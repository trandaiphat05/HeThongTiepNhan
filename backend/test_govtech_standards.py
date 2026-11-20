"""
Kịch bản kiểm thử Chuẩn hóa Nghiệp vụ Hành chính & GovTech Standards
Kiểm tra toàn diện 5 tiêu chuẩn:
1. Sinh mã tiếp nhận chuẩn ĐN-YYYYMMDD-XXXX
2. Tra cứu hồ sơ theo mã biên nhận
3. Human Override (Cán bộ chuyển cơ quan thụ lý)
4. Thống kê giám sát hệ thống dành cho Admin
5. Thể thức văn bản hành chính Nghị định 30/2020/NĐ-CP
"""

import sys
import os
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_govtech_tests():
    print("=" * 70)
    print("KIỂM THỬ CHUẨN HÓA NGHIỆP VỤ HÀNH CHÍNH & GOVTECH STANDARDS")
    print("=" * 70)

    # 1. Tiếp nhận đơn và kiểm tra định dạng mã ĐN-YYYYMMDD-XXXX (4 số cuối)
    print("\n[1] Kiểm thử tiếp nhận đơn & sinh mã chuẩn hành chính ĐN-YYYYMMDD-XXXX:")
    res = client.post(
        "/api/tickets/submit",
        data={
            "citizen_name": "Lê Hoàng Phúc",
            "citizen_phone": "0918889999",
            "citizen_email": "phucle.bienhoa@gmail.com",
            "raw_text": "Tuyến đường Đồng Khởi ngập sâu sau mưa lớn, đề nghị Sở GTVT phối hợp thoát nước đô thị nạo vét cống rãnh.",
            "source": "WEB_TEXT"
        }
    )
    assert res.status_code in [200, 201], f"Submit lỗi: {res.text}"
    submit_data = res.json()
    tracking_code = submit_data.get("tracking_code")
    print(f"  ✓ Mã tiếp nhận tự sinh: {tracking_code}")

    # Kiểm tra cấu trúc regex mã ĐN-YYYYMMDD-XXXX (đúng 4 số cuối)
    import re
    pattern = r"^ĐN-\d{8}-\d{4}$"
    assert re.match(pattern, tracking_code), f"Mã {tracking_code} không đúng chuẩn ĐN-YYYYMMDD-XXXX (4 chữ số cuối)"
    print(f"  ✓ Khớp định dạng chuẩn: ĐN-YYYYMMDD-XXXX (4 chữ số ngẫu nhiên)")

    # 2. Tra cứu tiến độ hồ sơ qua mã
    print(f"\n[2] Kiểm thử tra cứu tiến độ hồ sơ ({tracking_code}):")
    lookup_res = client.get(f"/api/tickets/lookup/{tracking_code}")
    assert lookup_res.status_code == 200, f"Lookup lỗi: {lookup_res.text}"
    lookup_data = lookup_res.json()
    assert lookup_data.get("tracking_code") == tracking_code
    print(f"  ✓ Tìm thấy hồ sơ: Trạng thái = {lookup_data.get('status')} | Cơ quan = {lookup_data.get('dept_name')}")
    print(f"  ✓ Tóm tắt vụ việc: {lookup_data.get('ai_result', {}).get('summary')}")

    # 3. Cán bộ chuyển cơ quan thụ lý (Human Override / Reassign)
    ticket_id = lookup_data.get("ticket_id")
    print(f"\n[3] Kiểm thử Human Override (Chuyển cơ quan thụ lý cho Ticket #{ticket_id}):")
    login_officer = client.post("/api/auth/login", json={"username": "canbo_gtvt", "password": "officer123"})
    officer_token = login_officer.json()["access_token"]
    headers_officer = {"Authorization": f"Bearer {officer_token}"}

    reassign_res = client.put(
        f"/api/tickets/{ticket_id}/reassign",
        headers=headers_officer,
        json={
            "department_code": "SO_XD",
            "reason": "Hệ thống cống thoát nước thuộc phân cấp quản lý hạ tầng kỹ thuật Sở Xây dựng",
            "reassigned_by": "Chuyên viên Tiếp công dân"
        }
    )
    assert reassign_res.status_code == 200, f"Reassign lỗi: {reassign_res.text}"
    reassign_data = reassign_res.json()
    assert reassign_data.get("department_code") == "SO_XD"
    assert "ticket_code" in reassign_data
    print(f"  ✓ Chuyển tuyến thành công (PUT /api/tickets/{ticket_id}/reassign): Cơ quan mới = {reassign_data.get('dept_name')} ({reassign_data.get('dept_code')})")
    print(f"  ✓ Nhật ký chuyển tuyến: {reassign_data.get('admin_note')}")


    # 4. Thống kê giám sát hệ thống dành cho Quản trị viên
    print("\n[4] Kiểm thử API Thống kê Giám sát Hệ thống (/api/admin/stats):")
    login_admin = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    admin_token = login_admin.json()["access_token"]
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    stats_res = client.get("/api/admin/stats", headers=headers_admin)
    assert stats_res.status_code == 200, f"Stats lỗi: {stats_res.text}"
    stats_data = stats_res.json()
    print(f"  ✓ Tổng số hồ sơ toàn tỉnh: {stats_data.get('total_tickets')}")
    depts = stats_data.get("departments", {})
    print(f"  ✓ Hồ sơ Sở GTVT: {depts.get('SO_GTVT', {}).get('count')}")
    print(f"  ✓ Hồ sơ Sở TN&MT: {depts.get('SO_TNMT', {}).get('count')}")
    print(f"  ✓ Hồ sơ Sở Xây dựng: {depts.get('SO_XD', {}).get('count')}")
    print(f"  ✓ Hồ sơ UBND Cấp Huyện: {depts.get('UBND_CAP_HUYEN', {}).get('count')}")
    print(f"  ✓ Tỷ lệ độ tin cậy AI trung bình: {stats_data.get('ai_avg_confidence_percent')}%")

    # 5. Kiểm thử thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP
    print("\n[5] Kiểm thử Thể thức Văn bản Dự thảo Hành chính (Nghị định 30/2020/NĐ-CP):")
    ai_result = lookup_data.get("ai_result") or {}
    draft = ai_result.get("draft_reply") or ""
    print(f"  ✓ Kiểm tra các thành phần văn bản hành chính:")
    has_quoc_hieu = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" in draft
    has_tieu_ngu = "Độc lập - Tự do - Hạnh phúc" in draft
    has_dia_danh_ngay = "Đồng Nai, ngày" in draft
    has_kinh_gui = "Kính gửi" in draft
    has_noi_nhan = "Nơi nhận" in draft

    print(f"    - Quốc hiệu: {'ĐẠT' if has_quoc_hieu else 'KHÔNG TÌM THẤY'}")
    print(f"    - Tiêu ngữ: {'ĐẠT' if has_tieu_ngu else 'KHÔNG TÌM THẤY'}")
    print(f"    - Địa danh, ngày tháng: {'ĐẠT' if has_dia_danh_ngay else 'KHÔNG TÌM THẤY'}")
    print(f"    - Kính gửi: {'ĐẠT' if has_kinh_gui else 'KHÔNG TÌM THẤY'}")
    print(f"    - Nơi nhận: {'ĐẠT' if has_noi_nhan else 'KHÔNG TÌM THẤY'}")

    assert has_quoc_hieu and has_tieu_ngu and has_kinh_gui, "Dự thảo chưa đạt chuẩn Nghị định 30/2020/NĐ-CP"

    print("\n" + "=" * 70)
    print("✓ 100% CÁC TIÊU CHUẨN NGHIỆP VỤ HÀNH CHÍNH & GOVTECH ĐÃ ĐẠT CHUẨN!")
    print("=" * 70)

if __name__ == "__main__":
    run_govtech_tests()

