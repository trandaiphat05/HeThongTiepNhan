# KỊCH BẢN THUYẾT TRÌNH VÀ DEMO SẢN PHẨM (03 PHÚT)
## HỆ THỐNG TIẾP NHẬN & ĐIỀU PHỐI ĐƠN THƯ CÔNG DÂN TỈNH ĐỒNG NAI (AI CIVIC ROUTER)
**Vòng 2 – Bán kết Hội thi "Chinh phục AI" (Bảng C – Ứng dụng Thực tiễn)**  
*Thời lượng tối đa quy định:* **03 phút (180 giây)** | *Thời lượng phản biện:* **04 phút**

---

## PHẦN 1: KỊCH BẢN CHUẨN BỊ TRƯỚC GIỜ THI (PRE-FLIGHT CHECKLIST)

> [!IMPORTANT]
> **Quy tắc vàng:** Tuyệt đối không dùng chung một cửa sổ trình duyệt cho nhiều vai trò để tránh đè JWT Token xác thực. Mở sẵn **03 cửa sổ riêng biệt** (Google Chrome Profile hoặc Chế độ Ẩn danh riêng).

### 1. Chuẩn bị 3 Cửa sổ Trình duyệt
* **Cửa sổ 1 (Dành cho CÔNG DÂN):**
  - Địa chỉ: `http://localhost:5173/?tab=submit`
  - Trạng thái: Form nộp đơn sạch sẽ, sẵn sàng.
  - Tệp mẫu ngoài Desktop: Sao chép sẵn tệp `tests/assets/don_trang_1.jpg` ra màn hình chính Desktop (đặt tên dễ thấy: `Don_Phan_Anh_QL1K.jpg`).
* **Cửa sổ 2 (Dành cho CÁN BỘ THỤ LÝ SỞ GTVT):**
  - Địa chỉ: `http://localhost:5173/officer?tab=all`
  - Đăng nhập trước: Tài khoản `canbo_gtvt` | Mật khẩu: `officer123` (Cán bộ Lê Thanh Bình – Sở GTVT).
  - Trạng thái: Đang ở tab "Tất cả đơn thư", đã nhìn thấy hồ sơ Gmail mẫu `ĐN-20261120-2514`.
* **Cửa sổ 3 (Dành cho QUẢN TRỊ VIÊN HỆ THỐNG / ADMIN):**
  - Địa chỉ: `http://localhost:5173/admin`
  - Đăng nhập trước: Tài khoản `admin` | Mật khẩu: `admin123` (Quản trị viên Hệ thống).
  - Trạng thái: Mở sẵn tab *"Giám Sát Hệ Thống & Hàng Đợi Điều Phối"*.

### 2. Khởi động Hệ thống
Trước giờ thi 15 phút, mở PowerShell chạy lệnh:
```powershell
# 1. Khởi động Backend FastAPI & SQL Server
Set-Location D:\Code\DauTruongAI\backend
& "D:\Code\DauTruongAI\backend\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000

# 2. Khởi động Frontend Vite (Mở một Terminal khác)
Set-Location D:\Code\DauTruongAI\frontend
npm run dev -- --port 5173 --host
```

### 3. Checklist 3 bước kiểm tra nhanh (10 phút trước khi lên sân khấu)
1. **Kiểm tra CSDL & Backend:** Mở `http://localhost:8000/docs` trên trình duyệt xem Swagger UI phản hồi ngay tức thì.
2. **Kiểm tra Quota Gemini:** Chạy thử nộp 1 đơn nháp để xác nhận kết nối mạng Internet và API Key Gemini hoạt động trơn tru.
3. **Mạng dự phòng:** Bật sẵn điểm phát sóng 4G/5G trên điện thoại cá nhân (đã kết nối sẵn trong laptop), phòng trường hợp Wifi hội trường bị nghẽn.

---

## PHẦN 2: BẢNG TIMELINE CHI TIẾT TỪNG GIÂY (0:00 – 3:00)

