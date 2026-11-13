"""
Core Database Module - Cung cấp kết nối và hàm khởi tạo CSDL
Tích hợp trực tiếp với modules.database (SQL Server 2025 Express)
"""

import os
import json
import logging
from core.config import BASE_DIR
from modules.database.connection import engine, SessionLocal, Base, get_db, USE_SQLITE
from modules.database.models import Department, User, Ticket, AIResult, RAGDoc

logger = logging.getLogger("DongNaiCivicDB")


def ensure_database_schema(eng):
    """Tự động kiểm tra và thêm các cột mới mở rộng cho users và tickets (MSSQL / SQLite)."""
    from sqlalchemy import text
    try:
        with eng.begin() as conn:
            dialect = eng.dialect.name
            if dialect == "mssql":
                statements = [
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'email') ALTER TABLE users ADD email NVARCHAR(100) NULL;",
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'gmail_account') ALTER TABLE users ADD gmail_account NVARCHAR(100) NULL;",
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'gmail_app_password') ALTER TABLE users ADD gmail_app_password NVARCHAR(255) NULL;",
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_synced_at') ALTER TABLE users ADD last_synced_at DATETIME NULL;",
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tickets') AND name = 'user_id') ALTER TABLE tickets ADD user_id INT NULL;",
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tickets') AND name = 'original_message_id') ALTER TABLE tickets ADD original_message_id NVARCHAR(255) NULL;",
                ]
                for stmt in statements:
                    try:
                        conn.execute(text(stmt))
                    except Exception as e:
                        logger.warning(f"Lỗi thực thi schema migration mssql: {e}")
            else:
                cols = [
                    ("users", "email", "TEXT"),
                    ("users", "gmail_account", "TEXT"),
                    ("users", "gmail_app_password", "TEXT"),
                    ("users", "last_synced_at", "DATETIME"),
                    ("tickets", "user_id", "INTEGER"),
                    ("tickets", "original_message_id", "TEXT"),
                ]
                for table, col, col_type in cols:
                    try:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                    except Exception:
                        pass
        logger.info("✓ ensure_database_schema() đã kiểm tra các cột mở rộng thành công.")
    except Exception as e:
        logger.warning(f"Lỗi kiểm tra schema CSDL: {e}")


DEPT_NAMES = {
    "SO_GTVT": "Sở Giao thông Vận tải",
    "SO_TNMT": "Sở Tài nguyên & Môi trường",
    "SO_XD": "Sở Xây dựng",
    "SO_XAYDUNG": "Sở Xây dựng",
    "SO_YTE": "Sở Y tế",
    "SO_YT": "Sở Y tế",
    "SO_GDDT": "Sở Giáo dục và Đào tạo",
    "SO_LDTBXH": "Sở Lao động - Thương binh và Xã hội",
    "CONG_AN_TINH": "Công an Tỉnh Đồng Nai",
    "UBND_CAP_HUYEN": "UBND Cấp Huyện / TP",
    "UBND_TINH": "UBND Tỉnh Đồng Nai",
    "REQUIRE_HUMAN_REVIEW": "Cần Admin Phân Luồng",
}

dept_header_map = {
    "SO_GTVT": ("SỞ GIAO THÔNG VẬN TẢI TỈNH ĐỒNG NAI", "Số: .../TB-SGTVT"),
    "SO_TNMT": ("SỞ TÀI NGUYÊN VÀ MÔI TRƯỜNG TỈNH ĐỒNG NAI", "Số: .../TB-STNMT"),
    "SO_XD": ("SỞ XÂY DỰNG TỈNH ĐỒNG NAI", "Số: .../TB-SXD"),
    "SO_XAYDUNG": ("SỞ XÂY DỰNG TỈNH ĐỒNG NAI", "Số: .../TB-SXD"),
    "SO_YTE": ("SỞ Y TẾ TỈNH ĐỒNG NAI", "Số: .../TB-SYT"),
    "SO_YT": ("SỞ Y TẾ TỈNH ĐỒNG NAI", "Số: .../TB-SYT"),
    "SO_GDDT": ("SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG NAI", "Số: .../TB-SGDDT"),
    "SO_LDTBXH": ("SỞ LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI TỈNH ĐỒNG NAI", "Số: .../TB-SLDTBXH"),
    "CONG_AN_TINH": ("CÔNG AN TỈNH ĐỒNG NAI", "Số: .../TB-CAT"),
    "UBND_TINH": ("ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI", "Số: .../TB-UBND"),
    "UBND_CAP_HUYEN": ("ỦY BAN NHÂN DÂN CẤP HUYỆN / TP", "Số: .../TB-UBND"),
    "REQUIRE_HUMAN_REVIEW": ("TỔ TIẾP NHẬN & ĐIỀU PHỐI ĐƠN THƯ TỈNH ĐỒNG NAI", "Số: .../TB-TĐP"),
}

