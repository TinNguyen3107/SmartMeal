import { ParsedIngredientInput, RecipeDraft, RecommendationRequest, RecipeDto, RecipeRecommendationDto, RecommendationWeightConfig } from '../types';

type IngredientRecord = {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  categoryNameVi: string;
  defaultUnit: string;
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
  aliases?: { alias: string; normalized: string }[];
};

type ResolvedIngredient = IngredientRecord & {
  quantity: number;
  unit: string;
  isKnown: boolean;
};

type RecipeRecord = {
  id: string;
  name: string;
  vietnameseName: string;
  description: string;
  image?: string | null;
  cuisine: string;
  category: string;
  difficulty: string;
  preparationTime: number;
  cookingTime: number;
  calories?: number | null;
  servings: number;
  tags: string;
  source: string;
  status: string;
  rating: number;
  reviewCount: number;
  popularityScore: number;
  ingredients: {
    id?: string;
    ingredientId: string;
    name: string;
    normalizedName: string;
    quantity: number;
    unit: string;
    isOptional: boolean;
    caloriesPer100g?: number | null;
    proteinPer100g?: number | null;
    carbsPer100g?: number | null;
    fatPer100g?: number | null;
  }[];
  instructions: {
    stepNumber: number;
    instruction: string;
  }[];
};

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanIngredientName(value: string): string {
  return value
    .replace(/[.!?]\s*(tôi|toi|mình|minh|em|tui|muốn|muon)\b.*$/i, '')
    .replace(/^(tôi|toi|mình|minh|em|tui)\s+(đang\s+)?(có|co)\s+/i, '')
    .replace(/^(trong\s+)?(tủ lạnh|tu lanh|bếp|bep)\s+(của\s+)?(tôi|toi|mình|minh|em)?\s*(có|co)?\s*/i, '')
    .replace(/^(muốn|muon)\s+(nấu|nau|làm|lam)\s+(món|mon)?\s*/i, '')
    .replace(/^(ít|it|một ít|mot it)\s+/i, '')
    .replace(/\b(dưới|duoi|tối đa|toi da|trong)\s+\d{1,3}\s*(phút|phut)\b/gi, '')
    .replace(/\b(nhanh|dễ nấu|de nau|healthy|ít dầu|it dau|ít cay|it cay)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseIngredientText(text: string): ParsedIngredientInput[] {
  return text
    .split(/[,;\n]+|\svà\s|\sand\s/gi)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const cleanedPart = cleanIngredientName(part);
      const prefix = cleanedPart.match(/^(\d+(?:[.,]\d+)?)\s*(g|gram|kg|ml|l)\s+(.+)$/i);
      if (prefix) {
        return { name: cleanIngredientName(prefix[3]), quantity: Number(prefix[1].replace(',', '.')), unit: prefix[2].toLowerCase() };
      }

      const unitBefore = cleanedPart.match(/^(\d+(?:[.,]\d+)?)\s+(quả|qua|trái|trai|củ|cu|chén|chen|bó|bo|lá|la|cây|cay|gói|goi|hộp|hop|miếng|mieng|tép|tep|nhánh|nhanh|thìa|thia|muỗng|muong|muỗng canh|muong canh|muỗng cà phê|muong ca phe)\s+(.+)$/i);
      if (unitBefore) {
        return { name: cleanIngredientName(unitBefore[3]), quantity: Number(unitBefore[1].replace(',', '.')), unit: unitBefore[2].toLowerCase() };
      }

      const unitAfter = cleanedPart.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(g|gram|kg|ml|l|quả|qua|trái|trai|củ|cu|chén|chen|bó|bo|lá|la|cây|cay|gói|goi|hộp|hop|miếng|mieng|tép|tep|nhánh|nhanh|thìa|thia|muỗng|muong|muỗng canh|muong canh|muỗng cà phê|muong ca phe)$/i);
      if (unitAfter) {
        return { name: cleanIngredientName(unitAfter[1]), quantity: Number(unitAfter[2].replace(',', '.')), unit: unitAfter[3].toLowerCase() };
      }

      return { name: cleanedPart, quantity: 1, unit: 'phần' };
    })
    .filter(item => item.name.length > 1);
}

