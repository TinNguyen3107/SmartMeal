import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { prisma } from './src/server/db';
import { buildRecommendations, normalizeText, parseIngredientText, parseTags, serializeRecipe } from './src/server/recommendationEngine';
import type { RecommendationWeightConfig } from './src/types';
import type { Prisma } from './src/generated/prisma/client';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const allowDemoLogin = process.env.ALLOW_DEMO_LOGIN === 'true'
  || (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_LOGIN !== 'false');

type AuthedRequest = Request & {
  user?: { id: string; email: string; name: string; role: string };
};

function publicUser(user: { id: string; email: string; name: string; role: string }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

function getToken(req: Request) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);

  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('smartmeal_token='));
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
}

function setSessionCookie(res: Response, token: string) {
  res.cookie('smartmeal_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie('smartmeal_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
}

function sessionTokenHash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function sessionFromRequest(req: Request) {
  const token = getToken(req);
  if (!token) return undefined;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sessionTokenHash(token) },
    include: { user: true }
  });
  if (!session) return undefined;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return undefined;
  }
  return publicUser(session.user);
}

async function createSession(user: { id: string }) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = crypto.randomBytes(32).toString('hex');
    try {
      await prisma.session.create({
        data: {
          tokenHash: sessionTokenHash(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + SESSION_TTL_MS)
        }
      });
      return token;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== 'P2002' || attempt === 2) throw error;
    }
  }

  throw new Error('Unable to create a session.');
}

function hasToken(value: string, token: string) {
  return new RegExp(`(^|\\s)${token}(\\s|$)`).test(value);
}

function categoryForUi(category: string, name = '') {
  const value = normalizeText(`${category} ${name}`);
  if (value.includes('seafood') || hasToken(value, 'tom') || value.includes('ca hoi') || value.includes('ca ngu')) return 'Seafood';
  if (value.includes('protein') || value.includes('meat') || hasToken(value, 'ga') || hasToken(value, 'heo') || hasToken(value, 'bo')) return 'Meat';
  if (value.includes('egg') || value.includes('dairy') || value.includes('trung') || value.includes('sua')) return 'EggDairy';
  if (value.includes('vegetable') || value.includes('rau') || value.includes('cu') || value.includes('nam')) return 'Vegetable';
  if (value.includes('carb') || value.includes('grain') || value.includes('com') || value.includes('gao') || value.includes('bun')) return 'GrainCarb';
  if (value.includes('seasoning') || value.includes('gia vi') || value.includes('hanh') || value.includes('toi')) return 'Condiment';
  if (value.includes('fruit') || value.includes('trai cay')) return 'Fruit';
  return 'Other';
}

function iconForIngredient(category: string, name = '') {
  const uiCategory = categoryForUi(category, name);
  if (uiCategory === 'EggDairy') return '🥚';
  if (uiCategory === 'Vegetable') return '🥬';
  if (uiCategory === 'Meat') return '🥩';
  if (uiCategory === 'Seafood') return '🦐';
  if (uiCategory === 'GrainCarb') return '🍚';
  if (uiCategory === 'Condiment') return '🧂';
  if (uiCategory === 'Fruit') return '🍎';
  return '🥗';
}

function recipeImage(recipe: { image?: string | null; category?: string; vietnameseName?: string }) {
  if (recipe.image) return recipe.image;
  const category = normalizeText(recipe.category || recipe.vietnameseName || '');
  if (category.includes('canh') || category.includes('sup')) {
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900';
  }
  if (category.includes('xao')) {
    return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900';
  }
  if (category.includes('salad') || category.includes('goi')) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900';
}

function normalizeDifficulty(value: string): 'Easy' | 'Medium' | 'Hard' {
  if (value === 'Hard' || normalizeText(value).includes('kho')) return 'Hard';
  if (value === 'Medium' || normalizeText(value).includes('trung')) return 'Medium';
  return 'Easy';
}

function normalizeCuisine(value: string): 'Vietnamese' | 'Asian' | 'Western' | 'Fusion' | 'International' {
  const normalized = normalizeText(value);
  if (normalized.includes('asian') || normalized.includes('a dong')) return 'Asian';
  if (normalized.includes('western') || normalized.includes('au')) return 'Western';
  if (normalized.includes('fusion')) return 'Fusion';
  if (normalized.includes('vietnam') || normalized.includes('viet')) return 'Vietnamese';
  return 'International';
}

function normalizeRecipeCategory(value: string): 'Món chính' | 'Canh / Súp' | 'Món xào' | 'Món kho' | 'Món chiên / nướng' | 'Salad / Khai vị' | 'Món ăn nhanh' {
  const normalized = normalizeText(value);
  if (normalized.includes('canh') || normalized.includes('sup')) return 'Canh / Súp';
  if (normalized.includes('xao')) return 'Món xào';
  if (normalized.includes('kho')) return 'Món kho';
  if (normalized.includes('chien') || normalized.includes('nuong')) return 'Món chiên / nướng';
  if (normalized.includes('salad') || normalized.includes('goi')) return 'Salad / Khai vị';
  if (normalized.includes('nhanh')) return 'Món ăn nhanh';
  return 'Món chính';
}

function dietaryTagsFromRecipe(recipe: { tags?: string[] | string; cuisine?: string; difficulty?: string }) {
  const rawTags = parseTags(recipe.tags).filter(Boolean);
  const tags = new Set<string>(rawTags);
  if (normalizeText(recipe.cuisine || '').includes('viet')) tags.add('Vietnamese');
  if (recipe.difficulty === 'Easy') tags.add('Quick Meal');
  return Array.from(tags).filter(tag =>
    ['Vietnamese', 'Asian', 'Western', 'Healthy', 'Vegetarian', 'Low Carb', 'High Protein', 'Quick Meal', 'Budget Meal'].includes(tag)
  );
}

function toUiIngredient(item: Awaited<ReturnType<typeof loadIngredients>>[number]) {
  return {
    id: item.id,
    name: item.name,
    normalizedName: item.normalizedName,
    category: categoryForUi(item.category, item.name),
    categoryNameVi: item.categoryNameVi,
    defaultUnit: item.defaultUnit,
    icon: iconForIngredient(item.category, item.name),
    aliases: item.aliases.map(alias => alias.alias),
    caloriesPer100g: item.caloriesPer100g,
    proteinPer100g: item.proteinPer100g,
    carbsPer100g: item.carbsPer100g,
    fatPer100g: item.fatPer100g
  };
}

function toUiRecipe(recipe: ReturnType<typeof serializeRecipe>) {
  return {
    id: recipe.id,
    name: recipe.vietnameseName || recipe.name,
    vietnameseName: recipe.vietnameseName,
    description: recipe.description,
    image: recipeImage(recipe),
    cuisine: normalizeCuisine(recipe.cuisine),
    category: normalizeRecipeCategory(recipe.category),
    dietaryTags: dietaryTagsFromRecipe(recipe),
    difficulty: normalizeDifficulty(String(recipe.difficulty)),
    preparationTime: recipe.preparationTime,
    cookingTime: recipe.cookingTime,
    totalTime: recipe.preparationTime + recipe.cookingTime,
    calories: recipe.calories || 0,
    servings: recipe.servings,
    rating: Number(recipe.rating || 0),
    reviewCount: recipe.reviewCount,
    popularityScore: recipe.popularityScore,
    source: recipe.source,
    status: recipe.status,
    ingredients: recipe.ingredients.map(item => ({
      ingredientId: item.ingredientId || item.id || item.name,
      name: item.name,
      normalizedName: item.normalizedName || normalizeText(item.name),
      quantity: item.quantity,
      unit: item.unit,
      isOptional: item.isOptional,
      caloriesPer100g: item.caloriesPer100g,
      proteinPer100g: item.proteinPer100g,
      carbsPer100g: item.carbsPer100g,
      fatPer100g: item.fatPer100g
    })),
    instructions: recipe.instructions.map((item, index) => ({
      stepNumber: item.stepNumber,
      instruction: item.instruction,
      estimatedMinutes: Math.max(3, Math.round((recipe.preparationTime + recipe.cookingTime) / Math.max(1, recipe.instructions.length))),
      tip: index === 0 ? 'Sơ chế trước khi bật bếp để nấu mượt hơn.' : undefined
    })),
    createdAt: new Date().toISOString()
  };
}