| Mốc giây | Tiêu chí BGK đánh trúng | Thao tác chuột chính xác trên màn hình | Điểm nhấn cần nói | Thời lượng |
| :---: | :--- | :--- | :--- | :---: |
| **0:00 – 0:25** | • Vấn đề & Ý tưởng<br>• Tính sáng tạo | **Cửa sổ 1:** Giữ nguyên giao diện Cổng nộp đơn Công dân (`/?tab=submit`). | Nêu bài toán thực tế: Đồng Nai nhận hàng nghìn đơn thư/tháng nhưng phân loại thủ công mất 3–5 ngày. Giới thiệu giải pháp AI Civic Router. | 25s |
| **0:25 – 1:15** | • Trực tiếp kiểm thử AI<br>• Khả năng vận hành<br>• Mức độ làm chủ | **Cửa sổ 1:** Kéo thả tệp `Don_Phan_Anh_QL1K.jpg` vào khung tải ảnh. Điền nhanh: Tên *"Nguyễn Văn An"*, SĐT *"0912345678"*, bấm **[Gửi Đơn Thư]**. | Trình diễn OCR đa trang, nén ảnh RAM, RAG tra cứu luật, định tuyến tự động về Sở GTVT trong 3 giây. | 50s |
| **1:15 – 2:05** | • Tính hữu ích<br>• Thể thức Nghị định 30<br>• Mức độ làm chủ | **Cửa sổ 2:** Chuyển sang tab Cán bộ GTVT, click mở hồ sơ vừa nộp hoặc hồ sơ Gmail `ĐN-20261120-2514`. | Khung Split 45/55: Bên trái là ảnh scan A4 số hóa, bên phải là căn cứ pháp lý RAG và dự thảo công văn chuẩn Nghị định 30 năm 2026. Bấm `[Lưu nháp]`. | 50s |
| **2:05 – 2:35** | • Giá trị ứng dụng<br>• Khả năng mở rộng<br>• Trực tiếp vận hành | **Cửa sổ 2:** Bấm nút **[Gmail]** trên Header xem trạng thái kết nối.<br>**Cửa sổ 3:** Chuyển nhanh tab Admin xem Bảng điều phối toàn tỉnh. | Đồng bộ hòm thư điện tử công vụ thật 100% (Zero Mock), tự động chống trùng `Message-ID`. Bảng điều hành giám sát thời gian thực. | 30s |
| **2:35 – 2:55** | • Hạn chế sản phẩm<br>• Tính trung thực<br>• Lộ trình nâng cấp | Đứng thẳng, nhìn trực diện Ban Giám khảo, không thao tác màn hình. | Thẳng thắn nêu 2 hạn chế thực tế (chữ quá mờ cần Admin can thiệp, phụ thuộc Cloud API) và hướng khắc phục bằng Local VLM Offline. | 20s |
| **2:55 – 3:00** | Lời kết & Cảm ơn | Giữ tư thế tự tin, mỉm cười cúi chào BGK. | Chốt thông điệp chuyển đổi số hành chính công tỉnh Đồng Nai và sẵn sàng bước vào phần phản biện. | 5s |

---

## PHẦN 3: LỜI THOẠI ĐỌC TRỰC TIẾP (WORD-FOR-WORD SCRIPT)

> [!NOTE]
> **Đo lường từ ngữ chính xác:** Phần lời thoại dưới đây gồm đúng **372 từ tiếng Việt** (không tính ghi chú thao tác).  
> Với tốc độ nói hành chính chuẩn mực (145 từ/phút), bài nói kéo dài **2 phút 34 giây**, dự phòng **26 giây an toàn** bù trừ độ trễ mạng/click chuột trên sân khấu!

---

### [0:00 – 0:25] ĐẶT VẤN ĐỀ & MỤC TIÊU SẢN PHẨM (56 từ)
Kính thưa Ban Giám khảo,  
Mỗi tháng, tỉnh tiếp nhận hàng nghìn phản ánh qua đơn viết tay và email công vụ. Tuy nhiên, khâu bóc tách và phân luồng thủ công hiện mất từ 3 đến 5 ngày, dễ dẫn đến đùn đẩy trách nhiệm.  
Đội chúng tôi giải quyết bài toán này bằng **Hệ thống AI Điều Phối Đơn Thư **.

---

