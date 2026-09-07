const baseUrl = process.env.SMARTMEAL_BASE_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed with ${response.status}: ${body.message || JSON.stringify(body)}`);
  }
  return { response, body };
}

async function requestWithStatus(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  return { response, body: await response.json().catch(() => ({})) };
}

async function requestText(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...(options.headers || {}) }
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed with ${response.status}: ${body}`);
  }
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login(email, password) {
  const { response, body } = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  const cookie = response.headers.get('set-cookie');
  assert(cookie, `Missing session cookie for ${email}`);
  return { cookie, user: body.user };
}

const checks = [];

async function check(name, fn) {
  const started = Date.now();
  await fn();
  checks.push({ name, ms: Date.now() - started });
}

await check('health connects to database', async () => {
  const { response, body } = await request('/api/health');
  assert(body.ok === true, 'Health endpoint did not return ok=true');
  assert(body.counts?.recipes > 0, 'Expected seeded recipes');
  assert(body.counts?.ingredients > 0, 'Expected seeded ingredients');
  assert(response.headers.get('x-content-type-options') === 'nosniff', 'Expected security response headers');
});

await check('demo user can log in', async () => {
  const { user } = await login('user@gmail.com', 'user123');
  assert(user?.role === 'user', 'Expected user demo role');
});

await check('user can save nutrition profile', async () => {
  const { cookie } = await login('user@gmail.com', 'user123');
  const { body } = await request('/api/auth/profile', {
    method: 'PUT',
    headers: { cookie },
    body: JSON.stringify({
      name: 'Demo User',
      age: 22,
      gender: 'Male',
      preferences: {
        dietaryTypes: ['Vietnamese', 'Healthy', 'High Protein'],
        preferredCuisine: ['Vietnamese'],
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
        allergies: []
      }
    })
  });
  assert(body.user?.preferences?.nutritionGoal === 'MUSCLE_GAIN', 'Expected saved nutrition goal');
  assert(body.user?.preferences?.targetProtein >= 100, 'Expected protein target in saved profile');
});

await check('demo admin can log in and view users', async () => {
  const { cookie, user } = await login('admin@gmail.com', 'admin123');
  assert(user?.role === 'admin', 'Expected admin demo role');
  const { body } = await request('/api/admin/users', { headers: { cookie } });
  assert(Array.isArray(body.users) && body.users.length >= 2, 'Expected admin users list');
  assert(body.users.every(item => item.role === 'USER' || item.role === 'ADMIN'), 'Expected normalized role labels');
});

await check('authorization protects admin data and pantry ownership', async () => {
  const guestAdmin = await requestWithStatus('/api/admin/users');
  assert(guestAdmin.response.status === 401, 'Guest must not access admin data');

  const { cookie: userCookie } = await login('user@gmail.com', 'user123');
  const userAdmin = await requestWithStatus('/api/admin/users', { headers: { cookie: userCookie } });
  assert(userAdmin.response.status === 403, 'User must not access admin data');

  const { body: createdPantry } = await request('/api/me/pantry', {
    method: 'POST',
    headers: { cookie: userCookie },
    body: JSON.stringify({ name: 'Trứng gà', quantity: 1, unit: 'quả' })
  });
  const pantryId = createdPantry.pantryItem?.id;
  assert(pantryId, 'Expected a pantry item for ownership test');

  const { cookie: adminCookie } = await login('admin@gmail.com', 'admin123');
  const foreignUpdate = await requestWithStatus(`/api/me/pantry/${pantryId}`, {
    method: 'PUT',
    headers: { cookie: adminCookie },
    body: JSON.stringify({ quantity: 99, unit: 'quả' })
  });
  assert(foreignUpdate.response.status === 404, 'A different user must not update another pantry item');

  const invalidStatus = await requestWithStatus('/api/admin/recipes/not-a-real-id/status', {
    method: 'PATCH',
    headers: { cookie: adminCookie },
    body: JSON.stringify({ status: 'INVALID' })
  });
  assert(invalidStatus.response.status === 400, 'Invalid recipe status must be rejected before update');

  await request(`/api/me/pantry/${pantryId}`, { method: 'DELETE', headers: { cookie: userCookie } });
});

