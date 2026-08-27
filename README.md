# SmartMeal - He thong goi y mon an thong minh

SmartMeal là một ứng dụng Web hiện đại giúp giải quyết bài toán muôn thuở: "Hôm nay ăn gì với những nguyên liệu đang có trong tủ lạnh?".

Hệ thống cho phép người dùng nhập nguyên liệu đầu vào theo nhiều cách khác nhau (gõ tìm kiếm, chọn danh mục, mô tả bằng giọng nói/văn bản tự nhiên hoặc chụp ảnh tủ lạnh), từ đó hệ thống sử dụng thuật toán Matching và AI (Gemini) để đề xuất những món ăn ngon nhất, phù hợp nhất với sở thích và chế độ ăn của người dùng.

---

## Cac tinh nang noi bat
1. Quan ly tu lanh (Pantry): Lưu trữ các nguyên liệu người dùng đang có sẵn.
2. 4 Phuong thuc nhap nguyen lieu thong minh:
   - Tìm kiếm nhanh (Autocomplete).
   - Chọn từ Danh mục trực quan.
   - AI NLP: Gõ một câu tự nhiên (VD: "Tôi có trứng và cà chua, muốn ăn đồ chay"), AI sẽ tự bóc tách.
   - AI Vision (Camera): Chụp ảnh tủ lạnh, AI tự động nhận diện nguyên liệu có trong ảnh.
3. Dong co goi y (Recommendation Engine): 
   - Tính toán tỷ lệ trùng khớp (Match Score %).
   - Ưu tiên món ăn ít thiếu nguyên liệu nhất.
   - Cá nhân hóa theo độ khó, thời gian nấu và chế độ dinh dưỡng (Healthy, Eat Clean, v.v.).
4. Chatbot AI Bep truong: Hỗ trợ hỏi đáp công thức và tư vấn nấu ăn trực tiếp.
5. Danh sach di cho (Shopping List): Tự động thêm các nguyên liệu còn thiếu vào danh sách cần mua.

---

## Cong nghe su dung
- Frontend: React 19, Vite, Tailwind CSS, Lucide React (Icons).
- Backend: Node.js, Express.js (Xử lý API và thuật toán gợi ý).
- AI Engine: Tích hợp @google/genai cho tính năng Natural Language và Computer Vision.
- Ngon ngu: TypeScript.

---

## Huong dan Cai dat & Van hanh

### 1. Yeu cau he thong
- Máy tính cần cài đặt sẵn Node.js (phiên bản 18 trở lên).
- Tài khoản API của Google Gemini (nếu muốn dùng tính năng AI nâng cao).

### 2. Cac buoc cai dat
Bật Terminal (Command Prompt / PowerShell) và điều hướng vào thư mục dự án, sau đó thực hiện các bước sau:

Buoc 1: Cai dat thu vien phu thuoc (node_modules)
```bash
npm install
```

Buoc 2: Cau hinh bien moi truong (Environment Variables)
1. Tạo một file tên là .env ở thư mục gốc của dự án (ngang hàng với package.json).
2. Sao chép nội dung từ file .env.example sang .env và điền key API của bạn (ví dụ: GEMINI_API_KEY=your_key_here).

Buoc 3: Khoi dong du an
```bash
npm run dev
```

### 3. Trai nghiem
Sau khi chạy lệnh trên, server sẽ tự động mở tại địa chỉ:
http://localhost:3000 (Hoặc cổng khác nếu 3000 bị trùng).

Bạn có thể sử dụng tính năng Đăng nhập Demo (Demo Login) trên góc phải màn hình để trải nghiệm ngay mà không cần tạo tài khoản.

---

## Quan tri vien (Admin)
- Đăng nhập bằng tài khoản Admin demo.
- Sử dụng tab Dashboard để xem thống kê độ chính xác (Precision/Hit Rate) của thuật toán, kiểm tra lịch sử thao tác hệ thống và quản lý từ điển Nguyên liệu / Công thức.

---
Dự án thực tập/đồ án xây dựng theo tài liệu SRS - Ingredient-Based Food Recommendation System.
