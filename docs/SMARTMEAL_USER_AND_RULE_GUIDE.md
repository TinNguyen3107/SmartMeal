# SmartMeal User and Rule Guide

## 1. Purpose and result types

SmartMeal recommends meals from ingredients the user currently has. Its primary source is the approved recipe catalogue in the database. Gemini is not required for matching, ranking, nutrition estimation, or the flexible draft fallback.

The initial seed contains a baseline catalogue of more than 100 common Vietnamese household ingredients across protein, vegetables, carbohydrates, fruit, dairy, fats, and seasonings. This is a starting vocabulary, not a closed list: administrators can add or correct ingredients, aliases, units, and macro values in the admin dashboard without changing application code.

There are two result types:

1. **Approved recipe**: a recipe created or reviewed by an administrator and published. It can be opened, saved, rated, and included in user history.
2. **Flexible draft**: a local, rule-based suggestion generated only when no approved recipe is eligible. It is labelled `CHƯA KIỂM DUYỆT`, cannot be rated or saved, and should not be used as clinical nutrition advice.

Example: before the catalogue contains *Rau muống xào tỏi*, `rau muống, tỏi` can only produce a draft. Once an administrator adds and publishes that recipe, the same input returns the approved recipe first.

## 2. Roles and access rules

### Guest

- Can browse the recipe catalogue and request recommendations.
- Can view only `PUBLISHED` recipes.
- Cannot keep pantry data, favorites, ratings, history, profile preferences, or access admin routes.
- Selecting an action that requires an account opens the sign-in flow.

### User

- Has every guest capability.
- Can update profile, dietary preferences, nutrition targets, and allergies.
- Can manage a private pantry.
- Can favorite and rate only published recipes.
- Can view only their own recommendation history.
- Cannot view drafts, rejected recipes, other users' pantry/history, admin data, or admin APIs.

### Administrator

- Has a separate **Quản trị Admin** tab.
- Can manage ingredients and aliases.
- Can create, edit, publish, reject, and inspect recipes.
- Can create a local recipe draft, then verify and save it as a recipe.
- Can view aggregated logs and users.
- Can manage evaluation cases, run evaluation, and export CSV evidence.
- Cannot use user-only pantry/history tabs because these are intentionally scoped to individual users.

The server enforces role checks, not only the UI. An account with role `USER` receives a forbidden response from every `/api/admin/*` endpoint.

## 3. User workflow

### 3.1 Sign in and register

1. Select **Đăng nhập**.
2. Use an existing account or switch to **Đăng ký**.
3. For local testing, use `user@gmail.com / user123` or `admin@gmail.com / admin123`.
4. In production, `ALLOW_DEMO_LOGIN=false` disables the shortcut buttons, while normal registration and login remain available.

Sessions are stored in an HTTP-only cookie. The response does not expose a reusable session token to JavaScript.

### 3.2 Enter ingredients and get recommendations

1. Open **Gợi ý món**.
2. Add ingredients from the search box, or use the quick ingredient buttons.
3. Use comma, semicolon, a new line, `và`, or `and` to separate items.
4. Prefer a quantity and unit for reliable nutrition estimates, for example:
   - `1 bó rau muống, 3 tép tỏi`
   - `200g ức gà, 150g bông cải, 1 chén cơm`
   - `2 quả trứng; 2 quả cà chua`
5. Open **Bộ lọc nâng cao** if needed, then select maximum cooking time, difficulty, cuisine, diet tags, and nutrition goal.
6. Select **Gợi ý món ăn ngay**.

The result list has two separate controls:

- Status: `Có thể nấu ngay` means match score at least 90%; `Gần đủ` is 70–89%; `Cần bổ sung` is 50–69%; `Ít phù hợp` is below 50%.
- Sort: ingredient match, final score, cooking time, or rating.

If a recipe is listed, open it to inspect required/missing ingredients, steps, estimated macros, reasons for its rank, favorite action, and rating.

### 3.3 Pantry, profile, favorites, and history

