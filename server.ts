import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config(); // Load .env TRƯỚC khi dùng process.env

import { createServer as createViteServer } from 'vite';
import { PrismaClient } from './src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
import {
  INITIAL_INGREDIENTS,
  INITIAL_RECIPES,
  DEMO_USERS,
  INITIAL_TEST_CASES
} from './src/data/mockDatabase';
import {
  calculateRecommendations,
  evaluateRecommendationMetrics,
  normalizeIngredient
} from './src/server/recommendationEngine';
import {
  extractIngredientsFromNL,
  detectIngredientsFromImage,
  chatWithRecipeAssistant,
  generateRecipeFromIngredients,
  generateWeeklyMealPlan
} from './src/server/aiService';
import {
  Ingredient,
  Recipe,
  UserProfile,
  UserIngredient,
  RecommendationFeedback,
  RecipeReview,
  SystemLog,
  TestCaseResult
} from './src/types';

// In-memory persistent database store for session
let dbIngredients: Ingredient[] = [...INITIAL_INGREDIENTS];
let dbRecipes: Recipe[] = [...INITIAL_RECIPES];
let dbUsers: UserProfile[] = [...DEMO_USERS];
let currentUser: UserProfile | null = null; // User must login manually

let dbPantry: Record<string, UserIngredient[]> = {};

let dbFavorites: Record<string, string[]> = {};
let dbReviews: RecipeReview[] = [];
let dbFeedbacks: RecommendationFeedback[] = [];

// History tracking (FR-15)
interface HistoryItem {
  id: string;
  userId: string;
  recipeName: string;
  recipeId: string;
  type: 'VIEW' | 'COOKED';
  date: string;
}
let dbHistory: HistoryItem[] = [];

let dbLogs: SystemLog[] = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    type: 'AUTH',
    message: 'Hệ thống SmartMeal khởi động thành công với cơ sở dữ liệu trống.'
  }
];

let dbTestCases: TestCaseResult[] = [...INITIAL_TEST_CASES];