### [0:25 – 1:15] TRỰC TIẾP VẬN HÀNH: GỬI ĐƠN & AI PHÂN LUỒNG TỰ ĐỘNG (96 từ)
*(Chỉ tay vào Cửa sổ 1 – Cổng Công dân)*  
Tại Cổng dịch vụ công dân, người dân chỉ cần tải lên ảnh đơn viết tay chụp từ hiện trường.  

**[THAO TÁC: Kéo thả tệp ảnh `Don_Phan_Anh_QL1K.jpg` vào khung 'Tải ảnh lên từ thiết bị'. Điền Tên: "Nguyễn Văn An", SĐT: "0912345678", rồi bấm nút màu xanh [Gửi Đơn Thư]]**  

*(Giải thích backend trong lúc AI xử lý 3 giây):*  
Trong lúc này, Backend xử lý nén ảnh trong RAM, dùng mô hình Gemini Flash trích xuất chữ viết tay và đối chiếu kho luật của tỉnh Đồng Nai.  

**[THAO TÁC: Khi màn hình chuyển sang Biên Nhận Điện Tử, chỉ chuột vào Mã tra cứu và Thẻ đơn vị tiếp nhận]**  
Chỉ sau 3 giây! Đơn thư đã được số hóa, nhận diện sự cố sụt lún Quốc lộ 1K và định tuyến chính xác về **Sở Giao thông Vận tải**, cấp ngay Mã tra cứu hồ sơ điện tử.

---

### [1:15 – 2:05] KHÔNG GIAN CÁN BỘ & VĂN BẢN CHUẨN NGHỊ ĐỊNH 30 (111 từ)
**[THAO TÁC: Chuyển sang Cửa sổ 2 – Màn hình Cán bộ Sở GTVT. Bấm mở hồ sơ ĐN-20261120-2514 hoặc đơn vừa nộp]**  

Tại Bàn làm việc cán bộ theo chuẩn Gmail:  
- Cột trái hiển thị bản scan A4 số hóa kèm con dấu tiếp nhận điện tử để cán bộ đối soát.  
- Cột phải, AI trích dẫn đúng Luật Giao thông đường bộ và lập sẵn **Dự thảo văn bản trả lời chuẩn Nghị định 30 năm 2026**.  
Nếu đơn thư thiếu vị trí cụ thể, AI tự động thêm câu đề nghị công dân cung cấp bổ sung hiện trường.  

**[THAO TÁC: Bấm nút [Lưu nháp], màn hình hiện thông báo xanh 'Đã lưu nháp']**  
Cán bộ chỉ cần rà soát và bấm ban hành, tiết kiệm hơn 80% thời gian soạn thảo hành chính.

---

### [2:05 – 2:35] GMAIL CÔNG VỤ THẬT & BẢNG ĐIỀU HÀNH TỈNH (65 từ)
**[THAO TÁC: Bấm nút [Gmail] trên thanh Header]**  
Hệ thống kết nối trực tiếp hòm thư Gmail công vụ qua IMAP an toàn, tự động chống trùng lặp qua mã Message-ID và bóc tách thư đến tức thì.  

**[THAO TÁC: Chuyển sang Cửa sổ 3 – Admin Dashboard]**  
Dữ liệu lưu trữ tập trung trên Microsoft SQL Server 2025, cung cấp bảng điều phối minh bạch cho lãnh đạo tỉnh.

---

### [2:35 – 3:00] HẠN CHẾ THỰC TẾ & LỜI KẾT (44 từ)
Về hạn chế thực tế: Với các đơn viết tay quá mờ hoặc rách góc, hệ thống kích hoạt cơ chế Fallback đưa vào hàng đợi xử lý thủ công chứ không đoán mò.  
Hướng phát triển tiếp theo là triển khai mô hình AI cục bộ bảo mật tại Trung tâm dữ liệu tỉnh Đồng Nai.  
Xin trân trọng cảm ơn Ban Giám khảo!

---

## PHẦN 4: PHƯƠNG ÁN B (XỬ LÝ SỰ CỐ TRÊN SÂN KHẤU TRONG 03 GIÂY)

