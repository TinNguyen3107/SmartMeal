export type DietaryType =
  | 'Vietnamese'
  | 'Asian'
  | 'Western'
  | 'Healthy'
  | 'Vegetarian'
  | 'Low Carb'
  | 'High Protein'
  | 'Quick Meal'
  | 'Budget Meal';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type IngredientCategory =
  | 'Vegetable'     // Rau củ
  | 'Meat'          // Thịt
  | 'Seafood'       // Hải sản
  | 'EggDairy'      // Trứng & Sữa
  | 'Condiment'     // Gia vị
  | 'GrainCarb'     // Tinh bột & Gạo & Mì
  | 'Fruit'         // Trái cây
  | 'Other';        // Khác

export interface Ingredient {
  id: string;
  name: string;
  normalizedName: string;
  category: IngredientCategory;
  categoryNameVi: string;
  defaultUnit: string;
  icon?: string;
  aliases: string[];
  approximateCaloriesPerUnit?: number;
}

export interface UserIngredient {
  id: string;
  ingredientId: string;
  name: string;
  normalizedName: string;
  category: IngredientCategory;
  quantity: number;
  unit: string;
  addedAt: string;
  expiryDate?: string;
}

export interface RecipeIngredientItem {
  ingredientId: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit: string;
  isOptional?: boolean;
  notes?: string;
}

export interface RecipeInstruction {
  stepNumber: number;
  instruction: string;
  estimatedMinutes?: number;
  tip?: string;
}

export interface Recipe {
  id: string;
  name: string;
  vietnameseName?: string;
  description: string;
  image: string;
  cuisine: 'Vietnamese' | 'Asian' | 'Western' | 'Fusion' | 'International';
  category: 'Món chính' | 'Canh / Súp' | 'Món xào' | 'Món kho' | 'Món chiên / nướng' | 'Salad / Khai vị' | 'Món ăn nhanh';
  dietaryTags: DietaryType[];
  difficulty: Difficulty;
  preparationTime: number; // minutes
  cookingTime: number;     // minutes
  totalTime: number;       // minutes
  calories: number;        // kcal
  proteinGrams?: number;   // grams
  carbGrams?: number;      // grams
  fatGrams?: number;       // grams
  nutritionNotes?: string; // Scientific basis & nutritional breakdown note
  servings: number;
  rating: number;          // 1.0 - 5.0
  reviewCount: number;
  popularityScore: number; // 0 - 100
  ingredients: RecipeIngredientItem[];
  instructions: RecipeInstruction[];
  createdAt: string;
  updatedAt?: string;
}

export interface RecommendationWeightConfig {
  ingredientMatch: number; // e.g. 0.50 (50%)
  userPreference: number;  // e.g. 0.20 (20%)
  rating: number;          // e.g. 0.10 (10%)
  popularity: number;      // e.g. 0.10 (10%)
  cookingTime: number;     // e.g. 0.05 (5%)
  difficulty: number;      // e.g. 0.05 (5%)
}

export interface RecommendationCriteria {
  ingredients: {
    name: string;
    normalizedName?: string;
    quantity?: number;
    unit?: string;
  }[];
  preferences?: {
    dietaryTypes?: DietaryType[];
    preferredCuisine?: string;
    maxCookingTime?: number;
    difficulty?: Difficulty;
    excludeIngredients?: string[];
  };
  weights?: Partial<RecommendationWeightConfig>;
}

export type MatchStatus = 'CAN_COOK_NOW' | 'ALMOST_READY' | 'NEEDS_SUPPLEMENT' | 'LOW_MATCH';

export interface RecommendedRecipe {
  recipe: Recipe;
  matchScore: number; // 0 - 100%
  finalScore: number; // 0 - 100
  status: MatchStatus;
  statusLabelVi: string;
  matchedIngredients: {
    name: string;
    normalizedName: string;
    userQuantity?: number;
    requiredQuantity: number;
    unit: string;
  }[];
  missingIngredients: {
    ingredientId: string;
    name: string;
    normalizedName: string;
    requiredQuantity: number;
    unit: string;
  }[];
  explanation: {
    headline: string;
    points: string[];
    summary: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  name: string;
  avatar?: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  role: 'admin' | 'user';
  preferences: {
    dietaryTypes: DietaryType[];
    preferredCuisine: string[];
    maxCookingTime: number;
    preferredDifficulty: Difficulty | 'Any';
    spiceLevel: 'None' | 'Mild' | 'Medium' | 'Hot';
    allergies: string[];
  };
  createdAt: string;
}

export interface RecommendationFeedback {
  id: string;
  userId?: string;
  recipeId: string;
  recipeName: string;
  feedbackType: 'HELPFUL' | 'NOT_RELEVANT' | 'TRIED_AND_LIKED' | 'MISSING_TOO_MUCH';
  comment?: string;
  rating?: number;
  timestamp: string;
}

export interface RecipeReview {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 - 5
  comment: string;
  date: string;
}

export interface EvaluationMetricResult {
  k: number;
  precisionAtK: number;
  recallAtK: number;
  hitRateAtK: number;
  ndcgAtK: number;
  evaluatedQueriesCount: number;
  averageLatencyMs: number;
  userHelpfulRate: number;
  timestamp: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  inputIngredients: string[];
  filterConditions?: Record<string, any>;
  expectedOutcome: string;
  actualTopResult: string;
  passed: boolean;
  score: number;
  latencyMs: number;
  details: string;
}

export interface MealPlanDay {
  dayOfWeek: 'Thứ Hai' | 'Thứ Ba' | 'Thứ Tư' | 'Thứ Năm' | 'Thứ Sáu' | 'Thứ Bảy' | 'Chủ Nhật';
  dateStr?: string;
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
  };
}

export interface ShoppingItem {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  recipeNames: string[];
  category: IngredientCategory;
  isPurchased: boolean;
  notes?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'AUTH' | 'SEARCH' | 'RECOMMEND' | 'FEEDBACK' | 'AI_NLP' | 'RECIPE_VIEW' | 'AI_GENERATE';
  message: string;
  details?: any;
}