function calculateNutritionTargets(user: { age?: number | null; gender?: string | null }, preference: {
  nutritionGoal?: string | null;
  activityLevel?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  targetCalories?: number | null;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetFat?: number | null;
} | null | undefined) {
  const weight = Number(preference?.weightKg) || 60;
  const height = Number(preference?.heightCm) || 165;
  const age = Number(user.age) || 25;
  const genderOffset = user.gender === 'Male' ? 5 : -161;
  const activityMultiplier = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725
  }[String(preference?.activityLevel || 'LIGHT')] || 1.375;
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderOffset;
  const maintenance = Math.round(bmr * activityMultiplier);
  const goal = String(preference?.nutritionGoal || 'BALANCED');
  const calories = preference?.targetCalories
    || (goal === 'WEIGHT_LOSS' ? maintenance - 350 : goal === 'MUSCLE_GAIN' ? maintenance + 250 : maintenance);

  return {
    nutritionGoal: goal,
    activityLevel: String(preference?.activityLevel || 'LIGHT'),
    heightCm: preference?.heightCm || undefined,
    weightKg: preference?.weightKg || undefined,
    targetCalories: Math.round(calories),
    targetProtein: preference?.targetProtein || Math.round(weight * (goal === 'MUSCLE_GAIN' ? 1.8 : 1.2)),
    targetCarbs: preference?.targetCarbs || Math.round((calories * (goal === 'LOW_CARB' ? 0.25 : 0.45)) / 4),
    targetFat: preference?.targetFat || Math.round((calories * 0.25) / 9)
  };
}

async function toUiUser(user: { id: string; email: string; name: string; role: string; avatar?: string | null; gender?: string | null; age?: number | null; createdAt?: Date }) {
  const preference = await prisma.userPreference.findUnique({ where: { userId: user.id } });
  const tags = parsePreferenceTags(preference?.tags);
  const nutritionTargets = calculateNutritionTargets(user, preference);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || undefined,
    gender: (user.gender as 'Male' | 'Female' | 'Other' | null) || 'Other',
    age: user.age || undefined,
    role: user.role === 'ADMIN' ? 'admin' : 'user',
    preferences: {
      dietaryTypes: tags.length ? tags : ['Vietnamese', 'Healthy'],
      preferredCuisine: preference?.preferredCuisine ? [preference.preferredCuisine] : ['Vietnamese'],
      maxCookingTime: preference?.maxCookingTime || 35,
      preferredDifficulty: (preference?.preferredDifficulty as 'Easy' | 'Medium' | 'Hard' | null) || 'Any',
      ...nutritionTargets,
      spiceLevel: 'Mild',
      allergies: parsePreferenceTags(preference?.allergies)
    },
    createdAt: (user.createdAt || new Date()).toISOString()
  };
}

function statusForMatch(matchScore: number) {
  if (matchScore >= 90) return { status: 'CAN_COOK_NOW', label: 'Có thể nấu ngay' };
  if (matchScore >= 70) return { status: 'ALMOST_READY', label: 'Gần đủ nguyên liệu' };
  if (matchScore >= 50) return { status: 'NEEDS_SUPPLEMENT', label: 'Cần bổ sung' };
  return { status: 'LOW_MATCH', label: 'Không ưu tiên' };
}

function toUiRecommendation(recommendation: ReturnType<typeof buildRecommendations>['recommendations'][number]) {
  const status = statusForMatch(recommendation.matchScore);
  const recipe = toUiRecipe(recommendation);
  return {
    ...recommendation,
    recipe,
    matchScore: recommendation.matchScore,
    finalScore: recommendation.score,
    status: status.status,
    statusLabelVi: status.label,
    matchedIngredients: recommendation.matchedIngredients.map(item => ({
      name: item.name,
      normalizedName: item.normalizedName || normalizeText(item.name),
      userQuantity: item.quantity,
      requiredQuantity: item.quantity,
      unit: item.unit
    })),
    missingIngredients: recommendation.missingIngredients.map(item => ({
      ingredientId: item.ingredientId || item.id || item.name,
      name: item.name,
      normalizedName: item.normalizedName || normalizeText(item.name),
      requiredQuantity: item.quantity,
      unit: item.unit
    })),
    explanation: {
      headline: status.label,
      points: recommendation.reasons,
      summary: recommendation.reasons[0] || 'Gợi ý dựa trên nguyên liệu bạn đang có.'
    }
  };
}

async function loadUiPantry(userId: string) {
  const pantry = await prisma.userIngredient.findMany({
    where: { userId },
    include: { ingredient: { include: { aliases: true } } },
    orderBy: { addedAt: 'desc' }
  });
  return pantry.map(item => ({
    id: item.id,
    ingredientId: item.ingredientId,
    name: item.name,
    normalizedName: item.ingredient.normalizedName,
    category: categoryForUi(item.ingredient.category, item.ingredient.name),
    quantity: item.quantity,
    unit: item.unit,
    addedAt: item.addedAt.toISOString()
  }));
}

function parsePreferenceTags(value: unknown) {
  return parseTags(typeof value === 'string' ? value : undefined);
}

function serializeIngredient(item: Awaited<ReturnType<typeof loadIngredients>>[number]) {
  return {
    id: item.id,
    name: item.name,
    normalizedName: item.normalizedName,
    category: item.category,
    categoryNameVi: item.categoryNameVi,
    defaultUnit: item.defaultUnit,
    caloriesPer100g: item.caloriesPer100g,
    proteinPer100g: item.proteinPer100g,
    carbsPer100g: item.carbsPer100g,
    fatPer100g: item.fatPer100g,
    aliases: item.aliases.map(alias => alias.alias)
  };
}

function asyncHandler(fn: (req: AuthedRequest, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

function isDatabaseConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('pool timeout')
    || message.includes('failed to retrieve a connection')
    || message.includes('ECONNREFUSED')
    || message.includes('Can\'t reach database server');
}

function isConstraintError(error: unknown) {
  const value = error as { code?: string; message?: string };
  const message = value?.message || '';
  return value?.code === 'P2003'
    || message.includes('Foreign key constraint')
    || message.includes('foreign key constraint');
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  void sessionFromRequest(req)
    .then(user => {
      if (!user) {
        res.status(401).json({ message: 'Vui lòng đăng nhập.' });
        return;
      }
      req.user = user;
      next();
    })
    .catch(next);
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Chỉ admin được thực hiện thao tác này.' });
  }
  next();
}

const recipeInclude = {
  ingredients: true,
  instructions: {
    orderBy: { stepNumber: 'asc' as const }
  }
};

async function loadIngredients() {
  return prisma.ingredient.findMany({
    include: { aliases: true },
    orderBy: { name: 'asc' }
  });
}

async function loadRecipes(where: Record<string, unknown> = {}) {
  return prisma.recipe.findMany({
    where,
    include: recipeInclude,
    orderBy: [{ popularityScore: 'desc' }, { rating: 'desc' }]
  });
}

type EvaluationCaseInput = {
  id: string;
  testId: string;
  description: string;
  inputIngredients: string[];
  expectedRecipeIds: string[];
  nutritionGoal?: string | null;
  tags: string[];
};

function stringArrayFromJson(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean)
    : [];
}

async function loadEvaluationCases(): Promise<EvaluationCaseInput[]> {
  const cases = await prisma.evaluationCase.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' }
  });

  return cases.map(testCase => ({
    id: testCase.id,
    testId: testCase.code,
    description: testCase.description,
    inputIngredients: stringArrayFromJson(testCase.inputIngredients),
    expectedRecipeIds: stringArrayFromJson(testCase.expectedRecipeIds),
    nutritionGoal: testCase.nutritionGoal,
    tags: stringArrayFromJson(testCase.tags)
  }));
}

function discountedCumulativeGain(relevance: number[]) {
  return relevance.reduce((sum, value, index) => sum + value / Math.log2(index + 2), 0);
}

