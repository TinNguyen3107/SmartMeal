# SmartMeal SRS

## 1. Mục tiêu dự án

SmartMeal là hệ thống gợi ý món ăn dựa trên nguyên liệu có sẵn. Người dùng nhập danh sách nguyên liệu, hệ thống chuẩn hóa tên nguyên liệu, tìm món ăn phù hợp trong cơ sở dữ liệu, tính điểm phù hợp, hiển thị nguyên liệu còn thiếu và giải thích lý do gợi ý.

## 2. Phạm vi thực hiện

Phiên bản đồ án tập trung vào hệ thống recommendation có thể chạy độc lập, không phụ thuộc Gemini API. Recipe thật trong database là nguồn dữ liệu chính. Công thức do AI/local generator sinh ra chỉ là bản nháp để admin kiểm duyệt trước khi lưu thành recipe chính thức.

## 3. Vai trò người dùng

### Guest

- Xem danh sách món ăn.
- Nhập nguyên liệu và nhận gợi ý cơ bản.
- Không lưu lịch sử, yêu thích hoặc đánh giá.

### User

- Đăng nhập bằng tài khoản thật.
- Nhập nguyên liệu và nhận gợi ý cá nhân hóa theo tags.
- Lưu món yêu thích.
- Đánh giá món ăn.
- Xem lịch sử gợi ý.

### Admin

- Quản lý nguyên liệu và alias.
- Quản lý recipe.
- Sinh công thức nháp từ nguyên liệu có sẵn.
- Duyệt công thức nháp thành recipe thật.
- Xem dashboard thống kê.
- Chạy bộ test đánh giá recommendation.

## 4. Tài khoản demo

```text
Admin: admin@gmail.com / admin123
User:  user@gmail.com / user123
```

## 5. Chức năng chính

### Authentication

- Đăng nhập bằng email và password.
- Password được hash bằng bcrypt.
- Backend cấp token phiên làm việc.
- API admin bắt buộc role `ADMIN`.

### Ingredient Management

- Nguyên liệu có tên chuẩn, nhóm, đơn vị mặc định.
- Mỗi nguyên liệu có nhiều alias tiếng Việt/tiếng Anh.
- Alias giúp hệ thống map `trứng`, `egg`, `trứng gà` về cùng nguyên liệu chuẩn.

### Recipe Management

- Recipe gồm tên, mô tả, cuisine, category, độ khó, thời gian chuẩn bị, thời gian nấu, calories, servings, tags.
- Recipe có danh sách nguyên liệu định lượng.
- Recipe có các bước nấu theo thứ tự.
- Recipe có source: `MANUAL`, `SEED`, `LOCAL_GENERATOR`, `GEMINI_DRAFT`.

### Recommendation

Input:

```text
Danh sách nguyên liệu người dùng có
Bộ lọc thời gian
Tags sở thích
```

Output:

```text
Danh sách món ăn phù hợp
Match score
Nguyên liệu đã có
Nguyên liệu còn thiếu
Lý do gợi ý
```

Formula:

```text
Final Score =
0.55 * Ingredient Match
+ 0.15 * Preference Score
+ 0.10 * Rating Score
+ 0.05 * Popularity Score
+ 0.10 * Cooking Time Score
+ 0.05 * Difficulty Score
```

Admin có thể điều chỉnh trọng số trong màn đánh giá thuật toán. Backend sẽ chuẩn hóa tổng trọng số về 1.0 trước khi xếp hạng.

### AI/Local Recipe Draft

- Hệ thống có thể sinh công thức nháp từ nguyên liệu nhận diện được.
- Công thức nháp bắt buộc có định lượng nguyên liệu, thời gian và các bước nấu.
- Admin phải duyệt trước khi lưu vào database.
- Không có Gemini API key thì generator local vẫn hoạt động.

## 6. Yêu cầu phi chức năng

- Recommendation nên phản hồi dưới 2 giây với dataset demo/vừa.
- Không lưu plaintext password.
- Không log secret/API key.
- Input được validate ở backend.
- AI/generator không thay thế dữ liệu chính thức nếu chưa qua admin duyệt.

## 7. Tiêu chí hoàn thành

- Có đăng nhập thật cho admin/user.
- Có seed tài khoản demo.
- Có seed nguyên liệu/alias/recipe mẫu.
- User nhận được gợi ý từ recipe thật.
- Admin sinh và lưu được công thức nháp.
- Có favorite, rating, history.
- Có dashboard và evaluation cơ bản.
- Admin CRUD được nguyên liệu/alias và recipe.
- User xem được lịch sử gợi ý từ database.
