"""
Kịch bản kiểm thử toàn diện DEMO READINESS cho Hệ thống Tiếp nhận & Điều phối Đơn thư Đồng Nai
"""
import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("BẮT ĐẦU KIỂM THỬ DEMO READINESS TOÀN DIỆN")
    print("=" * 60)

    # 1. Kiểm tra xác thực 3 vai trò
    print("\n[1] Kiểm tra 3 nút đăng nhập nhanh (Quick Login):")
    credentials = [
        ("canbo_gtvt", "officer123", "OFFICER", "SO_GTVT"),
        ("admin", "admin123", "ADMIN", "ALL"),
        ("congdan1", "citizen123", "CITIZEN", "CITIZEN"),
    ]
    officer_token = None
    admin_token = None
    for username, password, expected_role, expected_dept in credentials:
        res = client.post("/api/auth/login", json={"username": username, "password": password})
        assert res.status_code == 200, f"Đăng nhập thất bại: {res.text}"
        data = res.json()
        user = data.get("user", {})
        token = data.get("access_token")
        if username == "canbo_gtvt":
            officer_token = token
        elif username == "admin":
            admin_token = token
        assert user.get("role") == expected_role, f"Role sai: {user.get('role')} != {expected_role}"
        print(f"  ✓ Đăng nhập [{username}]: Token hợp lệ, Role = {user.get('role')}, Dept = {user.get('department_code')}")

    # 2. Kiểm tra phục vụ ảnh tĩnh (/uploads/)
    print("\n[2] Kiểm tra Static Files mount (/uploads/) phục vụ xem trước:")
    test_images = [
        "/uploads/demo_ql1k_p1.jpg",
        "/uploads/demo_ql1k_p2.jpg",
        "/uploads/demo_datdai_vinhcuu_p1.jpg",
        "/uploads/demo_datdai_vinhcuu_p2.jpg",
    ]
    for img_path in test_images:
        res = client.get(img_path)
        assert res.status_code == 200, f"Ảnh {img_path} bị lỗi HTTP {res.status_code}"
        print(f"  ✓ File {img_path}: HTTP {res.status_code} ({len(res.content)} bytes, header Content-Type={res.headers.get('content-type')})")

    # 3. Kiểm tra danh sách hồ sơ (/api/tickets)
    print("\n[3] Kiểm tra API danh sách hồ sơ thẩm định (/api/tickets):")
    headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}
    res = client.get("/api/tickets", headers=headers)
    assert res.status_code == 200
    tickets = res.json()
    print(f"  ✓ Tổng số hồ sơ trong CSDL: {len(tickets)} hồ sơ")

    demo_1 = next((t for t in tickets if t.get("tracking_code") == "ĐN-20261104-001"), None)
    demo_2 = next((t for t in tickets if t.get("tracking_code") == "ĐN-20261104-002"), None)

    assert demo_1 is not None, "Không tìm thấy hồ sơ demo 1 (ĐN-20261104-001)"
    assert demo_2 is not None, "Không tìm thấy hồ sơ demo 2 (ĐN-20261104-002)"

    print(f"  ✓ Hồ sơ 1: {demo_1['tracking_code']} -> Phòng: {demo_1['dept_name']} | Ưu tiên: {demo_1['priority']} | Trạng thái: {demo_1['status']}")
    print(f"    - Ảnh đính kèm: {demo_1['image_urls']}")
    print(f"    - Tóm tắt AI: {demo_1['ai_result']['summary']}")
    print(f"    - Căn cứ pháp lý: {demo_1['ai_result']['legal_basis'][:60]}...")

    print(f"  ✓ Hồ sơ 2: {demo_2['tracking_code']} -> Phòng: {demo_2['dept_name']} | Ưu tiên: {demo_2['priority']} | Trạng thái: {demo_2['status']}")
    print(f"    - Ảnh đính kèm: {demo_2['image_urls']}")
    print(f"    - Tóm tắt AI: {demo_2['ai_result']['summary']}")
    print(f"    - Căn cứ pháp lý: {demo_2['ai_result']['legal_basis'][:60]}...")

    # 4. Kiểm tra nộp đơn và định tuyến AI
    print("\n[4] Kiểm tra API tiếp nhận đơn trực tiếp (/api/tickets/submit):")
    res = client.post(
        "/api/tickets/submit",
        data={
            "citizen_name": "Ngô Văn Khải",
            "citizen_phone": "0903112233",
            "citizen_email": "haingo.dongnai@gmail.com",
            "raw_text": "Khu công nghiệp Amata Biên Hòa xuất hiện bãi rác tự phát bốc mùi hôi thối nồng nặc và nước rỉ rác đen ngòm tràn ra mương thoát nước chung.",
            "source": "WEB_TEXT"
        }
    )
    assert res.status_code in [200, 201], f"Submit lỗi: {res.text}"
    submit_data = res.json()
    print(f"  ✓ Đã nộp thành công đơn mới: Mã = {submit_data.get('tracking_code')}")
    print(f"  ✓ Kết quả định tuyến tức thì: Cơ quan = {submit_data.get('dept_name')} ({submit_data.get('dept_code')}) | Trạng thái = {submit_data.get('status')}")
    print(f"  ✓ Tóm tắt vụ việc: {submit_data.get('summary')}")

    print("\n" + "=" * 60)
    print("✓ TẤT CẢ 4 BƯỚC KIỂM THỬ ĐÃ ĐẠT 100% TIÊU CHUẨN DEMO READINESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()

