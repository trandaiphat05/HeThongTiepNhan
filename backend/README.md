# PHÂN HỆ MÁY CHỦ DỊCH VỤ (BACKEND FASTAPI)
## HỆ THỐNG TIẾP NHẬN & ĐIỀU PHỐI ĐƠN THƯ THÔNG MINH – TỈNH ĐỒNG NAI
> **Kiến trúc Modular Clean Architecture • Tích hợp Google Gemini Flash Multimodal • Semantic RAG • MS SQL Server 2025 Express**

---

## 🏗️ 1. CẤU TRÚC THƯ MỤC PHÂN HỆ BACKEND

```text
backend/
├── app/
│   └── api/
│       └── deps.py                 # Dependencies phân quyền và CSDL chung
├── core/
│   ├── config.py                   # Nạp biến môi trường từ .env (dotenv) & cài đặt hệ thống
│   ├── database.py                 # Khởi tạo kết nối SQLAlchemy Engine & SessionLocal
│   └── deps.py                     # Tiện ích trích xuất người dùng từ JWT Token
├── modules/
│   ├── ai_engine/
│   │   ├── agent.py                # Định nghĩa System Prompt & Agent Triage tỉnh Đồng Nai
│   │   └── ai_service.py           # Dịch vụ gọi Gemini REST API, nén ảnh RAM & Safe Keyword Fallback
│   ├── auth/
│   │   ├── models.py               # Bảng Users (băm mật khẩu Bcrypt, phân quyền RBAC)
│   │   ├── router.py               # Tuyến API /api/auth (login, register, me, approve)
│   │   ├── schemas.py              # Pydantic Schemas đăng nhập và đăng ký
│   │   └── service.py              # Logic xác thực và phát hành JWT Token
│   ├── database/
│   │   ├── connection.py           # Quản lý kết nối MS SQL Server & SQLite
│   │   └── models.py               # Lược đồ ORM: Departments, Users, Tickets, AI_Results, RAG_Docs
│   ├── notifications/
│   │   ├── email_worker.py         # Daemon chạy ngầm quét Gmail công vụ qua IMAP SSL mỗi 60s
│   │   ├── router.py               # API kiểm tra trạng thái dịch vụ email
│   │   └── service.py              # Dịch vụ gửi email phản hồi kết quả qua SMTP TLS
│   ├── rag/
│   │   ├── router.py               # Tuyến API /api/rag (danh mục luật, thêm mới, nạp lại tri thức)
│   │   ├── service.py              # Logic bóc tách tài liệu (PDF, Word, Text) & tìm kiếm ngữ nghĩa
│   │   └── vector_store.py         # Bộ nhớ lưu trữ Vector & thuật toán xếp hạng liên quan
│   └── tickets/
│       ├── models.py               # Bảng Tickets & Bảng AI_Results
│       ├── router.py               # Tuyến API /api/tickets (submit, list, detail, approve, reassign)
│       ├── schemas.py              # Pydantic Schemas dữ liệu đơn thư và kết quả phân loại
│       └── service.py              # Xử lý tiếp nhận, sinh mã ĐN-YYYYMMDD-XXXX, cập nhật trạng thái
├── uploads/                        # Thư mục lưu trữ hình ảnh hiện trường được mã hóa tên tệp
├── .env.example                    # Tệp mẫu biến môi trường
├── main.py                         # Điểm vào chính của FastAPI (CORS, Routers, Lifespan Startup)
├── requirements.txt                # Danh mục thư viện Python phụ thuộc
├── seed_demo_tickets.py            # Kịch bản nạp dữ liệu đơn thư mẫu cho 8 Sở/Ngành
└── test_demo_readiness.py          # Kịch bản kiểm thử độ sẵn sàng các thành phần Backend
```

---

## ⚙️ 2. CÀI ĐẶT & CẤU HÌNH BIẾN MÔI TRƯỜNG