export function serializeRecipe(recipe: RecipeRecord): RecipeDto {
  return {
    ...recipe,
    tags: parseTags(recipe.tags),
    ingredients: recipe.ingredients.map(item => ({
      id: item.id,
      ingredientId: item.ingredientId,
      name: item.name,
      normalizedName: item.normalizedName,
      quantity: item.quantity,
      unit: item.unit,
      isOptional: item.isOptional,
      caloriesPer100g: item.caloriesPer100g,
      proteinPer100g: item.proteinPer100g,
      carbsPer100g: item.carbsPer100g,
      fatPer100g: item.fatPer100g
    })),
    instructions: recipe.instructions
      .slice()
      .sort((a, b) => a.stepNumber - b.stepNumber)
  };
}

export function parseTags(tags: string | string[] | undefined): string[] {
  if (Array.isArray(tags)) return tags;
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return tags.split(',').map(tag => tag.trim()).filter(Boolean);
  }
}

function resolveInputIngredients(parsed: ParsedIngredientInput[], ingredients: IngredientRecord[]): ResolvedIngredient[] {
  return parsed
    .map(input => {
      const normalized = normalizeText(input.name);
      const namesFor = (ingredient: IngredientRecord) =>
        [ingredient.name, ingredient.normalizedName, ...(ingredient.aliases || []).flatMap(alias => [alias.alias, alias.normalized])]
          .map(normalizeText)
          .filter(Boolean);
      const exactMatch = ingredients.find(ingredient => namesFor(ingredient).some(alias => alias === normalized));
      const fuzzyMatch = normalized.length >= 4
        ? ingredients.find(ingredient => namesFor(ingredient).some(alias => alias.length >= 4 && (normalized.includes(alias) || alias.includes(normalized))))
        : undefined;
      const match = exactMatch || fuzzyMatch;
      if (match) return { ...match, quantity: input.quantity, unit: input.unit, isKnown: true };

      // Keep unfamiliar ingredients for the flexible-recipe fallback. They never
      // match a stored recipe, and are explicitly marked as needing verification.
      return {
        id: `unmapped:${normalized || 'ingredient'}`,
        name: input.name,
        normalizedName: normalized || 'ingredient',
        category: 'other',
        categoryNameVi: 'Chưa phân loại',
        defaultUnit: input.unit || 'phần',
        quantity: input.quantity,
        unit: input.unit,
        aliases: [],
        isKnown: false
      };
    })
    .filter(Boolean);
}

function timeScore(recipe: RecipeRecord, maxCookingTime?: number) {
  const total = recipe.preparationTime + recipe.cookingTime;
  if (!maxCookingTime) return 100;
  if (total <= maxCookingTime) return 100;
  return Math.max(0, 100 - (total - maxCookingTime) * 4);
}

function difficultyScore(recipe: RecipeRecord, desired?: string) {
  if (!desired) return 100;
  return normalizeText(recipe.difficulty) === normalizeText(desired) ? 100 : 55;
}

function boundedScore(value: unknown, fallback: number) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.min(100, Math.max(0, score));
}

function preferenceScore(recipe: RecipeRecord, request: RecommendationRequest) {
  const tags = parseTags(recipe.tags).map(normalizeText);
  const requestedTags = (request.tags || []).map(normalizeText);
  const goal = normalizeText(String(request.nutritionGoal || ''));
  let score = 50;

  if (request.cuisine && normalizeText(recipe.cuisine) === normalizeText(request.cuisine)) score += 20;
  if (requestedTags.length > 0) {
    const matched = requestedTags.filter(tag => tags.includes(tag)).length;
    score += Math.round((matched / requestedTags.length) * 30);
  }
  if (goal.includes('muscle') && tags.includes('high protein')) score += 15;
  if (goal.includes('weight') && tags.includes('healthy')) score += 12;
  if (goal.includes('low carb') && tags.includes('low carb')) score += 15;
  if (goal.includes('vegetarian') && tags.includes('vegetarian')) score += 20;

  return Math.min(100, score);
}

