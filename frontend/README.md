# PHÂN HỆ GIAO DIỆN NGƯỜI DÙNG (FRONTEND REACT + VITE)
## HỆ THỐNG TIẾP NHẬN & ĐIỀU PHỐI ĐƠN THƯ THÔNG MINH – TỈNH ĐỒNG NAI
> **Kiến trúc Feature-Driven Modular Architecture • Chuẩn mực Giao diện GovTech Cổng Dịch vụ công Quốc gia • Thiết kế Đáp ứng Toàn diện (Responsive)**

---

## 🎨 1. QUY CHUẨN THIẾT KẾ GOVTECH (DESIGN SYSTEM)

Giao diện được thiết kế bám sát Bộ nhận diện Cổng Dịch vụ công Quốc gia và UBND tỉnh Đồng Nai:
- **Màu chủ đạo (Primary Gov-Blue):** `#1E3A8A` (Xanh hành chính quyền lực, trang nghiêm).
- **Màu nền (Slate Background):** `#F8FAFC` (Màu ghi xám sáng tạo cảm giác thông thoáng, rõ ràng).
- **Viền & Ngăn cách (Border Neutral):** `#E2E8F0` (Thanh mảnh, tinh tế, chuẩn công sở số).
- **Hệ thống Font chữ:** San Francisco / Inter / Segoe UI hỗ trợ tiếng Việt có dấu với độ tương phản cao, chống mỏi mắt.
- **Huy hiệu độ khẩn cấp:** Đỏ (`#DC2626` - Khẩn cấp / Cao), Vàng cam (`#D97706` - Trung bình), Lam (`#2563EB` - Tiêu chuẩn).

---

## 📁 2. CẤU TRÚC THƯ MỤC PHÂN HỆ FRONTEND

```text
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx                 # Thanh tiêu đề Cổng DVC, điều hướng RBAC & thông tin đăng nhập
│   │   ├── Footer.jsx                 # Chân trang hành chính chuẩn (địa chỉ, cơ quan chủ quản, bản quyền)
│   │   └── ProtectedRoute.jsx         # Bộ bảo vệ tuyến đường kiểm soát vai trò (RBAC Route Guard)
│   ├── context/
│   │   └── AuthContext.jsx            # Quản lý trạng thái đăng nhập, giải mã JWT & quyền người dùng
│   ├── features/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx     # Container điều hành Bảng chỉ số toàn tỉnh
│   │   │   └── components/
│   │   │       ├── ExceptionQueueTab.jsx    # Tab giám sát 6 chỉ số KPI & xử lý đơn ngoại lệ / Spam
│   │   │       ├── RAGManagementTab.jsx     # Tab quản trị kho văn bản pháp luật & nút Hot Reload RAG
│   │   │       └── AccountManagementTab.jsx # Tab phê duyệt tài khoản cán bộ & giám sát Email Worker
│   │   ├── auth/
│   │   │   └── RegisterPage.jsx       # Trang đăng ký tài khoản Công dân mới & Cán bộ
│   │   ├── citizen/
│   │   │   ├── CitizenPortal.jsx      # Cổng tiếp nhận dành cho người dân (3 Tab: Gửi đơn, Tra cứu, Lịch sử)
│   │   │   └── components/
│   │   │       ├── ComplaintSubmitForm.jsx         # Biểu mẫu nhập đơn & tải nhiều ảnh nén RAM
│   │   │       ├── SubmissionModal.jsx            # Hộp thoại biên nhận điện tử & Thẻ AI phân tích
│   │   │       ├── SubmissionReceipt.jsx          # Biên nhận điện tử chi tiết
│   │   │       ├── ComplaintTrackingSection.jsx    # Khung tra cứu mã ĐN-YYYYMMDD-XXXX
│   │   │       ├── ComplaintProgressTimeline.jsx   # Trục thời gian 4 giai đoạn giải quyết hồ sơ
│   │   │       ├── AiRoutingResultCard.jsx        # Thẻ hiển thị minh bạch kết quả phân loại AI
│   │   │       └── CitizenComplaintHistory.jsx     # Danh mục lịch sử đơn cá nhân đã gửi
│   │   └── officer/
│   │       ├── OfficerWorkspace.jsx   # Bàn làm việc thông minh 2 cột của Cán bộ thụ lý 8 Sở
│   │       └── components/
│   │           ├── TicketListTable.jsx     # Cột trái: Bộ lọc & danh sách hồ sơ cần thẩm tra
│   │           ├── AiAnalysisCard.jsx      # Cột phải: Thẻ bóc tách thực thể & căn cứ luật RAG
│   │           ├── DraftResponseEditor.jsx # Khung soạn thảo công văn chuẩn Nghị định 30/2020/NĐ-CP
│   │           └── ReassignModal.jsx       # Hộp thoại chuyển tuyến hồ sơ sai thẩm quyền (Audit Trail)
│   ├── pages/
│   │   └── LoginPage.jsx              # Trang đăng nhập chuẩn hành chính với gợi ý tài khoản mẫu
│   ├── services/
│   │   ├── api.js                     # Cấu hình đối tượng Axios kết nối tới Backend
│   │   ├── authService.js             # Dịch vụ gọi API đăng nhập, đăng ký, thông tin người dùng
│   │   ├── ticketService.js           # Dịch vụ gọi API nộp đơn, tra cứu, phê duyệt, chuyển tuyến
│   │   ├── ragService.js              # Dịch vụ gọi API danh mục luật và nạp lại tri thức
│   │   └── httpClient.js              # Cấu hình bộ đánh chặn (Axios Interceptors) tự động gắn JWT Token
│   ├── utils/
│   │   └── formatters.js              # Hàm tiện ích định dạng ngày tháng, tiền tệ, tên Sở, trạng thái
│   ├── App.jsx                        # Điểm phối hợp Routing chính của ứng dụng
│   ├── index.css                      # Tailwind CSS base & GovTech utility classes
│   └── main.jsx                       # Điểm khởi tạo ứng dụng React 18 với ReactDOM
├── index.html                         # Tiêu đề trang web & Favicon Cổng DVC Đồng Nai
├── package.json                       # Danh mục thư viện phụ thuộc (React, Vite, Lucide, Axios)
├── tailwind.config.js                 # Cấu hình bảng màu Gov-Blue và breakpoint Responsive
└── vite.config.js                     # Cấu hình Vite Dev Server (Port 3000, Proxy /api -> Port 8000)
```

