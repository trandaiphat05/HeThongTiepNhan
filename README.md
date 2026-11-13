# HỆ THỐNG TIẾP NHẬN & ĐIỀU PHỐI ĐƠN THƯ - UBND TỈNH ĐỒNG NAI
> **Cổng Dịch Vụ Công & Nền Tảng Điều Phối Đơn Thư Thông Minh Ứng Dụng Trí Tuệ Nhân Tạo**

Hệ thống được thiết kế theo tiêu chuẩn Cổng Hành chính công Việt Nam, phục vụ tiếp nhận, tự động phân luồng, đối chiếu pháp lý và hỗ trợ soạn thảo văn bản phản hồi đơn thư phản ánh, kiến nghị của tổ chức, công dân trên địa bàn tỉnh Đồng Nai.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios (Kiến trúc Module hóa, tương thích mở rộng Next.js).
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic, SQLAlchemy ORM.
- **Cơ sở dữ liệu**: SQLite (khởi chạy nhanh cục bộ) / Microsoft SQL Server 2025 Express (Doanh nghiệp).
- **Lõi AI & RAG**: Google Gemini Flash, Hệ thống RAG truy xuất kho tri thức pháp luật tỉnh Đồng Nai.
- **Tự động hóa Email**: Background Worker tích hợp giao thức IMAP/SMTP tiếp nhận và phản hồi email tự động.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (3 Bước)

### Bước 1: Chuẩn bị cấu hình biến môi trường
1. Sao chép file cấu hình mẫu ở thư mục gốc hoặc trong từng phân hệ:
   ```bash
   cp .env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Mở file `backend/.env` và điền `GEMINI_API_KEY` (và thông tin Gmail nếu muốn thử nghiệm tính năng đồng bộ hòm thư tự động). Mặc định hệ thống sử dụng SQLite `dongnai_civic.db` không cần cài đặt SQL Server.

---

### Bước 2: Cài đặt và khởi chạy Backend (Cổng 8000)
```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo và kích hoạt môi trường ảo (tùy chọn)
python -m venv venv
# Trên Windows:
.\venv\Scripts\activate
# Trên Linux/macOS:
source venv/bin/activate

# Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt

# Khởi chạy máy chủ FastAPI
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
> Máy chủ API hoạt động tại: `http://localhost:8000` (Tài liệu Swagger UI: `http://localhost:8000/docs`).

---

### Bước 3: Cài đặt và khởi chạy Frontend (Cổng 3000)
Mở một cửa sổ Terminal mới:
```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt thư viện Node.js
npm install

# Khởi chạy giao diện phát triển
npm run dev
```
> Truy cập Cổng Dịch vụ công tại: `http://localhost:3000`.

*(Mẹo: Trên hệ điều hành Windows, bạn cũng có thể nhấp đúp vào file `run.bat` hoặc `run_dev.bat` ở thư mục gốc để khởi động tự động cả hai phân hệ).*

---

## 👥 Danh Sách Tài Khoản Kiểm Thử Nghiệp Vụ

Hệ thống đã tích hợp sẵn cơ chế kiểm tra phân quyền (RBAC) nghiêm ngặt với các tài khoản thử nghiệm sau:

| Vai trò | Tên đăng nhập | Mật khẩu | Phạm vi quyền hạn & Chức năng |
| :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin` | `admin123` | Quản trị toàn hệ thống, phê duyệt tài khoản Cán bộ, cấu hình tham số AI, thống kê KPI |
| **Cán bộ Sở GTVT** | `canbo_gtvt` | `officer123` | Bàn làm việc cán bộ, thẩm định & trả lời phản ánh lĩnh vực Giao thông Vận tải |
| **Cán bộ Sở Xây dựng** | `canbo_soxd` | `officer123` | Bàn làm việc cán bộ, thẩm định & trả lời phản ánh lĩnh vực Quy hoạch / Xây dựng |
| **Cán bộ Một cửa** | `canbo_motcua` | `officer123` | Bàn làm việc Một cửa cấp tỉnh, chuyển tuyến & phân loại phản ánh |
| **Công dân** | `congdan1` | `citizen123` | Cổng nộp phản ánh trực tuyến, quản lý lịch sử đơn, tra cứu tiến độ hồ sơ |

---

## 🏛️ Điểm Nổi Bật Về Nghiệp Vụ Hành Chính Công

1. **Chuẩn mực giao diện**: Tuân thủ hướng dẫn thiết kế Cổng Dịch vụ công Quốc gia (màu xanh hành chính `#1E3A8A`, viền xám trang nhã `#E2E8F0`, typography rõ ràng, trang trọng).
2. **Quy trình tiếp nhận đa kênh**: Hỗ trợ nộp đơn qua Web trực tuyến và tự động đồng bộ qua Hòm thư công vụ (`tiepnhandonthu@dongnai.gov.vn`).
3. **Phân luồng & Hỗ trợ soạn thảo tự động (AI-Assisted)**: Tự động trích xuất thực thể, đề xuất cơ quan thụ lý, tra cứu căn cứ pháp lý áp dụng và lập dự thảo văn bản trả lời đúng thể thức quy định.
4. **Bảo mật & Phân quyền**: Token JWT xác thực tập trung, kiểm soát truy cập phân tầng giữa Công dân, Cán bộ nghiệp vụ và Quản trị viên.
