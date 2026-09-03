# SmartMeal - He thong goi y mon an thong minh

SmartMeal la ung dung web ho tro nguoi dung tra loi cau hoi: "Hom nay nau gi voi nhung nguyen lieu dang co?". He thong cho phep quan ly nguyen lieu trong tu bep, phan tich dau vao cua nguoi dung va goi y cac cong thuc phu hop kem dinh luong, thoi gian nau, thong tin dinh duong va cac buoc che bien chi tiet.

De tai duoc thiet ke theo huong hybrid recommendation: loi goi y mon an hoat dong doc lap bang thuat toan matching/scoring, trong khi Gemini chi la module tuy chon de ho tro NLP nang cao va tao ban nhap cong thuc cho admin.

## Chuc nang chinh

1. Quan ly tu nguyen lieu ca nhan
   - Them/xoa nguyen lieu nguoi dung dang co.
   - Luu so luong, don vi va nhom nguyen lieu.
   - Dong bo danh sach nguyen lieu sang man hinh goi y mon an.

2. Goi y mon an tu nguyen lieu san co
   - Nhap nguyen lieu bang tim kiem/autocomplete.
   - Chon nguyen lieu theo danh muc.
   - Nhap cau tu nhien va de he thong tach nguyen lieu, thoi gian, so thich.
   - Tinh Match Score va Final Score cho tung cong thuc.
   - Hien thi nguyen lieu da co, nguyen lieu con thieu va ly do goi y.

3. Kho cong thuc va chi tiet mon an
   - Xem danh sach cong thuc trong he thong.
   - Xem chi tiet mon an: anh, nguyen lieu, dinh luong, calo, P/C/F, thoi gian va cac buoc nau.
   - Danh dau yeu thich, danh gia sao va binh luan.
   - Them nguyen lieu con thieu vao gio di cho.

4. Gio di cho
   - Tu dong gom nguyen lieu con thieu tu cac mon duoc goi y.
   - Them mon can mua thu cong.
   - Danh dau da mua, xoa mon da mua va sao chep danh sach.

5. Quan tri vien
   - Quan ly cong thuc mon an.
   - Quan ly tu dien nguyen lieu.
   - Tao cong thuc thu cong.
   - Tao ban nhap cong thuc bang Gemini hoac bo sinh cuc bo, sau do admin kiem duyet truoc khi luu.
   - Xem nhat ky he thong.
   - Danh gia thuat toan goi y bang Precision@K va HitRate@K.

## Rule va logic noi bat

- Chuan hoa nguyen lieu: bo dau tieng Viet, xu ly alias va dong nhat ten nguyen lieu.
- Ingredient Match Score: tinh do trung khop giua nguyen lieu nguoi dung co va cong thuc.
- Ingredient importance: phan biet nguyen lieu chinh, nguyen lieu phu va gia vi/tuy chon.
- Quantity matching: tinh khop mot phan khi nguoi dung co it hon dinh luong can thiet.
- Missing ingredient penalty: tru diem theo muc do quan trong cua nguyen lieu bi thieu.
- Preference score: ca nhan hoa theo che do an, thoi gian nau, do kho va nguyen lieu can tranh.
- Explainable recommendation: hien thi ly do tai sao he thong goi y mon do.
- Evaluation suite: chay test case mau de do do chinh xac cua thuat toan goi y.

## Cong nghe su dung

- Frontend: React, Vite, Tailwind CSS, Lucide React.
- Backend: Node.js, Express.js.
- Database: Prisma ORM voi MySQL/TiDB.
- AI optional: `@google/genai` cho NLP nang cao va tao ban nhap cong thuc.
- Ngon ngu: TypeScript.

## Cai dat va chay du an

```bash
npm install
npm run dev
```

Ung dung chay tai:

```text
http://localhost:3000
```

Gemini API key la tuy chon. Neu khong co `GEMINI_API_KEY`, he thong van co the:

- Phan tich cau nhap bang local parser.
- Goi y mon an bang recommendation engine.
- Tao ban nhap cong thuc bang local generator cho admin.

## Tai khoan demo

- User: `user@gmail.com` / `user123`
- Admin: `admin@gmail.com` / `admin123`

## Dinh huong production

Khi deploy production can cau hinh:

- `DATABASE_URL`
- `GEMINI_API_KEY` neu muon bat AI nang cao
- build server phu hop voi Prisma client
- seed data cho database production
