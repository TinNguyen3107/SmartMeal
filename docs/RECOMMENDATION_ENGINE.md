# SmartMeal Recommendation Engine

## Mục tiêu

SmartMeal gợi ý món ăn từ nguyên liệu có sẵn của người dùng, đồng thời xét đến mục tiêu cá nhân như giảm cân, tập gym, low carb, ăn chay, thời gian nấu, độ khó và dị ứng. Lõi gợi ý được thiết kế theo hướng local-first: hệ thống vẫn chạy khi không có Gemini API key.

## Kiến trúc Hybrid Recommendation

Engine hiện tại thuộc nhóm hybrid recommendation, kết hợp nhiều nguồn điểm:

```text
FinalScore =
  w_match     * IngredientMatch
+ w_nutrition * NutritionFit
+ w_semantic  * SemanticSimilarity
+ w_user      * UserPreference
+ w_rating    * Rating
+ w_popularity* Popularity
+ w_time      * CookingTime
+ w_difficulty* Difficulty
```

Trọng số mặc định:

| Thành phần | Ý nghĩa | Trọng số mặc định |
| --- | --- | --- |
| IngredientMatch | Tỷ lệ nguyên liệu bắt buộc user đang có | 0.40 |
| NutritionFit | Độ phù hợp với mục tiêu dinh dưỡng | 0.18 |
| SemanticSimilarity | Độ gần nghĩa giữa nhu cầu user và thông tin món | 0.12 |
| UserPreference | Cuisine, tag, sở thích cá nhân | 0.12 |
| Rating | Điểm đánh giá cộng đồng | 0.08 |
| Popularity | Độ phổ biến/lượt quan tâm | 0.05 |
| CookingTime | Mức phù hợp với thời gian tối đa | 0.08 |
| Difficulty | Mức phù hợp với độ khó mong muốn | 0.05 |

Các trọng số được chuẩn hóa trước khi tính điểm, nên admin có thể thử nghiệm bộ trọng số khác trên dashboard đánh giá.

## 1. NLP local

Input người dùng có thể là danh sách nguyên liệu hoặc câu tự nhiên:

```text
Trong tủ lạnh tôi có 4 quả trứng gà, 2 quả cà chua và ít hành lá.
Tôi muốn món dễ nấu dưới 20 phút.
```

Hệ thống xử lý:

- tách nguyên liệu bằng dấu phẩy, xuống dòng, từ nối "và", "and";
- nhận diện số lượng và đơn vị như `200g`, `2 quả`, `1 chén`;
- loại bỏ phần mô tả không phải nguyên liệu;
- chuẩn hóa tiếng Việt không dấu;
- map nguyên liệu sang dictionary chuẩn bằng alias.

Ví dụ:

| Chuỗi nhập | Nguyên liệu chuẩn |
| --- | --- |
| trứng, trứng gà, egg | Trứng gà |
| cà chua, tomato | Cà chua |
| tôm, shrimp | Tôm |

## 2. Ingredient Match

Với mỗi công thức, hệ thống so sánh nguyên liệu user có với nguyên liệu bắt buộc trong recipe.

```text
IngredientMatch = requiredMatched / requiredTotal * 100
```

Nếu user có đủ nguyên liệu bắt buộc, món được gắn trạng thái "Có thể nấu ngay". Nếu thiếu ít nguyên liệu, hệ thống vẫn gợi ý nhưng hiển thị phần cần bổ sung.

## 3. Nutrition-Aware Scoring

Mỗi user có hồ sơ dinh dưỡng:

- mục tiêu: cân bằng, giảm cân, tập gym, low carb, ăn chay;
- chiều cao, cân nặng, tuổi, giới tính;
- mức vận động;
- target calo/protein/carb/fat;
- dị ứng/thực phẩm cần tránh.

Hệ thống ước lượng mục tiêu mặc định bằng công thức BMR gần với Mifflin-St Jeor:

```text
BMR = 10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset
```

Sau đó nhân với hệ số vận động để ra maintenance calories. Tùy mục tiêu, hệ thống điều chỉnh:

- giảm cân: giảm khoảng 350 kcal/ngày;
- tập gym/tăng cơ: tăng khoảng 250 kcal/ngày;
- low carb: giảm tỷ lệ carb;
- ăn chay: ưu tiên recipe có tag vegetarian.

Mỗi nguyên liệu có dữ liệu dinh dưỡng trên 100g:

- caloriesPer100g;
- proteinPer100g;
- carbsPer100g;
- fatPer100g.

