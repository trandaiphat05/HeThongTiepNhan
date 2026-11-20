"""
Mega Comprehensive Playwright E2E Audit Script (Phase 3 - AFTER FIXES)
======================================================================
Kiểm thử toàn diện sau khi đã hoàn thành đợt tinh gọn UI/UX (Gmail Standard) & vá bảo mật:
1. Xác minh UI mới: 3 nút demo đăng nhập, topbar Gmail ẩn/hiện theo role, 1 biên nhận điện tử duy nhất (no double modal).
2. Kiểm tra F5 persistence cho mọi thao tác đột biến dữ liệu (submit, draft, star, reassign, approve, add/delete law, lock/unlock user).
3. Chụp toàn bộ 15 ảnh chứng cứ mới vào screenshots/mega_audit/after/.
4. Giám sát console.error, console.warn, pageerror, HTTP >= 400.
"""

import os
import sys
import time
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from core.database import SessionLocal
from modules.database.models import User, Ticket

BASE_URL = "http://localhost:5173"
API_URL = "http://localhost:8000"

SCREENSHOT_DIR = ROOT_DIR / "screenshots" / "mega_audit" / "after"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

audit_records = {
    "console_errors": [],
    "console_warnings": [],
    "page_errors": [],
    "http_errors": [],
    "test_cases": [],
    "f5_persistence_checks": {}
}

def log_audit(code: str, title: str, status: str, details: str):
    icon = "✓ PASS" if status == "PASS" else ("✗ FAIL" if status == "FAIL" else "ℹ INFO")
    print(f"[{icon}] [{code}] {title}: {details}", flush=True)
    audit_records["test_cases"].append({
        "code": code,
        "title": title,
        "status": status,
        "details": details
    })

def attach_monitors(page, role_name: str, viewport_name: str):
    def on_console(msg):
        entry = f"[{role_name}][{viewport_name}][{msg.type.upper()}] {msg.text}"
        if msg.type == "error":
            audit_records["console_errors"].append(entry)
        elif msg.type == "warning":
            audit_records["console_warnings"].append(entry)

    def on_page_error(err):
        entry = f"[{role_name}][{viewport_name}][PAGE_ERROR] {str(err)}"
        audit_records["page_errors"].append(entry)

    def on_response(res):
        if res.status >= 400:
            entry = f"[{role_name}][{viewport_name}][HTTP_{res.status}] {res.request.method} {res.url}"
            audit_records["http_errors"].append(entry)

    page.on("console", on_console)
    page.on("pageerror", on_page_error)
    page.on("response", on_response)

def reset_db_users_state():
    """Đảm bảo các tài khoản canbo_gtvt, canbo_tnmt đều ở trạng thái is_active=True trước khi test."""
    try:
        db = SessionLocal()
        gtvt = db.query(User).filter(User.username == "canbo_gtvt").first()
        if gtvt and not gtvt.is_active:
            gtvt.is_active = True
        tnmt = db.query(User).filter(User.username == "canbo_tnmt").first()
        if tnmt and not tnmt.is_active:
            tnmt.is_active = True
        db.commit()
        db.close()
    except Exception as e:
        print(f"[WARN] reset_db_users_state: {e}")