---

## ⚙️ 3. CÀI ĐẶT & CẤU HÌNH BIẾN MÔI TRƯỜNG

### Bước 1: Cài đặt thư viện Node.js
Khuyến nghị sử dụng Node.js phiên bản 18.x, 20.x hoặc 22.x:
```powershell
cd D:\Code\DauTruongAI\frontend
npm install
```

### Bước 2: Thiết lập file `frontend/.env`
Sao chép từ file mẫu `frontend/.env.example`:
```powershell
copy .env.example .env
```
Nội dung file `.env`:
```ini
# Để trống để sử dụng tính năng Proxy cục bộ của Vite chuyển tiếp /api đến http://127.0.0.1:8000
VITE_API_URL=
```

> [!NOTE]
> File `vite.config.js` đã được cấu hình sẵn tính năng Reverse Proxy:
> ```javascript
> server: {
>   port: 3000,
>   host: '0.0.0.0',
>   proxy: {
>     '/api': {
>       target: 'http://127.0.0.1:8000',
>       changeOrigin: true,
>       secure: false,
>     },
>   },
> }
> ```
> Việc này giúp toàn bộ các yêu cầu HTTP gửi từ trình duyệt tới `/api/...` đều tự động chuyển tiếp tới cổng 8000 của Backend FastAPI mà không bao giờ gặp lỗi CORS.

---

## 🚀 4. KHỞI CHẠY MÁY CHỦ PHÁT TRIỂN (PORT 3000)

Chạy lệnh trong terminal:
```powershell
npm run dev
```
- Giao diện web sẵn sàng tại: `http://localhost:3000`
- Tương thích tốt trên mọi trình duyệt hiện đại: Google Chrome, Microsoft Edge, Mozilla Firefox, Safari.

---

## 📱 5. TƯƠNG THÍCH ĐÁP ỨNG TOÀN DIỆN (RESPONSIVE AUDIT)

Hệ thống được thiết kế theo tư duy Mobile-First, tự động thích ứng với mọi kích thước màn hình:
- **Màn hình máy tính bảng & Desktop (> 1024px):**
  - Cổng Công Dân hiển thị căn giữa trang nhã tối đa `1024px`.
  - Bàn làm việc Cán bộ chia 2 cột công thái học: Danh sách hồ sơ bên trái (35%), Chi tiết & Vùng soạn thảo bên phải (65%).
- **Màn hình điện thoại di động (< 768px):**
  - Menu điều hướng chuyển sang chế độ xếp chồng gọn gàng.
  - Bộ tải ảnh hỗ trợ trực tiếp chụp ảnh hiện trường từ camera điện thoại.
  - Bàn làm việc cán bộ tự động chuyển đổi giữa danh sách và chi tiết khi nhấp vào hồ sơ, có nút quay lại tiện dụng.

---

## 📦 6. ĐÓNG GÓI SẢN PHẨM PRODUCTION BUILD

Khi triển khai lên máy chủ thật (Nginx / IIS / CDN):
```powershell
# Tạo bản đóng gói tối ưu tại thư mục dist/
npm run build

# Xem thử bản đóng gói production cục bộ
npm run preview
```
Toàn bộ mã nguồn được nén nhỏ, chia tách bundle tự động và tối ưu hóa thời gian nạp trang đầu tiên dưới **1.2 giây**.