function evaluateRecommendationSuite(
  ingredients: Awaited<ReturnType<typeof loadIngredients>>,
  recipes: Awaited<ReturnType<typeof loadRecipes>>,
  evaluationCases: EvaluationCaseInput[],
  k: number,
  weights?: Partial<RecommendationWeightConfig>
) {
  const recipeNames = new Map(recipes.map(recipe => [recipe.id, recipe.vietnameseName]));
  const testCases = evaluationCases.map(testCase => {
    const startedAt = Date.now();
    const result = buildRecommendations({
      text: testCase.inputIngredients.join(', '),
      nutritionGoal: testCase.nutritionGoal,
      tags: testCase.tags,
      weights
    }, ingredients, recipes);
    const returnedTopRecipes = result.recommendations.slice(0, k).map(recipe => ({
      id: recipe.id,
      name: recipe.vietnameseName,
      score: recipe.score
    }));
    const expectedRecipeNames = testCase.expectedRecipeIds
      .map(recipeId => recipeNames.get(recipeId))
      .filter((name): name is string => Boolean(name));
    const relevance = returnedTopRecipes.map(recipe => testCase.expectedRecipeIds.includes(recipe.id) ? 1 : 0);
    const relevantRetrieved = relevance.reduce((sum, value) => sum + value, 0);
    const idealRelevance = Array.from({ length: Math.min(k, testCase.expectedRecipeIds.length) }, () => 1);
    const dcg = discountedCumulativeGain(relevance);
    const idealDcg = discountedCumulativeGain(idealRelevance);

    return {
      id: testCase.testId,
      testId: testCase.testId,
      name: testCase.testId,
      description: testCase.description,
      inputIngredients: testCase.inputIngredients,
      expectedOutcome: expectedRecipeNames.join(', ') || 'Không có công thức đáp án đang xuất bản',
      expectedRecipeNames,
      actualTopResult: returnedTopRecipes[0]?.name || 'N/A',
      returnedTopRecipes,
      passed: relevantRetrieved > 0,
      score: returnedTopRecipes[0]?.score || 0,
      latencyMs: Date.now() - startedAt,
      precisionAtK: relevantRetrieved / k,
      recallAtK: relevantRetrieved / Math.max(1, testCase.expectedRecipeIds.length),
      ndcgAtK: idealDcg ? dcg / idealDcg : 0,
      details: relevantRetrieved > 0
        ? 'Có ít nhất một công thức mục tiêu trong Top K.'
        : 'Không có công thức mục tiêu trong Top K; cần xem lại dữ liệu, alias hoặc trọng số.'
    };
  });

  const count = Math.max(1, testCases.length);
  return {
    metrics: {
      k,
      precisionAtK: Math.round(testCases.reduce((sum, item) => sum + item.precisionAtK, 0) / count * 100),
      recallAtK: Math.round(testCases.reduce((sum, item) => sum + item.recallAtK, 0) / count * 100),
      hitRateAtK: Math.round(testCases.filter(item => item.passed).length / count * 100),
      ndcgAtK: Math.round(testCases.reduce((sum, item) => sum + item.ndcgAtK, 0) / count * 100),
      evaluatedQueriesCount: testCases.length,
      averageLatencyMs: Math.round(testCases.reduce((sum, item) => sum + item.latencyMs, 0) / count)
    },
    testCases
  };
}

const EVALUATION_WEIGHT_KEYS = new Set([
  'ingredientMatch', 'userPreference', 'rating', 'popularity', 'cookingTime', 'difficulty',
  'w_match', 'w_user', 'w_rating', 'w_popularity', 'w_time', 'w_difficulty', 'w_nutrition', 'w_semantic'
]);

function sanitizeEvaluationWeights(value: unknown): RecommendationWeightConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([key, weight]) =>
      EVALUATION_WEIGHT_KEYS.has(key) && typeof weight === 'number' && Number.isFinite(weight) && weight >= 0 && weight <= 1
    )
  ) as RecommendationWeightConfig;
}

function asJsonSnapshot(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function serializeEvaluationRun(run: any) {
  return {
    id: run.id,
    k: run.k,
    weights: run.weights || {},
    precisionAtK: run.precisionAtK,
    recallAtK: run.recallAtK,
    hitRateAtK: run.hitRateAtK,
    ndcgAtK: run.ndcgAtK,
    evaluatedQueriesCount: run.evaluatedQueriesCount,
    averageLatencyMs: run.averageLatencyMs,
    userHelpfulRate: run.userHelpfulRate,
    createdAt: run.createdAt.toISOString(),
    executedBy: run.executedBy
      ? { name: run.executedBy.name, email: run.executedBy.email }
      : null
  };
}

function requestStringArray(value: unknown) {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\n,]/)
      : [];
  return values
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);
}

async function prepareEvaluationCaseData(body: unknown) {
  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const code = String(input.code || '').trim().toUpperCase();
  const description = String(input.description || '').trim();
  const inputIngredients = requestStringArray(input.inputIngredients);
  const expectedRecipeIds = [...new Set(requestStringArray(input.expectedRecipeIds))];
  const tags = [...new Set(requestStringArray(input.tags))];
  const nutritionGoal = typeof input.nutritionGoal === 'string' && input.nutritionGoal.trim()
    ? input.nutritionGoal.trim().slice(0, 50)
    : null;

  if (!/^[A-Z][A-Z0-9-]{2,59}$/.test(code)) {
    return { message: 'Mã test chỉ gồm chữ in hoa, số và dấu gạch ngang; dài 3-60 ký tự.' };
  }
  if (!description || inputIngredients.length === 0 || expectedRecipeIds.length === 0) {
    return { message: 'Cần có mô tả, nguyên liệu đầu vào và ít nhất một công thức đáp án.' };
  }

  const publishedRecipes = await prisma.recipe.findMany({
    where: { id: { in: expectedRecipeIds }, status: 'PUBLISHED' },
    select: { id: true }
  });
  if (publishedRecipes.length !== expectedRecipeIds.length) {
    return { message: 'Công thức đáp án phải tồn tại và đang ở trạng thái xuất bản.' };
  }

  return {
    data: {
      code,
      description,
      inputIngredients: asJsonSnapshot(inputIngredients),
      expectedRecipeIds: asJsonSnapshot(expectedRecipeIds),
      nutritionGoal,
      tags: asJsonSnapshot(tags)
    }
  };
}

function serializeEvaluationCase(item: any, recipeNames: Map<string, string>) {
  const expectedRecipeIds = stringArrayFromJson(item.expectedRecipeIds);
  return {
    id: item.id,
    code: item.code,
    description: item.description,
    inputIngredients: stringArrayFromJson(item.inputIngredients),
    expectedRecipeIds,
    expectedRecipeNames: expectedRecipeIds
      .map(recipeId => recipeNames.get(recipeId))
      .filter((name): name is string => Boolean(name)),
    nutritionGoal: item.nutritionGoal,
    tags: stringArrayFromJson(item.tags),
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    createdBy: item.createdBy
      ? { name: item.createdBy.name, email: item.createdBy.email }
      : null
  };
}

