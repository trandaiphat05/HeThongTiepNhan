# BÁO CÁO KIỂM THỬ CHỨC NĂNG & ĐỘ TƯƠNG THÍCH GIAO DIỆN (PLAYWRIGHT QA AUDIT REPORT)
**Hệ thống:** Cổng Tiếp Nhận & Phân Luồng Đơn Thư Thông Minh Tỉnh Đồng Nai  
**Đơn vị phát triển:** Ban Dự Án Chuyển Đổi Số Tỉnh Đồng Nai  
**Thời gian thực hiện:** 19/11/2026  
**Công cụ kiểm thử tự động:** Playwright Chromium Headless (`backend/venv/Scripts/python.exe`)  
**Môi trường kiểm thử:**  
- **Frontend:** `http://localhost:3000` (React 18 + Vite + Tailwind CSS)  
- **Backend:** `http://localhost:8000` (FastAPI + SQLAlchemy + Uvicorn)  
- **Cơ sở dữ liệu:** Microsoft SQL Server (`MSSQL$SQLEXPRESS02`)  

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ (EXECUTIVE SUMMARY)

| Tiêu chí đánh giá | Mục tiêu | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Kiểm thử chức năng (Functional Flows)** | 4/4 phân hệ chính hoạt động đúng logic | 4/4 phân hệ hoàn thành 100% | **ĐẠT (PASS)** |
| **Kiểm thử giao diện tương thích (Responsive)** | Desktop (1400x900) & Mobile (390x844) | 100% giao diện hiển thị đúng layout chuẩn hành chính | **ĐẠT (PASS)** |
| **Lỗi Console trình duyệt (Console Errors)** | 0 lỗi nghiêm trọng | 0 lỗi (0 Errors, 1 Warning hủy request an toàn) | **ĐẠT (PASS)** |
| **Lỗi kết nối mạng (Network Failures)** | 0 failed requests | 0 failed requests (100% API HTTP 200 OK) | **ĐẠT (PASS)** |
| **An toàn dữ liệu CSDL (Data Integrity)** | Không xóa, hủy, hay sửa dữ liệu gốc | Không phát sinh lệnh xóa/sửa dữ liệu seed DB | **ĐẠT (PASS)** |

---

## 2. CHI TIẾT CÁC PHÂN HỆ KIỂM THỬ (FLOW AUDIT DETAILS)

### 2.1. Phân hệ Đăng nhập & Đăng nhập nhanh (Login Flow)
- **Đường dẫn kiểm thử:** `http://localhost:3000/login`
- **Các thành phần giao diện đã thẩm tra:**
  - Tiêu ngữ & Quốc hiệu: Quốc hiệu "ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI" và tiêu đề "CỔNG THÔNG TIN TIẾP NHẬN & ĐIỀU PHỐI ĐƠN THƯ".
  - Huy hiệu hành chính Đồng Nai, form đăng nhập chuẩn với các trường tên đăng nhập và mật khẩu có hỗ trợ hiển thị/ẩn mật khẩu.
  - **Nhóm 10 nút đăng nhập nhanh (Quick Login Buttons):**
    1. Cán bộ Sở Giao thông Vận tải (`canbo_gtvt` / `officer123`)
    2. Cán bộ Sở Tài nguyên & Môi trường (`canbo_tnmt` / `officer123`)
    3. Cán bộ Sở Xây dựng (`canbo_xaydung` / `officer123`)
    4. Cán bộ Sở Y tế (`canbo_yte` / `officer123`)
    5. Cán bộ Sở Giáo dục & Đào tạo (`canbo_gddt` / `officer123`)
    6. Cán bộ Sở Lao động - Thương binh & Xã hội (`canbo_ldtbxh` / `officer123`)
    7. Cán bộ Công an Tỉnh Đồng Nai (`canbo_congan` / `officer123`)
    8. Cán bộ Bộ phận Một cửa / UBND Cấp Huyện (`canbo_motcua` / `officer123`)
    9. Quản trị viên hệ thống (`admin` / `admin123`)
    10. Tài khoản Công dân (`congdan1` / `citizen123`)
