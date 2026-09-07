import 'dotenv/config';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { seedIngredients, seedRecipes } from '../src/data/demoData';
import { normalizeText } from '../src/server/recommendationEngine';

function adapterOptionsFromUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sslRequested = url.hostname.includes('tidbcloud.com')
    || url.searchParams.has('ssl')
    || url.searchParams.has('sslaccept')
    || process.env.DATABASE_SSL === 'true';
  const caPath = process.env.DATABASE_CA_PATH;
  const ssl = sslRequested
    ? caPath && fs.existsSync(caPath)
      ? { ca: fs.readFileSync(caPath, 'utf8') }
      : true
    : undefined;

  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    ...(ssl ? { ssl } : {})
  };
}

const connectionUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_PRISMA;

if (!connectionUrl) {
  throw new Error('Missing DATABASE_URL or DATABASE_URL_PRISMA.');
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(adapterOptionsFromUrl(connectionUrl) as any)
});

const nutritionFacts: Record<string, { caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number }> = {
  egg: { caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  tomato: { caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2 },
  'green-onion': { caloriesPer100g: 32, proteinPer100g: 1.8, carbsPer100g: 7.3, fatPer100g: 0.2 },
  onion: { caloriesPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9.3, fatPer100g: 0.1 },
  'chicken-breast': { caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  pork: { caloriesPer100g: 242, proteinPer100g: 27, carbsPer100g: 0, fatPer100g: 14 },
  shrimp: { caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3 },
  tofu: { caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8 },
  rice: { caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  'sweet-potato': { caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20.1, fatPer100g: 0.1 },
  broccoli: { caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 6.6, fatPer100g: 0.4 },
  mushroom: { caloriesPer100g: 22, proteinPer100g: 3.1, carbsPer100g: 3.3, fatPer100g: 0.3 },
  cucumber: { caloriesPer100g: 15, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1 },
  'water-spinach': { caloriesPer100g: 19, proteinPer100g: 2.6, carbsPer100g: 3.1, fatPer100g: 0.2 },
  garlic: { caloriesPer100g: 149, proteinPer100g: 6.4, carbsPer100g: 33.1, fatPer100g: 0.5 },
  'fish-sauce': { caloriesPer100g: 35, proteinPer100g: 5, carbsPer100g: 3.6, fatPer100g: 0 },
  'soy-sauce': { caloriesPer100g: 53, proteinPer100g: 8.1, carbsPer100g: 4.9, fatPer100g: 0.6 }
};

function nutritionFor(normalizedName: string, suppliedNutrition?: { caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number }) {
  return suppliedNutrition || nutritionFacts[normalizedName] || { caloriesPer100g: 35, proteinPer100g: 2, carbsPer100g: 7, fatPer100g: 0.5 };
}

async function upsertUsers() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: adminPassword, role: 'ADMIN', name: 'SmartMeal Admin' },
    create: {
      email: 'admin@gmail.com',
      password: adminPassword,
      name: 'SmartMeal Admin',
      role: 'ADMIN'
    }
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'user@gmail.com' },
    update: { password: userPassword, role: 'USER', name: 'Demo User' },
    create: {
      email: 'user@gmail.com',
      password: userPassword,
      name: 'Demo User',
      role: 'USER',
      preference: {
        create: {
          dietaryType: 'balanced',
          preferredCuisine: 'Vietnamese',
          maxCookingTime: 30,
          preferredDifficulty: 'Easy',
          nutritionGoal: 'MUSCLE_GAIN',
          activityLevel: 'MODERATE',
          heightCm: 170,
          weightKg: 65,
          targetCalories: 2300,
          targetProtein: 115,
          targetCarbs: 260,
          targetFat: 65,
          allergies: JSON.stringify([]),
          tags: JSON.stringify(['Vietnamese', 'Quick Meal', 'Healthy'])
        }
      }
    }
  });

  await prisma.userPreference.upsert({
    where: { userId: demoUser.id },
    update: {
      dietaryType: 'balanced',
      preferredCuisine: 'Vietnamese',
      maxCookingTime: 30,
      preferredDifficulty: 'Easy',
      nutritionGoal: 'MUSCLE_GAIN',
      activityLevel: 'MODERATE',
      heightCm: 170,
      weightKg: 65,
      targetCalories: 2300,
      targetProtein: 115,
      targetCarbs: 260,
      targetFat: 65,
      allergies: JSON.stringify([]),
      tags: JSON.stringify(['Vietnamese', 'Quick Meal', 'Healthy', 'High Protein'])
    },
    create: {
      userId: demoUser.id,
      dietaryType: 'balanced',
      preferredCuisine: 'Vietnamese',
      maxCookingTime: 30,
      preferredDifficulty: 'Easy',
      nutritionGoal: 'MUSCLE_GAIN',
      activityLevel: 'MODERATE',
      heightCm: 170,
      weightKg: 65,
      targetCalories: 2300,
      targetProtein: 115,
      targetCarbs: 260,
      targetFat: 65,
      allergies: JSON.stringify([]),
      tags: JSON.stringify(['Vietnamese', 'Quick Meal', 'Healthy', 'High Protein'])
    }
  });
}