Khi admin tạo hoặc seed công thức, các chỉ số này được copy vào từng `RecipeIngredient`. Engine tính macro của món từ định lượng trong công thức:

```text
grams = convert(quantity, unit)
ingredientCalories = grams * caloriesPer100g / 100
ingredientProtein  = grams * proteinPer100g  / 100
ingredientCarbs    = grams * carbsPer100g    / 100
ingredientFat      = grams * fatPer100g      / 100
```

Sau đó hệ thống so sánh macro của món với mục tiêu người dùng:

- tập gym/tăng cơ: ưu tiên protein cao;
- giảm cân: ưu tiên món có calories phù hợp target mỗi bữa;
- low carb: giảm điểm món có carb cao;
- ăn chay: ưu tiên recipe chay và loại bớt nguồn đạm động vật;
- cân bằng: ưu tiên món nằm trong khoảng năng lượng vừa phải.

Nutrition score là điểm phục vụ recommendation, không phải tư vấn y khoa. Với đồ án, phần này tạo cơ sở thuật toán rõ ràng hơn vì điểm dinh dưỡng đã dựa trên dữ liệu nguyên liệu trong database thay vì chỉ dựa vào tag.

## 4. Semantic Similarity

`SemanticSimilarity` hiện là local semantic scoring/embedding-ready. Hệ thống tạo ngữ cảnh từ:

- câu nhập của user;
- mục tiêu dinh dưỡng;
- tag người dùng chọn;
- tên món;
- mô tả món;
- cuisine/category;
- nguyên liệu trong recipe.

Sau đó so khớp token và áp dụng boost theo ý nghĩa như:

- `gym`, `protein`, `MUSCLE_GAIN` ưu tiên món giàu đạm;
- `healthy`, `giảm cân` ưu tiên món healthy/salad/rau;
- `chay`, `VEGETARIAN` ưu tiên món chay.

Thiết kế này cho phép thay hàm semantic hiện tại bằng embedding model local trong tương lai mà không phải viết lại toàn bộ engine.

## 5. Lọc dị ứng

Trước khi xếp hạng, hệ thống loại recipe có nguyên liệu trùng với danh sách dị ứng hoặc thực phẩm cần tránh của user.

Ví dụ user nhập dị ứng `tôm`, các món có nguyên liệu `Tôm` sẽ bị loại khỏi danh sách gợi ý.

## 6. Sinh công thức nháp

Khi không có công thức phù hợp hoặc admin muốn mở rộng kho dữ liệu, hệ thống có thể sinh recipe draft bằng local generator:

- chọn nguyên liệu chính, ưu tiên protein;
- ghép tên món từ nguyên liệu chính, rau củ, tinh bột;
- tạo định lượng từ input đã parse;
- ước lượng thời gian theo nhóm món;
- sinh các bước nấu bằng template.

Draft luôn có trạng thái cần admin kiểm duyệt. Admin phải kiểm tra định lượng, thời gian, khẩu vị và bước nấu trước khi lưu thành recipe chính thức.

Vòng đời quản trị công thức nháp:

```text
LOCAL_GENERATOR -> DRAFT -> PUBLISHED
                         \-> REJECTED
```

- `DRAFT`: công thức mới sinh hoặc admin lưu nháp, chỉ admin nhìn thấy.
- `PUBLISHED`: công thức đã được admin duyệt, user mới thấy trong danh sách món và recommendation.
- `REJECTED`: công thức bị từ chối hoặc cần ẩn khỏi user.

Thiết kế này giúp hệ thống không phụ thuộc mù quáng vào AI/API bên ngoài. AI hoặc local generator chỉ đóng vai trò hỗ trợ tạo dữ liệu ban đầu; dữ liệu chính thức vẫn phải qua kiểm duyệt của admin.

### 6.1 Công thức linh hoạt cho user

Kết quả gợi ý của user có hai tầng tách biệt:

| Loại kết quả | Nguồn | Có cần admin thêm trước? | Cách hiển thị |
| --- | --- | --- | --- |
| Công thức đã kiểm duyệt | Recipe `PUBLISHED` trong database | Có | Kết quả chính thức, có thể xem chi tiết, đánh giá và yêu thích |
| Công thức linh hoạt | Local rule-based generator | Không | Gắn nhãn chưa kiểm duyệt, chỉ phục vụ gợi ý cá nhân |

