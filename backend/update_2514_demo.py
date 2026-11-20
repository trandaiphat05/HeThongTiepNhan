"""
Script chuẩn hóa hồ sơ ĐN-20261120-2514 cho buổi Demo:
1. Chuẩn hóa nội dung email (gộp dòng giữa câu, giữ 6 đoạn văn).
2. Tạo ảnh scan văn bản A4 (800x1100) chuẩn hành chính, không tràn sang trang 2.
3. Cập nhật ai_results: Tóm tắt đầy đủ 'ô nhiễm môi trường', dự thảo văn bản trả lời chuẩn Nghị định 30 năm 2026.
4. Đồng bộ cả SQL Server (DongNaiCivicDB) và SQLite (dongnai_civic.db).
"""

import os
import sys
from datetime import datetime

# Đảm bảo UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from core.database import SessionLocal
from modules.database.models import Ticket, AIResult
from modules.notifications.email_worker import create_email_a4_document, normalize_email_body

def main():
    with SessionLocal() as db:
        t = db.query(Ticket).filter(Ticket.tracking_code.like('%2514%')).first()
        if not t:
            print("Không tìm thấy hồ sơ ĐN-20261120-2514 trong DB!")
            return

        print(f"Đang chuẩn hóa hồ sơ: {t.tracking_code}")
        
        raw_content = t.raw_text or ""
        body_part = raw_content.replace("Tiêu đề: Tình trạng ngập nước, kẹt xe với rác thải ngập ngụa", "").strip()
        clean_body = normalize_email_body(body_part)
        t.raw_text = f"Tiêu đề: Tình trạng ngập nước, kẹt xe với rác thải ngập ngụa\n\n{clean_body}"

        # 2. Tạo ảnh scan A4 tỉ lệ 800x1100
        a4_path = create_email_a4_document(
            tracking_code=t.tracking_code,
            citizen_name=t.citizen_name or "Thu Phuong Pham",
            citizen_email=t.citizen_email or "phamthuphuong@gmail.com",
            subject="Tình trạng ngập nước, kẹt xe với rác thải ngập ngụa",
            body_text=clean_body,
            created_at=t.created_at
        )
        t.image_url = f"/uploads/{os.path.basename(a4_path)}"

        # 3. Cập nhật AIResult
        ai = db.query(AIResult).filter(AIResult.ticket_id == t.ticket_id).first()
        if ai:
            ai.summary = "Người dân phản ánh tình trạng ngập úng đường sá, ùn tắc giao thông giờ cao điểm và ô nhiễm môi trường do rác thải tại khu dân cư."
            ai.extracted_text = clean_body
            ai.draft_reply = """CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-------------------------------

SỞ GIAO THÔNG VẬN TẢI TỈNH ĐỒNG NAI
Số: .../TB-SGTVT                               Đồng Nai, ngày 20 tháng 11 năm 2026

THÔNG BÁO
V/v trả lời phản ánh, kiến nghị của công dân Thu Phuong Pham
(Mã hồ sơ: ĐN-20261120-2514)

Kính gửi: Ông/Bà Thu Phuong Pham,

- Căn cứ pháp lý: Luật Giao thông đường bộ 2008 và Nghị định số 11/2010/NĐ-CP về quản lý kết cấu hạ tầng giao thông đường bộ;
- Xét nội dung phản ánh: "Người dân phản ánh tình trạng ngập úng đường sá, ùn tắc giao thông giờ cao điểm và ô nhiễm môi trường do rác thải tại khu dân cư."

Sở Giao thông Vận tải thông báo nội dung xử lý/hướng dẫn cụ thể như sau:
1. Đã tiếp nhận nội dung và cử tổ thanh tra chuyên ngành kiểm tra thực địa hạ tầng thoát nước, tổ chức giao thông và xử lý các điểm đen ùn tắc.
2. Biện pháp xử lý: Sở GTVT phối hợp với các cơ quan chức năng địa phương kiểm tra nạo vét hệ thống thoát nước, phân luồng giao thông và thu gom rác thải dứt điểm.
3. Thời hạn hoàn thành: Kết quả xử lý cụ thể sẽ được thông báo đến công dân trong thời hạn 05 ngày làm việc.
4. Đề nghị Ông/Bà cung cấp bổ sung thông tin địa chỉ, vị trí cụ thể của vụ việc để cơ quan chức năng có cơ sở kiểm tra và xử lý thực tế.

Nơi nhận:
- Công dân Thu Phuong Pham (để biết);
- Ban Giám đốc Sở;
- Lưu: VT, Tổ Tiếp nhận đơn thư."""

        db.commit()
        print(f"✓ Đã cập nhật thành công SQL Server cho hồ sơ {t.tracking_code}")
        print(f"✓ Ảnh A4 đã lưu tại: {t.image_url}")

    # Đồng bộ SQLite nếu có
    sqlite_path = os.path.join(BASE_DIR, "dongnai_civic.db")
    if os.path.exists(sqlite_path):
        import sqlite3
        conn = sqlite3.connect(sqlite_path)
        cur = conn.cursor()
        cur.execute("SELECT ticket_id, tracking_code FROM tickets WHERE tracking_code LIKE '%2514%'")
        row = cur.fetchone()
        if row:
            t_id, code = row
            cur.execute("UPDATE tickets SET image_url = ?, raw_text = ? WHERE ticket_id = ?", (f"/uploads/{os.path.basename(a4_path)}", t.raw_text, t_id))
            cur.execute("UPDATE ai_results SET summary = ?, extracted_text = ?, draft_reply = ? WHERE ticket_id = ?", (ai.summary, ai.extracted_text, ai.draft_reply, t_id))
            conn.commit()
            print(f"✓ Đã đồng bộ sang SQLite database: {code}")
        conn.close()

if __name__ == "__main__":
    main()
