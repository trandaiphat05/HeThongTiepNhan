import os
import sys
import time
import re
from playwright.sync_api import sync_playwright

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    screenshots_dir = os.path.join(base_dir, "test_screenshots")
    sample_images_dir = os.path.join(base_dir, "tests", "sample_images")
    os.makedirs(screenshots_dir, exist_ok=True)

    img_env = os.path.join(sample_images_dir, "don_moi_truong.png")
    img_sec = os.path.join(sample_images_dir, "don_an_ninh.png")

    print(f"[INFO] Screenshots will be saved to: {screenshots_dir}", flush=True)
    print(f"[INFO] Sample image 1 (TNMT): {img_env}", flush=True)
    print(f"[INFO] Sample image 2 (Cong An): {img_sec}", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1400, "height": 950},
            device_scale_factor=1.5
        )
        page = context.new_page()

        # =========================================================================
        # 1. SCREENSHOT 01: Login Page with Multi-Department Test Accounts
        # =========================================================================
        print("\n--- STEP 1: LOGIN PAGE ---", flush=True)
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.wait_for_selector("text=TÀI KHOẢN KIỂM THỬ HỆ THỐNG", timeout=15000)
        time.sleep(1)

        shot1_path = os.path.join(screenshots_dir, "01_login_page.png")
        page.screenshot(path=shot1_path, full_page=True)
        print(f"[SUCCESS] Saved 01_login_page.png: {shot1_path}", flush=True)

        # =========================================================================
        # 2. SCREENSHOT 02: Citizen Fill Submit Form with Image
        # =========================================================================
        print("\n--- STEP 2: CITIZEN FORM WITH ATTACHED IMAGE ---", flush=True)
        citizen_btn = page.locator("button:has-text('congdan1')")
        if citizen_btn.count() > 0:
            citizen_btn.first.click()
        else:
            page.fill("input[autocomplete='username']", "congdan1")
            page.fill("input[autocomplete='current-password']", "citizen123")
            page.click("button[type='submit']")

        page.wait_for_url("http://localhost:3000/", timeout=15000)
        page.wait_for_selector("text=Cổng Tiếp Nhận Ý Kiến, Kiến Nghị & Phản Ánh", timeout=15000)

        # Make sure "Gửi Phản Ánh" tab is active
        page.click("button:has-text('Gửi Phản Ánh')")
        page.wait_for_selector("text=Thông Tin Người Gửi Phản Ánh", timeout=10000)

        # Fill citizen fields
        page.fill("input[placeholder*='Nguyễn Văn An']", "Trần Đại Phát")
        page.fill("input[placeholder*='0912']", "0901234567")
        page.fill("input[placeholder*='vidu@gmail.com']", "daiphat.tran@dongnai.gov.vn")
        page.fill("input[placeholder*='Số nhà, tên đường']", "KCN Biên Hòa 2, TP. Biên Hòa, Tỉnh Đồng Nai")
        page.fill("input[placeholder*='Ví dụ: Phản ánh']", "Phản ánh ô nhiễm môi trường do xả nước thải đen hôi thối tại KCN Biên Hòa 2")
        page.fill(
            "textarea[placeholder*='Mô tả cụ thể sự việc']",
            "Doanh nghiệp xả nước thải đen đặc bốc mùi hôi thối nồng nặc ra kênh thoát nước KCN Biên Hòa 2 gây ô nhiễm môi trường nghiêm trọng, ảnh hưởng nặng nề đến sức khỏe người dân xung quanh. Kính đề nghị Sở Tài nguyên và Môi trường tỉnh Đồng Nai thanh tra, lấy mẫu xét nghiệm và xử lý nghiêm theo quy định pháp luật."
        )

        # Attach image 1
        page.set_input_files("input[type='file']", img_env)
        time.sleep(1)

        # Scroll so form and attached thumbnail are fully visible
        page.evaluate("window.scrollTo(0, 320)")
        time.sleep(1)

        shot2_path = os.path.join(screenshots_dir, "02_citizen_submit_with_image.png")
        page.screenshot(path=shot2_path, full_page=False)
        print(f"[SUCCESS] Saved 02_citizen_submit_with_image.png: {shot2_path}", flush=True)

        # =========================================================================
        # 3. SCREENSHOT 03: Receipt & AI Routing Card (Sở TN&MT)
        # =========================================================================
        print("\n--- STEP 3: SUBMIT COMPLAINT & VERIFY RECEIPT / AI ROUTING ---", flush=True)
        submit_btn = page.locator("button:has-text('Gửi Phản Ánh, Kiến Nghị')")
        submit_btn.click()

        # Wait for receipt modal or card to show up
        page.wait_for_selector("text=MÃ TRA CỨU HỒ SƠ", timeout=35000)
        time.sleep(2)

        # Extract tracking code
        raw_text_content = page.content()
        match = re.search(r"ĐN-\d{8}-\d{4}", raw_text_content)
        tracking_code_1 = match.group(0) if match else "ĐN-20261113-0001"
        print(f"[INFO] Generated Tracking Code 1: {tracking_code_1}", flush=True)

        shot3_path = os.path.join(screenshots_dir, "03_receipt_and_ai_card.png")
        page.screenshot(path=shot3_path, full_page=False)
        print(f"[SUCCESS] Saved 03_receipt_and_ai_card.png: {shot3_path}", flush=True)

        # Close modal
        close_modal_btn = page.locator("button:has-text('Đóng')")
        if close_modal_btn.count() > 0:
            close_modal_btn.first.click()
            time.sleep(1)

        # =========================================================================
        # 4. SCREENSHOT 04: Officer Workspace & Approve Ticket
        # =========================================================================
        print("\n--- STEP 4: OFFICER WORKSPACE & APPROVE TICKET ---", flush=True)
        # Clear citizen session to log in as officer
        page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        time.sleep(0.5)

        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.wait_for_selector("text=TÀI KHOẢN KIỂM THỬ HỆ THỐNG", timeout=15000)

        # Quick login as canbo_tnmt
        tnmt_btn = page.locator("button:has-text('canbo_tnmt')")
        if tnmt_btn.count() > 0:
            tnmt_btn.first.click()
        else:
            page.fill("input[autocomplete='username']", "canbo_tnmt")
            page.fill("input[autocomplete='current-password']", "officer123")
            page.click("button[type='submit']")

        page.wait_for_url("http://localhost:3000/officer", timeout=15000)
        page.wait_for_selector("text=Bàn Làm Việc Thẩm Định & Phê Duyệt Đơn Thư", timeout=15000)
        time.sleep(2)

        # If tracking_code_1 is in table, click it
        if tracking_code_1:
            ticket_row = page.locator(f"text={tracking_code_1}")
            if ticket_row.count() > 0:
                ticket_row.first.click()
                time.sleep(1)

        # Click "Nạp Mẫu Chuẩn Nghị Định 30"
        nd30_btn = page.locator("button:has-text('Nạp Mẫu Chuẩn Nghị Định 30')")
        if nd30_btn.count() > 0:
            nd30_btn.first.click()
            time.sleep(0.5)

        # Click "Phê Duyệt & Ban Hành"
        approve_btn = page.locator("button:has-text('Phê Duyệt & Ban Hành')")
        if approve_btn.count() > 0:
            approve_btn.first.click()
            time.sleep(2)

        # Scroll so the 2-column comparative workspace and approval notification are clear
        page.evaluate("window.scrollTo(0, 100)")
        time.sleep(1)

        shot4_path = os.path.join(screenshots_dir, "04_officer_workspace_approve.png")
        page.screenshot(path=shot4_path, full_page=False)
        print(f"[SUCCESS] Saved 04_officer_workspace_approve.png: {shot4_path}", flush=True)

        # =========================================================================
        # 5. SCREENSHOT 05: Citizen Tracking Shows Completed (Step 4)
        # =========================================================================
        print("\n--- STEP 5: CITIZEN TRACKING LOOKUP ---", flush=True)
        # Clear session to log in as citizen congdan1 for RBAC
        page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        time.sleep(0.5)

        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.wait_for_selector("text=TÀI KHOẢN KIỂM THỬ HỆ THỐNG", timeout=15000)

        citizen_btn = page.locator("button:has-text('congdan1')")
        if citizen_btn.count() > 0:
            citizen_btn.first.click()
        else:
            page.fill("input[autocomplete='username']", "congdan1")
            page.fill("input[autocomplete='current-password']", "citizen123")
            page.click("button[type='submit']")

        page.wait_for_url("http://localhost:3000/", timeout=15000)
        page.wait_for_selector("text=Cổng Tiếp Nhận Ý Kiến, Kiến Nghị & Phản Ánh", timeout=15000)

        # Switch to "Tra Cứu Tiến Độ" tab
        track_tab = page.locator("button:has-text('Tra Cứu Tiến Độ')")
        track_tab.first.click()
        page.wait_for_selector("input[placeholder*='Nhập mã tra cứu']", timeout=10000)

        # Fill tracking code 1
        page.fill("input[placeholder*='Nhập mã tra cứu']", tracking_code_1)
        # Click search
        lookup_btn = page.locator("form button:has-text('Tra Cứu Tiến Độ')")
        lookup_btn.first.click()

        # Wait for search result with tracking header and progress
        page.wait_for_selector("text=Mã Hồ Sơ Tra Cứu:", timeout=20000)
        time.sleep(2)

        page.evaluate("window.scrollTo(0, 220)")
        time.sleep(1)

        shot5_path = os.path.join(screenshots_dir, "05_tracking_completed.png")
        page.screenshot(path=shot5_path, full_page=False)
        print(f"[SUCCESS] Saved 05_tracking_completed.png: {shot5_path}", flush=True)

        # =========================================================================
        # 6. SCREENSHOT 06: Second Complaint Routing to Công An Tỉnh Đồng Nai
        # =========================================================================
        print("\n--- STEP 6: SECOND COMPLAINT ROUTING (CONG AN TỈNH) ---", flush=True)
        submit_tab = page.locator("button:has-text('Gửi Phản Ánh')")
        submit_tab.first.click()
        page.wait_for_selector("text=Thông Tin Người Gửi Phản Ánh", timeout=10000)

        # Fill second complaint
        page.fill("input[placeholder*='Nguyễn Văn An']", "Trần Đại Phát")
        page.fill("input[placeholder*='0912']", "0901234567")
        page.fill("input[placeholder*='vidu@gmail.com']", "daiphat.tran@dongnai.gov.vn")
        page.fill("input[placeholder*='Số nhà, tên đường']", "Khu phố 4, Phường Trảng Dài, TP. Biên Hòa, Đồng Nai")
        page.fill("input[placeholder*='Ví dụ: Phản ánh']", "Khiếu nại tiếng ồn hát karaoke quá 23h đêm gây mất trật tự an ninh")
        page.fill(
            "textarea[placeholder*='Mô tả cụ thể sự việc']",
            "Hàng xóm mở loa kẹo kéo công suất cực lớn hát karaoke liên tục từ 22h đêm đến 1h sáng gây mất an ninh trật tự khu dân cư, đe dọa người nhắc nhở. Kính đề nghị Công an Tỉnh Đồng Nai và Công an địa phương kiểm tra xử lý dứt điểm theo Nghị định 144/2021/NĐ-CP."
        )

        # Attach image 2 (don_an_ninh.png)
        page.set_input_files("input[type='file']", img_sec)
        time.sleep(1)

        # Submit
        submit_btn = page.locator("button:has-text('Gửi Phản Ánh, Kiến Nghị')")
        submit_btn.click()

        # Wait for receipt modal or card
        page.wait_for_selector("text=MÃ TRA CỨU HỒ SƠ", timeout=35000)
        time.sleep(2)

        raw_text_content2 = page.content()
        match2 = re.search(r"ĐN-\d{8}-\d{4}", raw_text_content2)
        tracking_code_2 = match2.group(0) if match2 else "ĐN-20261113-0002"
        print(f"[INFO] Generated Tracking Code 2: {tracking_code_2}", flush=True)

        shot6_path = os.path.join(screenshots_dir, "06_second_dept_routing.png")
        page.screenshot(path=shot6_path, full_page=False)
        print(f"[SUCCESS] Saved 06_second_dept_routing.png: {shot6_path}", flush=True)

        browser.close()
        print("\n[ALL COMPLETED] All 6 screenshots captured successfully!", flush=True)

if __name__ == "__main__":
    main()