- **Tủ lạnh của tôi**: add known ingredients with quantity and unit, remove them, then request recommendations from the pantry. Pantry records belong to the signed-in user only.
- **Sở thích & Hồ sơ cá nhân**: set cooking-time preference, difficulty, dietary tags, nutrition goal, activity level, height, weight, daily macro targets, and allergy list.
- **Dị ứng**: enter comma-separated ingredients, for example `tôm, đậu phộng`. Recipes containing a matching allergy are removed before ranking. If the input itself contains a declared allergen, SmartMeal does not generate a flexible draft.
- **Kho công thức**: browse and filter all published recipes.
- **Yêu thích và đánh giá**: only available for published recipes after sign-in. One user has one favorite state and one editable rating per recipe.
- **Lịch sử gợi ý**: stores recommendations returned for the signed-in user. It does not store flexible drafts because they are not verified recipes.

## 4. Administrator workflow

### 4.1 Ingredients and aliases

1. Sign in as admin and open **Quản trị Admin**.
2. Create an ingredient with a canonical Vietnamese name, normalized name, category, default unit, aliases, and nutrition per 100 g where known.
3. Add aliases for common spelling variants and English names, such as `rau muống`, `rau muong`, `water spinach`, and `morning glory`.
4. Edit incorrect nutrition values or aliases rather than creating duplicate ingredients.

Canonical names and aliases are how user input becomes a database ingredient. If an ingredient does not exist, it cannot match an approved recipe.

The recommended data workflow is: first search the existing catalogue; if an item is absent, add it once with aliases and nutrition per 100 g; then add or revise the recipes that use it. The change immediately benefits every future user request and does not require a code fix or a Gemini call.

### 4.2 Recipe lifecycle

1. Create a recipe manually, or enter ingredients in the local draft generator.
2. Check recipe title, quantities, units, preparation time, cooking time, servings, instructions, tags, and nutrition.
3. Save as `DRAFT` while reviewing.
4. Change to `PUBLISHED` only after verification. Published recipes appear to guests and users.
5. Use `REJECTED` for a draft that should not be used. It remains unavailable to users.

Only approved recipes are eligible for favorites, ratings, user history, and the public catalogue.

### 4.3 Evaluation and evidence

- Create evaluation cases with input ingredients and expected recipe identifiers. Expected recipes are ground truth and must be chosen by a human evaluator, not copied from the algorithm output.
- Run evaluation as an administrator. The system records `Precision@K`, `Recall@K`, `Hit Rate@K`, `NDCG@K`, average latency, weights, cases, executor, and time.
- Disable a poor or obsolete case instead of deleting it when historical evidence matters.
- Export evaluation runs and cases as CSV. CSV cells that could be interpreted as formulas are escaped for spreadsheet safety.

## 5. Ingredient parsing rules

1. Input is split by `,`, `;`, new line, `và`, or `and`.
2. Conversational prefixes such as `tôi có`, `trong tủ lạnh có`, and `muốn nấu` are removed.
3. Accepted quantity formats include `200g ức gà`, `2 quả cà chua`, and `cơm 1 chén`.
4. Without quantity, SmartMeal uses `1 phần`. This is adequate for matching but weak for nutrition estimation.
5. Text is lowercased, Vietnamese tone marks are normalized, punctuation is removed, then it is compared against canonical names and aliases.
6. Exact alias match is preferred. A fuzzy match is permitted only for strings with at least four characters and only when one normalized string contains the other.
7. Unknown input remains visible in a flexible draft, but it never falsely matches a stored recipe and triggers a verification warning.

Unit-to-gram estimates used when the database does not provide a direct amount are: `kg=1000g`, `l=1000g`, `ml=1g`, `quả/trái=80g`, `chén=150g`, `bó=120g`, `lá/nhánh/tép=10g`, `muỗng/thìa=5g`, and `muỗng canh=15g`. These are estimates, not laboratory measurements.

## 6. Recommendation rules

### 6.1 Candidate and match rules

