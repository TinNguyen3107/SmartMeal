import { additionalSeedIngredients, type SeedIngredient } from './ingredientCatalog';

export const seedIngredients: SeedIngredient[] = [
  {
    name: 'Trứng gà',
    normalizedName: 'egg',
    category: 'protein',
    categoryNameVi: 'Đạm',
    defaultUnit: 'quả',
    aliases: ['trứng', 'trung', 'trứng gà', 'egg', 'eggs', 'quả trứng']
  },
  {
    name: 'Cà chua',
    normalizedName: 'tomato',
    category: 'vegetable',
    categoryNameVi: 'Rau củ',
    defaultUnit: 'quả',
    aliases: ['cà chua', 'ca chua', 'tomato', 'tomatoes']
  },
  {
    name: 'Hành lá',
    normalizedName: 'green-onion',
    category: 'vegetable',
    categoryNameVi: 'Rau gia vị',
    defaultUnit: 'nhánh',
    aliases: ['hành lá', 'hanh la', 'green onion', 'scallion']
  },
  {
    name: 'Hành tây',
    normalizedName: 'onion',
    category: 'vegetable',
    categoryNameVi: 'Rau củ',
    defaultUnit: 'củ',
    aliases: ['hành tây', 'hanh tay', 'onion']
  },
  {
    name: 'Ức gà',
    normalizedName: 'chicken-breast',
    category: 'protein',
    categoryNameVi: 'Đạm',
    defaultUnit: 'g',
    aliases: ['ức gà', 'uc ga', 'thịt gà', 'thit ga', 'chicken', 'chicken breast']
  },
  {
    name: 'Thịt heo',
    normalizedName: 'pork',
    category: 'protein',
    categoryNameVi: 'Đạm',
    defaultUnit: 'g',
    aliases: ['thịt heo', 'thit heo', 'thịt lợn', 'pork']
  },
  {
    name: 'Tôm',
    normalizedName: 'shrimp',
    category: 'protein',
    categoryNameVi: 'Đạm',
    defaultUnit: 'g',
    aliases: ['tôm', 'tom', 'shrimp', 'prawn']
  },
  {
    name: 'Đậu hũ',
    normalizedName: 'tofu',
    category: 'protein',
    categoryNameVi: 'Đạm thực vật',
    defaultUnit: 'miếng',
    aliases: ['đậu hũ', 'dau hu', 'đậu phụ', 'dau phu', 'tofu']
  },
  {
    name: 'Cơm trắng',
    normalizedName: 'rice',
    category: 'carb',
    categoryNameVi: 'Tinh bột',
    defaultUnit: 'chén',
    aliases: ['cơm', 'com', 'cơm trắng', 'rice']
  },
  {
    name: 'Khoai lang',
    normalizedName: 'sweet-potato',
    category: 'carb',
    categoryNameVi: 'Tinh bột',
    defaultUnit: 'củ',
    aliases: ['khoai lang', 'sweet potato']
  },
  {
    name: 'Bông cải xanh',
    normalizedName: 'broccoli',
    category: 'vegetable',
    categoryNameVi: 'Rau củ',
    defaultUnit: 'g',
    aliases: ['bông cải', 'bong cai', 'bông cải xanh', 'broccoli']
  },
  {
    name: 'Nấm',
    normalizedName: 'mushroom',
    category: 'vegetable',
    categoryNameVi: 'Rau củ',
    defaultUnit: 'g',
    aliases: ['nấm', 'nam', 'nấm rơm', 'mushroom']
  },
  {
    name: 'Dưa leo',
    normalizedName: 'cucumber',
    category: 'vegetable',
    categoryNameVi: 'Rau củ',
    defaultUnit: 'quả',
    aliases: ['dưa leo', 'dua leo', 'dưa chuột', 'cucumber']
  },
  {
    name: 'Rau muống',
    normalizedName: 'water-spinach',
    category: 'vegetable',
    categoryNameVi: 'Rau củ',
    defaultUnit: 'bó',
    aliases: ['rau muống', 'rau muong', 'water spinach', 'morning glory', 'kangkong']
  },
  {
    name: 'Tỏi',
    normalizedName: 'garlic',
    category: 'seasoning',
    categoryNameVi: 'Gia vị',
    defaultUnit: 'tép',
    aliases: ['tỏi', 'toi', 'garlic']
  },
  {
    name: 'Nước mắm',
    normalizedName: 'fish-sauce',
    category: 'seasoning',
    categoryNameVi: 'Gia vị',
    defaultUnit: 'ml',
    aliases: ['nước mắm', 'nuoc mam', 'fish sauce']
  },
  {
    name: 'Nước tương',
    normalizedName: 'soy-sauce',
    category: 'seasoning',
    categoryNameVi: 'Gia vị',
    defaultUnit: 'ml',
    aliases: ['nước tương', 'nuoc tuong', 'soy sauce']
  },
  ...additionalSeedIngredients
];

