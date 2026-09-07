import { prisma } from '../src/server/db';

const cases = [
  {
    code: 'TC-REC-01',
    description: 'Người dùng có trứng, cà chua và hành lá.',
    inputIngredients: ['Trứng gà', 'Cà chua', 'Hành lá'],
    expectedRecipeName: 'Trứng sốt cà chua',
    nutritionGoal: null,
    tags: []
  },
  {
    code: 'TC-REC-02',
    description: 'Người dùng tập luyện có ức gà, bông cải và cơm trắng.',
    inputIngredients: ['Ức gà', 'Bông cải xanh', 'Cơm trắng'],
    expectedRecipeName: 'Ức gà bông cải ăn kèm cơm',
    nutritionGoal: 'MUSCLE_GAIN',
    tags: ['High Protein']
  },
  {
    code: 'TC-REC-03',
    description: 'Người dùng ăn chay có đậu hũ và nấm.',
    inputIngredients: ['Đậu hũ', 'Nấm'],
    expectedRecipeName: 'Đậu hũ xào nấm',
    nutritionGoal: 'VEGETARIAN',
    tags: ['Vegetarian']
  },
  {
    code: 'TC-REC-04',
    description: 'Người dùng giảm cân có tôm và dưa leo.',
    inputIngredients: ['Tôm', 'Dưa leo'],
    expectedRecipeName: 'Gỏi tôm dưa leo',
    nutritionGoal: 'WEIGHT_LOSS',
    tags: ['Healthy']
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
      update: {},
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
