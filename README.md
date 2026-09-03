# SmartMeal - He thong AI goi y mon an theo nguyen lieu va muc tieu dinh duong

SmartMeal la do an web nganh Cong nghe Thong tin cho phep nguoi dung nhap cac nguyen lieu dang co, sau do he thong tu phan tich tri so dinh duong va goi y cong thuc mon an phu hop cho nhieu nhom nguoi dung nhu an kieng, tap gym, low-carb, an chay hoac bua an can bang.

Dinh huong thiet ke cua du an la **offline-first AI logic**: loi phan tich va goi y khong phu thuoc Gemini API. Gemini co the duoc bo sung sau nay de dien dat cong thuc tu nhien hon, nhung ket qua chinh duoc tao bang du lieu dinh duong noi bo va thuat toan scoring rieng.

## Chuc nang chinh

- Nhap danh sach nguyen lieu bang ngon ngu tu nhien co dinh luong.
- Chuan hoa ten nguyen lieu bang alias tieng Viet/tieng Anh.
- Quy doi so luong ve gram/ml.
- Tinh calories, protein, carbohydrate, fat va fiber cho tung nguyen lieu.
- Tinh tong tri so dinh duong cua toan bo nguyen lieu.
- Hien thi ty le macro P/C/F theo nang luong.
- Chon muc tieu dinh duong:
  - Can bang
  - An kieng/giam can
  - Tap gym/tang co
  - Low carb
  - An chay
- Goi y cong thuc mon an phu hop voi muc tieu.
- Hien thi dinh luong, thoi gian, cac buoc nau va ly do goi y.
- Giai thich thuat toan dung trong he thong.

## Thuat toan Hybrid Nutrition Scoring

He thong gom 4 buoc:

1. **Ingredient parsing**
   - Tach chuoi nguoi dung nhap thanh danh sach nguyen lieu.
   - Vi du: `200g uc ga, 1 chen com, 150g bong cai`.

2. **Nutrition analysis**
   - Chuan hoa ten nguyen lieu bang alias.
   - Quy doi ve gram/ml.
   - Tinh calories, protein, carb, fat, fiber dua tren bang du lieu noi bo theo 100g.

3. **Recipe candidate generation**
   - Nhom nguyen lieu thanh protein, vegetable, carb, fat, seasoning.
   - Sinh ung vien cong thuc theo cac mau nau an:
     - Protein + rau cho an kieng/low-carb.
     - Protein + carb cho tap gym/tang co.
     - Nguyen lieu thuc vat cho an chay.
     - Phuong an can bang neu thieu nhom chat.

4. **Recommendation scoring**
   - Macro score: 40%
   - Cooking time score: 25%
   - Calorie target score: 20%
   - Ingredient variety score: 15%

Cong thuc tong quat:

```text
Final Score =
Macro Score * 0.40
+ Time Score * 0.25
+ Calorie Score * 0.20
+ Variety Score * 0.15
```

Moi cong thuc duoc xep hang theo diem so va co phan giai thich ly do.

## Vi sao khong lam dung Gemini?

- Du lieu dinh duong nam trong `src/data/nutritionDatabase.ts`.
- Thuat toan phan tich/giai thich nam trong `src/server/smartMealEngine.ts`.
- API `/api/smartmeal/analyze` chay duoc ke ca khi khong co `GEMINI_API_KEY`.
- Gemini chi nen dung trong giai do mo rong, vi du viet lai mo ta cong thuc tu nhien hon hoac giai thich bang van phong than thien hon.

## Cong nghe

- React
- Vite
- Tailwind CSS
- Express
- TypeScript

## Chay du an

```bash
npm install
npm run dev
```

Mo trinh duyet tai:

```text
http://localhost:3000
```

## API chinh

```text
POST /api/smartmeal/analyze
```

Body mau:

```json
{
  "text": "200g ức gà, 1 chén cơm, 150g bông cải xanh",
  "goal": "muscle-gain",
  "maxMinutes": 30,
  "servings": 1
}
```

## Huong phat trien

- Mo rong bang du lieu dinh duong.
- Luu lich su phan tich cua nguoi dung.
- Them tai khoan va ho so ca nhan.
- Them database production.
- Tich hop Gemini tuy chon de toi uu ngon ngu cong thuc, khong thay the thuat toan loi.