- The engine loads only `PUBLISHED` recipes for guest/user recommendations.
- A recipe containing one of the user's allergy terms is excluded before scoring.
- Required ingredients are ingredients not marked optional.
- `Ingredient Match = matched required ingredients / total required ingredients * 100`.
- Recipes with no matching input ingredient are hidden. A recipe with a matching optional ingredient may appear, but it will have a low match score unless required ingredients also match.

### 6.2 Default ranking formula

The final score is a weighted sum. The default weights are normalized to total 100%:

| Factor | Default weight | Rule |
| --- | ---: | --- |
| Ingredient match | 40% | Higher when more required ingredients are available. |
| Nutrition fit | 18% | Uses the selected goal and macro/calorie targets. |
| User preference | 12% | Cuisine and selected dietary tags. |
| Local semantic similarity | 12% | Token overlap from input, tags, description, category, and goal. |
| Rating | 8% | Recipe rating, with 4/5 as fallback for an unrated recipe. |
| Cooking time | 8% | Full score within the limit; then loses 4 points per minute over it. |
| Popularity | 5% | Admin-maintained popularity score. |
| Difficulty | 5% | Full score for the requested difficulty, otherwise 55. |

Administrators can submit another weight set for evaluation. The server validates values and normalizes their sum, so an invalid or oversized total cannot distort the formula accidentally.

### 6.3 Nutrition rules

- `MUSCLE_GAIN`: rewards protein and the `High Protein` tag.
- `WEIGHT_LOSS`: rewards a meal at or below one-third of the daily calorie target and the `Healthy` tag.
- `LOW_CARB`: rewards meals at or below 35 g carbohydrate and the `Low Carb` tag.
- `VEGETARIAN`: rewards the `Vegetarian` tag and penalizes recipes without it.
- `BALANCED`: rewards meals around 250–650 kcal.
- A meal can receive a small bonus when its protein reaches one-third of the daily protein target. It loses points when carbohydrate exceeds half of the daily carbohydrate target.

Nutrition values originate from administrator-maintained values per 100 g. Where an ingredient has no data, the engine uses a coarse category fallback and labels the resulting draft as an estimate.

### 6.4 Local semantic rules

The current semantic score is not Gemini and not a trained deep-learning model. It is deterministic local token matching over recipe text and request context. It adds limited domain boosts for gym/protein, healthy/weight loss, and vegetarian language. This makes its result explainable and testable, but its vocabulary improves only when administrators add good aliases, tags, descriptions, and recipes.

### 6.5 Flexible draft rules

- A draft is generated only when the user has at least one input ingredient and no declared allergy is present in that input.
- The UI displays it only when there is no eligible approved result, preventing a draft from competing visually with verified recipes.
- The draft picks a protein as main ingredient where possible; otherwise the first recognized ingredient is the main ingredient. It uses category-based time, title, steps, and macro estimates.
- A named local rule exists for `rau muống + tỏi`: it generates *Rau muống xào tỏi (nháp linh hoạt)* with stir-fry steps. The catalogue also contains an approved seed recipe for this same dish, so normal users should receive the approved version after database seeding.
- Drafts are intentionally not auto-published and do not become training data. An admin must review them.

## 7. Troubleshooting

### “Không tìm thấy món ăn phù hợp”

1. Check whether the ingredients have been added by admin with aliases.
2. Add a main ingredient, not only a seasoning. For example, `tỏi` alone should not be treated as a complete meal.
3. Set a less restrictive time, cuisine, diet, or difficulty filter.
4. Check profile allergies; an allergy can correctly hide a recipe.
5. If a recipe should exist, ensure its status is `PUBLISHED`, not `DRAFT` or `REJECTED`.

### “Công thức linh hoạt - chưa kiểm duyệt” appears

This is expected when SmartMeal has no approved recipe for the ingredient combination. Use it as a suggestion, not as verified nutrition guidance. The administrator should create or approve a matching recipe if this combination is a common use case.

### Rau muống and tỏi

Use `1 bó rau muống, 3 tép tỏi`. After running `npm run prisma:seed`, SmartMeal contains the ingredient aliases, nutrition values, and published recipe **Rau muống xào tỏi**. It should then appear with 100% required-ingredient match; fish sauce is optional.
