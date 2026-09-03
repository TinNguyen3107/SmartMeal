import {
  AnalyzedIngredient,
  GoalType,
  IngredientProfile,
  NutritionProfile,
  ParsedIngredientInput,
  RecipeRecommendation,
  SmartMealAnalysisRequest,
  SmartMealAnalysisResponse
} from '../types';
import { COMMON_UNITS, getIngredientDatabase } from '../data/nutritionDatabase';

const round = (value: number, digits = 1) => {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
};

const emptyNutrition = (): NutritionProfile => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0
});

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findIngredient(inputName: string): { ingredient?: IngredientProfile; confidence: number } {
  const normalized = normalizeText(inputName);
  let best: { ingredient?: IngredientProfile; confidence: number } = { confidence: 0 };

  for (const ingredient of getIngredientDatabase()) {
    const names = [ingredient.name, ...ingredient.aliases].map(normalizeText);
    for (const alias of names) {
      if (normalized === alias) return { ingredient, confidence: 1 };
      if (normalized.includes(alias) || alias.includes(normalized)) {
        const confidence = Math.min(alias.length, normalized.length) / Math.max(alias.length, normalized.length);
        if (confidence > best.confidence) best = { ingredient, confidence: round(confidence, 2) };
      }
    }
  }

  return best;
}

export function parseIngredientText(text: string): ParsedIngredientInput[] {
  return text
    .split(/[,;\n]+/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const compactPrefix = part.match(/^(\d+(?:[.,]\d+)?)\s*(g|gram|kg|ml|l)\s+(.+)$/i);
      if (compactPrefix) {
        return {
          name: compactPrefix[3].trim(),
          quantity: Number(compactPrefix[1].replace(',', '.')),
          unit: compactPrefix[2].toLowerCase()
        };
      }

      const unitBeforeName = part.match(/^(\d+(?:[.,]\d+)?)\s+(quả|qua|củ|cu|chén|chen|bó|bo|miếng|mieng|tép|tep|muỗng|muong)\s+(.+)$/i);
      if (unitBeforeName) {
        return {
          name: unitBeforeName[3].trim(),
          quantity: Number(unitBeforeName[1].replace(',', '.')),
          unit: unitBeforeName[2].toLowerCase()
        };
      }

      const unitAfterName = part.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(g|gram|kg|ml|l|quả|qua|củ|cu|chén|chen|bó|bo|miếng|mieng|tép|tep|muỗng|muong)$/i);
      if (unitAfterName) {
        return {
          name: unitAfterName[1].trim(),
          quantity: Number(unitAfterName[2].replace(',', '.')),
          unit: unitAfterName[3].toLowerCase()
        };
      }

      const match = part.match(/^(.+)$/i);
      if (!match) return { name: part, quantity: 1, unit: 'phần' };
      return {
        name: match[1].trim(),
        quantity: 1,
        unit: 'phần'
      };
    });
}

function convertToGrams(parsed: ParsedIngredientInput, ingredient: IngredientProfile): number {
  const unit = normalizeText(parsed.unit);
  if (unit === 'kg') return parsed.quantity * 1000;
  if (unit === 'g' || unit === 'gram') return parsed.quantity;
  if (unit === 'l') return parsed.quantity * 1000 * ingredient.gramsPerUnit;
  if (unit === 'ml') return parsed.quantity * ingredient.gramsPerUnit;
  if (COMMON_UNITS[parsed.unit] && ingredient.defaultUnit === 'g') return parsed.quantity * COMMON_UNITS[parsed.unit];
  return parsed.quantity * ingredient.gramsPerUnit;
}

function scaleNutrition(ingredient: IngredientProfile, grams: number): NutritionProfile {
  const factor = grams / 100;
  return {
    calories: round(ingredient.calories * factor),
    protein: round(ingredient.protein * factor),
    carbs: round(ingredient.carbs * factor),
    fat: round(ingredient.fat * factor),
    fiber: round(ingredient.fiber * factor)
  };
}

function addNutrition(a: NutritionProfile, b: NutritionProfile): NutritionProfile {
  return {
    calories: round(a.calories + b.calories),
    protein: round(a.protein + b.protein),
    carbs: round(a.carbs + b.carbs),
    fat: round(a.fat + b.fat),
    fiber: round(a.fiber + b.fiber)
  };
}