await check('admin evaluation metrics are derived from actual ranking results', async () => {
  const { cookie } = await login('admin@gmail.com', 'admin123');
  const { body } = await request('/api/admin/run-evaluations', {
    method: 'POST',
    headers: { cookie },
    body: JSON.stringify({ k: 3, weights: { w_match: 0.4, w_nutrition: 0.2, ignoredWeight: 2 } })
  });
  const testCases = body.testCases || [];
  assert(testCases.length >= 4, 'Expected curated evaluation cases');
  const hitCount = testCases.filter(item => item.passed).length;
  const expectedHitRate = Math.round(hitCount / testCases.length * 100);
  const relevantRetrieved = testCases.reduce((sum, testCase) => sum + (testCase.returnedTopRecipes || []).filter(recipe =>
    (testCase.expectedRecipeNames || []).includes(recipe.name)
  ).length, 0);
  const expectedPrecision = Math.round(relevantRetrieved / (3 * testCases.length) * 100);

  assert(body.metrics?.hitRateAtK === expectedHitRate, 'HitRate@K must equal the actual passing-case ratio');
  assert(body.metrics?.precisionAtK === expectedPrecision, 'Precision@K must equal relevant results divided by K');
  assert(body.metrics?.recallAtK === expectedHitRate, 'Single-target test cases make Recall@K equal HitRate@K');
  assert(Number(body.metrics?.ndcgAtK) >= 0 && Number(body.metrics?.ndcgAtK) <= 100, 'NDCG@K must be a valid percentage');
  assert(body.run?.id, 'Evaluation run must be persisted and returned');
  assert(body.run.weights?.w_match === 0.4, 'Persisted run must keep permitted weights');
  assert(body.run.weights?.ignoredWeight === undefined, 'Persisted run must reject unknown weights');

  const history = await request('/api/admin/evaluation-runs?limit=1', { headers: { cookie } });
  assert(history.body.runs?.[0]?.id === body.run.id, 'Latest persisted evaluation run must be available to admin');
});

await check('admin can manage database-backed evaluation ground truth', async () => {
  const { cookie } = await login('admin@gmail.com', 'admin123');
  const { body } = await request('/api/admin/evaluation-cases', { headers: { cookie } });
  const testCase = body.cases?.find(item => item.code === 'TC-REC-01');
  assert(testCase?.isActive, 'Expected seeded active ground truth case');
  assert(testCase.expectedRecipeIds?.length > 0, 'Ground truth case needs expected published recipe IDs');
  assert(testCase.expectedRecipeNames?.length > 0, 'Ground truth case needs resolved expected recipe names');

  try {
    const update = await request(`/api/admin/evaluation-cases/${testCase.id}`, {
      method: 'PUT',
      headers: { cookie },
      body: JSON.stringify({
        description: testCase.description,
        inputIngredients: testCase.inputIngredients,
        expectedRecipeIds: testCase.expectedRecipeIds,
        nutritionGoal: testCase.nutritionGoal,
        tags: testCase.tags,
        isActive: true
      })
    });
    assert(update.body.case?.id === testCase.id, 'Admin must be able to update a ground truth case');

    const disabled = await request(`/api/admin/evaluation-cases/${testCase.id}/status`, {
      method: 'PATCH',
      headers: { cookie },
      body: JSON.stringify({ isActive: false })
    });
    assert(disabled.body.isActive === false, 'Admin must be able to deactivate a ground truth case');
  } finally {
    await request(`/api/admin/evaluation-cases/${testCase.id}/status`, {
      method: 'PATCH',
      headers: { cookie },
      body: JSON.stringify({ isActive: true })
    });
  }
});

await check('admin can export evaluation evidence as safe CSV', async () => {
  const { cookie } = await login('admin@gmail.com', 'admin123');
  const runs = await requestText('/api/admin/evaluation-runs/export.csv', { headers: { cookie } });
  assert(runs.response.headers.get('content-type')?.includes('text/csv'), 'Expected evaluation runs CSV content type');
  assert(runs.response.headers.get('content-disposition')?.includes('smartmeal-evaluation-runs.csv'), 'Expected evaluation runs download filename');
  assert(runs.body.includes('Precision@K'), 'Evaluation runs CSV must include metrics header');

  const cases = await requestText('/api/admin/evaluation-cases/export.csv', { headers: { cookie } });
  assert(cases.response.headers.get('content-type')?.includes('text/csv'), 'Expected ground truth CSV content type');
  assert(cases.response.headers.get('content-disposition')?.includes('smartmeal-evaluation-cases.csv'), 'Expected ground truth download filename');
  assert(cases.body.includes('TC-REC-01'), 'Ground truth CSV must include database-backed test cases');
});