export const seedRecipes = [
  {
    name: 'Egg Tomato Stir Fry',
    vietnameseName: 'Trứng sốt cà chua',
    description: 'Món gia đình nhanh, dễ nấu, tận dụng trứng và cà chua với vị chua ngọt nhẹ.',
    cuisine: 'Vietnamese',
    category: 'Món mặn',
    difficulty: 'Easy',
    preparationTime: 8,
    cookingTime: 12,
    calories: 260,
    servings: 2,
    tags: ['Quick Meal', 'Vietnamese', 'Budget Meal'],
    popularityScore: 92,
    ingredients: [
      { normalizedName: 'egg', quantity: 3, unit: 'quả' },
      { normalizedName: 'tomato', quantity: 2, unit: 'quả' },
      { normalizedName: 'green-onion', quantity: 2, unit: 'nhánh', isOptional: true },
      { normalizedName: 'fish-sauce', quantity: 10, unit: 'ml', isOptional: true }
    ],
    instructions: [
      'Đánh tan trứng với một ít nước mắm.',
      'Cắt cà chua múi cau, cắt nhỏ hành lá.',
      'Xào cà chua đến khi mềm rồi cho trứng vào đảo nhẹ.',
      'Nêm lại, rắc hành lá và dùng nóng.'
    ]
  },
  {
    name: 'Tomato Egg Soup',
    vietnameseName: 'Canh cà chua trứng',
    description: 'Món canh nhẹ, dễ ăn, phù hợp bữa cơm nhanh khi có ít nguyên liệu.',
    cuisine: 'Vietnamese',
    category: 'Món canh',
    difficulty: 'Easy',
    preparationTime: 6,
    cookingTime: 10,
    calories: 180,
    servings: 2,
    tags: ['Quick Meal', 'Vietnamese', 'Healthy'],
    popularityScore: 88,
    ingredients: [
      { normalizedName: 'egg', quantity: 2, unit: 'quả' },
      { normalizedName: 'tomato', quantity: 2, unit: 'quả' },
      { normalizedName: 'green-onion', quantity: 1, unit: 'nhánh', isOptional: true }
    ],
    instructions: [
      'Đun sôi nước, cho cà chua vào nấu mềm.',
      'Đổ trứng đã đánh tan thành dòng mỏng.',
      'Nêm vừa ăn và thêm hành lá trước khi tắt bếp.'
    ]
  },
  {
    name: 'Chicken Broccoli Rice Bowl',
    vietnameseName: 'Ức gà bông cải ăn kèm cơm',
    description: 'Bữa chính giàu đạm, có rau và tinh bột, hợp người tập luyện hoặc cần bữa cân bằng.',
    cuisine: 'Asian',
    category: 'Món chính',
    difficulty: 'Medium',
    preparationTime: 12,
    cookingTime: 18,
    calories: 520,
    servings: 1,
    tags: ['High Protein', 'Healthy', 'Asian'],
    popularityScore: 84,
    ingredients: [
      { normalizedName: 'chicken-breast', quantity: 200, unit: 'g' },
      { normalizedName: 'broccoli', quantity: 150, unit: 'g' },
      { normalizedName: 'rice', quantity: 1, unit: 'chén' },
      { normalizedName: 'garlic', quantity: 2, unit: 'tép', isOptional: true }
    ],
    instructions: [
      'Ướp ức gà với tỏi và gia vị nhẹ.',
      'Áp chảo ức gà đến khi chín đều.',
      'Luộc hoặc hấp bông cải xanh.',
      'Dọn cùng cơm trắng và điều chỉnh khẩu phần theo nhu cầu.'
    ]
  },
  {
    name: 'Tofu Mushroom Stir Fry',
    vietnameseName: 'Đậu hũ xào nấm',
    description: 'Món chay đơn giản, giàu đạm thực vật, dễ dùng trong bữa cơm hằng ngày.',
    cuisine: 'Vietnamese',
    category: 'Món chay',
    difficulty: 'Easy',
    preparationTime: 10,
    cookingTime: 12,
    calories: 300,
    servings: 2,
    tags: ['Vegetarian', 'Healthy', 'Budget Meal'],
    popularityScore: 80,
    ingredients: [
      { normalizedName: 'tofu', quantity: 2, unit: 'miếng' },
      { normalizedName: 'mushroom', quantity: 150, unit: 'g' },
      { normalizedName: 'soy-sauce', quantity: 15, unit: 'ml' },
      { normalizedName: 'green-onion', quantity: 1, unit: 'nhánh', isOptional: true }
    ],
    instructions: [
      'Cắt đậu hũ miếng vừa ăn và áp chảo sơ.',
      'Xào nấm đến khi vừa chín.',
      'Cho đậu hũ vào, nêm nước tương.',
      'Rắc hành lá và dùng nóng.'
    ]
  },
  {
    name: 'Stir-Fried Water Spinach with Garlic',
    vietnameseName: 'Rau muống xào tỏi',
    description: 'Món rau Việt Nam nhanh, thơm mùi tỏi, phù hợp khi cần thêm một món rau xanh cho bữa cơm.',
    cuisine: 'Vietnamese',
    category: 'Món rau',
    difficulty: 'Easy',
    preparationTime: 8,
    cookingTime: 7,
    calories: 105,
    servings: 2,
    tags: ['Vietnamese', 'Healthy', 'Quick Meal', 'Vegetarian'],
    popularityScore: 82,
    ingredients: [
      { normalizedName: 'water-spinach', quantity: 1, unit: 'bó' },
      { normalizedName: 'garlic', quantity: 3, unit: 'tép', isOptional: true },
      { normalizedName: 'fish-sauce', quantity: 8, unit: 'ml', isOptional: true }
    ],
    instructions: [
      'Nhặt rau muống, rửa sạch và để thật ráo nước. Bóc, băm nhỏ tỏi.',
      'Làm nóng chảo với một lượng dầu vừa đủ, phi tỏi đến khi dậy mùi.',
      'Cho rau muống vào xào lửa lớn 3 đến 4 phút, đảo liên tục để rau chín đều và còn xanh.',
      'Nêm vừa ăn, tắt bếp ngay khi rau vừa chín tới và dùng nóng.'
    ]
  },
  {
    name: 'Shrimp Cucumber Salad',
    vietnameseName: 'Gỏi tôm dưa leo',
    description: 'Món nhẹ, ít tinh bột, nhiều đạm, phù hợp bữa ăn nhanh hoặc giảm cân.',
    cuisine: 'Vietnamese',
    category: 'Món gỏi',
    difficulty: 'Easy',
    preparationTime: 12,
    cookingTime: 8,
    calories: 240,
    servings: 2,
    tags: ['Low Carb', 'Healthy', 'Quick Meal'],
    popularityScore: 76,
    ingredients: [
      { normalizedName: 'shrimp', quantity: 200, unit: 'g' },
      { normalizedName: 'cucumber', quantity: 1, unit: 'quả' },
      { normalizedName: 'onion', quantity: 0.5, unit: 'củ' },
      { normalizedName: 'fish-sauce', quantity: 10, unit: 'ml', isOptional: true }
    ],
    instructions: [
      'Luộc tôm vừa chín rồi bóc vỏ.',
      'Cắt dưa leo và hành tây thật mỏng.',
      'Trộn tôm, dưa leo, hành tây với nước mắm pha nhẹ.',
      'Để thấm vài phút rồi dùng.'
    ]
  },
  {
    name: 'Pork Tomato Rice',
    vietnameseName: 'Thịt heo xào cà chua ăn kèm cơm',
    description: 'Món mặn quen thuộc, dễ nấu, phù hợp bữa cơm gia đình.',
    cuisine: 'Vietnamese',
    category: 'Món mặn',
    difficulty: 'Easy',
    preparationTime: 10,
    cookingTime: 15,
    calories: 560,
    servings: 2,
    tags: ['Vietnamese', 'Budget Meal'],
    popularityScore: 73,
    ingredients: [
      { normalizedName: 'pork', quantity: 200, unit: 'g' },
      { normalizedName: 'tomato', quantity: 2, unit: 'quả' },
      { normalizedName: 'rice', quantity: 1, unit: 'chén' },
      { normalizedName: 'garlic', quantity: 2, unit: 'tép', isOptional: true }
    ],
    instructions: [
      'Thái thịt heo mỏng, ướp với gia vị.',
      'Phi tỏi, xào thịt đến khi săn.',
      'Cho cà chua vào xào mềm và nêm lại.',
      'Dùng kèm cơm trắng.'
    ]
  }
];
