# Quy chuẩn Kỹ thuật và Vận hành Dự án (10-Day Sprint Rules)

## 1. Quy chuẩn Lập trình Backend (FastAPI & SQL Server)
- Mọi endpoint nhận đơn (Web và Email) bắt buộc sử dụng BackgroundTasks để gọi Gemini API, đảm bảo thời gian phản hồi HTTP dưới 500ms.
- Sử dụng Pydantic v2 để kiểm tra kiểu dữ liệu đầu vào và ép chuẩn JSON trả về từ Gemini.
- Chuỗi kết nối SQL Server qua pyodbc phải bật chế độ pooling và xử lý bảng mã Unicode (NVARCHAR) cho tiếng Việt.
- Bọc toàn bộ lệnh gọi AI trong khối try-except; nếu API quá tải hoặc lỗi mạng, tự động gán trạng thái REQUIRE_HUMAN_REVIEW để không làm mất đơn của dân.

## 2. Quy chuẩn Lập trình Frontend (React & Tailwind CSS)
- Thiết kế Mobile-First cho trang gửi đơn và trang Cán bộ Một cửa quét ảnh.
- Nút tải ảnh bắt buộc hỗ trợ thuộc tính capture="environment" để mở trực tiếp camera sau trên điện thoại.
- Tối ưu dung lượng ảnh trên trình duyệt (nén xuống dưới 1.5MB) trước khi đẩy lên FastAPI để tăng tốc độ truyền tải qua mạng 4G.
- Màn hình duyệt đơn của cán bộ phải hiển thị song song dữ liệu gốc và kết quả AI kèm nút chỉnh sửa nhanh trước khi phê duyệt.

## 3. Quy tắc Phối hợp Nhóm và Quản lý Dữ liệu
- Dữ liệu kiểm thử: Đội tạo đơn gửi ảnh qua Zalo bắt buộc chọn chế độ HD, hoặc gửi thẳng vào hộp thư Gmail dự án để kiểm thử luồng tự động.
- Quản lý tài liệu: Mọi cập nhật về văn bản luật và báo cáo 10 trang phải hoàn tất trước Ngày 8 để khớp với giao diện thực tế trên VPS.
- Đóng băng mã nguồn (Code Freeze): Chốt toàn bộ tính năng trên máy chủ Ubuntu VPS vào cuối Ngày 8, dành trọn Ngày 9 và Ngày 10 để kiểm thử chịu tải và quay video demo.