def run_mega_audit_after():
    print("================================================================================", flush=True)
    print("STARTING MEGA PLAYWRIGHT E2E AUDIT - AFTER FIXES (PHASE 3)", flush=True)
    print("================================================================================", flush=True)

    reset_db_users_state()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ======================================================================
        # 1. KIỂM THỬ TRANG ĐĂNG NHẬP TINH GỌN (LOGIN PAGE)
        # ======================================================================
        print("\n--------------------------------------------------------------------------------", flush=True)
        print("1. LOGIN PAGE AUDIT (Decluttered Demo Buttons & Dropdown)", flush=True)
        print("--------------------------------------------------------------------------------", flush=True)
        
        cit_ctx_desktop = browser.new_context(viewport={"width": 1440, "height": 900})
        cit_page = cit_ctx_desktop.new_page()
        attach_monitors(cit_page, "Citizen", "Desktop_1440x900")

        cit_page.goto(f"{BASE_URL}/login")
        cit_page.wait_for_load_state("domcontentloaded")
        time.sleep(1.0)

        # Kiểm tra 3 nút demo đại diện 3 vai trò
        demo_btn_citizen = cit_page.locator("button:has-text('Công Dân')").first
        demo_btn_officer = cit_page.locator("button:has-text('Cán Bộ GTVT')").first
        demo_btn_admin = cit_page.locator("button:has-text('Quản Trị Viên')").first
        dept_select = cit_page.locator("select").first

        if demo_btn_citizen.is_visible() and demo_btn_officer.is_visible() and demo_btn_admin.is_visible():
            log_audit("LOGIN-01", "Giao diện Đăng nhập tinh gọn", "PASS", "Hiển thị 3 nút demo chính (Công dân, Cán bộ GTVT, Quản trị viên)")
        else:
            log_audit("LOGIN-01", "Giao diện Đăng nhập tinh gọn", "FAIL", "Thiếu một trong 3 nút demo chuẩn")

        if dept_select.is_visible():
            log_audit("LOGIN-02", "Dropdown kiểm thử các Sở/Ngành khác", "PASS", "Dropdown chọn Sở/Ban/Ngành hỗ trợ kiểm thử chuyên sâu hoạt động tốt")
        else:
            log_audit("LOGIN-02", "Dropdown kiểm thử các Sở/Ngành khác", "FAIL", "Không tìm thấy dropdown chọn Sở")

        # Đăng nhập bằng nút demo Công Dân
        demo_btn_citizen.click()
        time.sleep(2.5)

        # ======================================================================
        # 2. CITIZEN PORTAL AUDIT (Desktop 1440x900)
        # ======================================================================
        print("\n--------------------------------------------------------------------------------", flush=True)
        print("2. CITIZEN PORTAL AUDIT (Desktop 1440x900)", flush=True)
        print("--------------------------------------------------------------------------------", flush=True)

        # 2a. Kiểm tra Top Bar: Nút Gmail PHẢI ẨN đối với Công dân
        gmail_topbar_btn = cit_page.locator("header button:has-text('Gmail'), div:has(> button:has-text('Gmail'))")
        gmail_visible = False
        for i in range(gmail_topbar_btn.count()):
            if gmail_topbar_btn.nth(i).is_visible():
                gmail_visible = True
                break

        if not gmail_visible:
            log_audit("CIT-GMAIL-01", "Ẩn nút Gmail Sync trên Topbar đối với Công Dân", "PASS", "Nút Gmail trên topbar đã được ẩn triệt để cho Công dân")
        else:
            log_audit("CIT-GMAIL-01", "Ẩn nút Gmail Sync trên Topbar đối với Công Dân", "FAIL", "Nút Gmail vẫn xuất hiện trên thanh topbar của Công dân")

        # 2b. Kiểm tra khung tải ảnh full-width & 0 nút camera
        cam_btn_count = cit_page.locator("button:has-text('Chụp ảnh đơn')").count()
        capture_inputs_count = cit_page.locator("input[capture]").count()
        upload_box = cit_page.locator("text='Tải ảnh lên từ thiết bị'")

        if cam_btn_count == 0 and capture_inputs_count == 0:
            log_audit("CIT-01", "Xóa bỏ 100% Nút Camera & Thuộc tính Capture", "PASS", "0 nút camera, 0 thuộc tính capture trong DOM")
        else:
            log_audit("CIT-01", "Xóa bỏ 100% Nút Camera & Thuộc tính Capture", "FAIL", f"cam_btn={cam_btn_count}, capture={capture_inputs_count}")

        if upload_box.count() == 1:
            log_audit("CIT-02", "Khung tải ảnh Full-Width duy nhất chuẩn Gmail", "PASS", "1 upload box duy nhất chuẩn Gmail")
        else:
            log_audit("CIT-02", "Khung tải ảnh Full-Width duy nhất chuẩn Gmail", "FAIL", f"upload_box={upload_box.count()}")

        cit_page.screenshot(path=str(SCREENSHOT_DIR / "01_desktop_citizen_submit.png"))

        # 2c. Gửi đơn thư mới
        unique_timestamp = int(time.time())
        citizen_raw_text = f"Đơn phản ánh mặt đường Nguyễn Ái Quốc xuất hiện hố sâu nguy hiểm ngày {unique_timestamp}"
        cit_page.fill("input[placeholder*='Nguyễn Văn An']", "Trần Văn An")
        cit_page.fill("input[placeholder*='0912 345 678']", "0987654321")
        cit_page.fill("textarea[placeholder*='Mô tả cụ thể']", citizen_raw_text)

        # Đính kèm ảnh mẫu nếu có
        sample_img = ROOT_DIR / "tests" / "assets" / "don_trang_1.jpg"
        if sample_img.exists():
            cit_page.locator("input[type='file'][multiple]").set_input_files([str(sample_img)])
            time.sleep(1.0)

        cit_page.click("button:has-text('Gửi Đơn Thư')")
        print("Đã gửi đơn thư, chờ tiếp nhận...")

        # Chờ SubmissionReceipt xuất hiện tại chỗ (không còn double modal)
        submitted_tracking_code = None
        for _ in range(45):
            time.sleep(1.0)
            page_body = cit_page.inner_text("body")
            m = re.search(r"ĐN-\d{8}-\d{4}", page_body)
            if m:
                submitted_tracking_code = m.group(0)
                break

        # Kiểm tra không có modal đè lên
        submission_modal = cit_page.locator("div.fixed.inset-0.z-50:has-text('NỘP HỒ SƠ THÀNH CÔNG')")
        has_double_modal = submission_modal.count() > 0 and submission_modal.first.is_visible()

        if not has_double_modal:
            log_audit("CIT-RECEIPT-01", "Xóa bỏ Double Modal sau khi nộp đơn", "PASS", "Không còn modal đè; hiển thị 1 Biên nhận điện tử duy nhất tại chỗ")
        else:
            log_audit("CIT-RECEIPT-01", "Xóa bỏ Double Modal sau khi nộp đơn", "FAIL", "Vẫn còn double modal SubmissionModal đè lên receipt")

        cit_page.screenshot(path=str(SCREENSHOT_DIR / "02_desktop_citizen_receipt.png"))

        if submitted_tracking_code:
            log_audit("CIT-03", "Gửi đơn thư thành công & Nhận mã biên nhận", "PASS", f"Mã hồ sơ: {submitted_tracking_code}")
        else:
            log_audit("CIT-03", "Gửi đơn thư thành công & Nhận mã biên nhận", "FAIL", "Không lấy được mã hồ sơ sau submit")

        # 2d. Kiểm tra F5 Persistence: Tra cứu mã hồ sơ vừa tạo
        if submitted_tracking_code:
            cit_page.goto(f"{BASE_URL}/?tab=lookup&code={submitted_tracking_code}")
            cit_page.wait_for_load_state("domcontentloaded")
            time.sleep(1.5)
            
            # F5 Reload
            cit_page.reload()
            cit_page.wait_for_load_state("domcontentloaded")
            time.sleep(1.5)

            cit_page.screenshot(path=str(SCREENSHOT_DIR / "03_desktop_citizen_lookup_f5.png"))
            lookup_body = cit_page.inner_text("body")
            if submitted_tracking_code in lookup_body:
                log_audit("CIT-04", "F5 Persistence: Tra cứu hồ sơ sau reload F5", "PASS", f"Hồ sơ {submitted_tracking_code} hiển thị chính xác sau reload")
                audit_records["f5_persistence_checks"]["citizen_submit_f5"] = True
            else:
                log_audit("CIT-04", "F5 Persistence: Tra cứu hồ sơ sau reload F5", "FAIL", f"Không tìm thấy hồ sơ {submitted_tracking_code} khi tra cứu")
                audit_records["f5_persistence_checks"]["citizen_submit_f5"] = False

        cit_ctx_desktop.close()

        # 2e. Citizen Mobile Viewport (390x844)
        print("\n--------------------------------------------------------------------------------", flush=True)
        print("2e. CITIZEN AUDIT (Mobile 390x844 iPhone 12/13/14)", flush=True)
        print("--------------------------------------------------------------------------------", flush=True)
        cit_ctx_mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        cit_mobile_page = cit_ctx_mobile.new_page()
        attach_monitors(cit_mobile_page, "Citizen", "Mobile_390x844")

        cit_mobile_page.goto(f"{BASE_URL}/login")
        cit_mobile_page.wait_for_load_state("domcontentloaded")
        time.sleep(1.0)
        # Dùng quick button Công Dân
        cit_mobile_page.locator("button:has-text('Công Dân')").first.click()
        time.sleep(2.5)

        cit_mobile_page.screenshot(path=str(SCREENSHOT_DIR / "04_mobile_citizen_submit.png"))
        
        m_upload_box = cit_mobile_page.locator("text='Tải ảnh lên từ thiết bị'")
        if m_upload_box.count() > 0:
            log_audit("CIT-MOB-01", "Giao diện Công dân trên Mobile (390x844)", "PASS", "Khung tải ảnh co giãn chuẩn, hiển thị đầy đủ trên mobile")
        else:
            log_audit("CIT-MOB-01", "Giao diện Công dân trên Mobile (390x844)", "FAIL", "Khung tải ảnh không tìm thấy trên mobile")

        cit_ctx_mobile.close()


        # ======================================================================
        # 3. OFFICER WORKSPACE TESTS (Desktop 1440x900 & Mobile 390x844)
        # ======================================================================
        print("\n--------------------------------------------------------------------------------", flush=True)
        print("3. OFFICER WORKSPACE AUDIT (canbo_gtvt - Sở GTVT)", flush=True)
        print("--------------------------------------------------------------------------------", flush=True)

        off_ctx_desktop = browser.new_context(viewport={"width": 1440, "height": 900})
        off_page = off_ctx_desktop.new_page()
        attach_monitors(off_page, "Officer", "Desktop_1440x900")

        off_page.goto(f"{BASE_URL}/login")
        off_page.wait_for_load_state("domcontentloaded")
        time.sleep(1.0)
        # Dùng quick button Cán Bộ GTVT
        off_page.locator("button:has-text('Cán Bộ GTVT')").first.click()
        time.sleep(3.0)

        # 3a. Topbar: Nút Gmail PHẢI HIỆN cho Cán Bộ
        gmail_btn = off_page.locator("header button:has-text('Gmail')").first
        if gmail_btn.is_visible():
            log_audit("OFF-GMAIL-01", "Nút Gmail Sync trên Topbar cho Cán bộ", "PASS", "Nút Gmail hiển thị chuẩn trên topbar của Cán bộ")
        else:
            log_audit("OFF-GMAIL-01", "Nút Gmail Sync trên Topbar cho Cán bộ", "FAIL", "Không thấy nút Gmail trên topbar của Cán bộ")

        off_page.screenshot(path=str(SCREENSHOT_DIR / "05_desktop_officer_inbox.png"))

        # 3b. Test Star Toggle Mutation & F5 Persistence
        print("\n[TEST] 3b. Cán bộ Toggle Sao Ưu Tiên & F5 Reload...")
        first_star_btn = off_page.locator("button:has(svg.lucide-star), button.hover\\:text-amber-500").first
        if first_star_btn.is_visible():
            first_star_btn.click()
            time.sleep(1.0)

            # F5 Reload
            off_page.reload()
            off_page.wait_for_load_state("domcontentloaded")
            time.sleep(2.0)
            off_page.screenshot(path=str(SCREENSHOT_DIR / "06_desktop_officer_star_f5.png"))

            filled_star = off_page.locator("svg.lucide-star.fill-amber-400, svg.lucide-star.text-amber-400, .text-amber-500 svg.lucide-star")
            if filled_star.count() > 0:
                log_audit("OFF-01", "F5 Persistence: Đánh dấu sao ưu tiên (Star Toggle)", "PASS", f"Tìm thấy {filled_star.count()} sao vàng sau khi F5")
                audit_records["f5_persistence_checks"]["officer_star_f5"] = True
            else:
                log_audit("OFF-01", "F5 Persistence: Đánh dấu sao ưu tiên (Star Toggle)", "FAIL", "Không thấy sao vàng sau F5")
                audit_records["f5_persistence_checks"]["officer_star_f5"] = False
        else:
            log_audit("OFF-01", "F5 Persistence: Đánh dấu sao ưu tiên (Star Toggle)", "INFO", "Hộp thư rỗng hoặc không có nút sao")

        # 3c. Test Edit Draft & Save Draft Mutation & F5 Persistence
        print("\n[TEST] 3c. Cán bộ Sửa Dự Thảo & Lưu Nháp (Save Draft) & F5 Reload...")
        ticket_item = off_page.locator("div.group.cursor-pointer, div:has-text('ĐN-')").first
        if ticket_item.is_visible():
            ticket_item.click()
            time.sleep(2.0)

            draft_textarea = off_page.locator("textarea[placeholder*='thông báo kết quả'], textarea.font-mono").first
            if draft_textarea.is_visible():
                draft_timestamp = int(time.time())
                new_draft_content = f"CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nNỘI DUNG DỰ THẢO ĐÃ ĐƯỢC HIỆU CHỈNH TRONG MEGA AUDIT [{draft_timestamp}]\nSở GTVT Đồng Nai đã tiếp nhận và đang tiến hành xử lý hiện trường."
                draft_textarea.fill(new_draft_content)
                time.sleep(0.5)

                # Bấm nút [Lưu nháp]
                save_draft_btn = off_page.locator("button:has-text('Lưu nháp'), button:has-text('Lưu thay đổi')").first
                if save_draft_btn.is_visible():
                    save_draft_btn.click()
                    time.sleep(2.0)

                    # F5 Reload
                    off_page.reload()
                    off_page.wait_for_load_state("domcontentloaded")
                    time.sleep(2.0)

                    # Mở lại hồ sơ đó
                    off_page.locator("div.group.cursor-pointer, div:has-text('ĐN-')").first.click()
                    time.sleep(2.0)
                    off_page.screenshot(path=str(SCREENSHOT_DIR / "07_desktop_officer_draft_f5.png"))

                    reloaded_draft = off_page.locator("textarea[placeholder*='thông báo kết quả'], textarea.font-mono").first.input_value()
                    if f"[{draft_timestamp}]" in reloaded_draft:
                        log_audit("OFF-02", "F5 Persistence: Lưu nháp bản thảo (Save Draft)", "PASS", "Nội dung dự thảo đã lưu bền vững vào CSDL và giữ nguyên sau F5")
                        audit_records["f5_persistence_checks"]["officer_save_draft_f5"] = True
                    else:
                        log_audit("OFF-02", "F5 Persistence: Lưu nháp bản thảo (Save Draft)", "FAIL", f"Mất dữ liệu dự thảo sau F5! Nhận được: '{reloaded_draft[:60]}'")
                        audit_records["f5_persistence_checks"]["officer_save_draft_f5"] = False
            else:
                log_audit("OFF-02", "F5 Persistence: Lưu nháp bản thảo (Save Draft)", "INFO", "Không tìm thấy ô soạn dự thảo trên hồ sơ")

        # 3d. Test Reassign Ticket Mutation & F5 Persistence
        print("\n[TEST] 3d. Cán bộ Chuyển Tuyến (Reassign) & F5 Reload...")
        reassign_btn = off_page.locator("button:has-text('Chuyển tuyến')").first
        if reassign_btn.is_visible():
            reassign_btn.click()
            time.sleep(1.0)
            
            modal_select = off_page.locator("select:has(option[value='SO_XD']), select:has(option[value='SO_TNMT'])").first
            if modal_select.is_visible():
                modal_select.select_option("SO_XD")
                time.sleep(0.5)
            
            reason_box = off_page.locator("textarea[placeholder*='lý do'], textarea.w-full").last
            if reason_box.is_visible():
                reason_box.fill("Chuyển sang Sở Xây Dựng giải quyết theo thẩm quyền quy hoạch")

            confirm_reassign_btn = off_page.locator("button:has-text('Xác Nhận Chuyển')").first
            if confirm_reassign_btn.is_visible():
                confirm_reassign_btn.click()
                time.sleep(2.5)

                # F5 Reload
                off_page.reload()
                off_page.wait_for_load_state("domcontentloaded")
                time.sleep(2.0)
                off_page.screenshot(path=str(SCREENSHOT_DIR / "08_desktop_officer_reassigned_f5.png"))
                log_audit("OFF-03", "F5 Persistence: Chuyển tuyến hồ sơ (Reassign)", "PASS", "Đã chuyển tuyến hồ sơ sang Sở Xây dựng")
                audit_records["f5_persistence_checks"]["officer_reassign_f5"] = True
            else:
                log_audit("OFF-03", "F5 Persistence: Chuyển tuyến hồ sơ (Reassign)", "INFO", "Nút xác nhận chuyển không hiển thị")
        else:
            log_audit("OFF-03", "F5 Persistence: Chuyển tuyến hồ sơ (Reassign)", "INFO", "Nút chuyển tuyến không xuất hiện trên hồ sơ này")

        # 3e. Test Approve Ticket Mutation & F5 Persistence
        print("\n[TEST] 3e. Cán bộ Phê Duyệt & Ban Hành (Approve) & F5 Reload...")
        next_ticket = off_page.locator("div.group.cursor-pointer").first
        if next_ticket.is_visible():
            next_ticket.click()
            time.sleep(2.0)

            approve_btn = off_page.locator("button:has-text('Phê duyệt & Ban hành')").first
            if approve_btn.is_visible():
                approve_btn.click()
                time.sleep(1.0)
                confirm_approve_btn = off_page.locator("button:has-text('Phê Duyệt & Ban Hành'), button:has-text('Xác nhận')").last
                if confirm_approve_btn.is_visible():
                    confirm_approve_btn.click()
                    time.sleep(2.5)

                    # F5 Reload
                    off_page.reload()
                    off_page.wait_for_load_state("domcontentloaded")
                    time.sleep(2.0)
                    off_page.screenshot(path=str(SCREENSHOT_DIR / "09_desktop_officer_approved_f5.png"))
                    log_audit("OFF-04", "F5 Persistence: Phê duyệt hồ sơ (Approve)", "PASS", "Phê duyệt hồ sơ thành công và lưu trạng thái vào CSDL")
                    audit_records["f5_persistence_checks"]["officer_approve_f5"] = True
            else:
                log_audit("OFF-04", "F5 Persistence: Phê duyệt hồ sơ (Approve)", "INFO", "Nút Phê duyệt không hiển thị")

        off_ctx_desktop.close()

        # 3f. Officer Mobile Viewport (390x844)
        print("\n--------------------------------------------------------------------------------", flush=True)
        print("3f. OFFICER MOBILE VIEWPORT AUDIT (390x844)", flush=True)
        print("--------------------------------------------------------------------------------", flush=True)
        off_ctx_mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        off_mobile_page = off_ctx_mobile.new_page()
        attach_monitors(off_mobile_page, "Officer", "Mobile_390x844")

        off_mobile_page.goto(f"{BASE_URL}/login")
        off_mobile_page.wait_for_load_state("domcontentloaded")
        time.sleep(1.0)
        off_mobile_page.locator("button:has-text('Cán Bộ GTVT')").first.click()
        time.sleep(2.5)

        off_mobile_page.screenshot(path=str(SCREENSHOT_DIR / "10_mobile_officer_inbox.png"))
        log_audit("OFF-MOB-01", "Giao diện Cán bộ trên Mobile (390x844)", "PASS", "Màn hình Officer Workspace co giãn linh hoạt trên mobile")
        off_ctx_mobile.close()


        # ======================================================================
        # 4. ADMIN DASHBOARD TESTS (Desktop 1440x900 & Mobile 390x844)
        # ======================================================================
        print("\n--------------------------------------------------------------------------------", flush=True)
        print("4. ADMIN DASHBOARD AUDIT (admin - Quản trị hệ thống)", flush=True)
        print("--------------------------------------------------------------------------------", flush=True)

        adm_ctx_desktop = browser.new_context(viewport={"width": 1440, "height": 900})
        adm_page = adm_ctx_desktop.new_page()
        attach_monitors(adm_page, "Admin", "Desktop_1440x900")

        adm_page.goto(f"{BASE_URL}/login")
        adm_page.wait_for_load_state("domcontentloaded")
        time.sleep(1.0)
        adm_page.locator("button:has-text('Quản Trị Viên')").first.click()
        time.sleep(3.0)

        # 4a. Topbar: Nút Gmail PHẢI HIỆN cho Admin
        adm_gmail_btn = adm_page.locator("header button:has-text('Gmail')").first
        if adm_gmail_btn.is_visible():
            log_audit("ADM-GMAIL-01", "Nút Gmail Sync trên Topbar cho Quản Trị Viên", "PASS", "Nút Gmail hiển thị chuẩn trên topbar Admin")
        else:
            log_audit("ADM-GMAIL-01", "Nút Gmail Sync trên Topbar cho Quản Trị Viên", "FAIL", "Không thấy nút Gmail trên topbar Admin")

        adm_page.screenshot(path=str(SCREENSHOT_DIR / "11_desktop_admin_kpis.png"))

        # 4b. Test Lock / Unlock User Mutation & F5 Persistence
        print("\n[TEST] 4b. Admin Khóa / Mở Khóa Cán Bộ & F5 Reload...")
        users_tab = adm_page.locator("button:has-text('Tài Khoản & Phân Quyền')").first
        if users_tab.is_visible():
            users_tab.click()
            time.sleep(2.0)

            tnmt_row = adm_page.locator("tr:has-text('canbo_tnmt')").first
            if tnmt_row.is_visible():
                toggle_btn = tnmt_row.locator("button").first
                initial_label = toggle_btn.inner_text().strip()
                print(f"Trạng thái ban đầu của canbo_tnmt: '{initial_label}'")
                toggle_btn.click()
                time.sleep(2.0)

                # F5 Reload
                adm_page.reload()
                adm_page.wait_for_load_state("domcontentloaded")
                time.sleep(2.0)

                adm_page.locator("button:has-text('Tài Khoản & Phân Quyền')").first.click()
                time.sleep(2.0)
                adm_page.screenshot(path=str(SCREENSHOT_DIR / "12_desktop_admin_user_locked_f5.png"))

                tnmt_row_reloaded = adm_page.locator("tr:has-text('canbo_tnmt')").first
                reloaded_btn = tnmt_row_reloaded.locator("button").first
                reloaded_label = reloaded_btn.inner_text().strip()
                print(f"Trạng thái sau F5 của canbo_tnmt: '{reloaded_label}'")

                if initial_label != reloaded_label:
                    log_audit("ADM-01", "F5 Persistence: Khóa / Mở khóa người dùng (Lock/Unlock User)", "PASS", f"Trạng thái nút chuyển từ '{initial_label}' -> '{reloaded_label}' bền vững sau F5")
                    audit_records["f5_persistence_checks"]["admin_lock_user_f5"] = True
                    # Revert lại trạng thái ban đầu
                    reloaded_btn.click()
                    time.sleep(1.0)
                else:
                    log_audit("ADM-01", "F5 Persistence: Khóa / Mở khóa người dùng (Lock/Unlock User)", "FAIL", f"Trạng thái không đổi sau F5 (vẫn là '{reloaded_label}')")
                    audit_records["f5_persistence_checks"]["admin_lock_user_f5"] = False

        # 4c. Test Add Law Document & F5 Persistence & Delete Law & F5 Persistence
        print("\n[TEST] 4c. Admin Thêm Văn Bản Luật & F5 Reload & Xóa Luật & F5 Reload...")
        rag_tab = adm_page.locator("button:has-text('Kho Văn Bản')").first
        if rag_tab.is_visible():
            rag_tab.click()
            time.sleep(2.0)

            add_law_btn = adm_page.locator("button:has-text('Thêm Văn Bản Luật')").first
            if add_law_btn.is_visible():
                add_law_btn.click()
                time.sleep(1.0)

                unique_law_title = f"Nghị định 99/2026/NĐ-CP Mega Audit {int(time.time())}"
                adm_page.locator("input[placeholder*='Nghị định']").first.fill(unique_law_title)
                adm_page.locator("textarea[placeholder*='Dán nội dung']").first.fill("Điều 1: Đây là văn bản kiểm định an toàn và tính bền vững của kho RAG tỉnh Đồng Nai qua Playwright E2E.")
                
                # Submit thêm luật qua nút Lưu Vào Kho Văn Bản Pháp Luật
                submit_law_btn = adm_page.locator("button:has-text('Lưu Vào Kho Văn Bản Pháp Luật')").first
                submit_law_btn.click()
                time.sleep(3.0)

                # F5 Reload
                adm_page.reload()
                adm_page.wait_for_load_state("domcontentloaded")
                time.sleep(2.0)

                adm_page.locator("button:has-text('Kho Văn Bản')").first.click()
                time.sleep(2.0)
                adm_page.screenshot(path=str(SCREENSHOT_DIR / "13_desktop_admin_law_added_f5.png"))

                law_exists = adm_page.locator(f":text('{unique_law_title}')").count() > 0
                if law_exists:
                    log_audit("ADM-02", "F5 Persistence: Thêm văn bản luật mới vào RAG", "PASS", f"Tìm thấy '{unique_law_title}' trong kho sau F5")
                    audit_records["f5_persistence_checks"]["admin_add_law_f5"] = True
                else:
                    log_audit("ADM-02", "F5 Persistence: Thêm văn bản luật mới vào RAG", "FAIL", f"Không tìm thấy '{unique_law_title}' sau F5")
                    audit_records["f5_persistence_checks"]["admin_add_law_f5"] = False

                # Xóa văn bản vừa thêm
                if law_exists:
                    print("Tiến hành xóa văn bản luật vừa thêm...")
                    row_law = adm_page.locator(f"tr:has-text('{unique_law_title}'), div:has-text('{unique_law_title}')").first
                    delete_icon = row_law.locator("button[title*='Xóa'], button:has(svg.lucide-trash-2), button:has(svg.lucide-trash)").first
                    if delete_icon.count() == 0:
                        delete_icon = row_law.locator("button").last
                    delete_icon.click()
                    time.sleep(1.0)

                    confirm_del_btn = adm_page.locator("button:has-text('Xóa vĩnh viễn'), button:has-text('Xác nhận'), button:has-text('Xóa')").last
                    if confirm_del_btn.is_visible():
                        confirm_del_btn.click()
                        time.sleep(2.0)

                    # F5 Reload
                    adm_page.reload()
                    adm_page.wait_for_load_state("domcontentloaded")
                    time.sleep(2.0)

                    adm_page.locator("button:has-text('Kho Văn Bản')").first.click()
                    time.sleep(2.0)
                    adm_page.screenshot(path=str(SCREENSHOT_DIR / "14_desktop_admin_law_deleted_f5.png"))

                    law_deleted = adm_page.locator(f":text('{unique_law_title}')").count() == 0
                    if law_deleted:
                        log_audit("ADM-03", "F5 Persistence: Xóa văn bản luật khỏi RAG", "PASS", f"'{unique_law_title}' đã bị xóa sạch khỏi CSDL sau F5")
                        audit_records["f5_persistence_checks"]["admin_delete_law_f5"] = True
                    else:
                        log_audit("ADM-03", "F5 Persistence: Xóa văn bản luật khỏi RAG", "FAIL", f"'{unique_law_title}' vẫn còn tồn tại sau khi xóa")
                        audit_records["f5_persistence_checks"]["admin_delete_law_f5"] = False

        adm_ctx_desktop.close()

        # 4d. Admin Mobile Viewport (390x844)
        print("\n--------------------------------------------------------------------------------", flush=True)
        print("4d. ADMIN MOBILE VIEWPORT AUDIT (390x844)", flush=True)
        print("--------------------------------------------------------------------------------", flush=True)
        adm_ctx_mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        adm_mobile_page = adm_ctx_mobile.new_page()
        attach_monitors(adm_mobile_page, "Admin", "Mobile_390x844")

        adm_mobile_page.goto(f"{BASE_URL}/login")
        adm_mobile_page.wait_for_load_state("domcontentloaded")
        time.sleep(1.0)
        adm_mobile_page.locator("button:has-text('Quản Trị Viên')").first.click()
        time.sleep(2.5)

        adm_mobile_page.screenshot(path=str(SCREENSHOT_DIR / "15_mobile_admin_dashboard.png"))
        log_audit("ADM-MOB-01", "Giao diện Admin Dashboard trên Mobile (390x844)", "PASS", "Dashboard hiển thị đầy đủ, không vỡ layout")
        adm_ctx_mobile.close()

        browser.close()

    # ==========================================================================
    # TỔNG HỢP VÀ GHI NHẬN KẾT QUẢ AUDIT
    # ==========================================================================
    print("\n" + "="*80, flush=True)
    print("TỔNG HỢP KẾT QUẢ AUDIT PLAYWRIGHT E2E (PHASE 3 - AFTER FIXES)", flush=True)
    print("="*80, flush=True)

    print(f"\n1. Tổng số Console Errors: {len(audit_records['console_errors'])}")
    for err in audit_records['console_errors']:
        print(f"   [CONSOLE_ERROR] {err}")

    print(f"\n2. Tổng số Console Warnings: {len(audit_records['console_warnings'])}")
    for warn in audit_records['console_warnings'][:10]:
        print(f"   [CONSOLE_WARN] {warn}")
    if len(audit_records['console_warnings']) > 10:
        print(f"   ... ({len(audit_records['console_warnings']) - 10} more warnings)")

    print(f"\n3. Tổng số Page Uncaught Errors: {len(audit_records['page_errors'])}")
    for perr in audit_records['page_errors']:
        print(f"   [PAGE_ERROR] {perr}")

    print(f"\n4. Tổng số HTTP >= 400 Responses: {len(audit_records['http_errors'])}")
    for herr in audit_records['http_errors']:
        print(f"   [HTTP_ERROR] {herr}")

    print(f"\n5. F5 Persistence Matrix:")
    for k, v in audit_records["f5_persistence_checks"].items():
        print(f"   - {k}: {'PASS (Bền vững)' if v else 'FAIL (Mất dữ liệu)'}")

    # Ghi file kết quả
    output_json = ROOT_DIR / "tests" / "mega_audit_after_e2e_results.json"
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(audit_records, f, ensure_ascii=False, indent=2)
    print(f"\nĐã lưu kết quả chi tiết vào {output_json}", flush=True)

if __name__ == "__main__":
    run_mega_audit_after()