### Bước 1: Chuẩn bị môi trường ảo Python
Khuyến nghị sử dụng Python 3.10 trở lên (hỗ trợ tốt nhất trên Python 3.12 hoặc 3.14):
```powershell
cd D:\Code\DauTruongAI\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Bước 2: Thiết lập file `backend/.env`
Sao chép từ file mẫu:
```powershell
copy .env.example .env
```
Nội dung file `.env`:
```ini
# Khóa Gemini AI (Lấy từ Google AI Studio hoặc Vertex AI)
GEMINI_API_KEY=AIzaSy... (hoặc AQ.Ab8RN...)

# Chuỗi kết nối MS SQL Server (Để trống nếu muốn dùng SQLite tự động)
# SQL_SERVER_CONNECTION_STRING=DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost\SQLEXPRESS02;DATABASE=DongNaiCivicDB;Trusted_Connection=yes;TrustServerCertificate=yes;

# Cấu hình bảo mật JWT Token
SECRET_KEY=dongnai-civic-router-super-secret-key-2026-production-ready
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Cấu hình Hòm thư công vụ (Tùy chọn)
GMAIL_USER=tiepnhandonthu.dongnai@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

---

## 🚀 3. KHỞI CHẠY MÁY CHỦ FASTAPI

Chạy lệnh uvicorn trong môi trường ảo:
```powershell
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- Khi máy chủ khởi động thành công:
  - API Gateway lắng nghe tại: `http://localhost:8000`
  - Swagger UI tương tác: `http://localhost:8000/docs`
  - ReDoc tài liệu mở rộng: `http://localhost:8000/redoc`
  - Điểm kiểm tra Health check: `http://localhost:8000/health`

---

## 📡 4. DANH MỤC API ENDPOINTS CHÍNH

### Phân hệ Xác thực & Quản trị Người dùng (`/api/auth`)
| Phương thức | Đường dẫn Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Public | Đăng nhập hệ thống, cấp mã định danh JWT Token (HS256) |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản Công dân mới (kích hoạt tự động) hoặc Cán bộ |
| `GET` | `/api/auth/me` | Đã đăng nhập | Lấy thông tin tài khoản hiện tại, vai trò (Role) và đơn vị (Dept) |
| `GET` | `/api/auth/users` | `ADMIN` | Lấy danh sách toàn bộ người dùng trong hệ thống |
| `PUT` | `/api/auth/users/{user_id}/approve` | `ADMIN` | Phê duyệt tài khoản Cán bộ và phân bổ về Sở chuyên trách |

### Phân hệ Tiếp nhận & Xử lý Đơn thư (`/api/tickets`)
| Phương thức | Đường dẫn Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/tickets/submit` | Public / Citizen | Nộp đơn phản ánh mới (hỗ trợ multipart nạp nhiều ảnh), gọi AI định tuyến |
| `GET` | `/api/tickets` | `OFFICER`, `ADMIN` | Lấy danh sách hồ sơ (hỗ trợ lọc theo Sở, trạng thái, mức ưu tiên, từ khóa) |
| `GET` | `/api/tickets/{tracking_code}` | Public / Citizen | Tra cứu thông tin chi tiết và hành trình 4 bước theo mã hồ sơ |
| `GET` | `/api/citizen/my-tickets` | `CITIZEN` | Lấy toàn bộ danh sách đơn thư do tài khoản công dân hiện tại đã gửi |
| `PUT` | `/api/tickets/{ticket_id}/approve` | `OFFICER`, `ADMIN` | Cán bộ phê duyệt văn bản trả lời chuẩn Nghị định 30, kích hoạt gửi email |
| `PUT` | `/api/tickets/{ticket_id}/reassign` | `OFFICER`, `ADMIN` | Điều chuyển hồ sơ sang Sở khác khi sai thẩm quyền, lưu vết `admin_note` |
| `GET` | `/api/admin/metrics` | `ADMIN` | Trích xuất 6 chỉ số KPI tiếp nhận và biểu đồ phân bổ Sở toàn tỉnh |
| `PUT` | `/api/admin/tickets/{ticket_id}/dispatch` | `ADMIN` | Quản trị viên chỉ định Sở thụ lý cho các hồ sơ ngoại lệ (`HUMAN_REVIEW`) |
| `PUT` | `/api/admin/tickets/{ticket_id}/spam` | `ADMIN` | Đánh dấu hồ sơ là thư rác hoặc nội dung phá hoại |

### Phân hệ Kho Tri thức Pháp luật RAG (`/api/rag`)
| Phương thức | Đường dẫn Endpoint | Quyền hạn | Mô tả chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/rag/docs` | Public / Authenticated | Lấy danh mục các văn bản quy phạm pháp luật địa phương |
| `POST` | `/api/rag/docs` | `ADMIN` | Bổ sung văn bản quy chuẩn pháp luật mới vào kho tri thức |
| `POST` | `/api/rag/reload` | `ADMIN` | **Hot Reload RAG:** Nạp lại dữ liệu tri thức vào RAM mà không cần restart server |