export function analyzeIngredients(parsedIngredients: ParsedIngredientInput[]): {
  analyzedIngredients: AnalyzedIngredient[];
  totals: NutritionProfile;
  warnings: string[];
} {
  const warnings: string[] = [];
  const analyzedIngredients: AnalyzedIngredient[] = [];

  for (const parsed of parsedIngredients) {
    const { ingredient, confidence } = findIngredient(parsed.name);
    if (!ingredient || confidence < 0.45) {
      warnings.push(`Chưa có dữ liệu dinh dưỡng cho "${parsed.name}", nguyên liệu này chưa được tính vào tổng macro.`);
      continue;
    }

    const grams = round(convertToGrams(parsed, ingredient));
    analyzedIngredients.push({
      inputName: parsed.name,
      matchedName: ingredient.name,
      quantity: parsed.quantity,
      unit: parsed.unit,
      grams,
      confidence,
      category: ingredient.category,
      nutrition: scaleNutrition(ingredient, grams)
    });
  }

  return {
    analyzedIngredients,
    totals: analyzedIngredients.reduce((sum, item) => addNutrition(sum, item.nutrition), emptyNutrition()),
    warnings
  };
}

function macroRatio(totals: NutritionProfile) {
  const proteinCalories = totals.protein * 4;
  const carbCalories = totals.carbs * 4;
  const fatCalories = totals.fat * 9;
  const total = proteinCalories + carbCalories + fatCalories || 1;

  return {
    proteinPercent: Math.round((proteinCalories / total) * 100),
    carbsPercent: Math.round((carbCalories / total) * 100),
    fatPercent: Math.round((fatCalories / total) * 100)
  };
}

function goalTargets(goal: GoalType) {
  const targets = {
    balanced: { protein: 25, carbs: 45, fat: 30, calories: [350, 650], tags: ['Gia đình', 'Cân bằng'] },
    'weight-loss': { protein: 35, carbs: 30, fat: 35, calories: [250, 480], tags: ['Giảm cân', 'No lâu'] },
    'muscle-gain': { protein: 40, carbs: 40, fat: 20, calories: [450, 850], tags: ['Tập gym', 'Tăng cơ'] },
    'low-carb': { protein: 40, carbs: 18, fat: 42, calories: [320, 650], tags: ['Low carb', 'Kiểm soát tinh bột'] },
    vegetarian: { protein: 25, carbs: 45, fat: 30, calories: [300, 650], tags: ['Ăn chay', 'Thực vật'] }
  } satisfies Record<GoalType, { protein: number; carbs: number; fat: number; calories: number[]; tags: string[] }>;
  return targets[goal];
}

function pickByCategory(items: AnalyzedIngredient[], category: AnalyzedIngredient['category']) {
  return items.find(item => item.category === category);
}

