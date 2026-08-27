import { Ingredient, Recipe, UserProfile, TestCaseResult } from '../types';

export const INITIAL_INGREDIENTS: Ingredient[] = [];

export const INITIAL_RECIPES: Recipe[] = [];

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user-demo-01',
    email: 'user@gmail.com',
    password: 'user123',
    name: 'User',
    role: 'user',
    preferences: {
      dietaryTypes: [],
      preferredCuisine: [],
      maxCookingTime: 30,
      preferredDifficulty: 'Any',
      spiceLevel: 'Mild',
      allergies: []
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'admin-demo-01',
    email: 'admin@gmail.com',
    password: 'admin123',
    name: 'Admin',
    role: 'admin',
    preferences: {
      dietaryTypes: [],
      preferredCuisine: [],
      maxCookingTime: 30,
      preferredDifficulty: 'Any',
      spiceLevel: 'Mild',
      allergies: []
    },
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_TEST_CASES: TestCaseResult[] = [];
