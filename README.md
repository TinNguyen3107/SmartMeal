# SmartMeal

SmartMeal là hệ thống gợi ý món ăn dựa trên nguyên liệu có sẵn. Dự án dùng React, Express, Prisma và MySQL/MariaDB, tập trung vào recommendation engine có thể chạy bằng dữ liệu nội bộ thay vì phụ thuộc Gemini API.

## Điểm chính

- Đăng nhập thật với role `ADMIN` và `USER`.
- Chuẩn hóa nguyên liệu bằng alias tiếng Việt/tiếng Anh.
- Gợi ý món ăn từ recipe thật trong database.
- Tính match score và hiển thị nguyên liệu còn thiếu.
- Giải thích lý do món ăn được đề xuất.
- User có history, favorite và rating.
- Admin có dashboard, evaluation và công cụ sinh recipe draft.
- Recipe draft có định lượng, thời gian và bước nấu; admin duyệt trước khi lưu.
- Khi không có công thức đã duyệt phù hợp, user vẫn nhận được một công thức linh hoạt cục bộ; kết quả này được gắn nhãn chưa kiểm duyệt và không tự xuất bản.
- Recommendation engine theo hướng hybrid: ingredient matching, nutrition-aware scoring, semantic scoring local và user preference.

## Tài khoản demo

```text
Admin: admin@gmail.com / admin123
User:  user@gmail.com / user123
```

## Cài đặt

```bash
npm install
```

Tạo `.env` từ `.env.example`, sau đó cấu hình database:

```text
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
DATABASE_URL_PRISMA="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
GEMINI_API_KEY=""
```

Gemini là tùy chọn. Recommendation core vẫn chạy khi không có key.

Khi deploy, đặt `NODE_ENV=production` và `ALLOW_DEMO_LOGIN=false` để tắt nút đăng nhập demo. Cookie phiên đăng nhập chỉ truyền qua HTTPS ở môi trường production.

## Prisma

Generate Prisma Client:

```bash
npm run prisma:generate
```

Đồng bộ schema vào database:

```bash
npm run prisma:push
```

Seed dữ liệu demo:

```bash
npm run prisma:seed
```

Nạp các ca ground truth `TC-REC` cho evaluation. Lệnh này chỉ tạo ca chưa tồn tại, không ghi đè dữ liệu admin đã quản lý:

```bash
npm run evaluation:seed
```

## Chạy dự án

```bash
npm run dev
```

Mở:

```text
http://localhost:3000
```

## Kiểm thử

Kiểm thử thuật toán chạy độc lập, không cần server hay database:

```bash
npm run test:engine
```

Kiểm thử tích hợp với server và database đang chạy:

```bash
npm run smoke
```

## Tài liệu

- SRS mới: `SmartMeal_SRS.md`
- Lộ trình: `development_roadmap.md`
- Giải thích thuật toán gợi ý: `docs/RECOMMENDATION_ENGINE.md`
- Hướng dẫn sử dụng, phân quyền và toàn bộ rule: `docs/SMARTMEAL_USER_AND_RULE_GUIDE.md`
