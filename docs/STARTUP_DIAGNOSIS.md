# BÁO CÁO CHẨN ĐOÁN KHỞI ĐỘNG HỆ THỐNG (STARTUP DIAGNOSIS REPORT)
**Dự án**: Cổng Điều Phối Tiếp Nhận & Xử Lý Đơn Thư Công Dân AI Tỉnh Đồng Nai (DongNai Civic Router)  
**Ngày thực hiện**: 19/11/2026  
**Đơn vị thực hiện**: Ban Kiểm định & Đảm bảo Vận hành (Audit & DevOps Swarm Team)  
**Phạm vi**: Toàn diện 4 Tầng Hệ Thống (Trình duyệt, Tiến trình/Mạng, Máy chủ/CSDL, Tổng hợp Khắc phục)

---

## 1. KẾT LUẬN NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE CONCLUSION)

Qua quá trình rà soát và thu thập bằng chứng đa tầng độc lập giữa Browser QA, DevOps và Lead Auditor, chúng tôi xác định nguyên nhân sự cố người dùng không thể truy cập giao diện web hệ thống như sau:

1. **Xung đột tiến trình kép nghiêm trọng trên cổng 3000 (Critical Port Collision - Primary Root Cause)**:
   - Có **2 tiến trình Node.js (Vite)** đang cùng chiếm dụng cổng 3000 dưới hai phạm vi lắng nghe khác nhau:
     - **PID 21256** (`node.exe`): Lắng nghe trên `0.0.0.0:3000` (được chạy từ lệnh `vite --host 0.0.0.0`).
     - **PID 8660** (`node.exe`): Lắng nghe trên `127.0.0.1:3000` (được chạy với tham số `--host 127.0.0.1 --port 3000 --strictPort`).
   - **Cơ chế gây lỗi**: Ngăn xếp mạng TCP/IP của Windows ưu tiên định tuyến các kết nối đến `localhost` hoặc `127.0.0.1` vào tiến trình ràng buộc địa chỉ cụ thể (`127.0.0.1:3000` - PID 8660). Tuy nhiên, tiến trình PID 8660 bị treo ngầm (deadlock/zombie state): nó chấp nhận bắt tay TCP SYN nhưng không bao giờ phản hồi gói tin HTTP dữ liệu, khiến trình duyệt rơi vào trạng thái chờ vô hạn và kết thúc bằng lỗi **`net::ERR_CONNECTION_TIMED_OUT`**.
   - **Bằng chứng đối chứng**: Khi truy cập qua địa chỉ IP mạng nội bộ `http://192.168.100.174:3000` (bỏ qua binding 127.0.0.1 để đến `0.0.0.0:3000` của PID 21256), máy chủ phản hồi mã `200 OK` ngay lập tức.

2. **Lệch cấu hình cổng công bố giữa Script khởi chạy và Cấu hình dự án (Port Mismatch - Secondary Root Cause)**:
   - Script khởi chạy tự động `run.bat` hướng dẫn và thông báo người dùng truy cập vào cổng **`5173`** (`http://localhost:5173`).
   - Trong khi đó, tệp cấu hình thực tế `frontend/vite.config.js` lại đang thiết lập cứng `server.port = 3000`.
   - Kết quả: Khi người dùng làm theo hướng dẫn của `run.bat` truy cập `http://localhost:5173`, trình duyệt trả về lỗi **`net::ERR_CONNECTION_REFUSED`** do hoàn toàn không có tiến trình nào lắng nghe trên cổng 5173.

3. **Trạng thái Dịch vụ Backend & Cơ sở dữ liệu (Backend & Database Status - HEALTHY)**:
   - Dịch vụ Backend FastAPI (Port 8000) và Cơ sở dữ liệu Microsoft SQL Server 2025 Express (`SQLEXPRESS02`) hoàn toàn hoạt động bình thường, dữ liệu và API hoạt động trơn tru 100%.

---

## 2. BẰNG CHỨNG THỰC TẾ CHI TIẾT (CONCRETE EVIDENCE)

### 2.1. Tầng 1: Trình duyệt & Mạng (Browser & Network Diagnostics)
Được kiểm tra độc lập tự động bằng Playwright headless browser qua script Python:

