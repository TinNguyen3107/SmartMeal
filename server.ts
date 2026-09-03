import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { runSmartMealAnalysis } from './src/server/smartMealEngine';
import { addIngredientProfile, getIngredientDatabase } from './src/data/nutritionDatabase';
import { GoalType, IngredientProfile, SmartMealAnalysisRequest } from './src/types';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const allowedGoals: GoalType[] = ['balanced', 'weight-loss', 'muscle-gain', 'low-carb', 'vegetarian'];
const evaluationCases = [
  {
    id: 'TC-01',
    input: '200g ức gà, 1 chén cơm, 150g bông cải xanh',
    goal: 'muscle-gain' as GoalType,
    expected: 'món giàu protein cho tập gym'
  },
  {
    id: 'TC-02',
    input: '2 quả trứng, 150g dưa leo, 1 quả bơ',
    goal: 'low-carb' as GoalType,
    expected: 'món ít tinh bột'
  },
  {
    id: 'TC-03',
    input: '150g đậu hũ, 100g nấm, 1 bó rau muống',
    goal: 'vegetarian' as GoalType,
    expected: 'món chay cân bằng'
  },
  {
    id: 'TC-04',
    input: '200g tôm, 150g rau bina, 1 củ khoai lang',
    goal: 'weight-loss' as GoalType,
    expected: 'món kiểm soát calo'
  }
];

function normalizeRequest(body: Partial<SmartMealAnalysisRequest>): SmartMealAnalysisRequest {
  const goal = allowedGoals.includes(body.goal as GoalType) ? body.goal as GoalType : 'balanced';

  return {
    text: typeof body.text === 'string' ? body.text : '',
    goal,
    maxMinutes: Math.min(90, Math.max(10, Number(body.maxMinutes) || 30)),
    servings: Math.min(6, Math.max(1, Number(body.servings) || 1))
  };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      app: 'SmartMeal',
      mode: 'offline-first-recommendation',
      geminiOptional: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  app.post('/api/smartmeal/analyze', (req, res) => {
    const request = normalizeRequest(req.body);
    if (!request.text.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập ít nhất một nguyên liệu.' });
    }

    const result = runSmartMealAnalysis(request);
    res.json(result);
  });

  app.get('/api/admin/ingredients', (_req, res) => {
    res.json({ ingredients: getIngredientDatabase() });
  });

  app.post('/api/admin/ingredients', (req, res) => {
    try {
      const body = req.body as Partial<IngredientProfile>;
      if (!body.name || !body.category || !body.defaultUnit) {
        return res.status(400).json({ message: 'Thiếu tên, nhóm hoặc đơn vị mặc định.' });
      }

      const created = addIngredientProfile({
        id: body.id || body.name,
        name: body.name,
        aliases: Array.isArray(body.aliases) ? body.aliases : [],
        category: body.category,
        defaultUnit: body.defaultUnit,
        gramsPerUnit: Number(body.gramsPerUnit) || 1,
        vegetarian: Boolean(body.vegetarian),
        calories: Number(body.calories) || 0,
        protein: Number(body.protein) || 0,
        carbs: Number(body.carbs) || 0,
        fat: Number(body.fat) || 0,
        fiber: Number(body.fiber) || 0
      });
      res.json({ ingredient: created, total: getIngredientDatabase().length });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Không thể thêm nguyên liệu.' });
    }
  });

  app.get('/api/admin/evaluation', (_req, res) => {
    const results = evaluationCases.map(testCase => {
      const analysis = runSmartMealAnalysis({
        text: testCase.input,
        goal: testCase.goal,
        maxMinutes: 30,
        servings: 1
      });
      const topRecipe = analysis.recommendations[0];
      return {
        ...testCase,
        topRecipe: topRecipe?.name || 'Không có gợi ý',
        score: topRecipe?.score || 0,
        recognizedIngredients: analysis.analyzedIngredients.length,
        passed: Boolean(topRecipe && topRecipe.score >= 60 && analysis.analyzedIngredients.length >= 2)
      };
    });

    const passed = results.filter(item => item.passed).length;
    res.json({
      total: results.length,
      passed,
      hitRate: Math.round((passed / results.length) * 100),
      averageScore: Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length),
      results
    });
  });

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartMeal running at http://localhost:${PORT}`);
  });
}

startServer();