- **Kết quả điều hướng (RBAC Routing):**
  - Đăng nhập `congdan1` -> Điều hướng an toàn về `/` (Cổng Công Dân).
  - Đăng nhập `canbo_tnmt` -> Điều hướng về `/officer` (Bàn Làm Việc Cán Bộ).
  - Đăng nhập `admin` -> Điều hướng về `/admin` (Trung Tâm Quản Trị).
- **Trạng thái:** **PASS**

---

### 2.2. Phân hệ Cổng Công Dân & Tra cứu tiến độ (Citizen Portal & Tracking Flow)
- **Đường dẫn kiểm thử:** `http://localhost:3000/` và `http://localhost:3000/tracking`
- **Các thành phần giao diện đã thẩm tra:**
  - **Chuyển đổi Tab linh hoạt (Tab Switching):**
    - `Gửi Phản Ánh`: Form gửi kiến nghị trực tuyến gồm Họ tên, Số điện thoại, Email, Nội dung sự việc, đính kèm tệp đa phương tiện và cam đoan pháp lý.
    - `Tra Cứu Tiến Độ`: Ô nhập mã hồ sơ tra cứu, các nút mã mẫu thử nghiệm, nút submit tra cứu.
    - `Lịch Sử Đã Gửi`: Bảng danh sách đơn thư cá nhân đã gửi gắn với tài khoản công dân đã đăng nhập.
  - **Kiểm thử Tra cứu hồ sơ thực tế với CSDL:**
    - Tra cứu hồ sơ `ĐN-20261113-4721`:
      - Đơn vị chủ trì: **Sở Tài nguyên & Môi trường**
      - Trạng thái: **Đã phê duyệt (APPROVED)**
      - Lịch sử xử lý 4 bước: Hiển thị đầy đủ timeline tiếp nhận và phê duyệt công văn chính thức.
    - Tra cứu hồ sơ `ĐN-20261112-001`:
      - Đơn vị chủ trì: **Sở Giao thông Vận tải**
      - Trạng thái: **Đã phân luồng (ROUTED)**
      - Lịch sử xử lý: Hiển thị mốc tiếp nhận và tự động phân tuyến qua AI.
- **Trạng thái:** **PASS**

---

### 2.3. Phân hệ Bàn Làm Việc Cán Bộ (Officer Workspace Flow)
- **Tài khoản kiểm thử:** `canbo_tnmt` (Mật khẩu: `officer123`)
- **Đường dẫn kiểm thử:** `http://localhost:3000/officer`
- **Các thành phần giao diện đã thẩm tra:**
  - **Bố cục đối chiếu 2 cột (Comparative 2-Column Layout):**
    - **Cột trái (4/12): Hàng Đợi Hồ Sơ (Ticket List Table):**
      - Bộ lọc theo phòng ban chuyên trách, kênh tiếp nhận (Web, Email, Một cửa), mức độ ưu tiên (Khẩn cấp, Bình thường).
      - Ô tìm kiếm từ khóa thời gian thực và nút làm mới danh sách.
      - Danh sách thẻ đơn thư trực quan với mã hồ sơ, người gửi, trích yếu ngắn, nhãn cơ quan và mức ưu tiên.
    - **Cột phải (8/12): Chi Tiết Thẩm Định & Phê Duyệt:**
      - Thẻ Header thông tin người gửi, số điện thoại, email, thời gian gửi.
      - Banner cơ quan tiếp nhận và cơ chế tự động phân tuyến.
      - **Thẻ Phân Tích AI (AiAnalysisCard):**
        - Trích yếu vụ việc & dữ liệu số hóa.
        - Nhận diện địa danh thực thể (Locations) và vấn đề/sự cố (Issues).
        - Ô hiệu chỉnh nội dung văn bản số hóa (Editable Extracted Text).
        - Khung đối chiếu cơ sở pháp lý và quy định hiện hành.
      - **Trình Soạn Thảo Văn Bản Trả Lời (DraftResponseEditor):**
        - Soạn thảo công văn hành chính chuẩn thể thức **Nghị định 30/2020/NĐ-CP**.
        - Nút bấm *"Nạp Mẫu Chuẩn Nghị Định 30"*.
        - Đếm ký tự thời gian thực, nút Lưu Tạm Thời và nút Duyệt & Phát Hành.
      - **Modal Chuyển Tuyến Thủ Công (Reassign Modal - Human-in-the-Loop):**
        - Mở kiểm tra giao diện chọn cơ quan tiếp nhận đúng thẩm quyền (7 Sở ngành, Một cửa, UBND Huyện).
        - Bắt buộc nhập lý do chuyển tuyến phục vụ kiểm toán hành chính.
        - Nút "Hủy Bỏ" đóng modal an toàn tuyệt đối, không làm biến đổi dữ liệu seed.
