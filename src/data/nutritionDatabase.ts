import { IngredientProfile } from '../types';

const baseIngredientDatabase: IngredientProfile[] = [
  {
    id: 'egg',
    name: 'Trứng gà',
    aliases: ['trứng', 'trung', 'egg', 'eggs'],
    category: 'protein',
    defaultUnit: 'quả',
    gramsPerUnit: 50,
    vegetarian: true,
    calories: 143,
    protein: 12.6,
    carbs: 0.7,
    fat: 9.5,
    fiber: 0
  },
  {
    id: 'chicken-breast',
    name: 'Ức gà',
    aliases: ['ức gà', 'uc ga', 'thịt gà', 'thit ga', 'chicken breast', 'chicken'],
    category: 'protein',
    defaultUnit: 'g',
    gramsPerUnit: 1,
    vegetarian: false,
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0
  },
  {
    id: 'beef',
    name: 'Thịt bò',
    aliases: ['thịt bò', 'thit bo', 'beef', 'bò'],
    category: 'protein',
    defaultUnit: 'g',
    gramsPerUnit: 1,
    vegetarian: false,
    calories: 250,
    protein: 26,
    carbs: 0,
    fat: 15,
    fiber: 0
  },
  {
    id: 'shrimp',
    name: 'Tôm',
    aliases: ['tôm', 'tom', 'shrimp', 'prawn'],
    category: 'protein',
    defaultUnit: 'g',
    gramsPerUnit: 1,
    vegetarian: false,
    calories: 99,
    protein: 24,
    carbs: 0.2,
    fat: 0.3,
    fiber: 0
  },
  {
    id: 'salmon',
    name: 'Cá hồi',
    aliases: ['cá hồi', 'ca hoi', 'salmon'],
    category: 'protein',
    defaultUnit: 'g',
    gramsPerUnit: 1,
    vegetarian: false,
    calories: 208,
    protein: 20,
    carbs: 0,
    fat: 13,
    fiber: 0
  },
  {
    id: 'tofu',
    name: 'Đậu hũ',
    aliases: ['đậu hũ', 'dau hu', 'đậu phụ', 'dau phu', 'tofu'],
    category: 'protein',
    defaultUnit: 'miếng',
    gramsPerUnit: 100,
    vegetarian: true,
    calories: 76,
    protein: 8,
    carbs: 1.9,
    fat: 4.8,
    fiber: 0.3
  },
  {
    id: 'rice',
    name: 'Cơm trắng',
    aliases: ['cơm', 'com', 'cơm trắng', 'rice'],
    category: 'carb',
    defaultUnit: 'chén',
    gramsPerUnit: 150,
    vegetarian: true,
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    fiber: 0.4
  },
  {
    id: 'brown-rice',
    name: 'Gạo lứt',
    aliases: ['gạo lứt', 'gao lut', 'brown rice'],
    category: 'carb',
    defaultUnit: 'chén',
    gramsPerUnit: 150,
    vegetarian: true,
    calories: 111,
    protein: 2.6,
    carbs: 23,
    fat: 0.9,
    fiber: 1.8
  },
  {
    id: 'oat',
    name: 'Yến mạch',
    aliases: ['yến mạch', 'yen mach', 'oat', 'oats'],
    category: 'carb',
    defaultUnit: 'g',
    gramsPerUnit: 1,
    vegetarian: true,
    calories: 389,
    protein: 16.9,
    carbs: 66.3,
    fat: 6.9,
    fiber: 10.6
  },
  {
    id: 'sweet-potato',
    name: 'Khoai lang',
    aliases: ['khoai lang', 'sweet potato'],
    category: 'carb',
    defaultUnit: 'củ',
    gramsPerUnit: 130,
    vegetarian: true,
    calories: 86,
    protein: 1.6,
    carbs: 20.1,
    fat: 0.1,
    fiber: 3
  },
  {
    id: 'tomato',
    name: 'Cà chua',
    aliases: ['cà chua', 'ca chua', 'tomato'],
    category: 'vegetable',
    defaultUnit: 'quả',
    gramsPerUnit: 120,
    vegetarian: true,
    calories: 18,
    protein: 0.9,
    carbs: 3.9,
    fat: 0.2,
    fiber: 1.2
  },
  {
    id: 'broccoli',
    name: 'Bông cải xanh',
    aliases: ['bông cải', 'bong cai', 'súp lơ xanh', 'sup lo xanh', 'broccoli'],
    category: 'vegetable',
    defaultUnit: 'g',
    gramsPerUnit: 1,
    vegetarian: true,
    calories: 34,
    protein: 2.8,
    carbs: 6.6,
    fat: 0.4,
    fiber: 2.6
  },
  {
    id: 'spinach',
    name: 'Rau bina',
    aliases: ['rau bina', 'cải bó xôi', 'cai bo xoi', 'spinach'],
    category: 'vegetable',
    defaultUnit: 'g',
    gramsPerUnit: 1,
    vegetarian: true,
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    fiber: 2.2
  },
  {
    id: 'water-spinach',
    name: 'Rau muống',
    aliases: ['rau muống', 'rau muong', 'morning glory'],
    category: 'vegetable',
    defaultUnit: 'bó',
    gramsPerUnit: 250,
    vegetarian: true,
    calories: 19,
    protein: 2.6,
    carbs: 3.1,
    fat: 0.2,
    fiber: 2.1
  },
  {
    id: 'mushroom',
    name: 'Nấm',
    aliases: ['nấm', 'nam', 'nấm rơm', 'mushroom'],
    category: 'vegetable',
    defaultUnit: 'g',
    gramsPerUnit: 1,
    vegetarian: true,
    calories: 22,
    protein: 3.1,
    carbs: 3.3,
    fat: 0.3,
    fiber: 1
  },
  {
    id: 'cucumber',
    name: 'Dưa leo',
    aliases: ['dưa leo', 'dua leo', 'dưa chuột', 'cucumber'],
    category: 'vegetable',
    defaultUnit: 'quả',
    gramsPerUnit: 150,
    vegetarian: true,
    calories: 15,
    protein: 0.7,
    carbs: 3.6,
    fat: 0.1,
    fiber: 0.5
  },
  {
    id: 'avocado',
    name: 'Bơ',
    aliases: ['bơ', 'bo', 'avocado'],
    category: 'fat',
    defaultUnit: 'quả',
    gramsPerUnit: 150,
    vegetarian: true,
    calories: 160,
    protein: 2,
    carbs: 8.5,
    fat: 14.7,
    fiber: 6.7
  },
  {
    id: 'olive-oil',
    name: 'Dầu ô liu',
    aliases: ['dầu ô liu', 'dau oliu', 'olive oil'],
    category: 'fat',
    defaultUnit: 'ml',
    gramsPerUnit: 0.91,
    vegetarian: true,
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
    fiber: 0
  },
  {
    id: 'milk',
    name: 'Sữa tươi',
    aliases: ['sữa', 'sua', 'sữa tươi', 'milk'],
    category: 'dairy',
    defaultUnit: 'ml',
    gramsPerUnit: 1.03,
    vegetarian: true,
    calories: 60,
    protein: 3.2,
    carbs: 4.8,
    fat: 3.3,
    fiber: 0
  },
  {
    id: 'greek-yogurt',
    name: 'Sữa chua Hy Lạp',
    aliases: ['sữa chua hy lạp', 'sua chua hy lap', 'greek yogurt', 'yogurt'],
    category: 'dairy',
    defaultUnit: 'g',
    gramsPerUnit: 1,
    vegetarian: true,
    calories: 59,
    protein: 10,
    carbs: 3.6,
    fat: 0.4,
    fiber: 0
  },
  {
    id: 'garlic',
    name: 'Tỏi',
    aliases: ['tỏi', 'toi', 'garlic'],
    category: 'seasoning',
    defaultUnit: 'tép',
    gramsPerUnit: 3,
    vegetarian: true,
    calories: 149,
    protein: 6.4,
    carbs: 33,
    fat: 0.5,
    fiber: 2.1
  },
  {
    id: 'onion',
    name: 'Hành tây',
    aliases: ['hành tây', 'hanh tay', 'onion'],
    category: 'vegetable',
    defaultUnit: 'củ',
    gramsPerUnit: 110,
    vegetarian: true,
    calories: 40,
    protein: 1.1,
    carbs: 9.3,
    fat: 0.1,
    fiber: 1.7
  },
  {
    id: 'fish-sauce',
    name: 'Nước mắm',
    aliases: ['nước mắm', 'nuoc mam', 'fish sauce'],
    category: 'seasoning',
    defaultUnit: 'ml',
    gramsPerUnit: 1.2,
    vegetarian: false,
    calories: 35,
    protein: 5,
    carbs: 3.6,
    fat: 0,
    fiber: 0
  },
  {
    id: 'soy-sauce',
    name: 'Nước tương',
    aliases: ['nước tương', 'nuoc tuong', 'soy sauce'],
    category: 'seasoning',
    defaultUnit: 'ml',
    gramsPerUnit: 1.15,
    vegetarian: true,
    calories: 53,
    protein: 8,
    carbs: 4.9,
    fat: 0.6,
    fiber: 0.8
  }
];

let ingredientDatabase: IngredientProfile[] = [...baseIngredientDatabase];

export function getIngredientDatabase() {
  return ingredientDatabase;
}

export function addIngredientProfile(profile: IngredientProfile) {
  const normalizedId = profile.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const ingredient: IngredientProfile = {
    ...profile,
    id: normalizedId,
    aliases: Array.from(new Set([profile.name, ...profile.aliases].filter(Boolean)))
  };
  const exists = ingredientDatabase.some(item => item.id === ingredient.id || item.name.toLowerCase() === ingredient.name.toLowerCase());
  if (exists) {
    throw new Error('Nguyên liệu đã tồn tại trong cơ sở dữ liệu.');
  }
  ingredientDatabase = [ingredient, ...ingredientDatabase];
  return ingredient;
}

export const COMMON_UNITS: Record<string, number> = {
  g: 1,
  gram: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  quả: 1,
  qua: 1,
  củ: 1,
  cu: 1,
  chén: 1,
  chen: 1,
  bó: 1,
  bo: 1,
  miếng: 1,
  mieng: 1,
  tép: 1,
  tep: 1,
  muỗng: 15,
  muong: 15
};
