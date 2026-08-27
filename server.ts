import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
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
  chatWithRecipeAssistant
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

dotenv.config();

// In-memory persistent database store for session
let dbIngredients: Ingredient[] = [...INITIAL_INGREDIENTS];
let dbRecipes: Recipe[] = [...INITIAL_RECIPES];
let dbUsers: UserProfile[] = [...DEMO_USERS];
let currentUser: UserProfile | null = DEMO_USERS[0]; // Default logged in as demo user

let dbPantry: Record<string, UserIngredient[]> = {
  'user-demo-01': [
    {
      id: 'p-1',
      ingredientId: 'ing-egg',
      name: 'Trứng gà',
      normalizedName: 'EGG',
      category: 'EggDairy',
      quantity: 4,
      unit: 'quả',
      addedAt: new Date().toISOString()
    },
    {
      id: 'p-2',
      ingredientId: 'ing-tomato',
      name: 'Cà chua',
      normalizedName: 'TOMATO',
      category: 'Vegetable',
      quantity: 3,
      unit: 'quả',
      addedAt: new Date().toISOString()
    },
    {
      id: 'p-3',
      ingredientId: 'ing-green-onion',
      name: 'Hành lá',
      normalizedName: 'GREEN_ONION',
      category: 'Vegetable',
      quantity: 2,
      unit: 'nhánh',
      addedAt: new Date().toISOString()
    }
  ]
};

let dbFavorites: Record<string, string[]> = {
  'user-demo-01': ['rec-01', 'rec-04']
};

let dbReviews: RecipeReview[] = [
  {
    id: 'rev-1',
    recipeId: 'rec-01',
    userId: 'user-demo-01',
    userName: 'Nguyễn Minh Anh',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Món làm siêu nhanh và ngon chuẩn cơm mẹ nấu! Sốt cà chua sánh đậm đà.',
    date: '2026-02-20'
  }
];

let dbFeedbacks: RecommendationFeedback[] = [
  {
    id: 'fb-1',
    userId: 'user-demo-01',
    recipeId: 'rec-01',
    recipeName: 'Trứng sốt cà chua',
    feedbackType: 'HELPFUL',
    rating: 5,
    timestamp: new Date().toISOString()
  }
];

