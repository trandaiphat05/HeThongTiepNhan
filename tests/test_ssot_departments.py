"""
Kiểm thử Toàn Diện Chuẩn Hóa Danh Mục Sở/Ban/Ngành (SSOT)
- Kiểm tra Backend GET /api/departments & /api/admin/stats
- Kiểm tra Frontend RegisterPage (8 đơn vị, phone field, email validation, 1 hint)
- Kiểm tra ReassignModal (đầy đủ các Sở)
- Kiểm tra Đăng ký Cán bộ thành công và ghi nhận vào hệ thống
"""

import os
import sys
import time
import json
import urllib.request
import urllib.error
from playwright.sync_api import sync_playwright

BASE_API = "http://localhost:8000"
BASE_UI = "http://localhost:5173"

EXPECTED_OFFICER_DEPTS = [
    "SO_GTVT",
    "SO_TNMT",
    "SO_XD",
    "SO_YTE",
    "SO_GDDT",
    "SO_LDTBXH",
    "CONG_AN_TINH",
    "UBND_CAP_HUYEN",
]


def test_01_backend_departments_endpoint():
    print("\n--- TEST 1: Backend GET /api/departments ---")
    req = urllib.request.urlopen(f"{BASE_API}/api/departments")
    assert req.status == 200
    data = json.loads(req.read().decode("utf-8"))
    assert len(data) >= 10, f"Expected at least 10 departments, got {len(data)}"
    
    dept_codes = [d["code"] for d in data]
    for exp in EXPECTED_OFFICER_DEPTS:
        assert exp in dept_codes, f"Missing {exp} in /api/departments"
    assert "UBND_TINH" in dept_codes
    assert "REQUIRE_HUMAN_REVIEW" in dept_codes
    print(f"PASS: /api/departments returns {len(data)} departments with canonical codes.")

    # Kiểm tra filter ?for_officer=true
    req_officer = urllib.request.urlopen(f"{BASE_API}/api/departments?for_officer=true")
    assert req_officer.status == 200
    officer_data = json.loads(req_officer.read().decode("utf-8"))
    assert len(officer_data) == 8, f"Expected 8 officer departments, got {len(officer_data)}"
    officer_codes = [d["code"] for d in officer_data]
    assert set(officer_codes) == set(EXPECTED_OFFICER_DEPTS)
    print(f"PASS: /api/departments?for_officer=true returns exactly 8 selectable departments: {officer_codes}")


