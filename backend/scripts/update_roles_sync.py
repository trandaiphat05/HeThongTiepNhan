import sys
import os
import sqlite3

# Thêm đường dẫn backend
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from core.database import engine
from sqlalchemy import text

print("=== 1. CẬP NHẬT TRỰC TIẾP SQL SERVER ===")
try:
    with engine.begin() as conn:
        # Cập nhật họ tên & chức danh hiển thị của canbo_motcua và motcua_bienhoa
        res_u = conn.execute(
            text("UPDATE users SET full_name = :fn WHERE username IN ('canbo_motcua', 'motcua_bienhoa')"),
            {"fn": "Vũ Thị Ngọc - Chuyên viên Tiếp công dân"}
        )
        print(f"[*] Đã cập nhật bảng users: {res_u.rowcount} dòng.")

        # Cập nhật tên phòng ban hiển thị sang Ban Tiếp công dân Tỉnh
        res_d = conn.execute(
            text("UPDATE departments SET dept_name = :dn WHERE dept_code IN ('UBND_CAP_HUYEN', 'BO_PHAN_MOT_CUA')"),
            {"dn": "Ban Tiếp công dân Tỉnh"}
        )
        print(f"[*] Đã cập nhật bảng departments: {res_d.rowcount} dòng.")

        # Cập nhật tiêu đề hiển thị trong kho văn bản RAG
        conn.execute(
            text("UPDATE rag_docs SET title = :t1 WHERE doc_id = 15"),
            {"t1": "8. LĨNH VỰC THỦ TỤC HÀNH CHÍNH & TIẾP CÔNG DÂN - 8.1. Thẩm quyền Ban Tiếp công dân Tỉnh"}
        )
        conn.execute(
            text("UPDATE rag_docs SET title = :t2 WHERE doc_id = 16"),
            {"t2": "8. LĨNH VỰC THỦ TỤC HÀNH CHÍNH & TIẾP CÔNG DÂN - 8.2. Căn cứ pháp lý viện dẫn lĩnh vực Ban Tiếp công dân"}
        )
        print("[*] Đã cập nhật tiêu đề điều luật RAG (doc_id 15, 16).")

        # Kiểm tra xác thực
        users_check = conn.execute(
            text("SELECT user_id, username, full_name, role, dept_code FROM users WHERE username IN ('canbo_motcua', 'motcua_bienhoa')")
        ).fetchall()
        for u in users_check:
            print("   -> User sau cập nhật:", dict(u._mapping))

        depts_check = conn.execute(
            text("SELECT dept_id, dept_code, dept_name FROM departments WHERE dept_code IN ('UBND_CAP_HUYEN', 'BO_PHAN_MOT_CUA')")
        ).fetchall()
        for d in depts_check:
            print("   -> Dept sau cập nhật:", dict(d._mapping))

except Exception as err:
    print(f"[!] Lỗi cập nhật SQL Server: {err}")

print("\n=== 2. CẬP NHẬT DATABASE DỰ PHÒNG SQLITE ===")
sqlite_path = os.path.join(backend_dir, "dongnai_civic.db")
if os.path.exists(sqlite_path):
    try:
        s_conn = sqlite3.connect(sqlite_path)
        cur = s_conn.cursor()
        cur.execute(
            "UPDATE users SET full_name = ? WHERE username IN ('canbo_motcua', 'motcua_bienhoa')",
            ("Vũ Thị Ngọc - Chuyên viên Tiếp công dân",)
        )
        print(f"[*] Đã cập nhật users SQLite: {cur.rowcount} dòng.")

        cur.execute(
            "UPDATE departments SET dept_name = ? WHERE dept_code IN ('UBND_CAP_HUYEN', 'BO_PHAN_MOT_CUA')",
            ("Ban Tiếp công dân Tỉnh",)
        )
        print(f"[*] Đã cập nhật departments SQLite: {cur.rowcount} dòng.")

        # Cập nhật rag_docs trong SQLite nếu có
        cur.execute(
            "UPDATE rag_docs SET title = ? WHERE doc_id = 15",
            ("8. LĨNH VỰC THỦ TỤC HÀNH CHÍNH & TIẾP CÔNG DÂN - 8.1. Thẩm quyền Ban Tiếp công dân Tỉnh",)
        )
        cur.execute(
            "UPDATE rag_docs SET title = ? WHERE doc_id = 16",
            ("8. LĨNH VỰC THỦ TỤC HÀNH CHÍNH & TIẾP CÔNG DÂN - 8.2. Căn cứ pháp lý viện dẫn lĩnh vực Ban Tiếp công dân",)
        )

        s_conn.commit()
        s_conn.close()
        print("[*] SQLite đồng bộ thành công.")
    except Exception as err:
        print(f"[!] Lỗi cập nhật SQLite: {err}")

print("=== HOÀN TẤT ĐỒNG BỘ CSDL ===")
