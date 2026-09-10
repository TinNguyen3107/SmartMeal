import { prisma } from '../src/server/db';

const cases = [
  {
    code: 'TC-REC-01',
    description: 'Bữa ăn gia đình có trứng, cà chua và hành lá; ưu tiên món Việt tiết kiệm.',
    inputIngredients: ['Trứng gà', 'Cà chua', 'Hành lá'],
    expectedRecipeName: 'Trứng sốt cà chua',
    nutritionGoal: null,
    tags: ['Vietnamese', 'Budget Meal']
  },
  {
    code: 'TC-REC-02',
    description: 'Cùng nguyên liệu trứng và cà chua, người dùng cần món canh nhanh, lành mạnh.',
    inputIngredients: ['Trứng gà', 'Cà chua'],
    expectedRecipeName: 'Canh cà chua trứng',
    nutritionGoal: 'BALANCED',
    tags: ['Vietnamese', 'Healthy', 'Quick Meal']
  },
  {
    code: 'TC-REC-03',
    description: 'Người dùng nhập alias tiếng Anh cho món trứng sốt cà chua.',
    inputIngredients: ['egg', 'tomato', 'green onion'],
    expectedRecipeName: 'Trứng sốt cà chua',
    nutritionGoal: null,
    tags: ['Vietnamese', 'Budget Meal']
  },
  {
    code: 'TC-REC-04',
    description: 'Người dùng nhập alias tiếng Anh và ưu tiên món canh trứng cà chua lành mạnh.',
    inputIngredients: ['egg', 'tomato'],
    expectedRecipeName: 'Canh cà chua trứng',
    nutritionGoal: 'BALANCED',
    tags: ['Healthy', 'Quick Meal']
  },
  {
    code: 'TC-REC-05',
    description: 'Người dùng tập luyện có đủ ức gà, bông cải và cơm trắng.',
    inputIngredients: ['Ức gà', 'Bông cải xanh', 'Cơm trắng'],
    expectedRecipeName: 'Ức gà bông cải ăn kèm cơm',
    nutritionGoal: 'MUSCLE_GAIN',
    tags: ['High Protein']
  },
  {
    code: 'TC-REC-06',
    description: 'Người dùng tập luyện nhập nguyên liệu bằng alias tiếng Anh.',
    inputIngredients: ['chicken breast', 'broccoli', 'rice'],
    expectedRecipeName: 'Ức gà bông cải ăn kèm cơm',
    nutritionGoal: 'MUSCLE_GAIN',
    tags: ['High Protein', 'Healthy']
  },
  {
    code: 'TC-REC-07',
    description: 'Người dùng cần bữa chính cân bằng từ ức gà, bông cải và cơm.',
    inputIngredients: ['Ức gà', 'Bông cải xanh', 'Cơm trắng', 'Tỏi'],
    expectedRecipeName: 'Ức gà bông cải ăn kèm cơm',
    nutritionGoal: 'BALANCED',
    tags: ['Healthy', 'Asian']
  },
  {
    code: 'TC-REC-08',
    description: 'Người dùng ăn chay có đậu hũ và nấm.',
    inputIngredients: ['Đậu hũ', 'Nấm'],
    expectedRecipeName: 'Đậu hũ xào nấm',
    nutritionGoal: 'VEGETARIAN',
    tags: ['Vegetarian']
  },
  {
    code: 'TC-REC-09',
    description: 'Người dùng ăn chay có đủ đậu hũ, nấm và nước tương.',
    inputIngredients: ['Đậu hũ', 'Nấm', 'Nước tương'],
    expectedRecipeName: 'Đậu hũ xào nấm',
    nutritionGoal: 'VEGETARIAN',
    tags: ['Vegetarian', 'Healthy']
  },
  {
    code: 'TC-REC-10',
    description: 'Người dùng nhập alias tiếng Anh cho món đậu hũ xào nấm.',
    inputIngredients: ['tofu', 'mushroom', 'soy sauce'],
    expectedRecipeName: 'Đậu hũ xào nấm',
    nutritionGoal: 'VEGETARIAN',
    tags: ['Vegetarian', 'Budget Meal']
  },
  {
    code: 'TC-REC-11',
    description: 'Người dùng có rau muống và tỏi, muốn món rau Việt nấu nhanh.',
    inputIngredients: ['Rau muống', 'Tỏi'],
    expectedRecipeName: 'Rau muống xào tỏi',
    nutritionGoal: 'BALANCED',
    tags: ['Vietnamese', 'Healthy', 'Quick Meal']
  },
  {
    code: 'TC-REC-12',
    description: 'Người dùng chỉ có rau muống, cần gợi ý món rau lành mạnh.',
    inputIngredients: ['Rau muống'],
    expectedRecipeName: 'Rau muống xào tỏi',
    nutritionGoal: 'BALANCED',
    tags: ['Vegetarian', 'Healthy']
  },
  {
    code: 'TC-REC-13',
    description: 'Người dùng nhập alias tiếng Anh cho rau muống và tỏi.',
    inputIngredients: ['water spinach', 'garlic'],
    expectedRecipeName: 'Rau muống xào tỏi',
    nutritionGoal: 'VEGETARIAN',
    tags: ['Vietnamese', 'Quick Meal']
  },
  {
    code: 'TC-REC-14',
    description: 'Người dùng giảm cân có tôm và dưa leo.',
    inputIngredients: ['Tôm', 'Dưa leo'],
    expectedRecipeName: 'Gỏi tôm dưa leo',
    nutritionGoal: 'WEIGHT_LOSS',
    tags: ['Healthy']
  },
  {
    code: 'TC-REC-15',
    description: 'Người dùng low-carb có tôm, dưa leo và hành tây.',
    inputIngredients: ['Tôm', 'Dưa leo', 'Hành tây'],
    expectedRecipeName: 'Gỏi tôm dưa leo',
    nutritionGoal: 'LOW_CARB',
    tags: ['Low Carb', 'Healthy']
  },
  {
    code: 'TC-REC-16',
    description: 'Người dùng nhập alias tiếng Anh cho món gỏi tôm dưa leo.',
    inputIngredients: ['shrimp', 'cucumber', 'onion'],
    expectedRecipeName: 'Gỏi tôm dưa leo',
    nutritionGoal: 'WEIGHT_LOSS',
    tags: ['Low Carb', 'Quick Meal']
  },
  {
    code: 'TC-REC-17',
    description: 'Bữa cơm Việt có thịt heo, cà chua và cơm trắng.',
    inputIngredients: ['Thịt heo', 'Cà chua', 'Cơm trắng'],
    expectedRecipeName: 'Thịt heo xào cà chua ăn kèm cơm',
    nutritionGoal: 'BALANCED',
    tags: ['Vietnamese', 'Budget Meal']
  },
  {
    code: 'TC-REC-18',
    description: 'Người dùng có thịt heo, cà chua, cơm và tỏi cho bữa cơm gia đình.',
    inputIngredients: ['Thịt heo', 'Cà chua', 'Cơm trắng', 'Tỏi'],
    expectedRecipeName: 'Thịt heo xào cà chua ăn kèm cơm',
    nutritionGoal: null,
    tags: ['Vietnamese', 'Budget Meal']
  },
  {
    code: 'TC-REC-19',
    description: 'Người dùng nhập alias tiếng Anh cho món thịt heo xào cà chua.',
    inputIngredients: ['pork', 'tomato', 'rice'],
    expectedRecipeName: 'Thịt heo xào cà chua ăn kèm cơm',
    nutritionGoal: 'BALANCED',
    tags: ['Vietnamese', 'Budget Meal']
  },
  {
    code: 'TC-REC-20',
    description: 'Người dùng có trứng, cà chua, hành lá và nước mắm cho món xào nhanh.',
    inputIngredients: ['Trứng gà', 'Cà chua', 'Hành lá', 'Nước mắm'],
    expectedRecipeName: 'Trứng sốt cà chua',
    nutritionGoal: null,
    tags: ['Vietnamese', 'Quick Meal', 'Budget Meal']
  },
  {
    code: 'TC-REC-21',
    description: 'Người dùng có trứng, cà chua và hành lá, ưu tiên món canh nhẹ.',
    inputIngredients: ['Trứng gà', 'Cà chua', 'Hành lá'],
    expectedRecipeName: 'Canh cà chua trứng',
    nutritionGoal: 'BALANCED',
    tags: ['Vietnamese', 'Healthy', 'Quick Meal']
  }
];

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' } });
  const recipes = await prisma.recipe.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, vietnameseName: true }
  });

  for (const item of cases) {
    const recipe = recipes.find(candidate => candidate.vietnameseName === item.expectedRecipeName);
    if (!recipe) {
      throw new Error(`Missing published expected recipe for ${item.code}: ${item.expectedRecipeName}`);
    }

    await prisma.evaluationCase.upsert({
      where: { code: item.code },
      update: {
        description: item.description,
        inputIngredients: item.inputIngredients,
        expectedRecipeIds: [recipe.id],
        nutritionGoal: item.nutritionGoal,
        tags: item.tags,
        isActive: true,
        createdById: admin?.id
      },
      create: {
        code: item.code,
        description: item.description,
        inputIngredients: item.inputIngredients,
        expectedRecipeIds: [recipe.id],
        nutritionGoal: item.nutritionGoal,
        tags: item.tags,
        createdById: admin?.id
      }
    });
  }

  console.log(`Ensured ${cases.length} evaluation cases.`);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