function buildRecipeCandidates(items: AnalyzedIngredient[], request: SmartMealAnalysisRequest): RecipeRecommendation[] {
  const protein = pickByCategory(items, 'protein') || pickByCategory(items, 'dairy');
  const vegetable = pickByCategory(items, 'vegetable');
  const carb = pickByCategory(items, 'carb');
  const fat = pickByCategory(items, 'fat');
  const seasoning = pickByCategory(items, 'seasoning');
  const target = goalTargets(request.goal);

  const baseIngredients = items.slice(0, 5).map((item, index) => ({
    name: item.matchedName,
    quantity: item.quantity,
    unit: item.unit,
    role: index === 0 ? 'main' as const : 'support' as const
  }));

  const candidates: RecipeRecommendation[] = [];

  if (protein && vegetable) {
    candidates.push({
      id: 'protein-veg-bowl',
      name: `${protein.matchedName} áp chảo cùng ${vegetable.matchedName}`,
      description: 'Công thức giàu đạm, tăng rau xanh và kiểm soát tinh bột, phù hợp người tập luyện hoặc giảm mỡ.',
      audience: ['Tập gym', 'Giảm cân', 'Low carb'],
      difficulty: 'Easy',
      prepMinutes: 8,
      cookMinutes: 14,
      totalMinutes: 22,
      nutrition: addNutrition(protein.nutrition, vegetable.nutrition),
      ingredients: baseIngredients,
      steps: [
        { order: 1, text: `Sơ chế ${protein.matchedName} và ${vegetable.matchedName}, để ráo trước khi nấu.`, minutes: 6 },
        { order: 2, text: `Áp chảo ${protein.matchedName} với lửa vừa đến khi chín đều hai mặt.`, minutes: 8 },
        { order: 3, text: `Cho ${vegetable.matchedName} vào đảo nhanh, nêm nhẹ để giữ vị tự nhiên.`, minutes: 5 },
        { order: 4, text: 'Chia khẩu phần theo mục tiêu dinh dưỡng và dùng khi còn nóng.', minutes: 3 }
      ],
      score: 0,
      reasons: []
    });
  }

  if (protein && carb && request.goal !== 'low-carb') {
    candidates.push({
      id: 'high-protein-carb-meal',
      name: `${protein.matchedName} ăn kèm ${carb.matchedName}`,
      description: 'Bữa chính có đủ đạm và carbohydrate để phục hồi năng lượng, phù hợp người vận động nhiều.',
      audience: ['Tập gym', 'Cân bằng', 'Tăng cơ'],
      difficulty: 'Easy',
      prepMinutes: 10,
      cookMinutes: 15,
      totalMinutes: 25,
      nutrition: [protein.nutrition, carb.nutrition, vegetable?.nutrition || emptyNutrition()].reduce(addNutrition, emptyNutrition()),
      ingredients: baseIngredients,
      steps: [
        { order: 1, text: `Chuẩn bị ${protein.matchedName}, ${carb.matchedName}${vegetable ? ` và ${vegetable.matchedName}` : ''}.`, minutes: 7 },
        { order: 2, text: `Làm chín ${protein.matchedName} bằng áp chảo, luộc hoặc hấp để hạn chế dầu thừa.`, minutes: 10 },
        { order: 3, text: `Kết hợp với ${carb.matchedName}, điều chỉnh lượng tinh bột theo mục tiêu calo.`, minutes: 5 },
        { order: 4, text: 'Nêm vừa phải, ưu tiên ít đường và ít dầu.', minutes: 3 }
      ],
      score: 0,
      reasons: []
    });
  }

  if (request.goal === 'vegetarian' || items.every(item => {
    const profile = findIngredient(item.matchedName).ingredient;
    return profile?.vegetarian;
  })) {
    const main = protein || vegetable || carb;
    if (main) {
      candidates.push({
        id: 'vegetarian-balanced',
        name: `${main.matchedName} sốt thanh đạm`,
        description: 'Món thiên về thực vật, dễ ăn, ưu tiên chất xơ và lượng dầu vừa phải.',
        audience: ['Ăn chay', 'Giảm cân', 'Cân bằng'],
        difficulty: 'Easy',
        prepMinutes: 8,
        cookMinutes: 12,
        totalMinutes: 20,
        nutrition: items.slice(0, 4).map(item => item.nutrition).reduce(addNutrition, emptyNutrition()),
        ingredients: baseIngredients,
        steps: [
          { order: 1, text: 'Sơ chế nguyên liệu, cắt miếng vừa ăn để chín đều.', minutes: 6 },
          { order: 2, text: 'Xào hoặc kho lửa nhỏ với nước tương, hạn chế dầu.', minutes: 8 },
          { order: 3, text: 'Thêm rau hoặc nấm ở cuối để giữ độ giòn và chất xơ.', minutes: 4 },
          { order: 4, text: 'Nếm lại vị mặn nhẹ, dùng cùng lượng tinh bột phù hợp.', minutes: 2 }
        ],
        score: 0,
        reasons: []
      });
    }
  }

  const fallbackNutrition = items.slice(0, 4).map(item => item.nutrition).reduce(addNutrition, emptyNutrition());
  candidates.push({
    id: 'smart-leftover-meal',
    name: 'Đĩa SmartMeal cân bằng từ nguyên liệu sẵn có',
    description: 'Phương án linh hoạt khi nguyên liệu chưa đủ nhóm, ưu tiên dùng những gì đang có và nấu nhanh.',
    audience: target.tags,
    difficulty: 'Easy',
    prepMinutes: 7,
    cookMinutes: 13,
    totalMinutes: 20,
    nutrition: fallbackNutrition,
    ingredients: baseIngredients,
    steps: [
      { order: 1, text: 'Nhóm nguyên liệu theo đạm, rau và tinh bột để dễ kiểm soát khẩu phần.', minutes: 4 },
      { order: 2, text: 'Nấu chín nhóm đạm trước, sau đó thêm rau để tránh bị mềm quá.', minutes: 9 },
      { order: 3, text: 'Điều chỉnh tinh bột: giảm cho ăn kiêng/low carb, tăng cho tập gym/tăng cơ.', minutes: 4 },
      { order: 4, text: 'Hoàn thiện bằng gia vị nhẹ, tránh thêm quá nhiều dầu hoặc đường.', minutes: 3 }
    ],
    score: 0,
    reasons: []
  });

  return candidates;
}

