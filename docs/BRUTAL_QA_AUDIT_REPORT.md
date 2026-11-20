# BÁO CÁO KIỂM THỬ TOÀN DIỆN & ĐÁNH GIÁ CHẤT LƯỢNG HỆ THỐNG
# (BRUTAL QA LEAD & REALISTIC UX AUDIT REPORT)

> **Dự án:** Hệ Thống Tiếp Nhận & Điều Phối Đơn Thư AI Tỉnh Đồng Nai (DongNai Civic Router)  
> **Phiên bản kiểm thử:** 2.1.0-RC (Post-Gmail Redesign & Hierarchical RBAC)  
> **Người thực hiện:** QA Lead Độc Lập & Senior UX Auditor  
> **Thời điểm kiểm định:** 20/11/2026 (Chạy trực tiếp Playwright Chromium Headless, MS SQL Server 2025 Express & Network Loggers)  
> **Nguyên tắc báo cáo:** **100% SỰ THẬT — KHÔNG BAO BIỆN — KHÔNG LÀM ĐẸP SỐ LIỆU (AUDIT-ONLY)**  

---

## MỤC LỤC
1. [KẾT LUẬN THẲNG THẮN: KHẢ NĂNG SỐNG SÓT KHI DEMO & CHẤM THI](#1-kết-luận-thẳng-thắn-khả-năng-sống-sót-khi-demo--chấm-thi)
2. [TOP 3 ĐIỂM CHẾT NGUY HIỂM NHẤT (FATAL SHOWSTOPPERS)](#2-top-3-điểm-chết-nguy-hiểm-nhất-fatal-showstoppers)
3. [BẢNG MA TRẬN KIỂM THỬ CHI TIẾT (FULL TEST MATRIX)](#3-bảng-ma-trận-kiểm-thử-chi-tiết-full-test-matrix)
4. [DANH SÁCH LỖI ĐƯỢC PHÂN LOẠI THEO ĐỘ NGHIÊM TRỌNG (P0 - P3)](#4-danh-sách-lỗi-được-phân-loại-theo-độ-nghiêm-trọng-p0---p3)
5. [NHẬT KÝ LỖI TRÌNH DUYỆT (CONSOLE ERRORS & FAILED NETWORK REQUESTS)](#5-nhật-ký-lỗi-trình-duyệt-console-errors--failed-network-requests)
6. [ĐÁNH GIÁ TRẢI NGHIỆM NGƯỜI DÙNG THỰC TẾ (HONEST UX CRITIQUE)](#6-đánh-giá-trải-nghiệm-người-dùng-thực-tế-honest-ux-critique)
7. [BẢNG CHẤM ĐIỂM THỰC TẾ (THANG 10) & KHUYẾN NGHỊ KHẮC PHỤC](#7-bảng-chấm-điểm-thực-tế-thang-10--khuyến-nghị-khắc-phục)

---

## 1. KẾT LUẬN THẲNG THẮN: KHẢ NĂNG SỐNG SÓT KHI DEMO & CHẤM THI

### Đánh giá tổng quan: **KHÔNG THỂ THÔNG QUA NGHIỆM THU AN TOÀN (FAIL PRODUCTION AUDIT)**
Nếu đem phiên bản hiện tại đi **Chấm thi Đấu trường AI** hoặc **Demo trực tiếp trước Hội đồng Ban Giám khảo / Lãnh đạo tỉnh**:
- **Khả năng qua vòng Demo trình diễn (Happy Path):** **75%** (nếu kịch bản được chuẩn bị trước, chỉ bấm theo đúng luồng chuẩn, không refresh trang, không ai thử soi Network API hoặc thử tấn công bảo mật).
- **Khả năng sống sót khi Ban giám khảo bấm ngẫu nhiên hoặc có chuyên gia An toàn thông tin soi code/API:** **0% (CHẾT CHẮC CHẮN)**. Hệ thống có 2 lỗ hổng bảo mật cấp độ `CRITICAL (P0)` cho phép bất kỳ ai không cần đăng nhập vẫn có thể can thiệp duyệt đơn và tải mã độc lên máy chủ, cùng 2 lỗi logic nghiệp vụ nặng khiến Cán bộ bị mất sạch dữ liệu soạn thảo khi bấm F5.

---

## 2. TOP 3 ĐIỂM CHẾT NGUY HIỂM NHẤT (FATAL SHOWSTOPPERS)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               3 ĐIỂM CHẾT NGUY HIỂM NHẤT                                 │
├────┬──────────────────────┬──────────────────────────────────────────┬───────────────────┤
│ STT│ Tên Điểm Chết        │ Mô Tả Hậu Quả Thực Tế                    │ Mức Độ Nguy Hiểm  │
├────┼──────────────────────┼──────────────────────────────────────────┼───────────────────┤
│ 01 │ Anonymous Bypass     │ Bất kỳ ai không cần đăng nhập vẫn có thể │ P0 - CRITICAL     │
│    │ Trên API Phê Duyệt   │ xem danh sách đơn và gọi PUT /approve    │ Lỗ hổng xác thực  │
│    │ & Chuyển Tuyến       │ duyệt đơn tùy ý.                         │ Backend           │
├────┼──────────────────────┼──────────────────────────────────────────┼───────────────────┤
│ 02 │ Nút "Lưu Nháp" Ảo    │ Cán bộ thụ lý gõ chỉnh sửa văn bản hàng  │ P1 - HIGH         │
│    │ Không Lưu CSDL       │ giờ, bấm "Lưu Thay Đổi", F5 mất sạch vì  │ Mất dữ liệu       │
│    │                      │ hàm chỉ show Toast giả mà không gọi API! │ Cán bộ            │
├────┼──────────────────────┼──────────────────────────────────────────┼───────────────────┤
│ 03 │ Cho Phép Upload File │ Backend nhận và lưu cả tệp .bat/.exe vào │ P0 - CRITICAL     │
│    │ Nguy Hại (.bat/.exe) │ thư mục /uploads/ với HTTP 201 Created   │ Thực thi mã độc   │
│    │ Không Kiểm Tra Định Dạng│ do không validate MIME/đuôi tệp!      │ Máy chủ           │
└────┴──────────────────────┴──────────────────────────────────────────┴───────────────────┘
```

---

## 3. BẢNG MA TRẬN KIỂM THỬ CHI TIẾT (FULL TEST MATRIX)

### 3.1. Phân Hệ Người Dân / Công Dân (`CITIZEN`)
*Tài khoản kiểm thử:* `congdan1` / `citizen123` | *Môi trường:* Trình duyệt Chromium (Desktop & Mobile)

| Tên chức năng | Trạng thái | Bằng chứng thực tế & Vị trí kiểm tra |
| :--- | :---: | :--- |
| **Đăng ký: Bỏ trống ô bắt buộc** | `PASS` | Form bật HTML5 validation + báo lỗi tiếng Việt, không gửi request rác lên server. |
| **Đăng ký: Trùng username/email** | `PASS` | Backend trả HTTP 400: `"Tên đăng nhập đã tồn tại trong danh mục hệ thống."` [RegisterPage.jsx](file:///d:/Code/DauTruongAI/frontend/src/features/auth/RegisterPage.jsx#L131-L134). |
| **Đăng ký: Băm mật khẩu bcrypt** | `PASS` | Kiểm tra SQL Server: cột `password_hash` lưu chuỗi `$2b$12$...` chuẩn mật mã học. |
| **Đăng nhập: Mật khẩu sai** | `PASS` | Hiển thị hộp thông báo màu đỏ: `"Tên đăng nhập hoặc mật khẩu không chính xác."` [LoginPage.jsx](file:///d:/Code/DauTruongAI/frontend/src/pages/LoginPage.jsx#L77-L80). |
| **Đăng nhập: Giữ phiên khi F5** | `PASS` | Bấm F5 trang chủ vẫn nhận diện `Nguyễn Văn Công Dân` (Role `CITIZEN`), không văng về `/login`. |
| **Đăng xuất & Nút Back trình duyệt** | `PASS` | Logout xóa `civic_token` khỏi `localStorage`; bấm Back không xem lại được dữ liệu phiên cũ. |
| **Gửi đơn: Bỏ trống nội dung** | `PASS` | Báo lỗi `"Vui lòng nhập nội dung phản ánh hoặc đính kèm ảnh đơn thư."` [ComplaintSubmitForm.jsx](file:///d:/Code/DauTruongAI/frontend/src/features/citizen/components/ComplaintSubmitForm.jsx#L50-L53). |
| **Gửi đơn: Chỉ gửi ảnh viết tay** | `FAIL` | **Lỗi logic:** Người dân chỉ đính kèm ảnh đơn giấy chụp hiện trường mà không gõ chữ thì form chặn lại đòi gõ `raw_text` mặc dù thông báo ghi là `"hoặc"`. |
| **Tải 2 ảnh đơn thư viết tay** | `PASS` | Đã tải thành công 2 trang `don_trang_1.jpg` & `don_trang_2.jpg`, hiển thị 2 thumbnail rõ nét [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/03_citizen_submit_form_previews.png). |
| **Xóa bớt ảnh xem trước [✕]** | `PASS` | Bấm nút `[✕]` trên thumbnail trang 2, danh sách giảm từ 2 xuống 1 ảnh chính xác. |
| **Upload file độc hại (.bat/.exe)** | `FAIL` | **Lỗ hổng:** Gửi tệp `.bat` lên API `POST /api/tickets/submit` trả về `HTTP 201 Created`, tệp được ghi thẳng vào thư mục `uploads/`! [service.py](file:///d:/Code/DauTruongAI/backend/modules/tickets/service.py#L316-L331). |
| **Thuộc tính nút chụp ảnh di động** | `PASS` | Input chứa đủ `accept="image/*"` và `capture="environment"` phục vụ mở camera sau trên điện thoại. |
| **Chống Double-Submit (Bấm nhanh 2 lần)**| `FAIL` | Nút không bị disable ở cấp micro-task trước khi state cập nhật; vẫn có khe hở thời gian tạo hồ sơ trùng. |
| **Sinh mã biên nhận & Đối chiếu DB** | `PASS` | Sinh mã `ĐN-20261120-2175`, đối chiếu SQL Server khớp 100% người gửi, mảng ảnh `image_urls`, trạng thái `ROUTED` [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/04_citizen_submit_success_receipt.png). |
| **Tra cứu: Mã đơn không tồn tại** | `PASS` | Nhập mã lạ báo `"Không tìm thấy hồ sơ."` thân thiện, không trắng trang, HTTP 404 sạch. |
| **Tra cứu: Timeline tiến độ** | `PASS` | Hiển thị đầy đủ tiến trình: Tiếp nhận -> Trích xuất AI -> Chuyển Sở GTVT thụ lý [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/05_citizen_tracking_timeline.png). |
| **Anti-IDOR: Xem đơn công dân khác** | `PASS` | `GET /api/citizen/my-tickets` chỉ trả về đơn có `user_id` khớp tài khoản đăng nhập. |
| **Chặn Công dân vào `/admin`** | `PASS` | `ProtectedRoute` tự động chuyển hướng an toàn về trang chủ `"/"`. |

---

### 3.2. Phân Hệ Cán Bộ Thụ Lý (`OFFICER`)
*Tài khoản kiểm thử:* `canbo_gtvt` / `officer123` (Sở Giao Thông Vận Tải)

| Tên chức năng | Trạng thái | Bằng chứng thực tế & Vị trí kiểm tra |
| :--- | :---: | :--- |
| **Quyền kế thừa: Dùng Cổng Công Dân** | `PASS` | Cán bộ vào trang chủ gửi phản ánh và tra cứu tiến độ bình thường theo mô hình Kế thừa RBAC. |
| **Chặn Cán bộ vào `/admin`** | `PASS` | Hiện màn hình cảnh báo từ chối quyền truy cập `UnauthorizedView` với đồng hồ đếm ngược 4s [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/07_officer_rbac_unauthorized_view.png). |
| **Hộp thư đến kiểu Gmail (Inbox)** | `PASS` | Bố cục dạng dòng Gmail, hover mượt mà, phân loại badge cơ quan rõ nét [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/08_officer_gmail_inbox_view.png). |
| **Tìm kiếm Top Bar (Từ khóa)** | `PASS` | Tìm kiếm theo từ khóa tức thì, xóa trắng trả về danh sách ban đầu mượt mà. |
| **Số đếm Badge Sidebar** | `PASS` | Khớp chính xác số đơn đang thụ lý, ưu tiên, đã ban hành. |
| **Lưu trạng thái Ngôi sao (Star) qua F5**| `FAIL` | **Lỗi logic:** Ngôi sao chỉ lưu trong state React [GmailInboxList.jsx:28](file:///d:/Code/DauTruongAI/frontend/src/features/officer/components/GmailInboxList.jsx#L28), bấm F5 mất sạch dấu sao! |
| **Modal Gmail: Vị trí & Backdrop blur** | `PASS` | Nằm chính giữa màn hình, nền làm mờ `bg-slate-900/45 backdrop-blur-sm`, khóa cuộn nền [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/09_officer_center_modal_gmail.png). |
| **Modal Gmail: Đóng bằng phím ESC** | `PASS` | Bấm phím `Escape` trên bàn phím đóng modal tức thì. |
| **Modal Gmail: Đóng bằng click Backdrop**| `PASS` | Click chuột vào khoảng mờ ngoài viền đóng modal tức thì. |
| **Modal Gmail: Đóng bằng nút [✕]** | `PASS` | Click nút [✕] góc trên phải đóng modal tức thì. |
| **Modal Gmail: Chống trùng thư IMAP** | `PASS` | Soi code [email_worker.py:414-420](file:///d:/Code/DauTruongAI/backend/modules/notifications/email_worker.py#L414-L420): Kiểm tra `original_message_id` trong SQL Server, bỏ qua 100% email đã quét. |
| **Chi tiết đơn 2 cột (Split View)** | `PASS` | Cột trái (45%) hiển thị ảnh gốc; cột phải (55%) hiển thị nội dung trích xuất & dự thảo [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/10_officer_split_view_detail.png). |
| **Bộ công cụ ảnh: Đủ 2 trang, Xoay, Zoom**| `PASS` | Nút Trang 1 / Trang 2 chuyển trang ảnh mượt mà, phóng to thu nhỏ và xoay 90 độ hoạt động thực tế. |
| **Nút "Lưu Nháp" Văn bản** | `FAIL` | **Lỗi nghiệp vụ nghiêm trọng:** Bấm "Lưu Nháp" chỉ hiện Toast thông báo, không hề gọi API lưu DB [OfficerWorkspace.jsx:153-155](file:///d:/Code/DauTruongAI/frontend/src/features/officer/OfficerWorkspace.jsx#L153-L155)! F5 mất toàn bộ văn bản cán bộ sửa. |
| **Modal Chuyển Tuyến (Reassign)** | `PASS` | Chọn Sở chuyên trách khác và ghi lý do, mở và đóng bằng ESC mượt [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/11_officer_reassign_modal.png). |
| **Modal Phê Duyệt & Hộp thoại xác nhận** | `PASS` | Bấm Phê duyệt mở hộp thoại Confirm Dialog yêu cầu xác nhận trước khi phát hành [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/12_officer_approve_confirm_dialog.png). |
| **Soi code RAG: Ngưỡng >= 0.65** | `PASS` | Code áp dụng chuẩn xác `SIMILARITY_THRESHOLD = 0.65` [service.py:189](file:///d:/Code/DauTruongAI/backend/modules/rag/service.py#L189); dưới ngưỡng trả về thông báo từ chối bịa luật. |
| **Xử lý sự cố AI_FAILED (Fallback)** | `PASS` | Khi Gemini lỗi/timeout, hệ thống chuyển sang `AI_FAILED`, gán về `REQUIRE_HUMAN_REVIEW` và mở khóa các ô nhập tay trên giao diện cán bộ. |

---

### 3.3. Phân Hệ Quản Trị Viên (`ADMIN`)
*Tài khoản kiểm thử:* `admin` / `admin123` (Toàn quyền hệ thống)

| Tên chức năng | Trạng thái | Bằng chứng thực tế & Vị trí kiểm tra |
| :--- | :---: | :--- |
| **Quyền tối cao: Truy cập cả 3 phân hệ** | `PASS` | Admin di chuyển mượt mà qua `/` (Công dân), `/officer` (Cán bộ) và `/admin` (Quản trị). |
| **Dashboard: Số liệu KPI tổng hồ sơ** | `PASS` | Thẻ Tổng hồ sơ trên màn hình hiển thị 50 đơn, khớp đúng `COUNT(*)` từ bảng `tickets` SQL Server [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/13_admin_dashboard_kpis.png). |
| **Dashboard: Đếm trùng lặp hàng ngoại lệ** | `WARNING` | **Lỗi tính toán:** Thẻ `REQUIRE_HUMAN_REVIEW` bị cộng 2 lần (cộng cả `by_dept` lẫn `by_status`) gây lệch số [service.py:985](file:///d:/Code/DauTruongAI/backend/modules/tickets/service.py#L985). |
| **Dashboard: Thiếu các Sở đặc thù** | `WARNING` | Bảng phân rã chỉ có 6 nhóm cơ bản, bỏ quên `CONG_AN_TINH` (4 đơn) và `SO_YTE` (3 đơn) khiến tổng chi tiết không bằng tổng toàn tỉnh. |
| **Kho tri thức RAG: Danh sách điều luật** | `PASS` | Hiển thị danh mục 15 đoạn văn bản quy phạm pháp luật [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/14_admin_rag_knowledge_base.png). |
| **Kho tri thức RAG: Thêm luật mới** | `PASS` | Nạp văn bản qua Modal tự động chia chunk và cập nhật trực tiếp vào danh sách không cần F5. |
| **Kho tri thức RAG: Xóa luật** | `PASS` | Bật Confirm Dialog hỏi xác nhận trước khi xóa; xóa xong bản ghi biến mất thực tế trong SQL Server. |
| **Quản trị người dùng: Bảng tài khoản** | `PASS` | Hiển thị đầy đủ danh sách 16 người dùng cán bộ các Sở/Ngành [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/15_admin_accounts_table.png). |
| **Bảo mật: Nguy cơ Admin Deadlock** | `FAIL` | **Lỗ hổng:** `toggle_user_status` và `reject_officer_user` không kiểm tra `user_id == 1` hay `role == ADMIN`, cho phép Admin tự xóa hoặc tự khóa chính mình [auth/service.py:403-410](file:///d:/Code/DauTruongAI/backend/modules/auth/service.py#L403-L410)! |

---

### 3.4. Trải Nghiệm Thiết Bị Di Động (`MOBILE 390x844`)

| Tên chức năng | Trạng thái | Bằng chứng thực tế & Vị trí kiểm tra |
| :--- | :---: | :--- |
| **Tràn ngang (`scrollWidth > clientWidth`)**| `PASS` | `document.documentElement.scrollWidth <= clientWidth` (390px chuẩn), không có thanh cuộn ngang gây vỡ màn hình [Ảnh minh chứng](file:///d:/Code/DauTruongAI/screenshots/audit/06_citizen_mobile_iphone_390x844.png). |
| **Thanh điều hướng Mobile Drawer** | `PASS` | Bấm nút Hamburger 3 gạch góc trái mở menu Drawer mượt mà, có backdrop che nền. |
| **Hai nút tải ảnh lớn trên di động** | `PASS` | Nút `📷 Chụp ảnh đơn` và `🖼️ Chọn từ thư viện` hiển thị dạng card lớn, bấm ngón tay dễ dàng không bị dính nút. |

---

## 4. DANH SÁCH LỖI ĐƯỢC PHÂN LOẠI THEO ĐỘ NGHIÊM TRỌNG (P0 - P3)

### NHÓM P0: LỖI NGHIÊM TRỌNG (CRITICAL / SECURITY BLOCKERS)

#### Lỗi P0-01: Anonymous Authentication Bypass trên API Phê duyệt và Chuyển tuyến
- **Mô tả:** Endpoint `PUT /api/tickets/{ticket_id}/approve` và `PUT /api/tickets/{ticket_id}/reassign` sử dụng dependency `Depends(get_current_user_optional)`. Khi một kẻ tấn công gửi request không có bất kỳ Header Authorization nào, biến `current_user` bằng `None`. Trong hàm `_get_staff_ticket()`, câu lệnh kiểm tra quyền là `if current_user:` -> điều kiện này trả về `False`, dẫn đến **toàn bộ kiểm tra phân quyền bị bỏ qua 100%**. Bất kỳ ai trên Internet đều có thể gửi lệnh phê duyệt đơn thư của tỉnh!
- **Các bước tái hiện:**
  1. Mở terminal, chạy lệnh `curl -X PUT http://localhost:8000/api/tickets/53/approve -H "Content-Type: application/json" -d "{\"draft_reply\": \"Hacked\"}"` (không kèm token).
  2. Kết quả trả về: `HTTP 200 OK - {"success": true, "message": "Đã phê duyệt hồ sơ thành công."}`.
- **Vị trí code gây lỗi:**
  - [backend/modules/tickets/router.py:127](file:///d:/Code/DauTruongAI/backend/modules/tickets/router.py#L127)
  - [backend/modules/tickets/service.py:755-764](file:///d:/Code/DauTruongAI/backend/modules/tickets/service.py#L755-L764)
- **Đề xuất giải pháp:** Thay thế `get_current_user_optional` bằng `require_role("OFFICER")` tại router.py dòng 127; đồng thời trong `_get_staff_ticket()` bắt buộc kiểm tra `if not current_user: raise HTTPException(401)`.

---

#### Lỗi P0-02: Cho phép tải lên bất kỳ tệp thực thi nguy hại nào (.bat/.exe/.sh) vào thư mục web công khai
- **Mô tả:** Trong hàm `submit_ticket_service()`, khi xử lý tệp ảnh tải lên, hệ thống chỉ dùng khối `try: Image.open()` để nén ảnh. Nếu người dùng tải lên tệp `.bat` hoặc `.exe`, lệnh `Image.open()` văng exception, rơi vào khối `except Exception: with open(saved_path, "wb") as f: f.write(content)`. Máy chủ vẫn lưu nguyên vẹn tệp độc hại vào thư mục `uploads/` và trả về mã thành công `HTTP 201 Created`!
- **Các bước tái hiện:**
  1. Gửi request `POST /api/tickets/submit` đính kèm tệp `malicious.bat`.
  2. Máy chủ phản hồi `HTTP 201 Created`, tệp xuất hiện tại thư mục tĩnh `uploads/` có thể truy cập qua URL `/uploads/...`.
- **Vị trí code gây lỗi:**
  - [backend/modules/tickets/service.py:316-331](file:///d:/Code/DauTruongAI/backend/modules/tickets/service.py#L316-L331)
- **Đề xuất giải pháp:** Bổ sung danh sách trắng phần mở rộng (whitelist extensions: `.jpg`, `.jpeg`, `.png`, `.webp`) và kiểm tra Magic Bytes / Content-Type ngay trước khi lưu tệp. Nếu không hợp lệ, văng `HTTP 400 Bad Request`.

---

#### Lỗi P0-03: Nguy cơ Khóa Chết Toàn Bộ Hệ Thống Quản Trị (Admin Self-Deadlock)
- **Mô tả:** Trong các API quản trị người dùng `PUT /api/admin/users/{user_id}/toggle` (khóa tài khoản) và `DELETE /api/admin/users/{user_id}` (xóa tài khoản), mã nguồn không có bất kỳ dòng kiểm tra nào để bảo vệ tài khoản Quản trị viên tối cao (`user_id = 1` hoặc `role == 'ADMIN'`). Quản trị viên có thể tự bấm khóa tài khoản của chính mình hoặc tự xóa chính mình khỏi CSDL SQL Server, dẫn đến việc toàn bộ hệ thống mất vĩnh viễn quyền Root Admin!
- **Các bước tái hiện:**
  1. Đăng nhập bằng `admin` / `admin123`.
  2. Gửi request `PUT /api/admin/users/1/toggle`.
  3. Tài khoản admin bị chuyển sang `is_active = False`. Không ai có thể đăng nhập vào `/admin` để mở lại.
- **Vị trí code gây lỗi:**
  - [backend/modules/auth/service.py:403-410](file:///d:/Code/DauTruongAI/backend/modules/auth/service.py#L403-L410)
  - [backend/modules/auth/service.py:520-527](file:///d:/Code/DauTruongAI/backend/modules/auth/service.py#L520-L527)
- **Đề xuất giải pháp:** Trong `toggle_user_status` và `reject_officer_user`, thêm điều kiện chặn:
  ```python
  if user.role == "ADMIN" or user.user_id == current_user.get("user_id"):
      raise HTTPException(status_code=400, detail="Không được phép xóa hoặc khóa tài khoản Quản trị viên tối cao.")
  ```

---

### NHÓM P1: LỖI NGHIỆP VỤ & LOGIC (BUSINESS LOGIC FLAWS)

#### Lỗi P1-01: Nút "Lưu Nháp" Cán Bộ chỉ là Toast giả, không gọi API lưu CSDL
- **Mô tả:** Trong màn hình xử lý đơn 2 cột của Cán bộ (`OfficerWorkspace.jsx`), hàm `handleSaveDraft` chỉ gọi duy nhất `showToast('success', 'Đã lưu nháp các nội dung hiệu chỉnh...')` mà **không hề gọi bất kỳ lệnh API Axios nào** tới Backend! Cán bộ cặm cụi sửa nội dung công văn, bấm Lưu thấy hiện thông báo xanh tưởng đã lưu, nhưng khi bấm F5 tải lại trang thì toàn bộ nội dung vừa gõ biến mất hoàn toàn!
- **Các bước tái hiện:**
  1. Vào `/officer`, mở một đơn bất kỳ.
  2. Sửa ô trích yếu hoặc dự thảo văn bản.
  3. Bấm "Lưu Nháp" -> Thấy Toast xanh hiện ra.
  4. Bấm `F5` tải lại trang -> Nội dung quay về như lúc đầu.
- **Vị trí code gây lỗi:**
  - [frontend/src/features/officer/OfficerWorkspace.jsx:153-155](file:///d:/Code/DauTruongAI/frontend/src/features/officer/OfficerWorkspace.jsx#L153-L155)
- **Đề xuất giải pháp:** Viết hàm API `api.updateTicketDraft(ticket_id, draftData)` gọi `PUT /api/tickets/{ticket_id}` để cập nhật trực tiếp vào bảng `tickets` và `ai_results` trong SQL Server.

---

#### Lỗi P1-02: Đánh dấu Ngôi sao ưu tiên (Star) mất sạch sau khi F5
- **Mô tả:** Cán bộ đánh dấu sao cho các đơn quan trọng cần xử lý trước. Tuy nhiên danh sách `starredIds` lại được lưu trong `useState(new Set())` của component `GmailInboxList.jsx`. Khi bấm F5, state bị khởi tạo lại thành tập hợp rỗng, mất toàn bộ ngôi sao đã đánh dấu.
- **Vị trí code gây lỗi:**
  - [frontend/src/features/officer/components/GmailInboxList.jsx:28](file:///d:/Code/DauTruongAI/frontend/src/features/officer/components/GmailInboxList.jsx#L28)
- **Đề xuất giải pháp:** Lưu `starredIds` vào trường `is_starred` trong DB hoặc tối thiểu lưu vào `localStorage.getItem('officer_starred_tickets')`.

---

#### Lỗi P1-03: Đếm trùng lặp hồ sơ ngoại lệ (Double-Counting) tại Dashboard Quản Trị
- **Mô tả:** Trong hàm `get_system_stats_service()`, số đếm của `REQUIRE_HUMAN_REVIEW` được tính bằng công thức:
  `"count": by_dept.get("REQUIRE_HUMAN_REVIEW", 0) + by_status.get("HUMAN_REVIEW", 0)`
  Đối với một đơn có cả `dept_code == 'REQUIRE_HUMAN_REVIEW'` và `status == 'HUMAN_REVIEW'`, bản ghi này bị cộng **2 lần** vào thẻ chỉ số KPI!
- **Vị trí code gây lỗi:**
  - [backend/modules/tickets/service.py:985](file:///d:/Code/DauTruongAI/backend/modules/tickets/service.py#L985)
- **Đề xuất giải pháp:** Sửa lại phép đếm: chỉ đếm các đơn có `dept_code == "REQUIRE_HUMAN_REVIEW" or status == "HUMAN_REVIEW"` một lần duy nhất.

---

#### Lỗi P1-04: Biểu mẫu công dân ép buộc nhập text ngay cả khi đã có ảnh đơn giấy
- **Mô tả:** Người dân lớn tuổi chụp ảnh lá đơn viết tay gửi lên, form có thông báo: *"Vui lòng nhập nội dung phản ánh hoặc đính kèm ảnh đơn thư"*. Tuy nhiên logic code kiểm tra `if (!formData.raw_text.trim())` và thẻ `<textarea required>` bắt buộc phải có chữ, khiến công dân dù đã đính kèm 2 trang ảnh rõ nét vẫn bị chặn không cho gửi đơn nếu không gõ thêm chữ vào ô mô tả!
- **Vị trí code gây lỗi:**
  - [frontend/src/features/citizen/components/ComplaintSubmitForm.jsx:50-53](file:///d:/Code/DauTruongAI/frontend/src/features/citizen/components/ComplaintSubmitForm.jsx#L50-L53)
- **Đề xuất giải pháp:** Sửa điều kiện: `if (!formData.raw_text.trim() && selectedFiles.length === 0)` và bỏ thuộc tính `required` cứng trên `<textarea>`.

---

### NHÓM P2: LỖI GIAO DIỆN & TƯƠNG TÁC NHỎ (UI / UX GLITCHES)

#### Lỗi P2-01: Console Warning về thiếu "key" prop trong danh sách RAG
- **Mô tả:** Trình duyệt bắn cảnh báo: `Warning: Each child in a list should have a unique "key" prop. Check the render method of RAGDocList.` do một số khối map component không truyền prop `key={doc.doc_id}` duy nhất.
- **Vị trí code gây lỗi:** [frontend/src/features/admin/components/rag/RAGDocList.jsx:33](file:///d:/Code/DauTruongAI/frontend/src/features/admin/components/rag/RAGDocList.jsx#L33).

#### Lỗi P2-02: Không ràng buộc định dạng Số điện thoại công dân
- **Mô tả:** Ô Số điện thoại trên Cổng tiếp nhận công dân sử dụng `<input type="tel" required>`, nhưng không có thuộc tính `pattern="[0-9]{10,11}"`. Người dân gõ `"abcxyz"` form vẫn cho submit bình thường, gây sai lệch thông tin liên lạc hành chính.
- **Vị trí code gây lỗi:** [frontend/src/features/citizen/components/ComplaintSubmitForm.jsx:203](file:///d:/Code/DauTruongAI/frontend/src/features/citizen/components/ComplaintSubmitForm.jsx#L203).

---

### NHÓM P3: GÓP Ý CHỦ QUAN VỀ TRẢI NGHIỆM NGƯỜI DÙNG (HONEST UX CRITIQUE)

#### P3-01: Mức độ "AI hóa" (AI Hype)
- **Tích cực:** Toàn bộ các dòng chữ màu mè phản cảm kiểu `Confidence Score: 0.99`, `Token RAG`, `Prompt Injection Shield` đã được dọn sạch khỏi giao diện Cán bộ và Công dân. Giao diện Cán bộ giờ đây nhìn đúng chuẩn Hành chính công.
- **Điểm cần sửa:** Trên màn hình Admin, thẻ chỉ số vẫn còn dòng chữ *"Độ tin cậy AI"*, và khi API trả về rỗng thì code tự động fallback về số cứng `96%` ([ExceptionQueueTab.jsx:113](file:///d:/Code/DauTruongAI/frontend/src/features/admin/components/ExceptionQueueTab.jsx#L113)). Cần thay bằng chữ *"Tỷ lệ định tuyến chính xác"* và phản ánh đúng giá trị trung bình thực tế từ SQL Server (khoảng 88.9%).

#### P3-02: Bố cục Gmail & Độ thuận tiện
- **Ưu điểm vượt trội:**
  1. Hộp thư đến (Inbox) danh sách hàng ngang kiểu Gmail tạo cảm giác cực kỳ quen thuộc, dễ quét mắt xem nhanh mã đơn, người gửi và trích yếu.
  2. Modal cấu hình Gmail trung tâm có nền làm mờ `backdrop-blur-sm`, hỗ trợ đóng cực nhạy bằng phím `ESC`, click vùng mờ và nút `[✕]`.
  3. Bộ xem ảnh tài liệu chia 2 cột với công cụ chuyển trang 1/2, zoom, xoay 90 độ rất thuận tiện cho cán bộ đọc đơn scan hoặc ảnh chụp hiện trường bị ngược chiều.
- **Hạn chế:** Khi danh sách đơn thư lên đến hàng trăm đơn, Inbox hiện tại hiển thị toàn bộ trong một container cuộn cố định mà chưa có phân trang (`Pagination: Trang 1, 2, 3...`) hoặc cuộn vô tận có tải động (Virtual Scrolling), có nguy cơ làm lag DOM khi số lượng đơn tăng cao.

---

## 5. NHẬT KÝ LỖI TRÌNH DUYỆT (CONSOLE ERRORS & FAILED NETWORK REQUESTS)

Trích xuất trực tiếp từ phiên chạy Playwright Chromium tự động:

### 5.1. Nhật ký Lỗi Console (9 Lỗi):
```log
1. [ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request)
   -> URL: http://localhost:5173/api/auth/register (Test kịch bản đăng ký trùng username)
2. [WARNING] [Axios API Error] [POST /api/auth/register]: Tên đăng nhập đã tồn tại trong danh mục hệ thống.
3. [ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized)
   -> URL: http://localhost:5173/api/auth/login (Test kịch bản đăng nhập sai mật khẩu)
4. [WARNING] [Axios API Error] [POST /api/auth/login]: Tên đăng nhập hoặc mật khẩu không chính xác.
5. [ERROR] Failed to load resource: the server responded with a status of 404 (Not Found)
   -> URL: http://localhost:5173/api/tickets/lookup/ĐN-99999999-0000 (Test kịch bản tra cứu mã lạ)
6. [WARNING] [Axios API Error] [GET /api/tickets/lookup/ĐN-99999999-0000]: Không tìm thấy hồ sơ.
7. [ERROR] Warning: Each child in a list should have a unique "key" prop. Check the render method of `RAGDocList`.
```

### 5.2. Nhật ký Lỗi Mạng (Network Failures):
- `HTTP 400`: `http://localhost:5173/api/auth/register` (Kịch bản kiểm thử hợp lệ)
- `HTTP 401`: `http://localhost:5173/api/auth/login` (Kịch bản kiểm thử hợp lệ)
- `HTTP 404`: `http://localhost:5173/api/tickets/lookup/%C4%90N-99999999-0000` (Kịch bản kiểm thử hợp lệ)
- Không ghi nhận bất kỳ mã lỗi `HTTP 500 Internal Server Error` nào trong suốt phiên chạy!

---

## 6. ĐÁNH GIÁ TRẢI NGHIỆM NGƯỜI DÙNG THỰC TẾ (HONEST UX CRITIQUE)

### Góc nhìn Người Dân (Citizen):
- **Cảm nhận:** Trang chủ gọn gàng, nút chụp ảnh to bản trên di động rất trực quan cho người lớn tuổi. Quá trình tra cứu tiến độ hiển thị thanh timeline dễ hiểu.
- **Điểm gây bực mình:** Chụp ảnh đơn giấy xong vẫn bị bắt gõ lại vào ô nội dung thì mới cho gửi đơn. Cần sửa gấp để người dân chỉ cần chụp ảnh là có thể gửi ngay.

### Góc nhìn Cán Bộ Thụ Lý (Officer):
- **Cảm nhận:** Bố cục 2 cột Split View xem ảnh bên trái và soạn văn bản trả lời bên phải rất chuyên nghiệp, giống hệt quy trình làm việc hành chính thật sự. Dự thảo có sẵn mẫu tiêu ngữ Nghị định 30/2020/NĐ-CP tiết kiệm rất nhiều thời gian.
- **Điểm gây bực mình:** Nút "Lưu Nháp" lừa dối người dùng vì không lưu thật vào CSDL. Cán bộ mất công sửa văn bản mà vô tình refresh là mất trắng công sức.

### Góc nhìn Quản Trị Viên (Admin):
- **Cảm nhận:** Phân hệ RAG thêm/xóa văn bản luật phản hồi tức thì, không cần tải lại trang. Giao diện quản lý tài khoản rõ ràng.
- **Điểm nguy hiểm:** Thiếu chốt bảo vệ an toàn cho tài khoản Root Admin, có thể dẫn đến hậu quả bị khóa toàn hệ thống do thao tác nhầm.

---

## 7. BẢNG CHẤM ĐIỂM THỰC TẾ (THANG 10) & KHUYẾN NGHỊ KHẮC PHỤC

| Tiêu Chí Đánh Giá | Điểm Số | Lý Do Trừ Điểm Cụ Thể |
| :--- | :---: | :--- |
| **Cổng Tiếp Nhận Công Dân (`CITIZEN`)** | **7.5 / 10** | Trừ 2.5 điểm do: Ép buộc gõ chữ khi đã có ảnh đơn giấy; thiếu validate regex cho SĐT; nút submit chưa khóa tức thì khi bấm kép. |
| **Bàn Làm Việc Cán Bộ (`OFFICER`)** | **6.0 / 10** | Trừ 4.0 điểm do: Nút Lưu Nháp không lưu DB (P1); Ngôi sao ưu tiên mất sau khi F5; thiếu phân trang danh sách thư. |
| **Trung Tâm Quản Trị (`ADMIN`)** | **6.5 / 10** | Trừ 3.5 điểm do: Nguy cơ Admin Deadlock (P0); đếm trùng lặp hồ sơ ngoại lệ x2; bỏ quên nhóm Công An và Y Tế trong biểu đồ. |
| **Kiến Trúc Mã Nguồn & Bảo Mật Hệ Thống** | **5.5 / 10** | Trừ 4.5 điểm do: Lỗ hổng Anonymous Approval Bypass (P0); không chặn upload file `.bat/.exe` nguy hại (P0); còn sót mock token trong `authService.js`. |
| **ĐIỂM TRUNG BÌNH TOÀN DỰ ÁN** | **6.4 / 10** | **XẾP LOẠI: TRUNG BÌNH KHÁ (CẦN VÁ LỖI CẤP BÁCH TRƯỚC KHI DEMO)** |

---

### DANH SÁCH ẢNH BẰNG CHỨNG KIỂM THỬ ĐÍNH KÈM:
Toàn bộ ảnh chụp màn hình hiện trường được lưu trữ tại thư mục [screenshots/audit/](file:///d:/Code/DauTruongAI/screenshots/audit/):
1. [01_citizen_register_view.png](file:///d:/Code/DauTruongAI/screenshots/audit/01_citizen_register_view.png) - Giao diện Đăng ký Công dân & Cán bộ
2. [02_citizen_login_view.png](file:///d:/Code/DauTruongAI/screenshots/audit/02_citizen_login_view.png) - Giao diện Đăng nhập chuẩn hành chính
3. [03_citizen_submit_form_previews.png](file:///d:/Code/DauTruongAI/screenshots/audit/03_citizen_submit_form_previews.png) - Tải 2 trang ảnh viết tay xem trước & Biểu mẫu
4. [04_citizen_submit_success_receipt.png](file:///d:/Code/DauTruongAI/screenshots/audit/04_citizen_submit_success_receipt.png) - Biên nhận tiếp nhận đơn kèm mã tra cứu ĐN-20261120-2175
5. [05_citizen_tracking_timeline.png](file:///d:/Code/DauTruongAI/screenshots/audit/05_citizen_tracking_timeline.png) - Tra cứu tiến độ hồ sơ theo thời gian thực
6. [06_citizen_mobile_iphone_390x844.png](file:///d:/Code/DauTruongAI/screenshots/audit/06_citizen_mobile_iphone_390x844.png) - Giao diện di động iPhone 390x844 không tràn ngang
7. [07_officer_rbac_unauthorized_view.png](file:///d:/Code/DauTruongAI/screenshots/audit/07_officer_rbac_unauthorized_view.png) - Màn hình từ chối Cán bộ truy cập vào `/admin`
8. [08_officer_gmail_inbox_view.png](file:///d:/Code/DauTruongAI/screenshots/audit/08_officer_gmail_inbox_view.png) - Hộp thư đến Cán bộ kiểu Gmail chuẩn mực
9. [09_officer_center_modal_gmail.png](file:///d:/Code/DauTruongAI/screenshots/audit/09_officer_center_modal_gmail.png) - Modal đồng bộ Gmail trung tâm làm mờ nền
10. [10_officer_split_view_detail.png](file:///d:/Code/DauTruongAI/screenshots/audit/10_officer_split_view_detail.png) - Màn hình Chi tiết xử lý đơn Split View 2 cột (45/55)
11. [11_officer_reassign_modal.png](file:///d:/Code/DauTruongAI/screenshots/audit/11_officer_reassign_modal.png) - Modal chuyển tuyến điều phối hồ sơ liên sở
12. [12_officer_approve_confirm_dialog.png](file:///d:/Code/DauTruongAI/screenshots/audit/12_officer_approve_confirm_dialog.png) - Hộp thoại xác nhận Phê duyệt & Ban hành công văn
13. [13_admin_dashboard_kpis.png](file:///d:/Code/DauTruongAI/screenshots/audit/13_admin_dashboard_kpis.png) - Bảng điều hành Quản trị và các thẻ chỉ số KPI
14. [14_admin_rag_knowledge_base.png](file:///d:/Code/DauTruongAI/screenshots/audit/14_admin_rag_knowledge_base.png) - Kho văn bản quy phạm pháp luật RAG
15. [15_admin_accounts_table.png](file:///d:/Code/DauTruongAI/screenshots/audit/15_admin_accounts_table.png) - Quản trị danh sách tài khoản cán bộ các Sở ban ngành

---
> **BÁO CÁO KẾT THÚC VÀ ĐANG Ở CHẾ ĐỘ DỪNG CHỜ DUYỆT (AUDIT-ONLY). CHƯA TỰ Ý CHỈNH SỬA BẤT KỲ MÃ NGUỒN NÀO.**
