import assert from 'node:assert/strict';
import { buildRecommendations, parseIngredientText } from '../src/server/recommendationEngine';

type TestIngredient = {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  categoryNameVi: string;
  defaultUnit: string;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  aliases: { alias: string; normalized: string }[];
};

const ingredients: TestIngredient[] = [
  {
    id: 'shrimp', name: 'Tôm', normalizedName: 'shrimp', category: 'protein', categoryNameVi: 'Hải sản', defaultUnit: 'g',
    caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3,
    aliases: [{ alias: 'shrimp', normalized: 'shrimp' }, { alias: 'tôm', normalized: 'tom' }]
  },
  {
    id: 'tomato', name: 'Cà chua', normalizedName: 'tomato', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'quả',
    caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2,
    aliases: [{ alias: 'tomato', normalized: 'tomato' }]
  },
  {
    id: 'chicken', name: 'Ức gà', normalizedName: 'chicken-breast', category: 'protein', categoryNameVi: 'Thịt', defaultUnit: 'g',
    caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6,
    aliases: [{ alias: 'chicken', normalized: 'chicken' }]
  },
  {
    id: 'rice', name: 'Cơm trắng', normalizedName: 'rice', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'chén',
    caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3,
    aliases: [{ alias: 'rice', normalized: 'rice' }]
  },
  {
    id: 'water-spinach', name: 'Rau muống', normalizedName: 'water-spinach', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó',
    caloriesPer100g: 19, proteinPer100g: 2.6, carbsPer100g: 3.1, fatPer100g: 0.2,
    aliases: [{ alias: 'rau muống', normalized: 'rau muong' }]
  },
  {
    id: 'garlic', name: 'Tỏi', normalizedName: 'garlic', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'tép',
    caloriesPer100g: 149, proteinPer100g: 6.4, carbsPer100g: 33.1, fatPer100g: 0.5,
    aliases: [{ alias: 'tỏi', normalized: 'toi' }]
  }
];

function recipe(input: {
  id: string;
  name: string;
  tags: string[];
  calories: number;
  ingredientIds: string[];
  preparationTime?: number;
  cookingTime?: number;
}) {
  return {
    id: input.id,
    name: input.name,
    vietnameseName: input.name,
    description: input.name,
    cuisine: 'Vietnamese',
    category: 'Món chính',
    difficulty: 'Easy',
    preparationTime: input.preparationTime ?? 5,
    cookingTime: input.cookingTime ?? 15,
    calories: input.calories,
    servings: 1,
    tags: JSON.stringify(input.tags),
    source: 'MANUAL',
    status: 'PUBLISHED',
    rating: 4.5,
    reviewCount: 10,
    popularityScore: 75,
    ingredients: input.ingredientIds.map(ingredientId => {
      const item = ingredients.find(ingredient => ingredient.id === ingredientId)!;
      return {
        ingredientId: item.id,
        name: item.name,
        normalizedName: item.normalizedName,
        quantity: item.id === 'rice' ? 1 : 150,
        unit: item.defaultUnit,
        isOptional: false,
        caloriesPer100g: item.caloriesPer100g,
        proteinPer100g: item.proteinPer100g,
        carbsPer100g: item.carbsPer100g,
        fatPer100g: item.fatPer100g
      };
    }),
    instructions: [{ stepNumber: 1, instruction: 'Cook safely.' }]
  };
}

const recipes = [
  recipe({ id: 'shrimp-tomato', name: 'Tôm xào cà chua', tags: ['Healthy'], calories: 210, ingredientIds: ['shrimp', 'tomato'] }),
  recipe({ id: 'tomato-only', name: 'Canh cà chua', tags: ['Healthy'], calories: 90, ingredientIds: ['tomato'] }),
  recipe({ id: 'muscle', name: 'Ức gà tăng cơ', tags: ['High Protein', 'Healthy', 'Low Carb'], calories: 320, ingredientIds: ['chicken'] }),
  recipe({ id: 'rice-bowl', name: 'Cơm trắng', tags: ['Quick Meal'], calories: 520, ingredientIds: ['rice'] })
];