function gramsFromQuantity(quantity: number, unit: string) {
  const normalizedUnit = normalizeText(unit);
  if (normalizedUnit === 'kg') return quantity * 1000;
  if (normalizedUnit === 'l') return quantity * 1000;
  if (normalizedUnit === 'ml') return quantity;
  if (normalizedUnit === 'g' || normalizedUnit === 'gram') return quantity;
  if (normalizedUnit === 'qua' || normalizedUnit === 'trai') return quantity * 80;
  if (normalizedUnit === 'chen') return quantity * 150;
  if (normalizedUnit === 'bo') return quantity * 120;
  if (normalizedUnit === 'la' || normalizedUnit === 'nhanh' || normalizedUnit === 'tep') return quantity * 10;
  if (normalizedUnit === 'muong' || normalizedUnit === 'thia' || normalizedUnit.includes('ca phe')) return quantity * 5;
  if (normalizedUnit.includes('canh')) return quantity * 15;
  return quantity * 100;
}

function hasToken(value: string, token: string) {
  return new RegExp(`(^|\\s)${token}(\\s|$)`).test(value);
}

function macroProfileForIngredient(name: string) {
  const value = normalizeText(name);
  if (value.includes('uc ga') || value.includes('thit') || hasToken(value, 'bo') || hasToken(value, 'heo') || hasToken(value, 'ga')) {
    return { calories: 1.7, protein: 0.26, carbs: 0, fat: 0.06 };
  }
  if (hasToken(value, 'tom') || value.includes('ca hoi') || value.includes('ca ngu') || value.includes('hai san')) {
    return { calories: 1.1, protein: 0.22, carbs: 0, fat: 0.02 };
  }
  if (value.includes('trung')) return { calories: 1.55, protein: 0.13, carbs: 0.01, fat: 0.11 };
  if (value.includes('dau hu')) return { calories: 0.9, protein: 0.10, carbs: 0.02, fat: 0.05 };
  if (value.includes('com') || value.includes('gao') || value.includes('bun') || value.includes('khoai')) {
    return { calories: 1.4, protein: 0.03, carbs: 0.30, fat: 0.01 };
  }
  if (value.includes('dau an') || value.includes('dau olive') || value.includes('bo thuc vat') || hasToken(value, 'avocado')) return { calories: 5.5, protein: 0.02, carbs: 0.08, fat: 0.45 };
  if (value.includes('duong')) return { calories: 4, protein: 0, carbs: 1, fat: 0 };
  return { calories: 0.35, protein: 0.02, carbs: 0.07, fat: 0.01 };
}

