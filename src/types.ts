export type Role = 'GUEST' | 'USER' | 'ADMIN';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type NutritionGoal =
  | 'BALANCED'
  | 'WEIGHT_LOSS'
  | 'MUSCLE_GAIN'
  | 'LOW_CARB'
  | 'VEGETARIAN';

export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHT'
  | 'MODERATE'
  | 'ACTIVE';

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

export type IngredientCategory =
  | 'Vegetable'
  | 'Meat'
  | 'Seafood'
  | 'EggDairy'
  | 'Condiment'
  | 'GrainCarb'
  | 'Fruit'
  | 'Other';

export interface ParsedIngredientInput {
  name: string;
  quantity: number;
  unit: string;
}

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
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
}

export interface IngredientDto {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  categoryNameVi: string;
  defaultUnit: string;
  aliases: string[];
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
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

export interface RecipeIngredientDto {
  id?: string;
  ingredientId?: string;
  name: string;
  normalizedName?: string;
  quantity: number;
  unit: string;
  isOptional?: boolean;
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
}

export interface RecipeIngredientItem {
  ingredientId: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit: string;
  isOptional?: boolean;
  notes?: string;
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
}

export interface RecipeInstructionDto {
  stepNumber: number;
  instruction: string;
}

export interface RecipeInstruction {
  stepNumber: number;
  instruction: string;
  estimatedMinutes?: number;
  tip?: string;
}

export interface RecipeDto {
  id: string;
  name: string;
  vietnameseName: string;
  description: string;
  image?: string | null;
  cuisine: string;
  category: string;
  difficulty: Difficulty | string;
  preparationTime: number;
  cookingTime: number;
  calories?: number | null;
  servings: number;
  tags: string[];
  source: string;
  status: string;
  rating: number;
  reviewCount: number;
  popularityScore: number;
  ingredients: RecipeIngredientDto[];
  instructions: RecipeInstructionDto[];
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
  preparationTime: number;
  cookingTime: number;
  totalTime: number;
  calories: number;
  servings: number;
  rating: number;
  reviewCount: number;
  popularityScore: number;
  source?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'REJECTED' | string;
  ingredients: RecipeIngredientItem[];
  instructions: RecipeInstruction[];
  createdAt: string;
  updatedAt?: string;
}

export interface RecommendationRequest {
  text: string;
  maxCookingTime?: number;
  difficulty?: string;
  cuisine?: string;
  tags?: string[];
  nutritionGoal?: NutritionGoal | string;
  activityLevel?: ActivityLevel | string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  allergies?: string[];
  semanticQuery?: string;
  weights?: Partial<RecommendationWeightConfig>;
}

export interface RecipeRecommendationDto extends RecipeDto {
  score: number;
  matchScore: number;
  nutritionScore?: number;
  semanticScore?: number;
  estimatedNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  scoreBreakdown?: {
    ingredientMatch: number;
    nutritionFit: number;
    semanticSimilarity: number;
    userPreference: number;
    rating: number;
    popularity: number;
    cookingTime: number;
    difficulty: number;
  };
  preferenceScore: number;
  ratingScore: number;
  popularityScoreValue: number;
  timeScore: number;
  difficultyScore: number;
  matchedIngredients: RecipeIngredientDto[];
  missingIngredients: RecipeIngredientDto[];
  reasons: string[];
  matchLevel: string;
}

export interface RecommendationResponse {
  parsedIngredients: ParsedIngredientInput[];
  normalizedIngredients: IngredientDto[];
  recommendations: RecipeRecommendationDto[];
  generatedDraft?: RecipeDraft;
  algorithm: {
    name: string;
    formula: string;
    explanation: string[];
  };
  warnings: string[];
}

export interface RecipeDraft {
  name: string;
  vietnameseName: string;
  description: string;
  cuisine: string;
  category: string;
  difficulty: Difficulty;
  preparationTime: number;
  cookingTime: number;
  calories?: number;
  estimatedNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  servings: number;
  tags: string[];
  source: 'LOCAL_GENERATOR' | 'GEMINI_DRAFT';
  status: 'DRAFT';
  ingredients: RecipeIngredientDto[];
  instructions: RecipeInstructionDto[];
  reasons: string[];
}

export interface RecommendationWeightConfig {
  ingredientMatch?: number;
  userPreference?: number;
  rating?: number;
  popularity?: number;
  cookingTime?: number;
  difficulty?: number;
  w_match?: number;
  w_user?: number;
  w_rating?: number;
  w_popularity?: number;
  w_time?: number;
  w_difficulty?: number;
  w_nutrition?: number;
  w_semantic?: number;
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
    preferredCuisine?: string | string[];
    maxCookingTime?: number;
    difficulty?: Difficulty;
    excludeIngredients?: string[];
  };
  weights?: Partial<RecommendationWeightConfig>;
}

export type MatchStatus = 'CAN_COOK_NOW' | 'ALMOST_READY' | 'NEEDS_SUPPLEMENT' | 'LOW_MATCH';

export interface RecommendedRecipe {
  recipe: Recipe;
  matchScore: number;
  nutritionScore?: number;
  semanticScore?: number;
  estimatedNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  scoreBreakdown?: {
    ingredientMatch: number;
    nutritionFit: number;
    semanticSimilarity: number;
    userPreference: number;
    rating: number;
    popularity: number;
    cookingTime: number;
    difficulty: number;
  };
  finalScore: number;
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
    nutritionGoal: NutritionGoal;
    activityLevel: ActivityLevel;
    heightCm?: number;
    weightKg?: number;
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
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
  rating: number;
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

export interface EvaluationRunRecord {
  id: string;
  k: number;
  weights: Partial<RecommendationWeightConfig>;
  precisionAtK: number;
  recallAtK: number;
  hitRateAtK: number;
  ndcgAtK: number;
  evaluatedQueriesCount: number;
  averageLatencyMs: number;
  userHelpfulRate: number;
  createdAt: string;
  executedBy: { name: string; email: string } | null;
}

export interface EvaluationCaseRecord {
  id: string;
  code: string;
  description: string;
  inputIngredients: string[];
  expectedRecipeIds: string[];
  expectedRecipeNames: string[];
  nutritionGoal: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string; email: string } | null;
}

export interface TestCaseResult {
  id: string;
  testId?: string;
  name: string;
  description: string;
  inputIngredients: string[];
  filterConditions?: Record<string, unknown>;
  expectedOutcome: string;
  expectedRecipeNames?: string[];
  actualTopResult: string;
  returnedTopRecipes?: { id: string; name: string; score: number }[];
  passed: boolean;
  score: number;
  latencyMs: number;
  details: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'AUTH' | 'SEARCH' | 'RECOMMEND' | 'FEEDBACK' | 'AI_NLP' | 'RECIPE_VIEW';
  message: string;
  details?: unknown;
}