await check('ingredients expose nutrition facts per 100g', async () => {
  const { body } = await request('/api/ingredients');
  const egg = body.ingredients?.find(item => item.normalizedName === 'egg');
  assert(egg, 'Expected egg ingredient');
  assert(Number(egg.caloriesPer100g) > 0, 'Expected calories per 100g');
  assert(Number(egg.proteinPer100g) > 0, 'Expected protein per 100g');
});

await check('baseline ingredient catalogue covers common Vietnamese ingredients', async () => {
  const { body } = await request('/api/ingredients');
  const ingredientIds = new Set((body.ingredients || []).map(item => item.normalizedName));
  assert(ingredientIds.size >= 100, `Expected at least 100 seeded ingredients, got ${ingredientIds.size}`);
  for (const normalizedName of ['chicken-thigh', 'bok-choy', 'rice-vermicelli', 'oyster-sauce', 'avocado']) {
    assert(ingredientIds.has(normalizedName), `Expected baseline ingredient ${normalizedName}`);
  }
});

await check('water spinach and garlic return the approved stir-fry recipe', async () => {
  const { body } = await request('/api/recommendations', {
    method: 'POST',
    body: JSON.stringify({
      text: '1 bó rau muống, 3 tép tỏi',
      nutritionGoal: 'BALANCED',
      tags: ['Vietnamese', 'Healthy']
    })
  });
  const top = body.recommendations?.[0];
  assert(top, 'Expected an approved recipe for water spinach and garlic');
  assert(top.vietnameseName === 'Rau muống xào tỏi', `Expected water-spinach stir-fry first, got ${top.vietnameseName}`);
  assert(top.matchScore === 100, 'Water spinach should satisfy every required ingredient');
  assert(top.missingIngredients?.length === 0, 'Only optional seasonings may be absent');
});

await check('local NLP recommendation ranks shrimp cucumber correctly', async () => {
  const { body } = await request('/api/recommendations', {
    method: 'POST',
    body: JSON.stringify({
      text: '200g tôm, 1 quả dưa leo',
      nutritionGoal: 'WEIGHT_LOSS',
      tags: ['Healthy']
    })
  });
  const top = body.recommendations?.[0];
  assert(top, 'Expected at least one recommendation');
  assert(top.vietnameseName?.toLowerCase().includes('tôm'), `Expected shrimp recipe first, got ${top.vietnameseName}`);
  assert(typeof top.nutritionScore === 'number', 'Expected nutrition-aware score');
  assert(typeof top.semanticScore === 'number', 'Expected semantic score');
  assert(Number(top.estimatedNutrition?.protein) > 0, 'Expected estimated nutrition macro');
  assert(Number(top.scoreBreakdown?.ingredientMatch) >= 0, 'Expected score breakdown');
  assert(top.ingredients?.some(item => Number(item.proteinPer100g) > 0), 'Expected recipe ingredient nutrition facts');
});

await check('unit conversion keeps recipe macros realistic', async () => {
  const { body } = await request('/api/recommendations', {
    method: 'POST',
    body: JSON.stringify({
      text: '3 quả trứng gà, 2 quả cà chua, 2 nhánh hành lá',
      tags: ['Vietnamese', 'Healthy']
    })
  });
  const eggTomato = body.recommendations?.find(item => item.vietnameseName === 'Trứng sốt cà chua');
  assert(eggTomato, 'Expected egg tomato recipe');
  assert(Number(eggTomato.estimatedNutrition?.protein) > 15, 'Expected egg tomato protein estimate');
  assert(Number(eggTomato.estimatedNutrition?.protein) < 45, 'Egg tomato protein estimate is unrealistically high');
});

await check('admin can generate local recipe draft', async () => {
  const { cookie } = await login('admin@gmail.com', 'admin123');
  const { body } = await request('/api/admin/recipe-drafts', {
    method: 'POST',
    headers: { cookie },
    body: JSON.stringify({
      text: '2 quả trứng gà, 2 quả cà chua, hành lá',
      maxCookingTime: 25,
      tags: ['Vietnamese', 'Quick Meal']
    })
  });
  assert(body.draft?.source === 'LOCAL_GENERATOR', 'Expected local generator draft');
  assert(body.draft?.ingredients?.length >= 2, 'Draft needs ingredient quantities');
  assert(body.draft?.instructions?.length >= 3, 'Draft needs cooking steps');
});