all_default_depts = [
    Department(dept_code=u"SO_GTVT", dept_name=u"Sở Giao thông Vận tải", email_contact=u"sgtvt@dongnai.gov.vn"),
    Department(dept_code=u"SO_TNMT", dept_name=u"Sở Tài nguyên & Môi trường", email_contact=u"stnmt@dongnai.gov.vn"),
    Department(dept_code=u"SO_XD", dept_name=u"Sở Xây dựng", email_contact=u"sxd@dongnai.gov.vn"),
    Department(dept_code=u"SO_XAYDUNG", dept_name=u"Sở Xây dựng", email_contact=u"sxd@dongnai.gov.vn"),
    Department(dept_code=u"SO_YTE", dept_name=u"Sở Y tế", email_contact=u"syte@dongnai.gov.vn"),
    Department(dept_code=u"SO_YT", dept_name=u"Sở Y tế", email_contact=u"syte@dongnai.gov.vn"),
    Department(dept_code=u"SO_GDDT", dept_name=u"Sở Giáo dục và Đào tạo", email_contact=u"sgddt@dongnai.gov.vn"),
    Department(dept_code=u"SO_LDTBXH", dept_name=u"Sở Lao động - Thương binh và Xã hội", email_contact=u"sldtbxh@dongnai.gov.vn"),
    Department(dept_code=u"CONG_AN_TINH", dept_name=u"Công an Tỉnh Đồng Nai", email_contact=u"congan@dongnai.gov.vn"),
    Department(dept_code=u"UBND_CAP_HUYEN", dept_name=u"UBND Cấp Huyện / TP", email_contact=u"ubnd.bienhoa@dongnai.gov.vn"),
    Department(dept_code=u"UBND_TINH", dept_name=u"UBND Tỉnh Đồng Nai", email_contact=u"ubnd@dongnai.gov.vn"),
    Department(dept_code=u"REQUIRE_HUMAN_REVIEW", dept_name=u"Cần Admin Phân Luồng", email_contact=u"admin.donthu@dongnai.gov.vn"),
]