---

## 🧠 5. CƠ CHẾ LÕI AI & DỰ PHÒNG SAFE KEYWORD FALLBACK

1. **Multimodal Gemini Flash Call:**
   - Sử dụng thư viện chuẩn của Google với giao thức REST (`transport="rest"`), triệt tiêu sự cố nghẽn gRPC trên Windows.
   - Nén ảnh đa trang trực tiếp trong RAM bằng `Pillow`, giới hạn độ phân giải `1600x1600` và chất lượng 80%, giảm dung lượng truyền tải trên 85%.
   - Ép kiểu phản hồi JSON cấu trúc chuẩn với Pydantic model `TicketRoutingResult`.
2. **Safe Keyword Fallback 8 Sở:**
   - Khi mạng mất kết nối hoặc API Gemini gặp sự cố, hệ thống tự động kích hoạt hàm `classify_complaint_fallback()`.
   - Thuật toán chấm điểm trọng số từ khóa chuyên ngành phân định chính xác vào đúng 1 trong 8 đơn vị:
     - `SO_GTVT`: Giao thông, ổ gà, kẹt xe, cầu cống, xe khách, đèn tín hiệu.
     - `SO_TNMT`: Môi trường, rác thải, ô nhiễm, xả thải, sổ đỏ, đất đai.
     - `SO_XD`: Xây dựng, lấn chiếm vỉa hè, sụp lún, quy hoạch, giấy phép xây dựng.
     - `SO_YTE`: Bệnh viện, ngộ độc thực phẩm, phòng khám tư nhân, dịch bệnh.
     - `SO_GDDT`: Trường học, học phí, lạm thu, tuyển sinh, bạo lực học đường.
     - `SO_LDTBXH`: Lương, nợ BHXH, tranh chấp lao động, công nhân KCN.
     - `CONG_AN_TINH`: An ninh trật tự, trộm cắp, đua xe, đánh bạc, tiếng ồn đêm.
     - `UBND_CAP_HUYEN`: Ban Tiếp công dân Tỉnh, chứng thực, hộ tịch, hòa giải cơ sở.
   - Luôn tự động gán trích dẫn luật liên quan và tạo sẵn văn bản phản hồi hành chính, đảm bảo tiến trình tiếp nhận không bao giờ bị gián đoạn.

---

## 🧪 6. KỊCH BẢN KIỂM THỬ & DỮ LIỆU MẪU

Trong thư mục `backend/` có sẵn các script hữu ích:
```powershell
# Nạp dữ liệu đơn thư mẫu phong phú cho 8 Sở/Ngành
python seed_demo_tickets.py

# Kiểm thử độc lập khả năng đọc hiểu & định tuyến của AI Agent
python test_agent.py

# Kiểm tra độ sẵn sàng của toàn bộ cấu hình GovTech Backend
python test_demo_readiness.py
```