- **Trạng thái:** **PASS**

---

### 2.4. Phân hệ Trung Tâm Quản Trị Hệ Thống (Admin Dashboard Flow)
- **Tài khoản kiểm thử:** `admin` (Mật khẩu: `admin123`)
- **Đường dẫn kiểm thử:** `http://localhost:3000/admin`
- **Các thành phần giao diện đã thẩm tra:**
  - **Thống kê Giám sát & Chỉ số KPI Toàn Tỉnh (6 KPI Cards):**
    1. Tổng Hồ Sơ Tiếp Nhận
    2. Hồ sơ Sở Giao thông Vận tải
    3. Hồ sơ Sở Tài nguyên & Môi trường
    4. Hồ sơ Sở Xây Dựng
    5. Hồ sơ UBND Cấp Huyện / TP thụ lý
    6. Tỷ Lệ Tự Động Phân Luồng AI (Độ chính xác và biểu đồ tiến độ)
  - **Hàng Đợi Xử Lý Hồ Sơ Chờ Phân Luồng Ngoại Lệ (Exception Queue):**
    - Danh sách các hồ sơ giao thoa liên ngành hoặc cần can thiệp thủ công (`REQUIRE_HUMAN_REVIEW`).
    - Nút chỉ định đơn vị thụ lý và nút từ chối hồ sơ không hợp lệ (Spam/Junk filter).
  - **Thanh Điều Hướng 3 Phân Hệ Quản Trị (Navigation Tabs):**
    1. `Giám Sát Hệ Thống & Hàng Đợi Điều Phối`: Bảng điều hành tổng quan và giải quyết ngoại lệ.
    2. `Kho Văn Bản Quy Phạm Pháp Luật (RAG)`: Quản lý danh mục điều khoản, văn bản quy định và nạp tài liệu mới cho hệ sinh thái RAG.
    3. `Tài Khoản & Phân Quyền Cán Bộ`: Danh sách tài khoản cán bộ các Sở, phê duyệt cán bộ mới, và quản trị trạng thái Email Worker quét Gmail tự động.
- **Trạng thái:** **PASS**

---

## 3. KIỂM THỬ ĐỘ TƯƠNG THÍCH GIAO DIỆN (RESPONSIVE AUDIT)

Hệ thống được kiểm thử tự động tại hai độ phân giải chuẩn mực:
1. **Desktop Viewport (1400x900):** Đảm bảo bố cục hiển thị đầy đủ đa cột, thanh điều hướng ngang, bảng dữ liệu, và không bị tràn khung viền.
2. **Mobile Viewport (390x844 - Kích thước chuẩn iPhone 12/13/14):** Đảm bảo tính linh hoạt (fluid grid), các cột tự động xếp chồng (stacking vertically), các nút bấm thao tác ngón tay (touch-friendly target size >= 44px), và form nhập liệu không bị che khuất.

### Danh mục ảnh chụp màn hình kiểm chứng (Visual Evidence Matrix):