function scoreRecipe(recipe: RecipeRecommendation, request: SmartMealAnalysisRequest): RecipeRecommendation {
  const target = goalTargets(request.goal);
  const ratio = macroRatio(recipe.nutrition);
  const macroDistance =
    Math.abs(ratio.proteinPercent - target.protein) +
    Math.abs(ratio.carbsPercent - target.carbs) +
    Math.abs(ratio.fatPercent - target.fat);
  const macroScore = Math.max(0, 100 - macroDistance);
  const timeScore = recipe.totalMinutes <= request.maxMinutes ? 100 : Math.max(0, 100 - (recipe.totalMinutes - request.maxMinutes) * 4);
  const calorieMid = (target.calories[0] + target.calories[1]) / 2;
  const calorieScore = Math.max(0, 100 - Math.abs(recipe.nutrition.calories - calorieMid) / calorieMid * 100);
  const varietyScore = Math.min(100, recipe.ingredients.length * 18);

  const score = Math.round(macroScore * 0.4 + timeScore * 0.25 + calorieScore * 0.2 + varietyScore * 0.15);
  const reasons = [
    `Macro gần mục tiêu ${target.tags.join(', ')}: Protein ${ratio.proteinPercent}%, Carb ${ratio.carbsPercent}%, Fat ${ratio.fatPercent}%.`,
    recipe.totalMinutes <= request.maxMinutes
      ? `Thời gian ${recipe.totalMinutes} phút nằm trong giới hạn ${request.maxMinutes} phút.`
      : `Thời gian vượt giới hạn ${request.maxMinutes} phút nên bị trừ điểm.`,
    `Điểm được tính từ macro 40%, thời gian 25%, calo 20% và độ đa dạng nguyên liệu 15%.`
  ];

  return { ...recipe, score, reasons };
}

export function runSmartMealAnalysis(request: SmartMealAnalysisRequest): SmartMealAnalysisResponse {
  const parsedIngredients = parseIngredientText(request.text);
  const { analyzedIngredients, totals, warnings } = analyzeIngredients(parsedIngredients);
  const recommendations = buildRecipeCandidates(analyzedIngredients, request)
    .map(recipe => scoreRecipe(recipe, request))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (analyzedIngredients.length === 0) {
    warnings.push('Hệ thống chưa nhận diện được nguyên liệu nào. Hãy nhập ví dụ: 200g ức gà, 1 chén cơm, 150g bông cải.');
  }

  return {
    parsedIngredients,
    analyzedIngredients,
    totals,
    macroRatio: macroRatio(totals),
    recommendations,
    algorithm: {
      name: 'Hybrid Nutrition Scoring',
      explanation: [
        'Bước 1: chuẩn hóa văn bản, nhận diện nguyên liệu bằng alias tiếng Việt/tiếng Anh trong cơ sở dữ liệu nội bộ.',
        'Bước 2: quy đổi số lượng về gram/ml và tính calories, protein, carb, fat, fiber theo 100g.',
        'Bước 3: sinh các ứng viên công thức theo nhóm nguyên liệu: đạm, rau, tinh bột, chất béo và gia vị.',
        'Bước 4: chấm điểm theo macro 40%, thời gian 25%, calo 20%, độ đa dạng nguyên liệu 15%.',
        'Gemini có thể được thêm sau để diễn đạt công thức tự nhiên hơn, nhưng kết quả lõi không phụ thuộc API.'
      ]
    },
    warnings
  };
}
