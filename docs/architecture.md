# KIẾN TRÚC HỆ THỐNG ĐIỀU PHỐI ĐƠN THƯ AI - TỈNH ĐỒNG NAI

## 1. Sơ đồ Tổng thể Hệ thống

```mermaid
flowchart TD
    subgraph Citizens["Người Dân (3 Kênh)"]
        C1["Kênh 1: Web Form (Văn bản tự do)"]
        C2["Kênh 2: Ảnh chụp đơn viết tay"]
        C3["Kênh 3: Email công vụ tỉnh"]
    end

    subgraph API_Gateway["Hạ tầng Cổng tiếp nhận (FastAPI)"]
        EP1["POST /api/tickets/submit"]
        BG["FastAPI BackgroundTasks"]
        EP2["GET /api/tickets (Dashboard Cán bộ)"]
        EP3["PUT /api/tickets/{id}/approve (Duyệt kết quả)"]
    end

    subgraph AI_Engine["Lõi AI (Gemini 3.8 / 1.5 Flash)"]
        OCR["Multimodal OCR Chữ viết tay"]
        NLU["Chuẩn hóa ngôn ngữ & Trích xuất thực thể"]
        Router["Định tuyến thẩm quyền Sở/Ngành"]
        RAG["Đối chiếu căn cứ pháp lý Đồng Nai"]
        Draft["Tự động soạn dự thảo phản hồi"]
    end

    subgraph Storage["Cơ sở dữ liệu (MS SQL Server)"]
        T_Users["Bảng Users"]
        T_Depts["Bảng Departments"]
        T_Tickets["Bảng Tickets"]
        T_AI["Bảng AI_Results"]
        T_RAG["Bảng RAG_Docs"]
    end

    subgraph Officers["Phân hệ Cán bộ & Quản trị"]
        O_OneStop["Cán bộ Một cửa (Quét camera điện thoại)"]
        O_Dept["Cán bộ Sở/Ngành (Màn hình 2 cột, duyệt trả lời)"]
        O_Admin["Quản trị viên (Cập nhật RAG, xử lý ngoại lệ)"]
    end

    C1 --> EP1
    C2 --> EP1
    C3 -->|IMAP Worker 60s| EP1
    EP1 -->|Trả mã Tracking < 500ms| Citizens
    EP1 --> BG
    BG --> AI_Engine
    AI_Engine --> Storage
    Storage --> EP2
    Officers --> EP2
    Officers --> EP3
```

---

## 2. Thiết kế Cơ sở Dữ liệu (MS SQL Server)

### 2.1. Bảng `Departments` (Sở, Ban, Ngành)
```sql
CREATE TABLE Departments (
    dept_id INT IDENTITY(1,1) PRIMARY KEY,
    dept_code NVARCHAR(50) UNIQUE NOT NULL, -- SO_GTVT, SO_TNMT, SO_XD, UBND_CAP_HUYEN
    dept_name NVARCHAR(255) NOT NULL,
    email_contact NVARCHAR(100) NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);
```

### 2.2. Bảng `Users` (Cán bộ & Admin)
```sql
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    role NVARCHAR(20) NOT NULL, -- 'ADMIN', 'OFFICER', 'ONE_STOP'
    dept_id INT FOREIGN KEY REFERENCES Departments(dept_id),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);
```

### 2.3. Bảng `Tickets` (Hồ sơ đơn thư)
```sql
CREATE TABLE Tickets (
    ticket_id INT IDENTITY(1,1) PRIMARY KEY,
    tracking_code NVARCHAR(30) UNIQUE NOT NULL, -- ĐN-YYYYMMDD-XXXX
    source NVARCHAR(20) NOT NULL, -- 'WEB_TEXT', 'WEB_PHOTO', 'EMAIL', 'ONE_STOP'
    citizen_name NVARCHAR(100) NULL,
    citizen_email NVARCHAR(100) NULL,
    citizen_phone NVARCHAR(20) NULL,
    raw_text NVARCHAR(MAX) NULL,
    image_url NVARCHAR(500) NULL,
    status NVARCHAR(30) DEFAULT 'PROCESSING', -- 'PROCESSING', 'ROUTED', 'APPROVED', 'REJECTED', 'HUMAN_REVIEW'
    dept_id INT NULL FOREIGN KEY REFERENCES Departments(dept_id),
    priority NVARCHAR(20) DEFAULT 'TRUNG_BINH',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
```

### 2.4. Bảng `AI_Results` (Kết quả phân tích từ Gemini)
```sql
CREATE TABLE AI_Results (
    result_id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_id INT UNIQUE FOREIGN KEY REFERENCES Tickets(ticket_id),
    extracted_text NVARCHAR(MAX) NOT NULL,
    summary NVARCHAR(500) NOT NULL,
    department_code NVARCHAR(50) NOT NULL,
    priority NVARCHAR(20) NOT NULL,
    entities_json NVARCHAR(MAX) NOT NULL,
    legal_basis NVARCHAR(MAX) NULL,
    draft_reply NVARCHAR(MAX) NOT NULL,
    confidence_score FLOAT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);
```

### 2.5. Bảng `RAG_Docs` (Kho văn bản pháp lý Đồng Nai)
```sql
CREATE TABLE RAG_Docs (
    doc_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    category NVARCHAR(50) NOT NULL, -- 'GIAO_THONG', 'MOI_TRUONG', 'XAY_DUNG', 'DAT_DAI', 'DAN_SU'
    regulation_content NVARCHAR(MAX) NOT NULL,
    effective_date DATE NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
```