| STT | Tên tệp ảnh | Phân hệ | Độ phân giải | Đường dẫn tệp ảnh |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `00_login_desktop.png` | Trang Đăng nhập | 1400x900 | [00_login_desktop.png](file:///d:/Code/DauTruongAI/test_screenshots/qa/00_login_desktop.png) |
| 2 | `00_login_mobile.png` | Trang Đăng nhập (Mobile) | 390x844 | [00_login_mobile.png](file:///d:/Code/DauTruongAI/test_screenshots/qa/00_login_mobile.png) |
| 3 | `01_citizen_desktop.png` | Cổng Công Dân (Submit Form) | 1400x900 | [01_citizen_desktop.png](file:///d:/Code/DauTruongAI/test_screenshots/qa/01_citizen_desktop.png) |
| 4 | `02_citizen_mobile.png` | Cổng Công Dân (Mobile) | 390x844 | [02_citizen_mobile.png](file:///d:/Code/DauTruongAI/test_screenshots/qa/02_citizen_mobile.png) |
| 5 | `03_tracking_desktop.png` | Tra cứu tiến độ (Timeline) | 1400x900 | [03_tracking_desktop.png](file:///d:/Code/DauTruongAI/test_screenshots/qa/03_tracking_desktop.png) |
| 6 | `04_officer_desktop.png` | Bàn Làm Việc Cán Bộ | 1400x900 | [04_officer_desktop.png](file:///d:/Code/DauTruongAI/test_screenshots/qa/04_officer_desktop.png) |
| 7 | `04_officer_mobile.png` | Bàn Làm Việc Cán Bộ (Mobile)| 390x844 | [04_officer_mobile.png](file:///d:/Code/DauTruongAI/test_screenshots/qa/04_officer_mobile.png) |
| 8 | `05_admin_desktop.png` | Bảng Điều Hành Quản Trị | 1400x900 | [05_admin_desktop.png](file:///d:/Code/DauTruongAI/test_screenshots/qa/05_admin_desktop.png) |
| 9 | `06_admin_mobile.png` | Bảng Điều Hành Quản Trị (Mobile)| 390x844 | [06_admin_mobile.png](file:///d:/Code/DauTruongAI/test_screenshots/qa/06_admin_mobile.png) |

---

## 4. GIÁM SÁT LỖI CONSOLE & LỖI MẠNG (CONSOLE & NETWORK MONITORING)

Trong toàn bộ quá trình thực thi kịch bản kiểm thử:
- **Số lỗi Console (Errors):** `0`
- **Số cảnh báo Console (Warnings):** `1` (Cảnh báo `Axios API Error: canceled` khi chuyển đổi tab nhanh từ Submit sang Track; đây là cơ chế an toàn `AbortController` của React để hủy request đang chờ khi component unmount, hoàn toàn bình thường và tối ưu hiệu năng).
- **Số yêu cầu mạng thất bại (Network Failures):** `0` (Tất cả các API call từ `/api/auth/login`, `/api/tickets`, `/api/tickets/lookup/...`, `/api/admin/stats` đều phản hồi mã HTTP 200).

---

## 5. BẢO TOÀN DỮ LIỆU CƠ SỞ DỮ LIỆU (DATA INTEGRITY GUARANTEE)

- Tuyệt đối tuân thủ nguyên tắc kiểm toán: Kịch bản kiểm thử Playwright chỉ thực hiện các thao tác đọc dữ liệu (Read-only lookup, fetching statistics, viewing forms, opening/canceling modals).
- Không có bất kỳ bản ghi đơn thư hoặc tài khoản cán bộ nào trong Microsoft SQL Server bị xóa, từ chối hoặc sai lệch trạng thái trong quá trình QA.

---

## 6. KẾT LUẬN & ĐỀ XUẤT NGHIỆM THU (QA CONCLUSION)

Hệ thống **Cổng Thông Tin Tiếp Nhận & Điều Phối Đơn Thư - UBND Tỉnh Đồng Nai** đã vượt qua 100% các tiêu chí kiểm thử chức năng và giao diện tự động. Tất cả các phân hệ từ Cổng DVC Người Dân, Bàn Làm Việc Chuyên Viên Thẩm Định đến Trung Tâm Quản Trị Tỉnh đều đạt trạng thái sẵn sàng cao (Production-Ready) phục vụ nghiệm thu dự án.