| Địa chỉ URL kiểm thử | Mã lỗi / Trạng thái phản hồi | Network Request Failure | Browser Console Error | Nhận định kết quả |
| :--- | :--- | :--- | :--- | :--- |
| `http://localhost:3000` | **`net::ERR_CONNECTION_TIMED_OUT`** | `GET http://localhost:3000/` failed: `net::ERR_CONNECTION_TIMED_OUT` | *(Không có log do timeout trước khi nhận HTML)* | Treo kết nối do trúng PID 8660 (lắng nghe trên 127.0.0.1). |
| `http://127.0.0.1:3000` | **`net::ERR_CONNECTION_TIMED_OUT`** | `GET http://127.0.0.1:3000/` failed: `net::ERR_CONNECTION_TIMED_OUT` | *(Không có log do timeout)* | Tương tự localhost, kết nối bị giữ và hết thời gian chờ. |
| `http://localhost:5173` | **`net::ERR_CONNECTION_REFUSED`** | `GET http://localhost:5173/` failed: `net::ERR_CONNECTION_REFUSED` | *(Không có log do kết nối bị từ chối)* | Không có tiến trình lắng nghe trên cổng 5173. |
| `http://localhost:8000` | **`HTTP 404 Not Found`** | Trả về payload JSON `{"detail":"Not Found"}` | `Failed to load resource: the server responded with a status of 404 (Not Found)` | Backend chạy bình thường (FastAPI không định nghĩa route `/`). |
| `http://localhost:8000/docs` | **`HTTP 200 OK`** | Tải thành công Swagger UI UI docs | Zero errors | Swagger UI và các OpenAPI spec tải trơn tru. |
| `http://localhost:8000/health` | **`HTTP 200 OK`** | `{"status":"healthy","database":"connected"}` | Zero errors | Endpoint kiểm tra sức khỏe hệ thống đạt chuẩn. |

*Ảnh chụp màn hình chẩn đoán thực tế đã được lưu trữ tại*:
- Ảnh tổng hợp chẩn đoán lỗi: `test_screenshots/error_diagnosis.png`
- Chi tiết từng trang: `test_screenshots/localhost_3000.png`, `test_screenshots/127_0_0_1_3000.png`, `test_screenshots/localhost_5173.png`, `test_screenshots/localhost_8000.png`.

---

### 2.2. Tầng 2: Cổng & Xung đột Tiến trình (Port & Process Inspection)
Kiểm tra bằng lệnh hệ thống `netstat -ano` và WMI `Get-CimInstance Win32_Process`:

```text
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       21256
TCP    127.0.0.1:3000         0.0.0.0:0              LISTENING       8660
TCP    0.0.0.0:8000           0.0.0.0:0              LISTENING       16992
```

Chi tiết các tiến trình:
1. **PID 8660** (Tiến trình gây xung đột và treo):
   - Đường dẫn thực thi: `C:\Program Files\nodejs\node.exe`
   - Dòng lệnh khởi chạy: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 3000 --strictPort`
   - Trạng thái: Chiếm dụng binding `127.0.0.1:3000`, không phục vụ dữ liệu.
2. **PID 21256** (Tiến trình Vite hợp lệ):
   - Đường dẫn thực thi: `C:\Program Files\nodejs\node.exe`
   - Dòng lệnh khởi chạy: `vite --host 0.0.0.0`
   - Trạng thái: Lắng nghe trên `0.0.0.0:3000`. Khi truy cập qua IP LAN `192.168.100.174:3000`, trả về mã 200 và giao diện React tải đầy đủ.
3. **PID 16992** (Tiến trình Backend FastAPI):
   - Đường dẫn thực thi: `d:\Code\DauTruongAI\backend\venv\Scripts\python.exe`
   - Dòng lệnh khởi chạy: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
   - Trạng thái: Hoạt động ổn định, phục vụ API.

---

### 2.3. Tầng 3: Nhật ký lỗi, Cấu hình & Dịch vụ Cơ sở Dữ liệu (Server Logs & Database Diagnostics)

#### 1. Dịch vụ SQL Server & Chuỗi kết nối
- Dịch vụ Windows:
  - `MSSQLSERVER` (Bản mặc định): Trạng thái 1060 (Không cài đặt).
  - `MSSQL$SQLEXPRESS`: **STATE 4 RUNNING** (Đang chạy).
  - `MSSQL$SQLEXPRESS02`: **STATE 4 RUNNING** (Đang chạy).
- Chuỗi kết nối trong `backend/.env`:
  ```ini
  DATABASE_URL=mssql+pyodbc://@localhost\SQLEXPRESS02/DongNaiCivicDB?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes
  USE_SQLITE=False
  ```
- Kiểm tra truy vấn trực tiếp bằng SQLAlchemy:
  - Máy chủ: Microsoft SQL Server 2025 Express (`17.0.1000.7 - X64`).
  - Kiểm tra 6 bảng lõi cơ sở dữ liệu:
    1. `ticket_status_events` (Đã có sẵn dữ liệu lịch sử)
    2. `departments` (Đã đồng bộ đầy đủ 7 sở ban ngành)
    3. `users` (Đã khởi tạo đủ tài khoản cán bộ và công dân)
    4. `rag_docs` (Cơ sở tri thức RAG sẵn sàng)
    5. `tickets` (Bảng đơn thư)
    6. `ai_results` (Bảng phân tích AI)
  - Kết nối hoàn toàn thông suốt, không có lỗi timeout hay authentication.

#### 2. Cấu hình CORS & API Reverse Proxy
- `frontend/vite.config.js`:
  - Cấu hình proxy định tuyến: Mọi yêu cầu `/api` và `/uploads` được chuyển tiếp chính xác đến `http://127.0.0.1:8000`.