async function upsertIngredients() {
  const map = new Map<string, string>();

  const upsertIngredient = async (item: typeof seedIngredients[number]) => {
    const ingredient = await prisma.ingredient.upsert({
      where: { normalizedName: item.normalizedName },
      update: {
        name: item.name,
        category: item.category,
        categoryNameVi: item.categoryNameVi,
        defaultUnit: item.defaultUnit,
        ...nutritionFor(item.normalizedName, item.nutrition)
      },
      create: {
        name: item.name,
        normalizedName: item.normalizedName,
        category: item.category,
        categoryNameVi: item.categoryNameVi,
        defaultUnit: item.defaultUnit,
        ...nutritionFor(item.normalizedName, item.nutrition)
      }
    });

    await Promise.all(item.aliases.map(async alias => {
      await prisma.ingredientAlias.upsert({
        where: { normalized: normalizeText(alias) },
        update: { alias, ingredientId: ingredient.id },
        create: { alias, normalized: normalizeText(alias), ingredientId: ingredient.id }
      });
    }));

    return [item.normalizedName, ingredient.id] as const;
  };

  // Two ingredients at a time keeps remote TiDB writes bounded while avoiding a
  // long sequential seed when the catalogue grows.
  for (let index = 0; index < seedIngredients.length; index += 2) {
    const entries = await Promise.all(seedIngredients.slice(index, index + 2).map(upsertIngredient));
    for (const [normalizedName, id] of entries) {
      map.set(normalizedName, id);
    }
  }

  return map;
}

async function upsertRecipes(ingredientMap: Map<string, string>) {
  for (const item of seedRecipes) {
    const existing = await prisma.recipe.findFirst({
      where: { vietnameseName: item.vietnameseName }
    });

    if (existing) {
      await prisma.recipeIngredient.deleteMany({ where: { recipeId: existing.id } });
      await prisma.recipeInstruction.deleteMany({ where: { recipeId: existing.id } });
      await prisma.recipe.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          description: item.description,
          cuisine: item.cuisine,
          category: item.category,
          difficulty: item.difficulty,
          preparationTime: item.preparationTime,
          cookingTime: item.cookingTime,
          calories: item.calories,
          servings: item.servings,
          tags: JSON.stringify(item.tags),
          source: 'SEED',
          status: 'PUBLISHED',
          popularityScore: item.popularityScore,
          ingredients: {
            create: item.ingredients.map(ingredient => ({
              ingredientId: ingredientMap.get(ingredient.normalizedName) || '',
              name: seedIngredients.find(seed => seed.normalizedName === ingredient.normalizedName)?.name || ingredient.normalizedName,
              normalizedName: ingredient.normalizedName,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              isOptional: Boolean(ingredient.isOptional),
              ...nutritionFor(ingredient.normalizedName)
            }))
          },
          instructions: {
            create: item.instructions.map((instruction, index) => ({
              stepNumber: index + 1,
              instruction
            }))
          }
        }
      });
    } else {
      await prisma.recipe.create({
        data: {
          name: item.name,
          vietnameseName: item.vietnameseName,
          description: item.description,
          cuisine: item.cuisine,
          category: item.category,
          difficulty: item.difficulty,
          preparationTime: item.preparationTime,
          cookingTime: item.cookingTime,
          calories: item.calories,
          servings: item.servings,
          tags: JSON.stringify(item.tags),
          source: 'SEED',
          status: 'PUBLISHED',
          popularityScore: item.popularityScore,
          ingredients: {
            create: item.ingredients.map(ingredient => ({
              ingredientId: ingredientMap.get(ingredient.normalizedName) || '',
              name: seedIngredients.find(seed => seed.normalizedName === ingredient.normalizedName)?.name || ingredient.normalizedName,
              normalizedName: ingredient.normalizedName,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              isOptional: Boolean(ingredient.isOptional),
              ...nutritionFor(ingredient.normalizedName)
            }))
          },
          instructions: {
            create: item.instructions.map((instruction, index) => ({
              stepNumber: index + 1,
              instruction
            }))
          }
        }
      });
    }
  }
}

async function main() {
  await upsertUsers();
  const ingredientMap = await upsertIngredients();
  await upsertRecipes(ingredientMap);
  console.log('Seeded SmartMeal demo users, ingredients and recipes.');
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