function estimateIngredientsNutrition(ingredients: Array<{
  name: string;
  normalizedName?: string;
  quantity: number;
  unit: string;
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
}>) {
  const totals = ingredients.reduce((sum, item) => {
    const grams = gramsFromQuantity(item.quantity, item.unit);
    const fallback = macroProfileForIngredient(item.normalizedName || item.name);
    const macro = {
      calories: Number(item.caloriesPer100g ?? fallback.calories * 100) / 100,
      protein: Number(item.proteinPer100g ?? fallback.protein * 100) / 100,
      carbs: Number(item.carbsPer100g ?? fallback.carbs * 100) / 100,
      fat: Number(item.fatPer100g ?? fallback.fat * 100) / 100
    };
    return {
      calories: sum.calories + grams * macro.calories,
      protein: sum.protein + grams * macro.protein,
      carbs: sum.carbs + grams * macro.carbs,
      fat: sum.fat + grams * macro.fat
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat)
  };
}

function estimateRecipeNutrition(recipe: RecipeRecord) {
  const totals = estimateIngredientsNutrition(recipe.ingredients);
  return {
    ...totals,
    calories: recipe.calories || totals.calories
  };
}

function nutritionScore(recipe: RecipeRecord, request: RecommendationRequest, nutrition = estimateRecipeNutrition(recipe)) {
  const goal = normalizeText(String(request.nutritionGoal || 'BALANCED'));
  const tags = parseTags(recipe.tags).map(normalizeText);
  let score = 70;

  if (goal.includes('muscle')) {
    score += Math.min(25, nutrition.protein * 1.2);
    if (tags.includes('high protein')) score += 10;
  } else if (goal.includes('weight')) {
    score += nutrition.calories <= (request.targetCalories ? request.targetCalories / 3 : 500) ? 20 : -15;
    if (tags.includes('healthy')) score += 10;
  } else if (goal.includes('low carb')) {
    score += nutrition.carbs <= 35 ? 25 : -20;
    if (tags.includes('low carb')) score += 10;
  } else if (goal.includes('vegetarian')) {
    score += tags.includes('vegetarian') ? 25 : -35;
  } else {
    score += nutrition.calories >= 250 && nutrition.calories <= 650 ? 15 : -8;
  }

  if (request.targetProtein && nutrition.protein >= request.targetProtein / 3) score += 10;
  if (request.targetCarbs && nutrition.carbs > request.targetCarbs / 2) score -= 10;
  if (request.targetCalories) {
    const mealTarget = request.targetCalories / 3;
    const distance = Math.abs(nutrition.calories - mealTarget);
    score += Math.max(-15, 15 - Math.round(distance / 30));
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

function semanticScore(recipe: RecipeRecord, request: RecommendationRequest) {
  const queryTokens = new Set(normalizeText([
    request.text,
    request.semanticQuery,
    request.cuisine,
    request.nutritionGoal,
    ...(request.tags || [])
  ].filter(Boolean).join(' ')).split(' ').filter(token => token.length > 2));
  if (queryTokens.size === 0) return 70;

  const recipeText = normalizeText([
    recipe.name,
    recipe.vietnameseName,
    recipe.description,
    recipe.cuisine,
    recipe.category,
    recipe.difficulty,
    parseTags(recipe.tags).join(' '),
    recipe.ingredients.map(item => item.name).join(' ')
  ].join(' '));
  const recipeTokens = new Set(recipeText.split(' ').filter(token => token.length > 2));
  const matched = [...queryTokens].filter(token => recipeTokens.has(token)).length;
  const lexical = Math.round((matched / Math.max(1, queryTokens.size)) * 100);
  let boost = 0;

  if (queryTokens.has('gym') || queryTokens.has('protein')) {
    if (recipeText.includes('protein') || recipeText.includes('ga') || recipeText.includes('tom') || recipeText.includes('thit')) boost += 15;
  }
  if (queryTokens.has('healthy') || queryTokens.has('giam') || queryTokens.has('can')) {
    if (recipeText.includes('healthy') || recipeText.includes('salad') || recipeText.includes('rau')) boost += 12;
  }
  if (queryTokens.has('chay') || queryTokens.has('vegetarian')) {
    if (recipeText.includes('vegetarian') || recipeText.includes('dau hu') || recipeText.includes('nam')) boost += 18;
  }

  return Math.min(100, Math.max(40, lexical + boost));
}

function containsAllergy(recipe: RecipeRecord, allergies?: string[]) {
  const normalizedAllergies = (allergies || []).map(normalizeText).filter(Boolean);
  if (normalizedAllergies.length === 0) return false;
  const recipeIngredients = recipe.ingredients.map(item => normalizeText(`${item.name} ${item.normalizedName}`));
  return normalizedAllergies.some(allergy => allergy.length >= 2 && recipeIngredients.some(ingredient =>
    ` ${ingredient} `.includes(` ${allergy} `)
  ));
}

function inputContainsAllergy(ingredients: ResolvedIngredient[], allergies?: string[]) {
  const normalizedAllergies = (allergies || []).map(normalizeText).filter(Boolean);
  return normalizedAllergies.some(allergy => ingredients.some(ingredient => {
    const ingredientText = normalizeText(`${ingredient.name} ${ingredient.normalizedName}`);
    return allergy.length >= 2 && ` ${ingredientText} `.includes(` ${allergy} `);
  }));
}

function normalizedWeights(raw?: Partial<RecommendationWeightConfig>) {
  const weights = {
    match: Number(raw?.w_match ?? raw?.ingredientMatch ?? 0.40),
    user: Number(raw?.w_user ?? raw?.userPreference ?? 0.12),
    nutrition: Number(raw?.w_nutrition ?? 0.18),
    semantic: Number(raw?.w_semantic ?? 0.12),
    rating: Number(raw?.w_rating ?? raw?.rating ?? 0.08),
    popularity: Number(raw?.w_popularity ?? raw?.popularity ?? 0.05),
    time: Number(raw?.w_time ?? raw?.cookingTime ?? 0.08),
    difficulty: Number(raw?.w_difficulty ?? raw?.difficulty ?? 0.05)
  };
  const total = Object.values(weights).reduce((sum, value) => sum + (Number.isFinite(value) && value > 0 ? value : 0), 0) || 1;
  return {
    match: weights.match / total,
    user: weights.user / total,
    nutrition: weights.nutrition / total,
    semantic: weights.semantic / total,
    rating: weights.rating / total,
    popularity: weights.popularity / total,
    time: weights.time / total,
    difficulty: weights.difficulty / total
  };
}

function matchLevel(matchScore: number) {
  if (matchScore >= 90) return 'Có thể nấu ngay';
  if (matchScore >= 70) return 'Gần đủ nguyên liệu';
  if (matchScore >= 50) return 'Cần bổ sung nguyên liệu';
  return 'Không ưu tiên';
}

export function buildRecommendations(
  request: RecommendationRequest,
  ingredients: IngredientRecord[],
  recipes: RecipeRecord[]
) {
  const parsedIngredients = parseIngredientText(request.text);
  const normalizedIngredients = resolveInputIngredients(parsedIngredients, ingredients);
  const available = new Set(normalizedIngredients.map(item => item.normalizedName));
  const warnings: string[] = [];
  const weights = normalizedWeights(request.weights);

  for (const ingredient of normalizedIngredients) {
    if (!ingredient.isKnown) {
      warnings.push(`"${ingredient.name}" chưa có trong từ điển dinh dưỡng. Công thức linh hoạt vẫn có thể dùng nguyên liệu này, nhưng chỉ số dinh dưỡng cần được xác minh.`);
    }
  }

  const recommendations: RecipeRecommendationDto[] = recipes
    .filter(recipe => !containsAllergy(recipe, request.allergies))
    .map(recipe => {
      const required = recipe.ingredients.filter(item => !item.isOptional);
      const matched = recipe.ingredients.filter(item => available.has(item.normalizedName));
      const missing = required.filter(item => !available.has(item.normalizedName));
      const requiredCount = Math.max(1, required.length);
      const matchScore = Math.round((required.filter(item => available.has(item.normalizedName)).length / requiredCount) * 100);
      const pref = preferenceScore(recipe, request);
      const estimatedNutrition = estimateRecipeNutrition(recipe);
      const nutrition = nutritionScore(recipe, request, estimatedNutrition);
      const semantic = semanticScore(recipe, request);
      const rating = Math.round(boundedScore(recipe.rating, 4) / 5 * 100);
      const popularity = Math.round(boundedScore(recipe.popularityScore, 50));
      const time = timeScore(recipe, request.maxCookingTime);
      const difficulty = difficultyScore(recipe, request.difficulty);
      const score = Math.round(
        matchScore * weights.match
        + pref * weights.user
        + nutrition * weights.nutrition
        + semantic * weights.semantic
        + rating * weights.rating
        + popularity * weights.popularity
        + time * weights.time
        + difficulty * weights.difficulty
      );

      return {
        ...serializeRecipe(recipe),
        score,
        matchScore,
        nutritionScore: nutrition,
        semanticScore: semantic,
        estimatedNutrition,
        scoreBreakdown: {
          ingredientMatch: matchScore,
          nutritionFit: nutrition,
          semanticSimilarity: semantic,
          userPreference: pref,
          rating,
          popularity,
          cookingTime: time,
          difficulty
        },
        preferenceScore: pref,
        ratingScore: rating,
        popularityScoreValue: popularity,
        timeScore: time,
        difficultyScore: difficulty,
        matchedIngredients: matched.map(item => ({ ...item })),
        missingIngredients: missing.map(item => ({ ...item })),
        matchLevel: matchLevel(matchScore),
        reasons: [
          `Bạn có ${requiredCount - missing.length}/${requiredCount} nguyên liệu bắt buộc của món này.`,
          missing.length === 0
            ? 'Không thiếu nguyên liệu bắt buộc, có thể nấu ngay.'
            : `Cần bổ sung: ${missing.map(item => item.name).join(', ')}.`,
          `Ước tính dinh dưỡng mỗi khẩu phần: ${estimatedNutrition.calories} kcal, ${estimatedNutrition.protein}g protein, ${estimatedNutrition.carbs}g carb, ${estimatedNutrition.fat}g fat.`,
          `Điểm tổng = match ${Math.round(weights.match * 100)}%, dinh dưỡng ${Math.round(weights.nutrition * 100)}%, ngữ nghĩa ${Math.round(weights.semantic * 100)}%, sở thích ${Math.round(weights.user * 100)}%, rating ${Math.round(weights.rating * 100)}%, độ phổ biến ${Math.round(weights.popularity * 100)}%, thời gian ${Math.round(weights.time * 100)}%, độ khó ${Math.round(weights.difficulty * 100)}%.`
        ]
      };
    })
    .filter(recipe => recipe.matchedIngredients.length > 0 || recipe.matchScore >= 50)
    .sort((a, b) => b.score - a.score || a.missingIngredients.length - b.missingIngredients.length)
    .slice(0, 12);

  const hasAllergenInInput = inputContainsAllergy(normalizedIngredients, request.allergies);
  if (hasAllergenInInput) {
    warnings.push('Không tạo công thức linh hoạt vì nguyên liệu nhập vào có thể trùng với dị ứng đã khai báo.');
  }
  const generatedDraft = normalizedIngredients.length > 0 && !hasAllergenInInput
    ? generateRecipeDraft(normalizedIngredients, request)
    : undefined;

  return {
    parsedIngredients,
    normalizedIngredients: normalizedIngredients.map(item => ({
      id: item.id,
      name: item.name,
      normalizedName: item.normalizedName,
      category: item.category,
      categoryNameVi: item.categoryNameVi,
      defaultUnit: item.defaultUnit,
      aliases: (item.aliases || []).map(alias => alias.alias),
      caloriesPer100g: item.caloriesPer100g,
      proteinPer100g: item.proteinPer100g,
      carbsPer100g: item.carbsPer100g,
      fatPer100g: item.fatPer100g
    })),
    recommendations,
    generatedDraft,
    algorithm: {
      name: 'Hybrid Content-Based + Nutrition-Aware Semantic Scoring',
      formula: `Final Score = ${weights.match.toFixed(2)}*Ingredient Match + ${weights.nutrition.toFixed(2)}*Nutrition Fit + ${weights.semantic.toFixed(2)}*Semantic Similarity + ${weights.user.toFixed(2)}*Preference + ${weights.rating.toFixed(2)}*Rating + ${weights.popularity.toFixed(2)}*Popularity + ${weights.time.toFixed(2)}*Cooking Time + ${weights.difficulty.toFixed(2)}*Difficulty`,
      explanation: [
        'Chuẩn hóa nguyên liệu bằng tên chuẩn và alias tiếng Việt/tiếng Anh.',
        'Tạo ứng viên từ các recipe có ít nhất một nguyên liệu trùng với nguyên liệu người dùng có.',
        'Tính match score theo tỷ lệ nguyên liệu bắt buộc đã có trên tổng nguyên liệu bắt buộc.',
        'Ước lượng nutrition fit theo mục tiêu như giảm cân, tăng cơ, low carb hoặc ăn chay.',
        'Tính semantic similarity local từ ngữ cảnh món ăn, tag, mô tả và mục tiêu người dùng; có thể thay bằng embedding model thật sau này.',
        'Xếp hạng lại bằng sở thích, rating, độ phổ biến, thời gian nấu và độ khó.',
        'Công thức nháp được sinh local để admin kiểm duyệt, không phụ thuộc Gemini API.'
      ]
    },
    warnings
  };
}

export function generateRecipeDraft(ingredients: ResolvedIngredient[], request: RecommendationRequest = { text: '' }): RecipeDraft {
  const main = ingredients.find(item => item.category === 'protein') || ingredients[0];
  const vegetable = ingredients.find(item => item.category === 'vegetable' && item.id !== main.id);
  const carb = ingredients.find(item => item.category === 'carb');
  const seasoning = ingredients.find(item => item.category === 'seasoning');
  const titleParts = [main.name, vegetable?.name, carb ? `ăn kèm ${carb.name}` : undefined].filter(Boolean);
  const defaultMinutes = carb ? 28 : 22;
  const requestedMax = Number(request.maxCookingTime) || defaultMinutes;
  const totalMinutes = Math.max(12, Math.min(defaultMinutes, requestedMax));
  const preparationTime = Math.min(8, Math.max(4, totalMinutes - 8));
  const estimatedNutrition = estimateIngredientsNutrition(ingredients);
  const nutritionGoal = normalizeText(String(request.nutritionGoal || ''));
  const hasUnknownIngredient = ingredients.some(item => !item.isKnown);
  const goalTags = nutritionGoal.includes('muscle')
    ? ['High Protein']
    : nutritionGoal.includes('low carb')
    ? ['Low Carb']
    : nutritionGoal.includes('weight')
    ? ['Healthy']
    : [];

  return {
    name: `Flexible ${main.normalizedName} Meal`,
    vietnameseName: titleParts.join(' '),
    description: 'Công thức linh hoạt được sinh tại chỗ từ nguyên liệu người dùng nhập. Đây không phải công thức đã được admin kiểm duyệt.',
    cuisine: 'Vietnamese',
    category: carb ? 'Món chính' : 'Món nhanh',
    difficulty: 'Easy',
    preparationTime,
    cookingTime: totalMinutes - preparationTime,
    calories: estimatedNutrition.calories,
    estimatedNutrition,
    servings: 1,
    tags: ['Flexible Recipe', 'Quick Meal', ...goalTags],
    source: 'LOCAL_GENERATOR',
    status: 'DRAFT',
    ingredients: ingredients.slice(0, 5).map(item => ({
      ingredientId: item.id,
      name: item.name,
      normalizedName: item.normalizedName,
      quantity: item.quantity,
      unit: item.unit === 'phần' ? item.defaultUnit : item.unit,
      isOptional: item.category === 'seasoning'
    })),
    instructions: [
      { stepNumber: 1, instruction: `Sơ chế ${main.name}${vegetable ? ` và ${vegetable.name}` : ''}, để ráo trước khi nấu.` },
      { stepNumber: 2, instruction: `Làm chín ${main.name} bằng áp chảo, xào hoặc luộc tùy dụng cụ sẵn có.` },
      { stepNumber: 3, instruction: vegetable ? `Cho ${vegetable.name} vào sau để giữ độ tươi và nêm vừa ăn.` : 'Nêm gia vị vừa ăn, ưu tiên ít dầu và ít đường.' },
      { stepNumber: 4, instruction: carb ? `Dùng kèm ${carb.name}, điều chỉnh khẩu phần theo nhu cầu.` : 'Trình bày ra đĩa và dùng khi còn nóng.' }
    ],
    reasons: [
      'Sinh bằng local rule-based generator nên hệ thống vẫn chạy khi không có Gemini API key.',
      `Nguyên liệu chính được chọn là ${main.name}.`,
      `Dinh dưỡng ước tính: ${estimatedNutrition.calories} kcal, ${estimatedNutrition.protein}g protein, ${estimatedNutrition.carbs}g carb, ${estimatedNutrition.fat}g chất béo.`,
      hasUnknownIngredient
        ? 'Có nguyên liệu chưa có dữ liệu dinh dưỡng chuẩn; hãy xác minh định lượng và chỉ số trước khi dùng cho chế độ ăn chuyên biệt.'
        : seasoning ? `${seasoning.name} được xem là gia vị tùy chọn.` : 'Có thể bổ sung gia vị tùy khẩu vị.'
    ]
  };
}