await check('unknown ingredient still receives a clearly marked flexible recipe', async () => {
  const { body } = await request('/api/recommendations', {
    method: 'POST',
    body: JSON.stringify({
      text: '150g mystery-herb',
      nutritionGoal: 'BALANCED'
    })
  });
  assert(body.generatedDraft?.source === 'LOCAL_GENERATOR', 'Expected flexible local draft for an unknown ingredient');
  assert(body.generatedDraft?.ingredients?.some(item => item.name === 'mystery-herb'), 'Flexible draft lost the unknown ingredient');
  assert(body.generatedDraft?.estimatedNutrition, 'Flexible draft needs estimated nutrition');
  assert(body.warnings?.some(item => item.includes('mystery-herb')), 'Expected data-verification warning for unknown ingredient');
});

await check('admin recipe draft lifecycle hides unpublished recipes from users', async () => {
  const { cookie } = await login('admin@gmail.com', 'admin123');
  const { body: ingredientsBody } = await request('/api/admin/ingredients', { headers: { cookie } });
  const ingredients = ingredientsBody.ingredients || [];
  const first = ingredients.find(item => item.normalizedName === 'egg') || ingredients[0];
  const second = ingredients.find(item => item.normalizedName === 'tomato') || ingredients[1] || first;
  assert(first && second, 'Expected at least two ingredients for draft lifecycle test');

  const draftName = `Smoke Draft ${Date.now()}`;
  const { body: created } = await request('/api/admin/recipes', {
    method: 'POST',
    headers: { cookie },
    body: JSON.stringify({
      vietnameseName: draftName,
      description: 'Temporary smoke-test draft recipe.',
      category: 'Mon chinh',
      cuisine: 'Vietnamese',
      difficulty: 'Easy',
      preparationTime: 5,
      cookingTime: 10,
      servings: 1,
      tags: ['Smoke Test'],
      status: 'DRAFT',
      ingredients: [
        { ingredientId: first.id, name: first.name, quantity: 1, unit: first.defaultUnit || 'phan' },
        { ingredientId: second.id, name: second.name, quantity: 1, unit: second.defaultUnit || 'phan' }
      ],
      instructions: [
        { stepNumber: 1, instruction: 'Prepare ingredients.' },
        { stepNumber: 2, instruction: 'Cook and season.' }
      ]
    })
  });
  const recipeId = created.recipe?.id;
  assert(recipeId, 'Expected created draft recipe id');
  assert(created.recipe?.status === 'DRAFT', 'Expected created recipe to remain DRAFT');

  const { body: hidden } = await request(`/api/recipes?search=${encodeURIComponent(draftName)}`);
  assert(!hidden.recipes?.some(item => item.id === recipeId), 'Draft recipe leaked to public recipe listing');

  const { body: published } = await request(`/api/admin/recipes/${recipeId}/status`, {
    method: 'PATCH',
    headers: { cookie },
    body: JSON.stringify({ status: 'PUBLISHED' })
  });
  assert(published.recipe?.status === 'PUBLISHED', 'Expected draft to be published');

  const { body: visible } = await request(`/api/recipes?search=${encodeURIComponent(draftName)}`);
  assert(visible.recipes?.some(item => item.id === recipeId), 'Published recipe did not appear in public listing');

  const { body: rejected } = await request(`/api/admin/recipes/${recipeId}/status`, {
    method: 'PATCH',
    headers: { cookie },
    body: JSON.stringify({ status: 'REJECTED' })
  });
  assert(rejected.recipe?.status === 'REJECTED', 'Expected recipe to be rejected');

  const { body: hiddenAgain } = await request(`/api/recipes?search=${encodeURIComponent(draftName)}`);
  assert(!hiddenAgain.recipes?.some(item => item.id === recipeId), 'Rejected recipe leaked to public recipe listing');

  await request(`/api/admin/recipes/${recipeId}`, {
    method: 'DELETE',
    headers: { cookie }
  });
});

console.table(checks);
console.log(`Smoke test passed against ${baseUrl}`);
