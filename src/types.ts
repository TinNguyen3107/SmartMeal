export type GoalType = 'balanced' | 'weight-loss' | 'muscle-gain' | 'low-carb' | 'vegetarian';

export interface ParsedIngredientInput {
  name: string;
  quantity: number;
  unit: string;
}

export interface NutritionProfile {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface IngredientProfile extends NutritionProfile {
  id: string;
  name: string;
  aliases: string[];
  category: 'protein' | 'vegetable' | 'carb' | 'fat' | 'seasoning' | 'dairy';
  defaultUnit: string;
  gramsPerUnit: number;
  vegetarian: boolean;
}

export interface AnalyzedIngredient {
  inputName: string;
  matchedName: string;
  quantity: number;
  unit: string;
  grams: number;
  confidence: number;
  category: IngredientProfile['category'];
  nutrition: NutritionProfile;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  role: 'main' | 'support' | 'optional';
}

export interface CookingStep {
  order: number;
  text: string;
  minutes: number;
}

export interface RecipeRecommendation {
  id: string;
  name: string;
  description: string;
  audience: string[];
  difficulty: 'Easy' | 'Medium';
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  nutrition: NutritionProfile;
  ingredients: RecipeIngredient[];
  steps: CookingStep[];
  score: number;
  reasons: string[];
}

export interface SmartMealAnalysisRequest {
  text: string;
  goal: GoalType;
  maxMinutes: number;
  servings: number;
}

export interface SmartMealAnalysisResponse {
  parsedIngredients: ParsedIngredientInput[];
  analyzedIngredients: AnalyzedIngredient[];
  totals: NutritionProfile;
  macroRatio: {
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  };
  recommendations: RecipeRecommendation[];
  algorithm: {
    name: string;
    explanation: string[];
  };
  warnings: string[];
}
