# SmartMeal Development Roadmap

## Trạng thái hiện tại

SmartMeal đã qua giai đoạn khôi phục nền tảng, hoàn tất Giai đoạn 1-5 và phần kỹ thuật cốt lõi của Giai đoạn 6. Dự án hiện có database thật, phân quyền thật, recommendation engine local-first và giao diện phân tách rõ công thức đã kiểm duyệt với công thức linh hoạt.

## Giai đoạn 1 - Nền tảng dữ liệu và phân quyền

Trạng thái: Đã hoàn thành.

- Prisma schema đã có user, role, preference, ingredient alias, recipe, favorite, review, recommendation history và feedback.
- Đã seed hai tài khoản demo:
  - `admin@gmail.com / admin123`
  - `user@gmail.com / user123`
- Đã seed bộ nguyên liệu, alias và recipe mẫu.
- Đã có API đăng nhập, đăng ký, đăng xuất và phân quyền admin/user.
- Session hỗ trợ cookie để frontend gọi API thuận tiện.

## Giai đoạn 2 - Recommendation core

Trạng thái: Đã hoàn thành bản lõi.

- Parse nguyên liệu từ câu tự nhiên đơn giản.
- Chuẩn hóa nguyên liệu bằng alias.
- Tìm recipe thật trong database.
- Tính ingredient match score.
- Xác định nguyên liệu thiếu.
- Xếp hạng theo match, preference, rating, độ phổ biến, thời gian và độ khó.
- Cho phép admin tinh chỉnh trọng số khi chạy evaluation.
- Lưu history cho user đã đăng nhập.
- Sinh recipe draft local để không phụ thuộc Gemini API key.

## Giai đoạn 3 - User features

Trạng thái: Đã hoàn thành phần chính.

Đã có:

- Giao diện nhập nguyên liệu bằng tìm kiếm, danh mục và câu tự nhiên.
- Xem danh sách món gợi ý theo match score.
- Xem chi tiết recipe.
- Lưu favorite.
- Đánh giá recipe.
- Quản lý nguyên liệu trong tủ lạnh cho user.
- Cập nhật hồ sơ và sở thích cá nhân.
- Trang lịch sử gợi ý của user.

Cần làm tiếp:

- UX rõ hơn khi bấm nguyên liệu còn thiếu: thêm vào tủ lạnh hoặc ghi nhận danh sách cần mua ở mức đơn giản.
- Kiểm tra lại các trạng thái rỗng/lỗi của từng màn hình.

## Giai đoạn 4 - Admin features

Trạng thái: Đã hoàn thành.

Đã có:

- Dashboard admin.
- Tab đánh giá thuật toán trong admin.
- Xem danh sách recipe.
- Xem từ điển nguyên liệu/alias.
- Xem log recommendation/feedback.
- CRUD nguyên liệu và alias trên giao diện admin.
- CRUD recipe trên giao diện admin.
- Trọng số thuật toán được gửi về backend khi chạy evaluation.
- Admin sinh recipe draft từ nguyên liệu nhập và nhận định lượng, thời gian, bước nấu.
- Luồng trạng thái `DRAFT -> PUBLISHED | REJECTED`; chỉ recipe `PUBLISHED` mới hiển thị cho user.

## Giai đoạn 5 - Evaluation và báo cáo

Trạng thái: Hoàn thành nền tảng kỹ thuật; còn mở rộng dữ liệu đánh giá thực tế.

Đã có:

- Bộ test case recommendation.
- Chỉ số Precision@K, Recall@K, HitRate@K, NDCG@K ở mức demo.
- Công thức điểm và giải thích recommendation.
- Evaluation sử dụng được bộ trọng số admin cấu hình.
- Smoke test tích hợp database cho auth, profile, recommendation, nutrition facts, local draft và vòng đời kiểm duyệt.
- Engine test độc lập cho parse, alias, dị ứng, mục tiêu dinh dưỡng và nguyên liệu lạ.
- Công thức linh hoạt cho user được gắn nhãn chưa kiểm duyệt, không tự xuất bản.
- Mỗi lần admin chạy evaluation được lưu thành `EvaluationRun`: K, bộ trọng số hợp lệ, metrics, latency, test case snapshot và người thực hiện.
- Dashboard admin hiển thị lịch sử evaluation để so sánh các lần tinh chỉnh thuật toán.
- Case evaluation `TC-REC` được lưu trong database bằng ID công thức đáp án; engine không còn dùng danh sách case cố định trong mã nguồn.
- Admin có thể thêm, sửa, bật/tắt ca ground truth trong dashboard; case vô hiệu hóa được giữ lại để bảo toàn bằng chứng của các lần đánh giá trước đó.

Cần làm tiếp:

- Mở rộng test case sát dữ liệu thực tế hơn, có ground truth do người đánh giá xác nhận.
- Ghi lại kết quả evaluation theo từng bộ trọng số để đưa vào báo cáo.
- Bổ sung ảnh chụp màn hình các flow chính.

## Giai đoạn 6 - Hoàn thiện bảo vệ

Trạng thái: Hoàn thành hạng mục kỹ thuật cốt lõi.

Đã có:

- Kiểm tra giao diện desktop và mobile 390px; sửa tràn thanh điều hướng, bộ lọc loại món và trạng thái không có kết quả.
- Modal chi tiết công thức hiển thị lỗi rõ ràng thay vì treo ở trạng thái tải.
- Bảo vệ quyền sở hữu tủ lạnh của user, chặn user truy cập API admin và chặn tương tác với recipe chưa xuất bản.
- Session cookie có thời hạn, `HttpOnly`, `SameSite=Lax`, bật `Secure` khi production; bổ sung các security header cơ bản.
- Có thể tắt tài khoản demo khi deploy qua `ALLOW_DEMO_LOGIN=false`.
- Build production, engine test và smoke test tích hợp database đã được chạy lại thành công.
- Seed demo và hướng dẫn cài đặt/chạy/demo đã có trong repository.

Cần làm trước khi nộp báo cáo:

- Thu thập tập recipe và kết quả đánh giá do người thật xác nhận để thay dữ liệu evaluation demo.
- Ghi kết quả evaluation theo từng bộ trọng số vào bảng/biểu đồ báo cáo.
- Chụp các flow user và admin từ bản dữ liệu đã chốt để đưa vào tài liệu bảo vệ.

## Đã loại khỏi scope hiện tại

Các chức năng sau đã bị gỡ khỏi `src` để tránh mock và giảm độ loãng đề tài:

- Chatbot bếp trưởng nhiều lượt.
- Nhận diện nguyên liệu từ ảnh tủ lạnh.
- Lập thực đơn 7 ngày.
- Shopping list mock trên frontend.
- Engine dinh dưỡng legacy `/api/smartmeal/analyze`.
- API legacy quản lý nutrition database.

Các tính năng này có thể đưa vào phần "hướng phát triển" của báo cáo thay vì triển khai trong bản bảo vệ chính.