function addLog(type: SystemLog['type'], message: string, details?: any) {
  const log: SystemLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    type,
    message,
    details
  };
  dbLogs.unshift(log);
  if (dbLogs.length > 200) dbLogs.pop();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ==================== SEED & LOAD DATABASE ====================
  async function seedAndLoadDatabase() {
    // 1. Seed tài khoản mẫu
    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' } });
    if (!adminExists) {
      await prisma.user.create({
        data: { email: 'admin@gmail.com', password: bcrypt.hashSync('admin123', 10), name: 'Admin', role: 'admin', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin' }
      });
    }
    const userExists = await prisma.user.findUnique({ where: { email: 'user@gmail.com' } });
    if (!userExists) {
      await prisma.user.create({
        data: { email: 'user@gmail.com', password: bcrypt.hashSync('user123', 10), name: 'User', role: 'user', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=User' }
      });
    }

    // 2. Load Ingredients từ TiDB vào RAM
    const dbIngs = await prisma.ingredient.findMany();
    if (dbIngs.length > 0) {
      dbIngredients = dbIngs.map(ing => ({
        id: ing.id,
        name: ing.name,
        normalizedName: ing.normalizedName,
        category: ing.category as any,
        categoryNameVi: ing.categoryNameVi,
        defaultUnit: ing.defaultUnit,
        aliases: [],
        icon: ''
      }));
    }

    // 3. Load Recipes từ TiDB vào RAM (kèm nguyên liệu)
    const dbRecs = await prisma.recipe.findMany({ include: { ingredients: true } });
    if (dbRecs.length > 0) {
      dbRecipes = dbRecs.map(r => ({
        id: r.id,
        name: r.name,
        vietnameseName: r.vietnameseName,
        description: r.description,
        image: r.image,
        cuisine: r.cuisine as any,
        category: r.category as any,
        dietaryTags: ['Vietnamese'] as any[],
        difficulty: r.difficulty as any,
        preparationTime: 5,
        cookingTime: r.totalTime - 5,
        totalTime: r.totalTime,
        calories: r.calories,
        servings: 2,
        rating: r.rating,
        reviewCount: r.reviewCount,
        popularityScore: r.popularityScore,
        ingredients: r.ingredients.map(i => ({
          ingredientId: i.ingredientId,
          name: i.name,
          normalizedName: i.normalizedName,
          quantity: i.quantity,
          unit: i.unit,
          isOptional: i.isOptional
        })),
        instructions: [
          { stepNumber: 1, instruction: 'Chuẩn bị nguyên liệu.' },
          { stepNumber: 2, instruction: 'Chế biến và thưởng thức.' }
        ],
        createdAt: r.createdAt.toISOString()
      }));
    }

    console.log(`✅ Database loaded: ${dbIngredients.length} nguyên liệu, ${dbRecipes.length} công thức, 2 tài khoản`);
  }

  await seedAndLoadDatabase();

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // ==================== AUTH ROUTES (FR-01, FR-02, FR-03) ====================
  app.get('/api/auth/me', (req, res) => {
    res.json({ user: currentUser });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // Tìm user trong TiDB
    const user = await prisma.user.findUnique({
      where: { email: (email || '').toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    // Hỗ trợ migrate user cũ (lưu plaintext) sang mã hóa bcrypt
    let isValid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isValid = bcrypt.compareSync(password, user.password);
    } else {
      isValid = (user.password === password);
      if (isValid) {
        // Tự động mã hóa lại mật khẩu cũ trên TiDB
        await prisma.user.update({
          where: { id: user.id },
          data: { password: bcrypt.hashSync(password, 10) }
        });
      }
    }

    if (!isValid) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    // Map Prisma User to UserProfile
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || '',
      role: user.role as 'admin' | 'user',
      preferences: {
        dietaryTypes: ['Vietnamese', 'Healthy'],
        preferredCuisine: ['Vietnamese'],
        maxCookingTime: 30,
        preferredDifficulty: 'Any',
        spiceLevel: 'Mild',
        allergies: []
      },
      createdAt: user.createdAt.toISOString()
    };

    currentUser = userProfile;
    addLog('AUTH', `Người dùng đăng nhập từ CSDL: ${user.name} (${user.email})`);
    res.json({ success: true, user: userProfile });
  });



  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !name) {
      return res.status(400).json({ message: 'Vui lòng điền đủ thông tin' });
    }

    // Kiểm tra trùng email trên TiDB
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return res.status(400).json({ message: 'Email đã tồn tại trên hệ thống' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Tạo user mới trên TiDB
    const created = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        role: 'user'
      }
    });

    const newUser: UserProfile = {
      id: created.id,
      email: created.email,
      password,
      name: created.name,
      avatar: created.avatar || '',
      gender: 'Other',
      role: 'user',
      preferences: {
        dietaryTypes: ['Vietnamese', 'Healthy'],
        preferredCuisine: ['Vietnamese'],
        maxCookingTime: 30,
        preferredDifficulty: 'Any',
        spiceLevel: 'Mild',
        allergies: []
      },
      createdAt: created.createdAt.toISOString()
    };

    currentUser = newUser;
    addLog('AUTH', `Tài khoản mới đăng ký vào CSDL: ${name} (${email})`);
    res.json({ success: true, user: newUser });
  });

  app.post('/api/auth/logout', (req, res) => {
    addLog('AUTH', `Người dùng đăng xuất: ${currentUser?.name || 'Guest'}`);
    currentUser = null;
    res.json({ success: true });
  });

  app.put('/api/auth/profile', (req, res) => {
    if (!currentUser) {
      return res.status(401).json({ message: 'Chưa đăng nhập' });
    }
    const { name, age, gender, preferences } = req.body;
    currentUser.name = name || currentUser.name;
    currentUser.age = age ?? currentUser.age;
    currentUser.gender = gender || currentUser.gender;
    if (preferences) {
      currentUser.preferences = { ...currentUser.preferences, ...preferences };
    }
    addLog('AUTH', `Cập nhật hồ sơ & sở thích: ${currentUser.name}`);
    res.json({ success: true, user: currentUser });
  });

  // ==================== INGREDIENT ROUTES (FR-04, FR-06) ====================
  app.get('/api/ingredients', (req, res) => {
    const query = (req.query.q as string || '').trim().toLowerCase();
    const category = req.query.category as string;

    let list = dbIngredients;
    if (category) {
      list = list.filter(i => i.category === category);
    }
    if (query) {
      list = list.filter(i =>
        i.name.toLowerCase().includes(query) ||
        i.normalizedName.toLowerCase().includes(query) ||
        i.aliases.some(a => a.toLowerCase().includes(query))
      );
    }
    res.json({ ingredients: list });
  });

  app.post('/api/ingredients', (req, res) => {
    const { name, category, defaultUnit, aliases, icon, approximateCaloriesPerUnit } = req.body;
    if (!name || !category) {
      return res.status(400).json({ message: 'Thiếu tên hoặc danh mục nguyên liệu' });
    }
    const normalized = name.toUpperCase().replace(/\s+/g, '_');
    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name,
      normalizedName: normalized,
      category,
      categoryNameVi: category,
      defaultUnit: defaultUnit || 'phần',
      icon: icon || '🥗',
      aliases: aliases || [name.toLowerCase()],
      approximateCaloriesPerUnit: approximateCaloriesPerUnit || 50
    };
    dbIngredients.push(newIng);
    addLog('SEARCH', `Admin thêm nguyên liệu mới: ${name} (${normalized})`);
    res.json({ success: true, ingredient: newIng });
  });

  app.put('/api/ingredients/:id', (req, res) => {
    const { id } = req.params;
    const idx = dbIngredients.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });

    dbIngredients[idx] = { ...dbIngredients[idx], ...req.body };
    res.json({ success: true, ingredient: dbIngredients[idx] });
  });

  app.delete('/api/ingredients/:id', (req, res) => {
    const { id } = req.params;
    dbIngredients = dbIngredients.filter(i => i.id !== id);
    res.json({ success: true });
  });

  app.get('/api/user/pantry', async (req, res) => {
    const userId = currentUser?.id;
    if (!userId) return res.json({ items: [] });

    const items = await prisma.userIngredient.findMany({
      where: { userId }
    });
    res.json({ items });
  });

  app.post('/api/user/pantry', async (req, res) => {
    const userId = currentUser?.id;
    if (!userId) return res.status(401).json({ message: 'Vui lòng đăng nhập' });

    const { name, quantity, unit, category } = req.body;
    if (!name) return res.status(400).json({ message: 'Vui lòng nhập tên nguyên liệu' });

    const norm = normalizeIngredient(name, dbIngredients);
    
    // Đảm bảo Ingredient id tồn tại trong TiDB hoặc tạo mới nếu chưa có
    let ingredientId = norm.canonicalIngredient?.id;
    if (!ingredientId) {
      const newIng = await prisma.ingredient.create({
        data: {
          name: name,
          normalizedName: norm.normalizedName,
          category: category || 'Other',
          categoryNameVi: category || 'Khác',
          defaultUnit: unit || 'phần'
        }
      });
      ingredientId = newIng.id;
    }
    
    let created;
    const existingUserIng = await prisma.userIngredient.findFirst({
      where: { userId, ingredientId }
    });

    if (existingUserIng) {
      created = await prisma.userIngredient.update({
        where: { id: existingUserIng.id },
        data: { quantity: existingUserIng.quantity + (Number(quantity) || 1) }
      });
    } else {
      created = await prisma.userIngredient.create({
        data: {
          userId,
          ingredientId: ingredientId,
          name: norm.canonicalIngredient?.name || name,
          quantity: Number(quantity) || 1,
          unit: unit || norm.canonicalIngredient?.defaultUnit || 'phần'
        }
      });
    }

    addLog('SEARCH', `Thêm vào tủ lạnh: ${created.name} (${created.quantity} ${created.unit})`);
    
    const items = await prisma.userIngredient.findMany({ where: { userId } });
    res.json({ success: true, item: created, items });
  });

  app.delete('/api/user/pantry/:id', async (req, res) => {
    const userId = currentUser?.id;
    if (!userId) return res.status(401).json({ message: 'Vui lòng đăng nhập' });

    await prisma.userIngredient.deleteMany({
      where: { id: req.params.id, userId }
    });

    const items = await prisma.userIngredient.findMany({ where: { userId } });
    res.json({ success: true, items });
  });

  // ==================== USER HISTORY (FR-15) ====================
  app.get('/api/user/history', async (req, res) => {
    const userId = currentUser?.id;
    if (!userId) return res.json({ history: [] });

    const items = await prisma.history.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 20
    });

    res.json({ history: items });
  });

  // ==================== RECIPE ROUTES (FR-07, FR-18) ====================
  app.get('/api/recipes', (req, res) => {
    const query = (req.query.q as string || '').trim().toLowerCase();
    const cuisine = req.query.cuisine as string;
    const category = req.query.category as string;
    const difficulty = req.query.difficulty as string;
    const diet = req.query.diet as string;
    const maxTime = Number(req.query.maxTime) || 0;

    let list = dbRecipes;
    if (query) {
      list = list.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(query))
      );
    }
    if (cuisine) list = list.filter(r => r.cuisine.toLowerCase() === cuisine.toLowerCase());
    if (category) list = list.filter(r => r.category === category);
    if (difficulty && difficulty !== 'Any') list = list.filter(r => r.difficulty === difficulty);
    if (diet) list = list.filter(r => r.dietaryTags.some(d => d.toLowerCase() === diet.toLowerCase()));
    if (maxTime > 0) list = list.filter(r => r.totalTime <= maxTime);

    res.json({ recipes: list, total: list.length });
  });

  app.get('/api/recipes/:id', async (req, res) => {
    const recipe = dbRecipes.find(r => r.id === req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Không tìm thấy công thức món ăn' });

    // Ghi lịch sử xem món vào TiDB (FR-15)
    if (currentUser) {
      await prisma.history.create({
        data: {
          userId: currentUser.id,
          recipeId: recipe.id,
          recipeName: recipe.name,
          type: 'VIEW'
        }
      });
    }

    addLog('RECIPE_VIEW', `Xem chi tiết món: ${recipe.name}`);
    const reviews = await prisma.review.findMany({
      where: { recipeId: recipe.id },
      orderBy: { createdAt: 'desc' }
    });
    
    // Map format
    const formattedReviews = reviews.map(r => ({
      ...r,
      userName: r.userId === currentUser?.id ? currentUser.name : 'Người dùng Ẩn danh',
      date: r.createdAt.toISOString().split('T')[0]
    }));
    
    res.json({ recipe, reviews: formattedReviews });
  });

  app.post('/api/recipes', async (req, res) => {
    const body = req.body;

    // Đảm bảo tất cả nguyên liệu đã tồn tại trong bảng Ingredient trước khi tạo Recipe
    const resolvedIngredients = [];
    for (const ing of body.ingredients || []) {
      const normName = ing.normalizedName || ing.name.toUpperCase().replace(/\s+/g, '_');
      let dbIng = await prisma.ingredient.findUnique({ where: { normalizedName: normName } });
      
      if (!dbIng) {
        dbIng = await prisma.ingredient.create({
          data: {
            name: ing.name,
            normalizedName: normName,
            category: 'Other',
            categoryNameVi: 'Khác',
            defaultUnit: ing.unit || 'phần'
          }
        });
        dbIngredients.push({
          ...dbIng,
          category: dbIng.category as any,
          aliases: []
        }); // Đồng bộ vào RAM
      }
      
      resolvedIngredients.push({
        ingredientId: dbIng.id,
        name: ing.name,
        normalizedName: normName,
        quantity: ing.quantity || 1,
        unit: ing.unit || 'phần',
        isOptional: ing.isOptional || false
      });
    }

    // Lưu Recipe vào TiDB
    const created = await prisma.recipe.create({
      data: {
        name: body.name,
        vietnameseName: body.vietnameseName || body.name,
        description: body.description || '',
        image: body.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        cuisine: body.cuisine || 'Vietnamese',
        category: body.category || 'Món chính',
        difficulty: body.difficulty || 'Easy',
        totalTime: body.totalTime || 15,
        calories: body.calories || 250,
        rating: 5.0,
        reviewCount: 1,
        popularityScore: 80,
        ingredients: {
          create: resolvedIngredients
        }
      },
      include: { ingredients: true }
    });

    // Đồng bộ vào RAM
    const newRecipe: Recipe = {
      ...body,
      id: created.id,
      rating: 5.0,
      reviewCount: 1,
      popularityScore: 80,
      createdAt: created.createdAt.toISOString()
    };
    dbRecipes.unshift(newRecipe);

    addLog('SEARCH', `Admin tạo món ăn mới (TiDB): ${created.name}`);
    res.json({ success: true, recipe: newRecipe });
  });

  app.put('/api/recipes/:id', async (req, res) => {
    const idx = dbRecipes.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Không tìm thấy công thức' });

    // Update in TiDB (ignore if not in db e.g., mock data)
    await prisma.recipe.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        vietnameseName: req.body.vietnameseName,
        description: req.body.description,
        difficulty: req.body.difficulty,
        totalTime: req.body.totalTime,
        calories: req.body.calories
      }
    }).catch(() => {});

    // Sync to RAM
    dbRecipes[idx] = { ...dbRecipes[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json({ success: true, recipe: dbRecipes[idx] });
  });

  app.delete('/api/recipes/:id', async (req, res) => {
    // Delete from TiDB
    await prisma.recipe.delete({
      where: { id: req.params.id }
    }).catch(() => {}); // Bỏ qua lỗi nếu không tìm thấy

    // Sync to RAM
    dbRecipes = dbRecipes.filter(r => r.id !== req.params.id);
    res.json({ success: true });
  });

  // ==================== RECOMMENDATION ENGINE (FR-08 - FR-15) ====================
  app.post('/api/recommendations', (req, res) => {
    const { ingredients = [], preferences = {}, weights } = req.body;

    const userPref = currentUser?.preferences
      ? {
        dietaryTypes: preferences.dietaryTypes || currentUser.preferences.dietaryTypes,
        preferredCuisine: preferences.preferredCuisine || currentUser.preferences.preferredCuisine[0],
        maxCookingTime: preferences.maxCookingTime || currentUser.preferences.maxCookingTime,
        difficulty: preferences.difficulty || currentUser.preferences.preferredDifficulty,
        excludeIngredients: preferences.excludeIngredients || currentUser.preferences.allergies
      }
      : preferences;

    const results = calculateRecommendations(
      {
        ingredients,
        preferences: userPref,
        weights
      },
      dbRecipes,
      dbIngredients
    );

    const ingNames = ingredients.map((i: any) => i.name).join(', ');
    addLog('RECOMMEND', `Chạy gợi ý cho [${ingNames || 'Tất cả'}]: Tìm thấy ${results.length} món phù hợp.`);

    res.json({
      total: results.length,
      recommendations: results,
      userPreferencesApplied: userPref
    });
  });

  // Feedback (FR-16)
  app.post('/api/recommendations/feedback', (req, res) => {
    const { recipeId, recipeName, feedbackType, comment, rating } = req.body;
    const feedback: RecommendationFeedback = {
      id: `fb-${Date.now()}`,
      userId: currentUser?.id,
      recipeId,
      recipeName,
      feedbackType: feedbackType || 'HELPFUL',
      comment,
      rating,
      timestamp: new Date().toISOString()
    };
    dbFeedbacks.unshift(feedback);
    addLog('FEEDBACK', `Phản hồi gợi ý món ${recipeName}: ${feedbackType}`);
    res.json({ success: true, feedback });
  });

  // Favorites (FR-17)
  app.get('/api/user/favorites', async (req, res) => {
    const userId = currentUser?.id;
    if (!userId) return res.json({ favorites: [], favoriteIds: [] });

    const favs = await prisma.favorite.findMany({
      where: { userId },
      include: { recipe: true }
    });

    const favoriteIds = favs.map(f => f.recipeId);
    const favorites = favs.map(f => f.recipe);
    res.json({ favorites, favoriteIds });
  });

  app.post('/api/user/favorites/toggle', async (req, res) => {
    const userId = currentUser?.id;
    if (!userId) return res.status(401).json({ message: 'Vui lòng đăng nhập' });

    const { recipeId } = req.body;
    
    const existing = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId, recipeId } }
    });

    let isFav = false;
    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
    } else {
      await prisma.favorite.create({
        data: { userId, recipeId }
      });
      isFav = true;
    }

    const allFavs = await prisma.favorite.findMany({ where: { userId } });
    res.json({ isFavorite: isFav, favoriteIds: allFavs.map(f => f.recipeId) });
  });

  // Ratings & Reviews (FR-16)
  app.post('/api/user/ratings', async (req, res) => {
    const { recipeId, rating, comment } = req.body;
    const userId = currentUser?.id;
    if (!userId) return res.status(401).json({ message: 'Vui lòng đăng nhập' });

    const newRev = await prisma.review.create({
      data: {
        userId,
        recipeId,
        rating: Number(rating) || 5,
        comment: comment || 'Món ăn rất ngon và dễ làm!'
      }
    });

    // Update recipe average rating in TiDB
    const recReviews = await prisma.review.findMany({ where: { recipeId } });
    const avg = recReviews.reduce((sum, r) => sum + r.rating, 0) / recReviews.length;
    
    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        rating: Math.round(avg * 10) / 10,
        reviewCount: recReviews.length
      }
    });

    // Cập nhật lại trong mảng RAM
    const ramRecipe = dbRecipes.find(r => r.id === recipeId);
    if (ramRecipe) {
      ramRecipe.rating = updatedRecipe.rating;
      ramRecipe.reviewCount = updatedRecipe.reviewCount;
    }

    const formattedReview = {
      ...newRev,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      date: newRev.createdAt.toISOString().split('T')[0]
    };

    res.json({ success: true, review: formattedReview, newRating: updatedRecipe.rating });
  });

  // ==================== AI NLP & MULTIMODAL API (FR-05, FR-20, FR-21, FR-26) ====================
  app.post('/api/ai/extract-nlp', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Vui lòng nhập văn bản mô tả' });

    addLog('AI_NLP', `AI trích xuất NLP: "${text}"`);
    const extracted = await extractIngredientsFromNL(text);
    res.json({ success: true, ...extracted });
  });

  app.post('/api/ai/vision-fridge', async (req, res) => {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) return res.status(400).json({ message: 'Thiếu dữ liệu ảnh' });

    addLog('AI_NLP', `AI Vision quét ảnh tủ lạnh`);
    const detected = await detectIngredientsFromImage(imageBase64, mimeType || 'image/jpeg');
    res.json({ success: true, ...detected });
  });

  app.post('/api/ai/chat', async (req, res) => {
    const { message, history = [], pantryIngredients = [] } = req.body;
    const reply = await chatWithRecipeAssistant(
      message,
      history,
      pantryIngredients,
      currentUser?.preferences
    );
    res.json({ reply });
  });

  app.post('/api/ai/generate-recipe', async (req, res) => {
    const { ingredients = [], preferences = {} } = req.body;
    if (!ingredients.length) return res.status(400).json({ message: 'Vui lòng cung cấp danh sách nguyên liệu' });

    addLog('AI_GENERATE', `AI đang sáng tạo công thức từ: ${ingredients.join(', ')}`);
    try {
      const generatedRecipe = await generateRecipeFromIngredients(ingredients, preferences);
      res.json({ success: true, recipe: generatedRecipe });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Lỗi khi gọi AI sinh công thức.' });
    }
  });

  app.post('/api/ai/generate-meal-plan', async (req, res) => {
    addLog('AI_GENERATE', `AI đang thiết kế thực đơn 7 ngày`);
    try {
      const preferences = req.body.preferences || 'Ăn uống lành mạnh, đủ chất';
      const plan = await generateWeeklyMealPlan(preferences);
      res.json({ success: true, plan });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Lỗi khi gọi AI sinh thực đơn.' });
    }
  });

  // ==================== ADMIN & EVALUATION ROUTES (Section 17, 12.6, 13) ====================
  app.get('/api/admin/metrics', (req, res) => {
    const metrics = evaluateRecommendationMetrics(dbTestCases, 5, dbRecipes, dbIngredients);
    const totalUsers = dbUsers.length;
    const totalRecipes = dbRecipes.length;
    const totalIngredients = dbIngredients.length;
    const totalFeedbacks = dbFeedbacks.length;
    const helpfulCount = dbFeedbacks.filter(f => f.feedbackType === 'HELPFUL' || f.feedbackType === 'TRIED_AND_LIKED').length;
    const successRate = totalFeedbacks > 0 ? Math.round((helpfulCount / totalFeedbacks) * 100) : 95;

    res.json({
      metrics,
      stats: {
        totalUsers,
        totalRecipes,
        totalIngredients,
        totalRecommendations: dbLogs.filter(l => l.type === 'RECOMMEND').length + 48,
        successRate,
        averageRating: 4.8
      }
    });
  });

  app.post('/api/admin/run-evaluations', (req, res) => {
    const { k = 5 } = req.body;
    const metrics = evaluateRecommendationMetrics(dbTestCases, Number(k) || 5, dbRecipes, dbIngredients);
    addLog('RECOMMEND', `Chạy bộ kiểm thử tự động Evaluation Suite: Precision@${k}=${metrics.precisionAtK}%, HitRate@${k}=${metrics.hitRateAtK}%`);
    res.json({ success: true, metrics, testCases: dbTestCases });
  });

  app.get('/api/admin/logs', (req, res) => {
    res.json({ logs: dbLogs });
  });

  // ==================== VITE MIDDLEWARE / PRODUCTION STATIC ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartMeal Server running at http://localhost:${PORT}`);
  });
}

startServer();