function topRecipeId(request: Parameters<typeof buildRecommendations>[0]) {
  return buildRecommendations(request, ingredients, recipes).recommendations[0]?.id;
}

const parsed = parseIngredientText('200g shrimp, 2 quả cà chua, 1 chén rice');
assert.deepEqual(parsed, [
  { name: 'shrimp', quantity: 200, unit: 'g' },
  { name: 'cà chua', quantity: 2, unit: 'quả' },
  { name: 'rice', quantity: 1, unit: 'chén' }
]);

const aliasResult = buildRecommendations({ text: '200g shrimp, 2 quả tomato' }, ingredients, recipes);
assert.equal(aliasResult.normalizedIngredients.length, 2, 'Vietnamese and English aliases must resolve');
assert.equal(aliasResult.recommendations[0]?.id, 'shrimp-tomato', 'Alias resolution should retain the exact recipe match');

const allergyResult = buildRecommendations({ text: '200g tôm, 2 quả cà chua', allergies: ['tôm'] }, ingredients, recipes);
assert(!allergyResult.recommendations.some(item => item.id === 'shrimp-tomato'), 'Shrimp allergy must remove shrimp recipe');
assert(allergyResult.recommendations.some(item => item.id === 'tomato-only'), 'Shrimp allergy must not remove tomato recipe');
assert.equal(allergyResult.generatedDraft, undefined, 'Allergen in input must block flexible recipe generation');

assert.equal(
  topRecipeId({ text: '150g chicken, 1 chén rice', nutritionGoal: 'MUSCLE_GAIN', tags: ['High Protein'] }),
  'muscle',
  'Muscle-gain goal should prioritize a high-protein recipe'
);

assert.equal(
  topRecipeId({ text: '150g chicken, 1 chén rice', nutritionGoal: 'LOW_CARB', tags: ['Low Carb'] }),
  'muscle',
  'Low-carb goal should prioritize lower-carb recipe'
);

assert.equal(
  topRecipeId({ text: '150g chicken, 1 chén rice', nutritionGoal: 'WEIGHT_LOSS', targetCalories: 1200, tags: ['Healthy'] }),
  'muscle',
  'Weight-loss goal should prefer the lower-calorie healthy recipe'
);

const unknownResult = buildRecommendations({ text: '150g mystery-herb' }, ingredients, recipes);
assert.equal(unknownResult.recommendations.length, 0, 'Unknown ingredient must not falsely match stored recipes');
assert.equal(unknownResult.generatedDraft?.source, 'LOCAL_GENERATOR', 'Unknown ingredient should use local flexible fallback');
assert(unknownResult.warnings.some(warning => warning.includes('mystery-herb')), 'Unknown ingredient requires a verification warning');

const waterSpinachDraft = buildRecommendations({ text: '1 bó rau muống, 3 tép tỏi' }, ingredients, recipes).generatedDraft;
assert.equal(waterSpinachDraft?.vietnameseName, 'Rau muống xào tỏi (nháp linh hoạt)', 'Common water-spinach and garlic pair should use its local culinary rule');

const duplicateIngredients = [
  {
    id: 'legacy-water-spinach', name: 'Rau muống', normalizedName: 'RAU_MUONG', category: 'vegetable', categoryNameVi: 'Vegetable', defaultUnit: 'bó',
    caloriesPer100g: null, proteinPer100g: null, carbsPer100g: null, fatPer100g: null, aliases: []
  },
  {
    id: 'catalog-water-spinach', name: 'Rau muống', normalizedName: 'water-spinach', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó',
    caloriesPer100g: 19, proteinPer100g: 2.6, carbsPer100g: 3.1, fatPer100g: 0.2, aliases: [{ alias: 'rau muống', normalized: 'rau muong' }]
  }
];
const duplicateResult = buildRecommendations({ text: '1 bó rau muống' }, duplicateIngredients, []);
assert.equal(duplicateResult.normalizedIngredients[0]?.id, 'catalog-water-spinach', 'Resolver must prefer complete catalog data over a legacy duplicate');

console.log('Engine tests passed: parsing, aliases, allergy boundaries, nutrition-goal ranking, and flexible fallback rules.');