function csvCell(value: unknown) {
  const raw = value === null || value === undefined ? '' : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function csvDocument(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')}`;
}

async function measuredHelpfulRate() {
  const [total, helpful] = await Promise.all([
    prisma.recommendationFeedback.count(),
    prisma.recommendationFeedback.count({
      where: { type: { in: ['HELPFUL', 'USEFUL', 'TRIED_AND_LIKED'] } }
    })
  ]);
  return total ? Math.round(helpful / total * 100) : 0;
}

function normalizeRecipeStatus(value: unknown) {
  const status = String(value || 'PUBLISHED').toUpperCase();
  return ['DRAFT', 'PUBLISHED', 'REJECTED'].includes(status) ? status : 'PUBLISHED';
}

async function resolveIngredientByName(name: string) {
  const normalized = normalizeText(name);
  const ingredients = await loadIngredients();
  return ingredients.find(ingredient => {
    const aliases = [ingredient.name, ingredient.normalizedName, ...ingredient.aliases.map(alias => alias.alias)];
    return aliases.map(normalizeText).some(alias => alias === normalized || normalized.includes(alias) || alias.includes(normalized));
  });
}

async function findPublishedRecipe(recipeId: string) {
  if (!recipeId) return null;
  return prisma.recipe.findFirst({ where: { id: recipeId, status: 'PUBLISHED' } });
}

async function buildRecipeCreateData(body: any) {
  if (!body.vietnameseName || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
    throw new Error('Thiếu tên món hoặc nguyên liệu.');
  }

  return {
    name: String(body.name || body.vietnameseName),
    vietnameseName: String(body.vietnameseName),
    description: String(body.description || ''),
    image: body.image ? String(body.image) : null,
    cuisine: String(body.cuisine || 'Vietnamese'),
    category: String(body.category || 'Món chính'),
    difficulty: String(body.difficulty || 'Easy'),
    totalTime: (Number(body.preparationTime) || 10) + (Number(body.cookingTime) || 15),
    preparationTime: Number(body.preparationTime) || 10,
    cookingTime: Number(body.cookingTime) || 15,
    calories: body.calories ? Number(body.calories) : null,
    servings: Number(body.servings) || 1,
    tags: JSON.stringify(parseTags(body.tags)),
    source: String(body.source || 'MANUAL'),
    status: normalizeRecipeStatus(body.status),
    ingredients: {
      create: await Promise.all(body.ingredients.map(async (item: any) => {
        const ingredient = item.ingredientId
          ? await prisma.ingredient.findUnique({ where: { id: item.ingredientId } })
          : await resolveIngredientByName(String(item.name));
        if (!ingredient) throw new Error(`Không tìm thấy nguyên liệu "${item.name}".`);
        return {
          ingredientId: ingredient.id,
          name: ingredient.name,
          normalizedName: ingredient.normalizedName,
          quantity: Number(item.quantity) || 1,
          unit: String(item.unit || ingredient.defaultUnit),
          isOptional: Boolean(item.isOptional),
          caloriesPer100g: ingredient.caloriesPer100g,
          proteinPer100g: ingredient.proteinPer100g,
          carbsPer100g: ingredient.carbsPer100g,
          fatPer100g: ingredient.fatPer100g
        };
      }))
    },
    instructions: {
      create: (Array.isArray(body.instructions) ? body.instructions : []).map((item: any, index: number) => ({
        stepNumber: Number(item.stepNumber) || index + 1,
        instruction: String(item.instruction || item)
      }))
    }
  };
}

async function startServer() {
  const app = express();

  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', asyncHandler(async (_req, res) => {
    const [users, recipes, ingredients] = await Promise.all([
      prisma.user.count(),
      prisma.recipe.count(),
      prisma.ingredient.count()
    ]);

    res.json({
      ok: true,
      app: 'SmartMeal',
      mode: 'database-backed-recommendation',
      geminiOptional: Boolean(process.env.GEMINI_API_KEY),
      counts: { users, recipes, ingredients }
    });
  }));

  app.post('/api/auth/register', asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Thiếu họ tên, email hoặc mật khẩu.' });
    if (String(password).length < 6) return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự.' });

    const exists = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (exists) return res.status(409).json({ message: 'Email đã tồn tại.' });

    const user = await prisma.user.create({
      data: {
        name: String(name),
        email: String(email).toLowerCase(),
        password: await bcrypt.hash(String(password), 10),
        role: 'USER',
        preference: { create: { tags: JSON.stringify(['Vietnamese', 'Quick Meal']) } }
      }
    });
    const token = await createSession(user);
    setSessionCookie(res, token);
    res.status(201).json({ success: true, user: await toUiUser(user) });
  }));

  app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    const user = await prisma.user.findUnique({ where: { email: String(email || '').toLowerCase() } });
    if (!user || !(await bcrypt.compare(String(password || ''), user.password))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const token = await createSession(user);
    setSessionCookie(res, token);
    res.json({ success: true, user: await toUiUser(user) });
  }));

  app.post('/api/auth/demo-login', asyncHandler(async (req, res) => {
    if (!allowDemoLogin) return res.status(404).json({ message: 'Không tìm thấy tài nguyên.' });
    const role = String(req.body?.role || 'user').toLowerCase() === 'admin' ? 'ADMIN' : 'USER';
    const email = role === 'ADMIN' ? 'admin@gmail.com' : 'user@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Chưa seed tài khoản demo. Hãy chạy npm run prisma:seed.' });

    const token = await createSession(user);
    setSessionCookie(res, token);
    res.json({ success: true, user: await toUiUser(user) });
  }));

  app.get('/api/auth/me', asyncHandler(async (req, res) => {
    const sessionUser = await sessionFromRequest(req);
    if (!sessionUser) return res.json({ user: null });
    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    res.json({ user: user ? await toUiUser(user) : null });
  }));

  app.post('/api/auth/logout', asyncHandler(async (req, res) => {
    const token = getToken(req);
    if (token) {
      await prisma.session.deleteMany({ where: { tokenHash: sessionTokenHash(token) } });
    }
    clearSessionCookie(res);
    res.json({ success: true, ok: true });
  }));

  app.get('/api/me/profile', requireAuth, asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { preference: true }
    });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user.' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        gender: user.gender,
        age: user.age,
        preference: user.preference ? {
          dietaryType: user.preference.dietaryType,
          preferredCuisine: user.preference.preferredCuisine,
          maxCookingTime: user.preference.maxCookingTime,
          preferredDifficulty: user.preference.preferredDifficulty,
          nutritionGoal: user.preference.nutritionGoal,
          activityLevel: user.preference.activityLevel,
          heightCm: user.preference.heightCm,
          weightKg: user.preference.weightKg,
          targetCalories: user.preference.targetCalories,
          targetProtein: user.preference.targetProtein,
          targetCarbs: user.preference.targetCarbs,
          targetFat: user.preference.targetFat,
          allergies: parsePreferenceTags(user.preference.allergies),
          tags: parsePreferenceTags(user.preference.tags)
        } : null
      }
    });
  }));

  app.put('/api/me/profile', requireAuth, asyncHandler(async (req, res) => {
    const body = req.body || {};
    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        name: body.name ? String(body.name) : undefined,
        avatar: body.avatar ? String(body.avatar) : undefined,
        gender: body.gender ? String(body.gender) : undefined,
        age: body.age === undefined || body.age === '' ? undefined : Number(body.age)
      }
    });
    const updated = publicUser(user);
    req.user = updated;
    res.json({ user: updated });
  }));

  app.put('/api/me/preferences', requireAuth, asyncHandler(async (req, res) => {
    const body = req.body || {};
    const preference = await prisma.userPreference.upsert({
      where: { userId: req.user?.id || '' },
      update: {
        dietaryType: body.dietaryType ? String(body.dietaryType) : null,
        preferredCuisine: body.preferredCuisine ? String(body.preferredCuisine) : null,
        maxCookingTime: body.maxCookingTime ? Number(body.maxCookingTime) : null,
        preferredDifficulty: body.preferredDifficulty ? String(body.preferredDifficulty) : null,
        nutritionGoal: body.nutritionGoal ? String(body.nutritionGoal) : null,
        activityLevel: body.activityLevel ? String(body.activityLevel) : null,
        heightCm: body.heightCm ? Number(body.heightCm) : null,
        weightKg: body.weightKg ? Number(body.weightKg) : null,
        targetCalories: body.targetCalories ? Number(body.targetCalories) : null,
        targetProtein: body.targetProtein ? Number(body.targetProtein) : null,
        targetCarbs: body.targetCarbs ? Number(body.targetCarbs) : null,
        targetFat: body.targetFat ? Number(body.targetFat) : null,
        allergies: JSON.stringify(Array.isArray(body.allergies) ? body.allergies : []),
        tags: JSON.stringify(Array.isArray(body.tags) ? body.tags : [])
      },
      create: {
        userId: req.user?.id || '',
        dietaryType: body.dietaryType ? String(body.dietaryType) : null,
        preferredCuisine: body.preferredCuisine ? String(body.preferredCuisine) : null,
        maxCookingTime: body.maxCookingTime ? Number(body.maxCookingTime) : null,
        preferredDifficulty: body.preferredDifficulty ? String(body.preferredDifficulty) : null,
        nutritionGoal: body.nutritionGoal ? String(body.nutritionGoal) : null,
        activityLevel: body.activityLevel ? String(body.activityLevel) : null,
        heightCm: body.heightCm ? Number(body.heightCm) : null,
        weightKg: body.weightKg ? Number(body.weightKg) : null,
        targetCalories: body.targetCalories ? Number(body.targetCalories) : null,
        targetProtein: body.targetProtein ? Number(body.targetProtein) : null,
        targetCarbs: body.targetCarbs ? Number(body.targetCarbs) : null,
        targetFat: body.targetFat ? Number(body.targetFat) : null,
        allergies: JSON.stringify(Array.isArray(body.allergies) ? body.allergies : []),
        tags: JSON.stringify(Array.isArray(body.tags) ? body.tags : [])
      }
    });
    res.json({ preference: { ...preference, tags: parsePreferenceTags(preference.tags) } });
  }));

  app.put('/api/auth/profile', requireAuth, asyncHandler(async (req, res) => {
    const body = req.body || {};
    const updated = await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        name: body.name ? String(body.name) : undefined,
        avatar: body.avatar ? String(body.avatar) : undefined,
        gender: body.gender ? String(body.gender) : undefined,
        age: body.age === undefined || body.age === '' ? undefined : Number(body.age)
      }
    });

    const preferences = body.preferences || {};
    await prisma.userPreference.upsert({
      where: { userId: req.user?.id || '' },
      update: {
        preferredCuisine: Array.isArray(preferences.preferredCuisine)
          ? String(preferences.preferredCuisine[0] || 'Vietnamese')
          : preferences.preferredCuisine ? String(preferences.preferredCuisine) : undefined,
        maxCookingTime: preferences.maxCookingTime ? Number(preferences.maxCookingTime) : undefined,
        preferredDifficulty: preferences.preferredDifficulty && preferences.preferredDifficulty !== 'Any'
          ? String(preferences.preferredDifficulty)
          : null,
        nutritionGoal: preferences.nutritionGoal ? String(preferences.nutritionGoal) : 'BALANCED',
        activityLevel: preferences.activityLevel ? String(preferences.activityLevel) : 'LIGHT',
        heightCm: preferences.heightCm ? Number(preferences.heightCm) : null,
        weightKg: preferences.weightKg ? Number(preferences.weightKg) : null,
        targetCalories: preferences.targetCalories ? Number(preferences.targetCalories) : null,
        targetProtein: preferences.targetProtein ? Number(preferences.targetProtein) : null,
        targetCarbs: preferences.targetCarbs ? Number(preferences.targetCarbs) : null,
        targetFat: preferences.targetFat ? Number(preferences.targetFat) : null,
        allergies: JSON.stringify(Array.isArray(preferences.allergies) ? preferences.allergies : []),
        tags: JSON.stringify(Array.isArray(preferences.dietaryTypes) ? preferences.dietaryTypes : [])
      },
      create: {
        userId: req.user?.id || '',
        preferredCuisine: Array.isArray(preferences.preferredCuisine)
          ? String(preferences.preferredCuisine[0] || 'Vietnamese')
          : String(preferences.preferredCuisine || 'Vietnamese'),
        maxCookingTime: Number(preferences.maxCookingTime) || 35,
        preferredDifficulty: preferences.preferredDifficulty && preferences.preferredDifficulty !== 'Any'
          ? String(preferences.preferredDifficulty)
          : null,
        nutritionGoal: preferences.nutritionGoal ? String(preferences.nutritionGoal) : 'BALANCED',
        activityLevel: preferences.activityLevel ? String(preferences.activityLevel) : 'LIGHT',
        heightCm: preferences.heightCm ? Number(preferences.heightCm) : null,
        weightKg: preferences.weightKg ? Number(preferences.weightKg) : null,
        targetCalories: preferences.targetCalories ? Number(preferences.targetCalories) : null,
        targetProtein: preferences.targetProtein ? Number(preferences.targetProtein) : null,
        targetCarbs: preferences.targetCarbs ? Number(preferences.targetCarbs) : null,
        targetFat: preferences.targetFat ? Number(preferences.targetFat) : null,
        allergies: JSON.stringify(Array.isArray(preferences.allergies) ? preferences.allergies : []),
        tags: JSON.stringify(Array.isArray(preferences.dietaryTypes) ? preferences.dietaryTypes : ['Vietnamese', 'Healthy'])
      }
    });

    req.user = publicUser(updated);
    res.json({ success: true, user: await toUiUser(updated) });
  }));

  app.get('/api/me/pantry', requireAuth, asyncHandler(async (req, res) => {
    const pantry = await prisma.userIngredient.findMany({
      where: { userId: req.user?.id },
      include: { ingredient: true },
      orderBy: { addedAt: 'desc' }
    });
    res.json({ pantry });
  }));

  app.post('/api/me/pantry', requireAuth, asyncHandler(async (req, res) => {
    const body = req.body || {};
    const ingredient = body.ingredientId
      ? await prisma.ingredient.findUnique({ where: { id: String(body.ingredientId) } })
      : await resolveIngredientByName(String(body.name || ''));
    if (!ingredient) return res.status(404).json({ message: 'Không tìm thấy nguyên liệu.' });

    const existing = await prisma.userIngredient.findFirst({
      where: { userId: req.user?.id, ingredientId: ingredient.id }
    });
    const data = {
      userId: req.user?.id || '',
      ingredientId: ingredient.id,
      name: ingredient.name,
      quantity: Number(body.quantity) || 1,
      unit: String(body.unit || ingredient.defaultUnit)
    };
    const pantryItem = existing
      ? await prisma.userIngredient.update({ where: { id: existing.id }, data })
      : await prisma.userIngredient.create({ data });

    res.status(existing ? 200 : 201).json({ pantryItem });
  }));

  app.put('/api/me/pantry/:id', requireAuth, asyncHandler(async (req, res) => {
    const updated = await prisma.userIngredient.updateMany({
      where: { id: req.params.id, userId: req.user?.id },
      data: {
        quantity: Number(req.body?.quantity) || 1,
        unit: String(req.body?.unit || 'phần')
      }
    });
    if (updated.count === 0) return res.status(404).json({ message: 'Không tìm thấy nguyên liệu trong tủ lạnh.' });
    const pantryItem = await prisma.userIngredient.findFirst({
      where: { id: req.params.id, userId: req.user?.id }
    });
    res.json({ pantryItem });
  }));

  app.delete('/api/me/pantry/:id', requireAuth, asyncHandler(async (req, res) => {
    await prisma.userIngredient.deleteMany({ where: { id: req.params.id, userId: req.user?.id } });
    res.json({ ok: true });
  }));

  app.get('/api/user/pantry', asyncHandler(async (req, res) => {
    const user = await sessionFromRequest(req);
    if (!user) return res.json({ success: true, items: [] });
    res.json({ success: true, items: await loadUiPantry(user.id) });
  }));

  app.post('/api/user/pantry', requireAuth, asyncHandler(async (req, res) => {
    const body = req.body || {};
    const ingredient = body.ingredientId
      ? await prisma.ingredient.findUnique({ where: { id: String(body.ingredientId) } })
      : await resolveIngredientByName(String(body.name || ''));
    if (!ingredient) return res.status(404).json({ success: false, message: 'Không tìm thấy nguyên liệu.' });

    const existing = await prisma.userIngredient.findFirst({
      where: { userId: req.user?.id, ingredientId: ingredient.id }
    });
    const data = {
      userId: req.user?.id || '',
      ingredientId: ingredient.id,
      name: ingredient.name,
      quantity: Number(body.quantity) || 1,
      unit: String(body.unit || ingredient.defaultUnit)
    };

    if (existing) {
      await prisma.userIngredient.update({ where: { id: existing.id }, data });
    } else {
      await prisma.userIngredient.create({ data });
    }

    res.json({ success: true, items: await loadUiPantry(req.user?.id || '') });
  }));

  app.delete('/api/user/pantry/:id', requireAuth, asyncHandler(async (req, res) => {
    await prisma.userIngredient.deleteMany({ where: { id: req.params.id, userId: req.user?.id } });
    res.json({ success: true, items: await loadUiPantry(req.user?.id || '') });
  }));

  app.get('/api/user/favorites', asyncHandler(async (req, res) => {
    const user = await sessionFromRequest(req);
    if (!user) return res.json({ success: true, favoriteIds: [] });
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      select: { recipeId: true },
      orderBy: { addedAt: 'desc' }
    });
    res.json({ success: true, favoriteIds: favorites.map(item => item.recipeId) });
  }));

  app.post('/api/user/favorites/toggle', requireAuth, asyncHandler(async (req, res) => {
    const recipeId = String(req.body?.recipeId || '');
    if (!recipeId) return res.status(400).json({ success: false, message: 'Thiếu recipeId.' });
    if (!await findPublishedRecipe(recipeId)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công thức đã xuất bản.' });
    }

    const existing = await prisma.favorite.findFirst({ where: { userId: req.user?.id, recipeId } });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
    } else {
      await prisma.favorite.create({ data: { userId: req.user?.id || '', recipeId } });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user?.id },
      select: { recipeId: true },
      orderBy: { addedAt: 'desc' }
    });
    res.json({ success: true, favoriteIds: favorites.map(item => item.recipeId) });
  }));

  app.post('/api/user/ratings', requireAuth, asyncHandler(async (req, res) => {
    const recipeId = String(req.body?.recipeId || '');
    const rating = Math.min(5, Math.max(1, Number(req.body?.rating) || 5));
    const comment = req.body?.comment ? String(req.body.comment) : null;
    if (!recipeId) return res.status(400).json({ success: false, message: 'Thiếu recipeId.' });
    if (!await findPublishedRecipe(recipeId)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công thức đã xuất bản.' });
    }

    const existingReview = await prisma.review.findFirst({ where: { userId: req.user?.id, recipeId } });
    const review = existingReview
      ? await prisma.review.update({ where: { id: existingReview.id }, data: { rating, comment } })
      : await prisma.review.create({ data: { userId: req.user?.id || '', recipeId, rating, comment } });

    const aggregate = await prisma.review.aggregate({
      where: { recipeId },
      _avg: { rating: true },
      _count: { rating: true }
    });
    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        rating: aggregate._avg.rating || rating,
        reviewCount: aggregate._count.rating
      }
    });

    res.json({
      success: true,
      review,
      newRating: updatedRecipe.rating,
      reviewCount: updatedRecipe.reviewCount
    });
  }));

  app.get('/api/ingredients', asyncHandler(async (_req, res) => {
    const ingredients = await loadIngredients();
    res.json({ ingredients: ingredients.map(toUiIngredient) });
  }));

  app.get('/api/recipes', asyncHandler(async (req, res) => {
    const search = String(req.query.search || '').trim();
    const recipes = await loadRecipes({
      status: 'PUBLISHED',
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { vietnameseName: { contains: search } },
              { category: { contains: search } },
              { cuisine: { contains: search } }
            ]
          }
        : {})
    });
    res.json({ recipes: recipes.map(recipe => toUiRecipe(serializeRecipe(recipe))) });
  }));

  app.get('/api/recipes/:id', asyncHandler(async (req, res) => {
    const recipe = await prisma.recipe.findUnique({
      where: { id: req.params.id },
      include: recipeInclude
    });
    if (!recipe) return res.status(404).json({ message: 'Không tìm thấy món ăn.' });
    const user = await sessionFromRequest(req);
    if (recipe.status !== 'PUBLISHED' && user?.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Khong tim thay mon an.' });
    }
    const reviews = await prisma.review.findMany({
      where: { recipeId: recipe.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({
      recipe: toUiRecipe(serializeRecipe(recipe)),
      reviews: reviews.map(review => ({
        id: review.id,
        recipeId: review.recipeId,
        userId: review.userId,
        userName: review.user.name,
        userAvatar: review.user.avatar || undefined,
        rating: review.rating,
        comment: review.comment || '',
        date: review.createdAt.toISOString()
      }))
    });
  }));

  app.post('/api/recommendations', asyncHandler(async (req: AuthedRequest, res) => {
    const ingredientsFromUi = Array.isArray(req.body?.ingredients) ? req.body.ingredients : [];
    const preferences = req.body?.preferences || {};
    const preferredCuisine = Array.isArray(preferences.preferredCuisine)
      ? preferences.preferredCuisine[0]
      : preferences.preferredCuisine;
    const request = {
      text: String(req.body?.text || ingredientsFromUi.map((item: any) =>
        `${item.quantity || 1} ${item.unit || 'phần'} ${item.name || ''}`
      ).join(', ')),
      maxCookingTime: Number(req.body?.maxCookingTime || preferences.maxCookingTime) || undefined,
      difficulty: req.body?.difficulty || preferences.difficulty,
      cuisine: req.body?.cuisine || preferredCuisine,
      tags: Array.isArray(req.body?.tags)
        ? req.body.tags
        : Array.isArray(preferences.dietaryTypes) ? preferences.dietaryTypes : [],
      nutritionGoal: req.body?.nutritionGoal || preferences.nutritionGoal,
      activityLevel: req.body?.activityLevel || preferences.activityLevel,
      targetCalories: Number(req.body?.targetCalories || preferences.targetCalories) || undefined,
      targetProtein: Number(req.body?.targetProtein || preferences.targetProtein) || undefined,
      targetCarbs: Number(req.body?.targetCarbs || preferences.targetCarbs) || undefined,
      targetFat: Number(req.body?.targetFat || preferences.targetFat) || undefined,
      allergies: Array.isArray(req.body?.allergies)
        ? req.body.allergies
        : Array.isArray(preferences.allergies) ? preferences.allergies : [],
      semanticQuery: req.body?.semanticQuery || preferences.semanticQuery,
      weights: req.body?.weights || preferences.weights
    };
    if (!request.text.trim()) return res.status(400).json({ message: 'Vui lòng nhập ít nhất một nguyên liệu.' });

    const optionalUser = await sessionFromRequest(req);
    if (optionalUser) {
      const preference = await prisma.userPreference.findUnique({ where: { userId: optionalUser.id } });
      const storedAllergies = parsePreferenceTags(preference?.allergies);
      request.allergies = Array.from(new Set([...(request.allergies || []), ...storedAllergies]));
    }

    const [ingredients, recipes] = await Promise.all([
      loadIngredients(),
      loadRecipes({ status: 'PUBLISHED' })
    ]);
    const result = buildRecommendations(request, ingredients, recipes);

    if (optionalUser && result.recommendations.length > 0) {
      await prisma.recommendationHistory.createMany({
        data: result.recommendations.slice(0, 5).map(recipe => ({
          userId: optionalUser.id,
          recipeId: recipe.id,
          inputIngredients: request.text,
          score: recipe.score,
          matchScore: recipe.matchScore,
          missingCount: recipe.missingIngredients.length
        }))
      });
    }

    res.json({
      ...result,
      recommendations: result.recommendations.map(toUiRecommendation)
    });
  }));

  app.get('/api/me/history', requireAuth, asyncHandler(async (req, res) => {
    const history = await prisma.recommendationHistory.findMany({
      where: { userId: req.user?.id },
      include: { recipe: true },
      orderBy: { generatedAt: 'desc' },
      take: 30
    });
    res.json({ history });
  }));

  app.get('/api/user/history', requireAuth, asyncHandler(async (req, res) => {
    const history = await prisma.recommendationHistory.findMany({
      where: { userId: req.user?.id },
      include: { recipe: true },
      orderBy: { generatedAt: 'desc' },
      take: 40
    });

    res.json({
      success: true,
      history: history.map(item => ({
        id: item.id,
        recipeId: item.recipeId,
        recipeName: item.recipe.vietnameseName || item.recipe.name,
        recipeImage: recipeImage(item.recipe),
        inputIngredients: item.inputIngredients,
        score: item.score,
        matchScore: item.matchScore,
        missingCount: item.missingCount,
        generatedAt: item.generatedAt.toISOString()
      }))
    });
  }));

  app.post('/api/favorites/:recipeId', requireAuth, asyncHandler(async (req, res) => {
    if (!await findPublishedRecipe(req.params.recipeId)) {
      return res.status(404).json({ message: 'Không tìm thấy công thức đã xuất bản.' });
    }
    await prisma.favorite.upsert({
      where: { userId_recipeId: { userId: req.user?.id || '', recipeId: req.params.recipeId } },
      update: {},
      create: { userId: req.user?.id || '', recipeId: req.params.recipeId }
    });
    res.json({ ok: true });
  }));

  app.delete('/api/favorites/:recipeId', requireAuth, asyncHandler(async (req, res) => {
    await prisma.favorite.deleteMany({ where: { userId: req.user?.id, recipeId: req.params.recipeId } });
    res.json({ ok: true });
  }));

  app.get('/api/me/favorites', requireAuth, asyncHandler(async (req, res) => {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user?.id, recipe: { status: 'PUBLISHED' } },
      include: { recipe: { include: recipeInclude } },
      orderBy: { addedAt: 'desc' }
    });
    res.json({ recipes: favorites.map(item => serializeRecipe(item.recipe)) });
  }));

  app.post('/api/ratings', requireAuth, asyncHandler(async (req, res) => {
    const recipeId = String(req.body?.recipeId || '');
    const rating = Math.min(5, Math.max(1, Number(req.body?.rating) || 5));
    const comment = req.body?.comment ? String(req.body.comment) : null;
    if (!recipeId || !await findPublishedRecipe(recipeId)) {
      return res.status(404).json({ message: 'Không tìm thấy công thức đã xuất bản.' });
    }

    const existingReview = await prisma.review.findFirst({
      where: { userId: req.user?.id, recipeId }
    });

    if (existingReview) {
      await prisma.review.update({
        where: { id: existingReview.id },
        data: { rating, comment }
      });
    } else {
      await prisma.review.create({
        data: { userId: req.user?.id || '', recipeId, rating, comment }
      });
    }

    const aggregate = await prisma.review.aggregate({
      where: { recipeId },
      _avg: { rating: true },
      _count: { rating: true }
    });
    await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        rating: aggregate._avg.rating || rating,
        reviewCount: aggregate._count.rating
      }
    });

    res.json({ ok: true });
  }));

  app.post('/api/recommendations/feedback', asyncHandler(async (req, res) => {
    const user = await sessionFromRequest(req);
    if (user && req.body?.recipeId) {
      if (!await findPublishedRecipe(String(req.body.recipeId))) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy công thức đã xuất bản.' });
      }
      await prisma.recommendationFeedback.create({
        data: {
          userId: user.id,
          recipeId: String(req.body.recipeId),
          type: String(req.body.feedbackType || req.body.type || 'USEFUL'),
          note: req.body?.comment || req.body?.note ? String(req.body.comment || req.body.note) : null
        }
      });
    }
    res.json({ success: true, ok: true });
  }));

  app.post('/api/ai/extract-nlp', (req, res) => {
    const text = String(req.body?.text || '');
    const ingredients = parseIngredientText(text);
    const timeMatch = normalizeText(text).match(/(?:duoi|toi da|trong)\s+(\d{2,3})\s*phut/);
    const normalized = normalizeText(text);
    res.json({
      success: true,
      ingredients,
      constraints: {
        maxCookingTime: timeMatch ? Number(timeMatch[1]) : undefined,
        difficulty: normalized.includes('de nau') || normalized.includes('nhanh') ? 'Easy' : undefined
      },
      understoodIntentSummary: `Đã nhận diện ${ingredients.length} nguyên liệu từ câu mô tả. Hệ thống dùng bộ phân tích local nên không phụ thuộc Gemini API key.`
    });
  });

  app.get('/api/admin/dashboard', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const [users, recipes, draftRecipes, publishedRecipes, rejectedRecipes, ingredients, histories, feedbacks] = await Promise.all([
      prisma.user.count(),
      prisma.recipe.count(),
      prisma.recipe.count({ where: { status: 'DRAFT' } }),
      prisma.recipe.count({ where: { status: 'PUBLISHED' } }),
      prisma.recipe.count({ where: { status: 'REJECTED' } }),
      prisma.ingredient.count(),
      prisma.recommendationHistory.count(),
      prisma.recommendationFeedback.count()
    ]);
    res.json({
      users,
      recipes,
      ingredients,
      recommendations: histories,
      feedbacks,
      recipeStatus: {
        draft: draftRecipes,
        published: publishedRecipes,
        rejected: rejectedRecipes
      }
    });
  }));

  app.get('/api/admin/metrics', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const [ingredients, recipes, userHelpfulRate, evaluationCases] = await Promise.all([
      loadIngredients(),
      loadRecipes({ status: 'PUBLISHED' }),
      measuredHelpfulRate(),
      loadEvaluationCases()
    ]);
    const evaluation = evaluateRecommendationSuite(ingredients, recipes, evaluationCases, 5);
    res.json({
      success: true,
      metrics: {
        ...evaluation.metrics,
        userHelpfulRate,
        timestamp: new Date().toISOString()
      }
    });
  }));

  app.get('/api/admin/logs', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const [histories, feedbacks] = await Promise.all([
      prisma.recommendationHistory.findMany({
        include: { user: true, recipe: true },
        orderBy: { generatedAt: 'desc' },
        take: 8
      }),
      prisma.recommendationFeedback.findMany({
        include: { user: true, recipe: true },
        orderBy: { createdAt: 'desc' },
        take: 8
      })
    ]);

    const logs = [
      ...histories.map(item => ({
        id: `history-${item.id}`,
        timestamp: item.generatedAt.toISOString(),
        type: 'RECOMMEND',
        message: `${item.user.name} nhận gợi ý "${item.recipe.vietnameseName}" với match ${item.matchScore}%.`,
        details: { score: item.score, missingCount: item.missingCount }
      })),
      ...feedbacks.map(item => ({
        id: `feedback-${item.id}`,
        timestamp: item.createdAt.toISOString(),
        type: 'FEEDBACK',
        message: `${item.user.name} phản hồi "${item.type}" cho món "${item.recipe.vietnameseName}".`,
        details: { note: item.note }
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ success: true, logs });
  }));

  app.post('/api/admin/run-evaluations', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const k = Math.min(10, Math.max(3, Number(req.body?.k) || 5));
    const weights = sanitizeEvaluationWeights(req.body?.weights);
    const [ingredients, recipes, userHelpfulRate, evaluationCases] = await Promise.all([
      loadIngredients(),
      loadRecipes({ status: 'PUBLISHED' }),
      measuredHelpfulRate(),
      loadEvaluationCases()
    ]);
    const evaluation = evaluateRecommendationSuite(ingredients, recipes, evaluationCases, k, weights);
    const run = await prisma.evaluationRun.create({
      data: {
        executedById: req.user?.id,
        k,
        weights: asJsonSnapshot(weights),
        precisionAtK: evaluation.metrics.precisionAtK,
        recallAtK: evaluation.metrics.recallAtK,
        hitRateAtK: evaluation.metrics.hitRateAtK,
        ndcgAtK: evaluation.metrics.ndcgAtK,
        evaluatedQueriesCount: evaluation.metrics.evaluatedQueriesCount,
        averageLatencyMs: evaluation.metrics.averageLatencyMs,
        userHelpfulRate,
        testCases: asJsonSnapshot(evaluation.testCases)
      }
    });

    res.json({
      success: true,
      metrics: {
        ...evaluation.metrics,
        userHelpfulRate,
        timestamp: run.createdAt.toISOString()
      },
      testCases: evaluation.testCases,
      run: serializeEvaluationRun(run)
    });
  }));

  app.get('/api/admin/evaluation-runs', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit) ? Math.min(20, Math.max(1, Math.floor(requestedLimit))) : 8;
    const runs = await prisma.evaluationRun.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { executedBy: { select: { name: true, email: true } } }
    });
    res.json({ success: true, runs: runs.map(serializeEvaluationRun) });
  }));

  app.get('/api/admin/evaluation-runs/export.csv', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const runs = await prisma.evaluationRun.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      include: { executedBy: { select: { name: true, email: true } } }
    });
    const csv = csvDocument(
      ['Run ID', 'Executed at', 'Executed by', 'K', 'Precision@K', 'Recall@K', 'HitRate@K', 'NDCG@K', 'Queries', 'Latency ms', 'Helpful rate', 'Weights'],
      runs.map(run => [
        run.id,
        run.createdAt.toISOString(),
        run.executedBy?.email || '',
        run.k,
        run.precisionAtK,
        run.recallAtK,
        run.hitRateAtK,
        run.ndcgAtK,
        run.evaluatedQueriesCount,
        run.averageLatencyMs,
        run.userHelpfulRate,
        JSON.stringify(run.weights)
      ])
    );
    res.type('text/csv; charset=utf-8');
    res.attachment('smartmeal-evaluation-runs.csv');
    res.send(csv);
  }));

  app.get('/api/admin/evaluation-cases', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const [cases, recipes] = await Promise.all([
      prisma.evaluationCase.findMany({
        orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
        include: { createdBy: { select: { name: true, email: true } } }
      }),
      prisma.recipe.findMany({ select: { id: true, vietnameseName: true } })
    ]);
    const recipeNames = new Map(recipes.map(recipe => [recipe.id, recipe.vietnameseName]));
    res.json({ success: true, cases: cases.map(item => serializeEvaluationCase(item, recipeNames)) });
  }));

  app.get('/api/admin/evaluation-cases/export.csv', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const [cases, recipes] = await Promise.all([
      prisma.evaluationCase.findMany({
        orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
        include: { createdBy: { select: { email: true } } }
      }),
      prisma.recipe.findMany({ select: { id: true, vietnameseName: true } })
    ]);
    const recipeNames = new Map(recipes.map(recipe => [recipe.id, recipe.vietnameseName]));
    const csv = csvDocument(
      ['Code', 'Active', 'Description', 'Input ingredients', 'Expected recipe IDs', 'Expected recipe names', 'Nutrition goal', 'Tags', 'Created at', 'Updated at', 'Created by'],
      cases.map(item => {
        const expectedRecipeIds = stringArrayFromJson(item.expectedRecipeIds);
        return [
          item.code,
          item.isActive ? 'true' : 'false',
          item.description,
          stringArrayFromJson(item.inputIngredients).join(' | '),
          expectedRecipeIds.join(' | '),
          expectedRecipeIds.map(id => recipeNames.get(id)).filter(Boolean).join(' | '),
          item.nutritionGoal || '',
          stringArrayFromJson(item.tags).join(' | '),
          item.createdAt.toISOString(),
          item.updatedAt.toISOString(),
          item.createdBy?.email || ''
        ];
      })
    );
    res.type('text/csv; charset=utf-8');
    res.attachment('smartmeal-evaluation-cases.csv');
    res.send(csv);
  }));

  app.post('/api/admin/evaluation-cases', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const prepared = await prepareEvaluationCaseData(req.body);
    if (!prepared.data) return res.status(400).json({ message: prepared.message });
    const existing = await prisma.evaluationCase.findUnique({ where: { code: prepared.data.code } });
    if (existing) return res.status(409).json({ message: 'Mã test đã tồn tại.' });

    const created = await prisma.evaluationCase.create({
      data: { ...prepared.data, createdById: req.user?.id },
      include: { createdBy: { select: { name: true, email: true } } }
    });
    const recipes = await prisma.recipe.findMany({ select: { id: true, vietnameseName: true } });
    res.status(201).json({ case: serializeEvaluationCase(created, new Map(recipes.map(recipe => [recipe.id, recipe.vietnameseName]))) });
  }));

  app.put('/api/admin/evaluation-cases/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const current = await prisma.evaluationCase.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ message: 'Không tìm thấy ca đánh giá.' });
    const prepared = await prepareEvaluationCaseData({ ...req.body, code: current.code });
    if (!prepared.data) return res.status(400).json({ message: prepared.message });

    const updated = await prisma.evaluationCase.update({
      where: { id: current.id },
      data: {
        ...prepared.data,
        isActive: typeof req.body?.isActive === 'boolean' ? req.body.isActive : current.isActive
      },
      include: { createdBy: { select: { name: true, email: true } } }
    });
    const recipes = await prisma.recipe.findMany({ select: { id: true, vietnameseName: true } });
    res.json({ case: serializeEvaluationCase(updated, new Map(recipes.map(recipe => [recipe.id, recipe.vietnameseName]))) });
  }));

  app.patch('/api/admin/evaluation-cases/:id/status', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    if (typeof req.body?.isActive !== 'boolean') {
      return res.status(400).json({ message: 'Trạng thái isActive phải là boolean.' });
    }
    const updated = await prisma.evaluationCase.updateMany({
      where: { id: req.params.id },
      data: { isActive: req.body.isActive }
    });
    if (!updated.count) return res.status(404).json({ message: 'Không tìm thấy ca đánh giá.' });
    res.json({ success: true, isActive: req.body.isActive });
  }));

  app.get('/api/admin/users', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({
      users: users.map(user => ({
        ...user,
        role: user.role === 'ADMIN' ? 'ADMIN' : 'USER'
      }))
    });
  }));

  app.get('/api/admin/ingredients', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const ingredients = await loadIngredients();
    res.json({ ingredients: ingredients.map(toUiIngredient) });
  }));

  app.post('/api/admin/ingredients', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!body.name) return res.status(400).json({ message: 'Tên nguyên liệu là bắt buộc.' });
    const normalizedName = body.normalizedName ? normalizeText(body.normalizedName) : normalizeText(body.name).replace(/\s+/g, '-');
    const ingredient = await prisma.ingredient.upsert({
      where: { normalizedName },
      update: {
        name: String(body.name),
        category: String(body.category || 'other'),
        categoryNameVi: String(body.categoryNameVi || 'Khác'),
        defaultUnit: String(body.defaultUnit || 'phần'),
        caloriesPer100g: body.caloriesPer100g === undefined || body.caloriesPer100g === '' ? null : Number(body.caloriesPer100g),
        proteinPer100g: body.proteinPer100g === undefined || body.proteinPer100g === '' ? null : Number(body.proteinPer100g),
        carbsPer100g: body.carbsPer100g === undefined || body.carbsPer100g === '' ? null : Number(body.carbsPer100g),
        fatPer100g: body.fatPer100g === undefined || body.fatPer100g === '' ? null : Number(body.fatPer100g)
      },
      create: {
        name: String(body.name),
        normalizedName,
        category: String(body.category || 'other'),
        categoryNameVi: String(body.categoryNameVi || 'Khác'),
        defaultUnit: String(body.defaultUnit || 'phần'),
        caloriesPer100g: body.caloriesPer100g === undefined || body.caloriesPer100g === '' ? null : Number(body.caloriesPer100g),
        proteinPer100g: body.proteinPer100g === undefined || body.proteinPer100g === '' ? null : Number(body.proteinPer100g),
        carbsPer100g: body.carbsPer100g === undefined || body.carbsPer100g === '' ? null : Number(body.carbsPer100g),
        fatPer100g: body.fatPer100g === undefined || body.fatPer100g === '' ? null : Number(body.fatPer100g)
      }
    });

    const aliases = Array.isArray(body.aliases) ? body.aliases : [body.name];
    for (const alias of aliases) {
      await prisma.ingredientAlias.upsert({
        where: { normalized: normalizeText(String(alias)) },
        update: { alias: String(alias), ingredientId: ingredient.id },
        create: { alias: String(alias), normalized: normalizeText(String(alias)), ingredientId: ingredient.id }
      });
    }

    res.json({ ingredient });
  }));

  app.put('/api/admin/ingredients/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const body = req.body || {};
    const current = await prisma.ingredient.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ message: 'Không tìm thấy nguyên liệu.' });

    const ingredient = await prisma.ingredient.update({
      where: { id: req.params.id },
      data: {
        name: body.name ? String(body.name) : current.name,
        normalizedName: body.normalizedName ? normalizeText(String(body.normalizedName)).replace(/\s+/g, '-') : current.normalizedName,
        category: body.category ? String(body.category) : current.category,
        categoryNameVi: body.categoryNameVi ? String(body.categoryNameVi) : current.categoryNameVi,
        defaultUnit: body.defaultUnit ? String(body.defaultUnit) : current.defaultUnit,
        caloriesPer100g: body.caloriesPer100g === undefined || body.caloriesPer100g === '' ? current.caloriesPer100g : Number(body.caloriesPer100g),
        proteinPer100g: body.proteinPer100g === undefined || body.proteinPer100g === '' ? current.proteinPer100g : Number(body.proteinPer100g),
        carbsPer100g: body.carbsPer100g === undefined || body.carbsPer100g === '' ? current.carbsPer100g : Number(body.carbsPer100g),
        fatPer100g: body.fatPer100g === undefined || body.fatPer100g === '' ? current.fatPer100g : Number(body.fatPer100g)
      },
      include: { aliases: true }
    });

    if (Array.isArray(body.aliases)) {
      await prisma.ingredientAlias.deleteMany({ where: { ingredientId: ingredient.id } });
      for (const alias of body.aliases) {
        await prisma.ingredientAlias.upsert({
          where: { normalized: normalizeText(String(alias)) },
          update: { alias: String(alias), ingredientId: ingredient.id },
          create: { alias: String(alias), normalized: normalizeText(String(alias)), ingredientId: ingredient.id }
        });
      }
    }

    const refreshed = await prisma.ingredient.findUnique({
      where: { id: ingredient.id },
      include: { aliases: true }
    });
    res.json({ ingredient: refreshed ? serializeIngredient(refreshed) : serializeIngredient(ingredient) });
  }));

  app.delete('/api/admin/ingredients/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    await prisma.ingredient.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }));

  app.post('/api/admin/recipe-drafts', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const request = {
      text: String(req.body?.text || ''),
      maxCookingTime: Number(req.body?.maxCookingTime) || 30,
      tags: Array.isArray(req.body?.tags) ? req.body.tags : ['AI Draft']
    };
    const result = buildRecommendations(request, await loadIngredients(), await loadRecipes({ status: 'PUBLISHED' }));
    res.json({ draft: result.generatedDraft, warnings: result.warnings });
  }));

  app.get('/api/admin/recipes', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const recipes = await loadRecipes();
    res.json({ recipes: recipes.map(recipe => toUiRecipe(serializeRecipe(recipe))) });
  }));

  app.post('/api/admin/recipes', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!body.vietnameseName || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      return res.status(400).json({ message: 'Thiếu tên món hoặc nguyên liệu.' });
    }

    const recipe = await prisma.recipe.create({
      data: await buildRecipeCreateData({
        ...body,
        status: normalizeRecipeStatus(body.status)
      }),
      include: recipeInclude
    });
    res.status(201).json({ recipe: toUiRecipe(serializeRecipe(recipe)) });
  }));

  app.patch('/api/admin/recipes/:id/status', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const status = String(req.body?.status || '').toUpperCase();
    if (!['DRAFT', 'PUBLISHED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái công thức không hợp lệ.' });
    }
    const recipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data: { status },
      include: recipeInclude
    });
    res.json({ recipe: toUiRecipe(serializeRecipe(recipe)) });
  }));

  app.put('/api/admin/recipes/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const body = req.body || {};
    const existing = await prisma.recipe.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy món ăn.' });

    const data = await buildRecipeCreateData({
      ...existing,
      ...body,
      vietnameseName: body.vietnameseName || existing.vietnameseName,
      ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
      instructions: Array.isArray(body.instructions) ? body.instructions : []
    });

    await prisma.recipeIngredient.deleteMany({ where: { recipeId: req.params.id } });
    await prisma.recipeInstruction.deleteMany({ where: { recipeId: req.params.id } });

    const recipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data,
      include: recipeInclude
    });
    res.json({ recipe: toUiRecipe(serializeRecipe(recipe)) });
  }));

  app.delete('/api/admin/recipes/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    await prisma.recipe.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }));

  app.get('/api/admin/evaluation', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const [ingredients, recipes, evaluationCases] = await Promise.all([
      loadIngredients(),
      loadRecipes({ status: 'PUBLISHED' }),
      loadEvaluationCases()
    ]);
    const evaluation = evaluateRecommendationSuite(ingredients, recipes, evaluationCases, 5);
    res.json({
      total: evaluation.testCases.length,
      passed: evaluation.testCases.filter(item => item.passed).length,
      hitRate: evaluation.metrics.hitRateAtK,
      averageScore: Math.round(evaluation.testCases.reduce((sum, item) => sum + item.score, 0) / Math.max(1, evaluation.testCases.length)),
      results: evaluation.testCases.map(item => ({
        id: item.testId,
        input: item.inputIngredients.join(', '),
        expected: item.expectedOutcome,
        topRecipe: item.actualTopResult,
        score: item.score,
        passed: item.passed
      }))
    });
  }));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json({
        message: 'Cơ sở dữ liệu chưa sẵn sàng. Vui lòng bật MySQL/MariaDB rồi thử lại.'
      });
    }

    if (isConstraintError(error)) {
      return res.status(409).json({
        message: 'Không thể thực hiện thao tác vì dữ liệu này đang được liên kết với dữ liệu khác.'
      });
    }

    res.status(500).json({ message: 'Lỗi hệ thống. Vui lòng thử lại sau.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartMeal running at http://localhost:${PORT}`);
  });
}

startServer();