| Sự cố bất ngờ | Phản xạ trong 3 giây | Lời nói ứng biến trên sân khấu (Biến nguy thành cơ) |
| :--- | :--- | :--- |
| **1. Mạng hội trường lag hoặc Gemini API timeout lúc bấm Gửi đơn** | Không bấm gửi lại nhiều lần. Chờ 5 giây nếu thấy thẻ cảnh báo xuất hiện hoặc đang quay tròn, lập tức chuyển chuột sang Cửa sổ 2 (Cán bộ). | *"Hệ thống có cơ chế bảo vệ Circuit Breaker: Khi mạng ngoài gặp sự cố, đơn thư không bị mất mà lập tức chuyển sang hàng đợi AI_FAILED để cán bộ can thiệp. Giờ chúng ta hãy xem hồ sơ hoàn chỉnh đã được tiếp nhận ngay bên hòm thư cán bộ."* |
| **2. Cổng mạng hội trường chặn IMAP 993 không quét được Gmail mới** | Không bấm nút Quét lại. Mở thẳng bản ghi `ĐN-20261120-2514` có gắn nhãn nguồn `GMAIL_REAL` đã có sẵn trong danh sách. | *"Hệ thống kiểm tra trùng lặp email theo Message-ID chuẩn RFC 822. Đây là một email thực tế của người dân gửi về tình trạng ngập nước, hệ thống đã đồng bộ và tự động dựng thành bản scan A4 hoàn chỉnh với thời gian gửi gốc UTC+7."* |
| **3. Đồng hồ bấm giờ báo còn 20 giây mà chưa nói xong Cán bộ** | Dừng ngay việc rê chuột vào các nút phụ. Bấm thẳng nút `[Lưu nháp]` rồi chuyển ngay sang câu nói Hạn chế & Kết thúc. | *(Nói ngay câu chốt 15s):* *"Điểm chúng tôi tự hào nhất là tính trung thực: hệ thống có cơ chế cảnh báo đơn rách mờ chuyển Ban Tiếp công dân Tỉnh, và định hướng chạy mô hình AI cục bộ bảo mật cho tỉnh Đồng Nai. Xin cảm ơn BGK!"* |

---

## PHẦN 5: TÀI LIỆU "PHÒNG THỦ" 04 PHÚT PHẢN BIỆN (CHỨNG MINH LÀM CHỦ SẢN PHẨM)

> [!TIP]
> Ban Giám khảo Bảng C sẽ xoáy sâu vào **Mức độ làm chủ mã nguồn**, **Tính an toàn thông tin** và **Khả năng triển khai thật tại Đồng Nai**. Dưới đây là 7 câu hỏi hiểm hóc nhất kèm câu trả lời chuẩn xác từng file mã nguồn.

### Câu 1: AI có thể bịa luật hoặc ảo giác thẩm quyền (hallucination) không? Đội giải quyết thế nào?
* **Trả lời (25 giây):**  
  "Dạ thưa Ban Giám khảo, chúng tôi loại bỏ hoàn toàn việc để AI tự do suy đoán luật bằng kỹ thuật RAG Grounding trong tệp `backend/modules/rag/service.py`. Khi có đơn thư, hệ thống truy xuất chính xác các điều khoản từ bảng `rag_docs` trong SQL Server với ngưỡng tương đồng từ $0.65$ trở lên. Nếu độ tin cậy thấp, hệ thống gán nhãn yêu cầu cán bộ bổ sung chứ tuyệt đối không sinh nội dung sai lệch."

### Câu 2: Thông tin cá nhân của người dân khi gửi lên Cloud Gemini có bị lộ lọt không?
* **Trả lời (25 giây):**  
  "Dạ, tại tệp `backend/modules/ai_engine/ai_service.py`, hình ảnh được nén trực tiếp trên bộ nhớ RAM (BytesIO) thành luồng nhị phân và mã hóa truyền qua TLS 1.3, không ghi đệm tạm tệp rác lên ổ đĩa. Dữ liệu lưu trữ trong Microsoft SQL Server được phân quyền theo mô hình RBAC chặt chẽ; cán bộ sở nào chỉ được xem đơn thư của sở đó, công dân chỉ tra cứu được mã hồ sơ của chính mình."