Khi không tìm thấy công thức `PUBLISHED` phù hợp, hoặc người dùng nhập nguyên liệu chưa có trong từ điển, engine vẫn giữ nguyên liệu đó để dựng công thức linh hoạt. Nguyên liệu chưa có nutrition fact theo 100g được gắn cảnh báo xác minh; hệ thống không được trình bày con số ước tính này như dữ liệu dinh dưỡng chuẩn.

Nếu nguyên liệu đầu vào trùng với dị ứng trong hồ sơ, hệ thống không sinh công thức linh hoạt. Đây là lớp bảo vệ bổ sung bên cạnh việc loại các recipe đã xuất bản có dị nguyên.

## 7. Bằng chứng kiểm thử

Dự án có smoke test tự động:

```bash
npm run smoke
```

Smoke test kiểm tra:

- kết nối database;
- login user demo;
- user lưu nutrition profile;
- login admin demo;
- admin xem danh sách users;
- recommendation có `nutritionScore` và `semanticScore`;
- recommendation có `estimatedNutrition` và `scoreBreakdown`;
- admin sinh recipe draft bằng `LOCAL_GENERATOR`.
- nguyên liệu chưa có trong từ điển vẫn tạo được công thức linh hoạt và kèm cảnh báo xác minh dữ liệu.
- admin kiểm tra vòng đời recipe draft: nháp không lộ cho user, publish thì xuất hiện, reject thì ẩn lại.

Ngoài smoke test, bộ kiểm thử lõi chạy độc lập bằng lệnh sau:

```bash
npm run test:engine
```

Bộ này khóa các hành vi thuật toán quan trọng: parse định lượng, alias Việt/Anh, ranh giới từ khi lọc dị ứng (ví dụ `tôm` không được loại nhầm `tomato`), xếp hạng theo tăng cơ/giảm cân/low carb và fallback cho nguyên liệu chưa có trong từ điển.

## 8. Giải thích kết quả gợi ý

Mỗi món trong response recommendation trả thêm dữ liệu giải thích:

```json
{
  "estimatedNutrition": {
    "calories": 260,
    "protein": 34,
    "carbs": 11,
    "fat": 27
  },
  "scoreBreakdown": {
    "ingredientMatch": 100,
    "nutritionFit": 85,
    "semanticSimilarity": 71,
    "userPreference": 65,
    "rating": 100,
    "popularity": 92,
    "cookingTime": 100,
    "difficulty": 100
  }
}
```

UI dùng dữ liệu này để hiển thị macro và điểm thành phần ngay trên card món ăn. Khi bảo vệ, có thể giải thích rằng hệ thống xếp hạng món bằng nhiều bằng chứng: nguyên liệu đang có, macro dinh dưỡng, độ gần nghĩa nhu cầu, sở thích cá nhân, đánh giá, độ phổ biến, thời gian và độ khó.

Admin dashboard có thêm evaluation metrics:

- Precision@K;
- Recall@K;
- HitRate@K;
- NDCG@K;
- test case theo các nhóm nguyên liệu mẫu.

Các chỉ số này được tính lại từ thứ hạng thực tế của từng test case, không dùng số mô phỏng cố định:

```text
Precision@K = relevant recipes trong Top K / K
Recall@K    = relevant recipes trong Top K / tổng recipe mục tiêu
HitRate@K   = số test case có ít nhất một recipe mục tiêu trong Top K / tổng test case
NDCG@K      = DCG / IDCG, giảm điểm khi recipe mục tiêu xuất hiện ở vị trí thấp hơn
```

## Giới hạn hiện tại

- Nutrition facts hiện đã có trên 100g cho dataset demo, nhưng cần mở rộng thêm nếu kho nguyên liệu lớn hơn.
- Semantic scoring hiện là local token/keyword scoring, chưa dùng embedding model thật.
- Recipe draft là bản nháp có kiểm duyệt, không nên xem là công thức chuẩn tuyệt đối.
- Đánh giá thuật toán hiện dựa trên dataset demo; khi dataset lớn hơn cần mở rộng test case và ground truth.

## Hướng nâng cấp tiếp theo

- Tách semantic scoring thành service riêng để sau này thay bằng Vietnamese SBERT/PhoBERT embedding local.
- Bổ sung bảng NutritionFact cho từng nguyên liệu theo 100g.
- Lưu lại lý do chi tiết từng thành phần điểm trong RecommendationHistory.
- Thêm màn admin xem phân tích score của từng món.
- Tăng số test case để báo cáo đồ án thuyết phục hơn.