def seed_sqlite_database(sqlite_path: str):
    """Đảm bảo CSDL SQLite phụ trợ cũng được nạp đầy đủ danh mục 7 Sở và các tài khoản cán bộ hoạt động."""
    import sqlite3
    try:
        conn = sqlite3.connect(sqlite_path)
        cur = conn.cursor()
        
        # Đảm bảo bảng departments và users tồn tại
        cur.execute("""
            CREATE TABLE IF NOT EXISTS departments (
                dept_id INTEGER PRIMARY KEY AUTOINCREMENT,
                dept_code TEXT UNIQUE NOT NULL,
                dept_name TEXT NOT NULL,
                email_contact TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL,
                dept_code TEXT,
                officer_code TEXT,
                phone TEXT,
                email TEXT,
                gmail_account TEXT,
                gmail_app_password TEXT,
                last_synced_at DATETIME,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Danh mục 7 Sở cho SQLite
        sqlite_depts = [
            ("SO_GTVT", "Sở Giao thông Vận tải", "sgtvt@dongnai.gov.vn"),
            ("SO_TNMT", "Sở Tài nguyên & Môi trường", "stnmt@dongnai.gov.vn"),
            ("SO_XD", "Sở Xây dựng", "sxd@dongnai.gov.vn"),
            ("SO_XAYDUNG", "Sở Xây dựng", "sxd@dongnai.gov.vn"),
            ("SO_YTE", "Sở Y tế", "syte@dongnai.gov.vn"),
            ("SO_YT", "Sở Y tế", "syte@dongnai.gov.vn"),
            ("SO_GDDT", "Sở Giáo dục và Đào tạo", "sgddt@dongnai.gov.vn"),
            ("SO_LDTBXH", "Sở Lao động - Thương binh và Xã hội", "sldtbxh@dongnai.gov.vn"),
            ("CONG_AN_TINH", "Công an Tỉnh Đồng Nai", "congan@dongnai.gov.vn"),
            ("UBND_CAP_HUYEN", "UBND Cấp Huyện / TP", "ubnd.bienhoa@dongnai.gov.vn"),
            ("UBND_TINH", "UBND Tỉnh Đồng Nai", "ubnd@dongnai.gov.vn"),
            ("REQUIRE_HUMAN_REVIEW", "Cần Admin Phân Luồng", "admin.donthu@dongnai.gov.vn"),
        ]
        for code, name, email in sqlite_depts:
            cur.execute("""
                INSERT INTO departments (dept_code, dept_name, email_contact, is_active)
                VALUES (?, ?, ?, 1)
                ON CONFLICT(dept_code) DO UPDATE SET dept_name=excluded.dept_name, email_contact=excluded.email_contact, is_active=1
            """, (code, name, email))

        # Danh mục tài khoản cho SQLite
        sqlite_users = [
            ("admin", "admin123", "Quản trị viên Hệ thống", "ADMIN", "ALL"),
            ("admin_tinh", "admin123", "Nguyễn Văn Minh", "ADMIN", "UBND_TINH"),
            ("canbo_gtvt", "officer123", "Lê Thanh Bình", "OFFICER", "SO_GTVT"),
            ("canbo_tnmt", "officer123", "Hoàng Thị Yến", "OFFICER", "SO_TNMT"),
            ("canbo_xd", "officer123", "Đặng Quốc Huy", "OFFICER", "SO_XD"),
            ("canbo_xaydung", "officer123", "Đặng Quốc Huy", "OFFICER", "SO_XD"),
            ("canbo_soxd", "officer123", "Đặng Quốc Huy", "OFFICER", "SO_XD"),
            ("canbo_yte", "officer123", "Bác sĩ Phan Văn Nam", "OFFICER", "SO_YTE"),
            ("canbo_gddt", "officer123", "Thầy Trần Trọng Hiếu", "OFFICER", "SO_GDDT"),
            ("canbo_ldtbxh", "officer123", "Lê Thị Thảo", "OFFICER", "SO_LDTBXH"),
            ("canbo_congan", "officer123", "Trần Văn An", "OFFICER", "CONG_AN_TINH"),
            ("motcua_bienhoa", "officer123", "Vũ Thị Ngọc", "OFFICER", "UBND_CAP_HUYEN"),
            ("canbo_motcua", "officer123", "Vũ Thị Ngọc", "OFFICER", "UBND_CAP_HUYEN"),
            ("congdan1", "citizen123", "Nguyễn Văn Công Dân", "CITIZEN", "CITIZEN"),
        ]
        for uname, pwd, fname, role, dcode in sqlite_users:
            cur.execute("""
                INSERT INTO users (username, password_hash, full_name, role, dept_code, is_active)
                VALUES (?, ?, ?, ?, ?, 1)
                ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash, full_name=excluded.full_name, role=excluded.role, dept_code=excluded.dept_code, is_active=1
            """, (uname, pwd, fname, role, dcode))

        conn.commit()
        conn.close()
        logger.info(f"✓ Đã đồng bộ tài khoản và danh mục 7 Sở vào SQLite ({sqlite_path}) thành công.")
    except Exception as sq_err:
        logger.warning(f"Lỗi đồng bộ SQLite ({sqlite_path}): {sq_err}")


def init_db(clean_existing: bool = False):
    """
    Khởi tạo toàn bộ bảng và nạp dữ liệu mẫu ban đầu chuẩn Unicode tiếng Việt vào SQL Server.
    - clean_existing=True: Dọn dẹp (delete) dữ liệu mẫu cũ để tránh xung đột hoặc trùng lặp bản ghi lỗi font.
    - Tự động phát hiện và dọn dẹp nếu phát hiện dữ liệu cũ bị biến đổi ký tự thành dấu '?'.
    - Đảm bảo toàn bộ chuỗi tiếng Việt nạp vào có tiền tố Unicode u"..." chuẩn.
    """
    # 1. Tự động sinh bảng nếu chưa có trong SQL Server với kiểu NVARCHAR
    Base.metadata.create_all(bind=engine)
    ensure_database_schema(engine)
    logger.info("✓ Base.metadata.create_all(bind=engine) đã thực thi trên SQL Server.")

    db = SessionLocal()
    try:
        # Tự động kiểm tra làm sạch dữ liệu cũ lỗi font
        should_clean = clean_existing
        if not should_clean:
            dept_sample = db.query(Department).first()
            if dept_sample and "?" in (dept_sample.dept_name or ""):
                should_clean = True
                logger.warning("Phát hiện dữ liệu mẫu cũ bị lỗi font '?'. Tự động dọn dẹp để nạp lại Unicode chuẩn...")

        if should_clean:
            logger.info("Đang làm sạch dữ liệu cũ theo thứ tự khóa ngoại...")
            db.query(AIResult).delete()
            db.query(Ticket).delete()
            db.query(User).delete()
            db.query(Department).delete()
            db.commit()
            logger.info("✓ Đã dọn dẹp sạch sẽ các bản ghi cũ.")

        # 2. Nạp danh mục phòng ban chuẩn với tiền tố Unicode u"..."
        existing_dept_codes = {d.dept_code for d in db.query(Department).all()}
        depts_to_add = [d for d in all_default_depts if d.dept_code not in existing_dept_codes]
        if depts_to_add:
            db.add_all(depts_to_add)
            db.commit()
            logger.info(f"✓ Đã đồng bộ danh mục {len(depts_to_add)} Sở/Ban/Ngành chuẩn Unicode vào SQL Server.")

        # 3. Nạp danh sách người dùng mặc định và đảm bảo tài khoản đang active
        default_users = [
            User(username=u"admin", password_hash=u"admin123", full_name=u"Quản trị viên Hệ thống", role=u"ADMIN", dept_code=u"ALL", is_active=True),
            User(username=u"admin_tinh", password_hash=u"admin123", full_name=u"Nguyễn Văn Minh", role=u"ADMIN", dept_code=u"UBND_TINH", is_active=True),
            User(username=u"canbo_gtvt", password_hash=u"officer123", full_name=u"Lê Thanh Bình", role=u"OFFICER", dept_code=u"SO_GTVT", is_active=True),
            User(username=u"canbo_tnmt", password_hash=u"officer123", full_name=u"Hoàng Thị Yến", role=u"OFFICER", dept_code=u"SO_TNMT", is_active=True),
            User(username=u"canbo_xd", password_hash=u"officer123", full_name=u"Đặng Quốc Huy", role=u"OFFICER", dept_code=u"SO_XD", is_active=True),
            User(username=u"canbo_xaydung", password_hash=u"officer123", full_name=u"Đặng Quốc Huy", role=u"OFFICER", dept_code=u"SO_XD", is_active=True),
            User(username=u"canbo_soxd", password_hash=u"officer123", full_name=u"Đặng Quốc Huy", role=u"OFFICER", dept_code=u"SO_XD", is_active=True),
            User(username=u"canbo_yte", password_hash=u"officer123", full_name=u"Bác sĩ Phan Văn Nam", role=u"OFFICER", dept_code=u"SO_YTE", is_active=True),
            User(username=u"canbo_gddt", password_hash=u"officer123", full_name=u"Thầy Trần Trọng Hiếu", role=u"OFFICER", dept_code=u"SO_GDDT", is_active=True),
            User(username=u"canbo_ldtbxh", password_hash=u"officer123", full_name=u"Lê Thị Thảo", role=u"OFFICER", dept_code=u"SO_LDTBXH", is_active=True),
            User(username=u"canbo_congan", password_hash=u"officer123", full_name=u"Trần Văn An", role=u"OFFICER", dept_code=u"CONG_AN_TINH", is_active=True),
            User(username=u"motcua_bienhoa", password_hash=u"officer123", full_name=u"Vũ Thị Ngọc", role=u"OFFICER", dept_code=u"UBND_CAP_HUYEN", is_active=True),
            User(username=u"canbo_motcua", password_hash=u"officer123", full_name=u"Vũ Thị Ngọc", role=u"OFFICER", dept_code=u"UBND_CAP_HUYEN", is_active=True),
            User(username=u"congdan1", password_hash=u"citizen123", full_name=u"Nguyễn Văn Công Dân", role=u"CITIZEN", dept_code=u"CITIZEN", is_active=True),
        ]
        existing_users = {u.username: u for u in db.query(User).all()}
        users_to_add = []
        for du in default_users:
            if du.username not in existing_users:
                users_to_add.append(du)
            else:
                eu = existing_users[du.username]
                eu.is_active = True
                if not eu.password_hash or eu.password_hash == "":
                    eu.password_hash = du.password_hash
                if not eu.dept_code:
                    eu.dept_code = du.dept_code
        if users_to_add:
            db.add_all(users_to_add)
        db.commit()
        logger.info("✓ Đã đồng bộ danh sách tài khoản Cán bộ 7 Sở, Admin & Công dân active chuẩn Unicode vào CSDL.")

        # 4. Nạp hồ sơ mẫu ban đầu nếu rỗng với tiền tố Unicode u"..."
        if db.query(Ticket).count() == 0:
            today_str = datetime.now().strftime("%Y%m%d")
            ticket1 = Ticket(
                tracking_code=f"ĐN-{today_str}-001",
                source=u"WEB_TEXT",
                citizen_name=u"Nguyễn Văn Hùng",
                citizen_phone=u"0912345678",
                citizen_email=u"hung.nv@gmail.com",
                raw_text=u"Đoạn đg Nguyễn Ái Quốc gần ngã tư Tân Phong bh bị sụt lún ổ gà nhiều quá trời, xe cộ đi lại dễ té ngã liên tục. Đề nghị sửa gấp giùm dân.",
                status=u"ROUTED",
                dept_code=u"SO_GTVT",
                dept_name=u"Sở Giao thông Vận tải",
                priority=u"CAO",
            )
            db.add(ticket1)
            db.commit()
            db.refresh(ticket1)

            ai_res1 = AIResult(
                ticket_id=ticket1.ticket_id,
                extracted_text=u"Đoạn đường Nguyễn Ái Quốc gần ngã tư Tân Phong, thành phố Biên Hòa bị sụt lún xuất hiện nhiều ổ gà lớn, phương tiện giao thông di chuyển dễ té ngã liên tục. Đề nghị cơ quan chức năng sửa chữa gấp cho người dân.",
                summary=u"Đường Nguyễn Ái Quốc gần ngã tư Tân Phong (Biên Hòa) bị sụt lún, xuất hiện ổ gà gây nguy cơ tai nạn giao thông.",
                department_code=u"SO_GTVT",
                priority=u"CAO",
                entities_json=json.dumps({
                    "locations": [u"Đường Nguyễn Ái Quốc", u"Ngã tư Tân Phong", u"TP. Biên Hòa"],
                    "issues": [u"Sụt lún mặt đường", u"Ổ gà lớn", u"Nguy cơ tai nạn giao thông"]
                }, ensure_ascii=False),
                legal_basis=u"Điều 37, Điều 38 Luật Giao thông đường bộ 2008 và Nghị định 11/2010/NĐ-CP về quản lý và bảo vệ kết cấu hạ tầng giao thông đường bộ.",
                draft_reply=u"Kính gửi ông Nguyễn Văn Hùng, Sở Giao thông Vận tải tỉnh Đồng Nai trân trọng cảm ơn thông tin phản ánh kịp thời của ông về tình trạng hư hỏng mặt đường tại đường Nguyễn Ái Quốc. Sở đã cử Ban Quản lý kiểm tra và lên phương án dặm vá khẩn cấp trong vòng 24 giờ tới.",
                confidence_score=0.96
            )
            db.add(ai_res1)

            ticket2 = Ticket(
                tracking_code=f"ĐN-{today_str}-002",
                source=u"WEB_IMAGE",
                citizen_name=u"Trần Thị Mai",
                citizen_phone=u"0988765432",
                citizen_email=u"mai.tran@gmail.com",
                raw_text=u"Đơn giấy chụp tại Một cửa: Nhà hàng xóm ở KP4 phường Trảng Dài tối nào cũng mở loa kẹo kéo hát karaoke đến 1-2h sáng gây ồn ào không ngủ được.",
                image_url=u"https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80",
                status=u"ROUTED",
                dept_code=u"UBND_CAP_HUYEN",
                dept_name=u"UBND TP. Biên Hòa",
                priority=u"TRUNG_BINH",
            )
            db.add(ticket2)
            db.commit()
            db.refresh(ticket2)

            ai_res2 = AIResult(
                ticket_id=ticket2.ticket_id,
                extracted_text=u"Đơn kiến nghị: Tôi tên Trần Thị Mai, Khu phố 4, phường Trảng Dài, TP. Biên Hòa. Tôi xin phản ánh hộ gia đình hàng xóm thường xuyên mở loa kẹo kéo hát karaoke quá 22h đêm đến 1-2 giờ sáng, gây ô nhiễm tiếng ồn nghiêm trọng.",
                summary=u"Hộ dân tại KP4, phường Trảng Dài sử dụng loa kẹo kéo hát karaoke quá 22h đêm gây ô nhiễm tiếng ồn khu dân cư.",
                department_code=u"UBND_CAP_HUYEN",
                priority=u"TRUNG_BINH",
                entities_json=json.dumps({
                    "locations": [u"Khu phố 4", u"Phường Trảng Dài", u"TP. Biên Hòa"],
                    "issues": [u"Hát karaoke loa kẹo kéo quá 22h", u"Gây tiếng ồn khu dân cư"]
                }, ensure_ascii=False),
                legal_basis=u"Điều 8 Nghị định số 144/2021/NĐ-CP về an ninh trật tự khu dân cư.",
                draft_reply=u"Kính gửi bà Trần Thị Mai, UBND TP. Biên Hòa đã chỉ đạo UBND phường Trảng Dài cùng Công an phường kiểm tra, nhắc nhở và xử phạt nếu tái phạm.",
                confidence_score=0.94
            )
            db.add(ai_res2)

            ticket3 = Ticket(
                tracking_code=f"ĐN-{today_str}-004",
                source=u"EMAIL",
                citizen_name=u"Trịnh Quốc Bảo",
                citizen_phone=u"0909556677",
                citizen_email=u"bao.trinh@gmail.com",
                raw_text=u"Công trình xây dựng đào móng làm nứt toác toàn bộ tường nhà tôi, nguy cơ sụp đổ bất cứ lúc nào, xe chở đất cát làm rơi vãi ngập bùn đất và gây tắc cống.",
                status=u"HUMAN_REVIEW",
                dept_code=u"REQUIRE_HUMAN_REVIEW",
                dept_name=u"Cần Admin Phân Luồng",
                priority=u"CAO",
            )
            db.add(ticket3)
            db.commit()
            db.refresh(ticket3)

            ai_res3 = AIResult(
                ticket_id=ticket3.ticket_id,
                extracted_text=u"Công trình xây dựng thi công đào móng làm nứt tường nhà dân liền kề; xe chở đất cát làm rơi vãi gây ngập bùn đất và tắc cống thoát nước.",
                summary=u"Công trình xây dựng thi công làm nứt nhà dân liền kề và gây ô nhiễm tắc cống đường.",
                department_code=u"REQUIRE_HUMAN_REVIEW",
                priority=u"CAO",
                entities_json=json.dumps({
                    "locations": [u"Đồng Nai"],
                    "issues": [u"Thi công nứt tường nhà dân", u"Rơi vãi đất cát", u"Tắc cống"]
                }, ensure_ascii=False),
                legal_basis=u"Đơn thư đa lĩnh vực giao thoa giữa Sở Xây dựng và Sở GTVT/UBND địa phương. Độ tự tin 62% (< 65%). Chờ Admin chỉ định đơn vị chủ trì.",
                draft_reply=u"Hồ sơ đa ngành phức tạp đang được chuyển đến Quản trị viên để phân bổ đơn vị chủ trì kiểm tra liên ngành.",
                confidence_score=0.62
            )
            db.add(ai_res3)

            db.commit()
            logger.info("✓ Đã nạp các đơn thư mẫu chuẩn Unicode tiếng Việt vào SQL Server.")
    except Exception as e:
        logger.error(f"Lỗi khởi tạo dữ liệu mẫu: {e}")
        db.rollback()
    finally:
        db.close()

    # 5. Đồng bộ luôn CSDL SQLite phụ trợ backend/dongnai_civic.db
    sqlite_path = os.path.join(BASE_DIR, "dongnai_civic.db")
    seed_sqlite_database(sqlite_path)


__all__ = [
    "engine",
    "SessionLocal",
    "Base",
    "get_db",
    "init_db",
    "USE_SQLITE",
    "Department",
    "User",
    "Ticket",
    "AIResult",
    "RAGDoc",
    "DEPT_NAMES",
    "dept_header_map",
    "all_default_depts",
    "seed_sqlite_database",
]