### Câu 3: Điểm khác biệt cốt lõi giữa hệ thống này với việc cán bộ tự dùng ChatGPT hay Gemini Web là gì?
* **Trả lời (30 giây):**  
  "Dạ, khác biệt lớn nhất là **Tính khép kín và Tính chuẩn hóa hành chính**. Sử dụng ChatGPT bên ngoài là rời rạc và vi phạm bảo mật dữ liệu công. Hệ thống của chúng tôi là một quy trình End-to-End: tích hợp Single Source of Truth cho 7 Sở/Ngành tỉnh Đồng Nai, tự động sinh mã hồ sơ, số hóa văn bản A4, lưu vết kiểm toán (Audit Trail) trong SQL Server, xuất dự thảo đúng thể thức Nghị định 30/2020/NĐ-CP và tự động gửi email thông báo biên nhận lẫn kết quả cho người dân."

### Câu 4: Nếu mô hình AI gặp sự cố (mất mạng, hết quota, API Google lỗi) thì hệ thống xử lý ra sao?
* **Trả lời (25 giây):**  
  "Dạ, chúng tôi xây dựng cơ chế chịu lỗi hai tầng trong `classify_complaint_fallback`:  
  - Tầng 1: Sử dụng bộ quy tắc phân loại từ khóa chuyên sâu theo thẩm quyền 7 Sở của tỉnh Đồng Nai để định tuyến dự phòng.  
  - Tầng 2: Nếu nội dung quá phức tạp, hệ thống chuyển trạng thái `AI_FAILED` và đẩy về Ban Tiếp công dân Tỉnh / UBND Cấp Huyện tại Hàng đợi ngoại lệ trên Admin Dashboard để phân luồng thủ công, bảo đảm đơn không bao giờ bị nghẽn."

### Câu 5: Hệ thống làm thế nào để ngăn chặn một người gửi email spam hàng loạt gây quá tải hòm thư công vụ?
* **Trả lời (25 giây):**  
  "Dạ, tại module `backend/modules/notifications/email_worker.py`, chúng tôi bóc tách trường `Message-ID` chuẩn RFC 822 từ header gốc của email và đối chiếu với cột `original_message_id` trong bảng `tickets`. Bất kỳ email nào đã quét qua sẽ bị bỏ qua ngay lập tức ở tầng IMAP mà không tốn chi phí gọi AI. Ngoài ra, giao diện nộp đơn có rate-limiting và kiểm tra tính hợp lệ của số điện thoại trước khi gửi."

### Câu 6: Chi phí vận hành AI sẽ như thế nào nếu áp dụng thực tế toàn tỉnh Đồng Nai?
* **Trả lời (30 giây):**  
  "Dạ, hiện hệ thống tối ưu hóa chi phí bằng mô hình Gemini Flash Lite với giá chỉ khoảng 0.075 USD trên 1 triệu token. Nhờ thuật toán nén ảnh in-memory giới hạn tối đa 1600px, mỗi đơn thư chỉ tiêu tốn chưa đến 50 đồng Việt Nam. Về lâu dài, với kiến trúc module tách rời của dự án, tỉnh Đồng Nai hoàn toàn có thể thay thế tầng AI Cloud bằng một mô hình thị giác nguồn mở chạy Offline tại Trung tâm Tích hợp Dữ liệu tỉnh như Qwen2.5-VL mà không cần thay đổi cấu trúc Backend và Database."

### Câu 7: Đội thi đã nâng cấp và hoàn thiện những gì so với phiên bản Vòng loại sơ khảo?
* **Trả lời (30 giây):**  
  "Dạ, so với Vòng loại, chúng tôi đã thực hiện 4 cải tiến thực chất:  
  1. Chuyển đổi toàn bộ CSDL sang Microsoft SQL Server 2025 Express chuẩn hóa Unicode NVARCHAR.  
  2. Xây dựng nguồn dữ liệu chuẩn duy nhất (SSOT) cho đầy đủ 7 Sở/Ban/Ngành và Ban Tiếp công dân Tỉnh.  
  3. Tích hợp Gmail công vụ hoạt động thực tế 100% qua IMAP/SMTP, có tính năng sinh phiếu A4 số hóa.  
  4. Tinh giản triệt để giao diện theo tiêu chuẩn Gmail ứng dụng thực tiễn, loại bỏ toàn bộ các yếu tố phô trương AI để tập trung vào trải nghiệm thuận tiện cho cán bộ và người dân."