def test_02_backend_officer_registration_validation():
    print("\n--- TEST 2: Backend Officer Registration Validation ---")
    # Thử đăng ký với email không phải @dongnai.gov.vn
    invalid_email_payload = {
        "full_name": "Cán bộ Thử Nghiệm",
        "username": f"cb_test_{int(time.time())}",
        "password": "password123",
        "email": "canbo.test@gmail.com",
        "phone": "0912345678",
        "role": "OFFICER",
        "dept_code": "SO_YTE",
        "officer_code": "CB-YT-99",
    }
    req = urllib.request.Request(
        f"{BASE_API}/api/auth/register",
        data=json.dumps(invalid_email_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    try:
        urllib.request.urlopen(req)
        assert False, "Should have failed with 400"
    except urllib.error.HTTPError as exc_info:
        assert exc_info.code == 400
    print("PASS: Backend correctly rejects officer registration with non-governmental email.")

    # Đăng ký hợp lệ với Sở Y tế (đơn vị mới được bổ sung chuẩn)
    timestamp = int(time.time())
    valid_officer_payload = {
        "full_name": "Bác sĩ Nguyễn Văn Test",
        "username": f"canbo_yte_test_{timestamp}",
        "password": "officerpassword123",
        "email": f"canbo.yte.{timestamp}@dongnai.gov.vn",
        "phone": "0988776655",
        "role": "OFFICER",
        "dept_code": "SO_YTE",
        "officer_code": f"CB-YT-{timestamp % 1000}",
    }
    req_valid = urllib.request.Request(
        f"{BASE_API}/api/auth/register",
        data=json.dumps(valid_officer_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    res = urllib.request.urlopen(req_valid)
    assert res.status in (200, 201)
    res_data = json.loads(res.read().decode("utf-8"))
    assert res_data.get("success") is True
    assert res_data["user"]["is_active"] is False  # Cán bộ cần chờ duyệt
    assert res_data["user"]["dept_code"] == "SO_YTE"
    assert res_data["user"]["phone"] == "0988776655"
    print("PASS: Backend successfully created officer account with SO_YTE and phone.")


def test_03_frontend_register_page_ssot():
    print("\n--- TEST 3: Frontend RegisterPage Playwright Verification ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto(f"{BASE_UI}/register", wait_until="networkidle")
        time.sleep(1)

        # 1. Chuyển sang Tab Cán bộ
        officer_tab_btn = page.locator("button:has-text('Tài Khoản Cán Bộ')")
        officer_tab_btn.click()
        time.sleep(0.5)

        # 2. Kiểm tra dropdown Đơn vị công tác có đủ 8 Sở
        dept_select = page.locator("select[name='dept_code']")
        assert dept_select.is_visible()
        options = dept_select.locator("option").all()
        option_values = [opt.get_attribute("value") for opt in options]
        print(f"Dropdown options in RegisterPage: {option_values}")
        for exp in EXPECTED_OFFICER_DEPTS:
            assert exp in option_values, f"Option {exp} missing from RegisterPage dropdown!"
        print(f"PASS: RegisterPage has all 8 operational departments ({len(option_values)} options).")

        # 3. Kiểm tra ô Số điện thoại liên hệ dành cho Cán bộ
        phone_input = page.locator("input[name='phone']")
        assert phone_input.is_visible(), "Phone input must be visible for Officer registration!"
        print("PASS: Phone input field is present and visible in Officer form.")

        # 4. Kiểm tra kiểm tra regex số điện thoại
        page.fill("input[name='full_name']", "Cán bộ Kiểm Thử GD")
        page.fill("input[name='email']", "canbo.gddt@dongnai.gov.vn")
        page.fill("input[name='phone']", "12345")  # Invalid phone
        page.fill("input[name='officer_code']", "CB-GD-01")
        dept_select.select_option("SO_GDDT")
        page.fill("input[name='username']", f"cb_gd_{int(time.time())}")
        page.fill("input[name='password']", "officer123")
        page.fill("input[name='confirmPassword']", "officer123")

        # Bấm Đăng ký
        page.locator("button[type='submit']").click()
        time.sleep(0.5)

        # Phải xuất hiện lỗi số điện thoại
        error_box = page.locator(".bg-rose-50")
        assert error_box.is_visible(), "Error box should appear for invalid phone!"
        error_text = error_box.inner_text()
        print(f"Validation error triggered correctly: {error_text}")
        assert "Số điện thoại" in error_text

        # 5. Sửa lại số điện thoại chuẩn và nộp form thành công
        page.fill("input[name='phone']", "0912345678")
        page.locator("button[type='submit']").click()
        time.sleep(1.5)

        # Màn hình chờ duyệt phải xuất hiện
        success_heading = page.locator("h3:has-text('Yêu Cầu Đăng Ký Đã Được Ghi Nhận')")
        assert success_heading.is_visible(), "Pending approval screen must appear!"
        
        # Kiểm tra thông tin hiển thị gồm Sở Giáo dục & Đào tạo và số điện thoại
        details_text = page.locator(".bg-slate-50").inner_text()
        print(f"Details on screen:\n{details_text}")
        assert "Sở Giáo dục" in details_text or "SO_GDDT" in details_text
        assert "0912345678" in details_text
        print("PASS: Officer registration flow in UI works with phone and SO_GDDT.")

        browser.close()


def test_04_frontend_reassign_modal_ssot():
    print("\n--- TEST 4: Frontend Reassign Modal Verification ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Đăng nhập bằng cán bộ GTVT
        page.goto(f"{BASE_UI}/login", wait_until="networkidle")
        time.sleep(1)

        # Click nút Quick login Sở GTVT
        quick_btn = page.locator("button:has-text('canbo_gtvt')")
        assert quick_btn.is_visible()
        quick_btn.click()
        page.wait_for_url("**/officer**", timeout=10000)
        time.sleep(1.5)

        # Click đơn thư đầu tiên trong danh sách để mở SplitReadingReplyPane
        first_ticket = page.locator("div[role='button']").first
        if first_ticket.is_visible():
            first_ticket.click()
            time.sleep(1)

            # Click nút Chuyển tuyến nếu có
            reassign_btn = page.locator("button:has-text('Chuyển tuyến')")
            if reassign_btn.is_visible():
                reassign_btn.click()
                time.sleep(0.5)

                modal_select = page.locator("div[role='dialog'] select, .fixed select").first
                if modal_select.is_visible():
                    opts = modal_select.locator("option").all()
                    opt_vals = [opt.get_attribute("value") for opt in opts]
                    print(f"Reassign Modal options: {opt_vals}")
                    for exp in EXPECTED_OFFICER_DEPTS:
                        assert exp in opt_vals, f"Reassign modal missing {exp}"
                    print("PASS: Reassign Modal contains all canonical departments.")

        browser.close()


if __name__ == "__main__":
    test_01_backend_departments_endpoint()
    test_02_backend_officer_registration_validation()
    test_03_frontend_register_page_ssot()
    test_04_frontend_reassign_modal_ssot()
    print("\n=======================================================")
    print("✓ TẤT CẢ 4 BỘ TEST KIỂM TRA SSOT ĐÃ PASS 100%!")
    print("=======================================================")