let dbLogs: SystemLog[] = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    type: 'AUTH',
    message: 'Hệ thống SmartMeal khởi động thành công với 18 công thức chuẩn.'
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

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // ==================== AUTH ROUTES (FR-01, FR-02, FR-03) ====================
  app.get('/api/auth/me', (req, res) => {
    res.json({ user: currentUser });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = dbUsers.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }
    currentUser = user;
    addLog('AUTH', `Người dùng đăng nhập: ${user.name} (${user.email})`);
    res.json({ success: true, user });
  });

  app.post('/api/auth/demo-login', (req, res) => {
    const { role } = req.body;
    const user = dbUsers.find(u => u.role === (role || 'user')) || dbUsers[0];
    currentUser = user;
    addLog('AUTH', `Đăng nhập Demo chế độ: ${user.role} (${user.name})`);
    res.json({ success: true, user });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !name) {
      return res.status(400).json({ message: 'Vui lòng điền đủ thông tin' });
    }
    if (dbUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ message: 'Email đã tồn tại trên hệ thống' });
    }
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      name,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
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
      createdAt: new Date().toISOString()
    };
    dbUsers.push(newUser);
    currentUser = newUser;
    addLog('AUTH', `Tài khoản mới đăng ký: ${name} (${email})`);
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

  // ==================== USER PANTRY / MY INGREDIENTS ====================
  app.get('/api/user/pantry', (req, res) => {
    const userId = currentUser?.id || 'guest';
    const items = dbPantry[userId] || [];
    res.json({ items });
  });

  app.post('/api/user/pantry', (req, res) => {
    const userId = currentUser?.id || 'guest';
    const { name, quantity, unit, category } = req.body;
    if (!name) return res.status(400).json({ message: 'Vui lòng nhập tên nguyên liệu' });

    const norm = normalizeIngredient(name, dbIngredients);
    const newItem: UserIngredient = {
      id: `pantry-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ingredientId: norm.canonicalIngredient?.id || `custom-${Date.now()}`,
      name: norm.canonicalIngredient?.name || name,
      normalizedName: norm.normalizedName,
      category: norm.canonicalIngredient?.category || category || 'Other',
      quantity: Number(quantity) || 1,
      unit: unit || norm.canonicalIngredient?.defaultUnit || 'phần',
      addedAt: new Date().toISOString()
    };

    if (!dbPantry[userId]) dbPantry[userId] = [];
    dbPantry[userId].push(newItem);
    addLog('SEARCH', `Thêm vào tủ lạnh: ${newItem.name} (${newItem.quantity} ${newItem.unit})`);
    res.json({ success: true, item: newItem, items: dbPantry[userId] });
  });

  app.delete('/api/user/pantry/:id', (req, res) => {
    const userId = currentUser?.id || 'guest';
    if (dbPantry[userId]) {
      dbPantry[userId] = dbPantry[userId].filter(i => i.id !== req.params.id);
    }
    res.json({ success: true, items: dbPantry[userId] || [] });
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

  app.get('/api/recipes/:id', (req, res) => {
    const recipe = dbRecipes.find(r => r.id === req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Không tìm thấy công thức món ăn' });

    addLog('RECIPE_VIEW', `Xem chi tiết món: ${recipe.name}`);
    const reviews = dbReviews.filter(rev => rev.recipeId === recipe.id);
    res.json({ recipe, reviews });
  });

  app.post('/api/recipes', (req, res) => {
    const newRecipe: Recipe = {
      ...req.body,
      id: `rec-${Date.now()}`,
      rating: 5.0,
      reviewCount: 1,
      popularityScore: 80,
      createdAt: new Date().toISOString()
    };
    dbRecipes.unshift(newRecipe);
    addLog('SEARCH', `Admin tạo món ăn mới: ${newRecipe.name}`);
    res.json({ success: true, recipe: newRecipe });
  });

  app.put('/api/recipes/:id', (req, res) => {
    const idx = dbRecipes.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Không tìm thấy công thức' });

    dbRecipes[idx] = { ...dbRecipes[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json({ success: true, recipe: dbRecipes[idx] });
  });

  app.delete('/api/recipes/:id', (req, res) => {
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
  app.get('/api/user/favorites', (req, res) => {
    const userId = currentUser?.id || 'guest';
    const favIds = dbFavorites[userId] || [];
    const favorites = dbRecipes.filter(r => favIds.includes(r.id));
    res.json({ favorites, favoriteIds: favIds });
  });

  app.post('/api/user/favorites/toggle', (req, res) => {
    const userId = currentUser?.id || 'guest';
    const { recipeId } = req.body;
    if (!dbFavorites[userId]) dbFavorites[userId] = [];

    const isFav = dbFavorites[userId].includes(recipeId);
    if (isFav) {
      dbFavorites[userId] = dbFavorites[userId].filter(id => id !== recipeId);
    } else {
      dbFavorites[userId].push(recipeId);
    }
    res.json({ isFavorite: !isFav, favoriteIds: dbFavorites[userId] });
  });

  // Ratings & Reviews (FR-16)
  app.post('/api/user/ratings', (req, res) => {
    const { recipeId, rating, comment } = req.body;
    const newRev: RecipeReview = {
      id: `rev-${Date.now()}`,
      recipeId,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Thành viên SmartMeal',
      userAvatar: currentUser?.avatar,
      rating: Number(rating) || 5,
      comment: comment || 'Món ăn rất ngon và dễ làm!',
      date: new Date().toISOString().split('T')[0]
    };
    dbReviews.unshift(newRev);

    // Update recipe average rating
    const recReviews = dbReviews.filter(r => r.recipeId === recipeId);
    const avg = recReviews.reduce((sum, r) => sum + r.rating, 0) / recReviews.length;
    const recipe = dbRecipes.find(r => r.id === recipeId);
    if (recipe) {
      recipe.rating = Math.round(avg * 10) / 10;
      recipe.reviewCount = recReviews.length;
    }

    res.json({ success: true, review: newRev, newRating: recipe?.rating });
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
    console.log(`SmartMeal Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