- `backend/main.py`:
  - Đã kích hoạt middleware `CORSMiddleware` với `allow_origins=["*"]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`.
- `frontend/.env`:
  - `VITE_API_URL=""` (Sử dụng đường dẫn tương đối để thông qua proxy Vite, cấu hình chuẩn).

---

## 3. PHƯƠNG ÁN KHẮC PHỤC TỪNG BƯỚC (STEP-BY-STEP FIX PROPOSAL)

> [!IMPORTANT]
> **Tuân thủ nguyên tắc an toàn vận hành**: Ban kiểm định **KHÔNG** tự ý thực thi các lệnh dừng tiến trình hoặc sửa đổi mã nguồn. Đề xuất này được lập thành văn bản để Người dùng/Quản trị viên xem xét và phê duyệt trước khi thực hiện.

### Bước 1: Dọn dẹp triệt để các tiến trình Node.js & Vite bị treo hoặc xung đột
Cần tiêu diệt cả hai tiến trình Node.js (PID 8660 và PID 21256) đang gây xung đột trên cổng 3000 để giải phóng hoàn toàn cổng mạng.

### Bước 2: Đồng bộ hóa thông tin cổng hiển thị trong kịch bản khởi chạy `run.bat`
Hiện tại `frontend/vite.config.js` cấu hình cổng `3000`, nhưng `run.bat` hiển thị thông báo truy cập cổng `5173`. Cần chỉnh sửa `run.bat` để phản ánh đúng cổng `3000`:
- Dòng 17: `echo [2/2] Đang khởi động Frontend React Vite (Port 3000)...`
- Dòng 23: `echo  - Cổng Công Dân & Bàn Làm Việc: http://localhost:3000`

### Bước 3: Khởi động lại hệ thống theo trình tự chuẩn hóa
Khởi chạy dịch vụ theo quy trình sạch để đảm bảo không bị xung đột tiến trình mồ côi (orphan process).

---

## 4. CÁC LỆNH KHỞI ĐỘNG LẠI CHÍNH XÁC (EXACT RESTART COMMANDS)

*Dành cho Quản trị viên/Người dùng thực thi sau khi phê duyệt*:

### Lựa chọn A: Sử dụng Kịch bản Tự động (Khuyến nghị)
Mở cửa sổ Command Prompt (CMD) hoặc PowerShell với quyền Administrator tại thư mục gốc dự án `d:\Code\DauTruongAI`:

```cmd
:: 1. Tắt toàn bộ tiến trình cũ đang xung đột
d:\Code\DauTruongAI\stop.bat

:: 2. Khởi động lại toàn bộ hệ thống
d:\Code\DauTruongAI\run.bat
```

Sau đó mở trình duyệt và truy cập: **`http://localhost:3000`**.

---

### Lựa chọn B: Thực thi Lệnh Thủ công Từng bước (Manual Execution)

#### 1. Dừng các tiến trình xung đột:
```cmd
taskkill /F /PID 8660 /T
taskkill /F /PID 21256 /T
```
*(Nếu muốn dọn sạch tất cả tiến trình Node và Python cũ)*:
```cmd
taskkill /F /IM node.exe /T
taskkill /F /IM uvicorn.exe /T
```

#### 2. Khởi động Backend (Cửa sổ Terminal 1):
```cmd
cd /d d:\Code\DauTruongAI\backend
venv\Scripts\activate.bat
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*Kiểm tra sức khỏe Backend*: Mở `http://localhost:8000/docs` hoặc `http://localhost:8000/health`.

#### 3. Khởi động Frontend (Cửa sổ Terminal 2):
```cmd
cd /d d:\Code\DauTruongAI\frontend
npm run dev
```

#### 4. Xác nhận kết quả trên Trình duyệt:
- Cổng giao diện người dùng: **`http://localhost:3000`** (hoặc `http://127.0.0.1:3000`).
- Giao diện tiếp nhận phản ánh công dân và bảng điều khiển cán bộ tiếp nhận sẽ hiển thị sẵn sàng.

---
*Báo cáo được hoàn thành và đối soát bởi @lead-auditor.*
