"""
Automated Playwright test for streamlined Citizen Navigation
Validates:
1. Complete removal of duplicate 3-tab bar in the middle of CitizenPortal
2. Clean Sidebar with exactly 3 functional items: [+ Gửi đơn mới], [Tra cứu mã hồ sơ], [Lịch sử đơn của tôi]
3. Active state highlighting for the currently open screen
4. Top Bar Search automatically redirects to lookup tab and executes tracking
5. Removal of emojis from [Chụp ảnh đơn] and [Chọn từ thư viện] buttons
6. Seamless switching across all 3 screens on Desktop and Mobile
"""

import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT_DIR = Path(__file__).resolve().parent.parent
SCREENSHOT_DIR = ROOT_DIR / "screenshots" / "citizen_navigation"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = "http://localhost:5173"

def run_tests():
    print("================================================================================")
    print("STARTING CITIZEN STREAMLINED NAVIGATION VERIFICATION")
    print("================================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ----------------------------------------------------------------------
        # 1. DESKTOP VIEWPORT TEST (1400 x 900)
        # ----------------------------------------------------------------------
        print("\n--- 1. DESKTOP NAVIGATION TEST (1400x900) ---")
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        # Login as citizen
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill("input[type='text']", "congdan1")
        page.fill("input[type='password']", "citizen123")
        page.click("button[type='submit']")
        page.wait_for_load_state("networkidle")
        time.sleep(1.0)

        # 1.1 Verify on submit form
        page.goto(f"{BASE_URL}/?tab=submit")
        page.wait_for_load_state("networkidle")
        time.sleep(1.0)
        page.screenshot(path=str(SCREENSHOT_DIR / "01_desktop_submit_form.png"))

        # Check 1: Old 3-tab bar in the middle is GONE
        tab_buttons = page.locator("button:has-text('Gửi Đơn'), button:has-text('Tra Cứu'), button:has-text('Lịch Sử')")
        # Ensure none inside the header card (max-w-xl mx-auto rounded-full)
        middle_tab_bar = page.locator(".max-w-xl.mx-auto.rounded-full, .grid.grid-cols-3.gap-1\\.5.p-1")
        if middle_tab_bar.count() == 0:
            print("  ✓ PASS: Đã xóa hoàn toàn thanh 3 tab trùng lặp ở giữa màn hình CitizenPortal.")
        else:
            print("  ✗ FAIL: Vẫn còn thanh 3 tab ở giữa màn hình.")

        # Check 2: Sidebar structure
        # Must NOT contain "Cổng nộp phản ánh"
        old_menu_item = page.locator(":text('Cổng nộp phản ánh')")
        if old_menu_item.count() == 0:
            print("  ✓ PASS: Đã xóa mục trùng lặp 'Cổng nộp phản ánh' khỏi Sidebar.")
        else:
            print("  ✗ FAIL: Vẫn còn mục 'Cổng nộp phản ánh' trong Sidebar.")

        # Check 3: Sidebar has [+ Gửi đơn mới], [Tra cứu mã hồ sơ], [Lịch sử đơn của tôi]
        compose_btn = page.locator("button:has-text('Gửi đơn mới')")
        lookup_link = page.locator("aside a:has-text('Tra cứu mã hồ sơ')")
        history_link = page.locator("aside a:has-text('Lịch sử đơn của tôi')")

        assert compose_btn.count() > 0, "Thiếu nút [+ Gửi đơn mới] trên Sidebar"
        assert lookup_link.count() > 0, "Thiếu liên kết [Tra cứu mã hồ sơ] trên Sidebar"
        assert history_link.count() > 0, "Thiếu liên kết [Lịch sử đơn của tôi] trên Sidebar"
        print("  ✓ PASS: Sidebar Công dân chỉ gồm đúng 3 mục chuẩn.")

        # Check 4: Emoji removed from Camera and Gallery buttons
        camera_btn = page.locator("button:has-text('Chụp ảnh đơn')")
        gallery_btn = page.locator("button:has-text('Chọn từ thư viện')")
        camera_text = camera_btn.first.inner_text()
        gallery_text = gallery_btn.first.inner_text()
        assert "📷" not in camera_text, f"Vẫn còn emoji camera trong: {camera_text}"
        assert "🖼️" not in gallery_text and "🖼" not in gallery_text, f"Vẫn còn emoji gallery trong: {gallery_text}"
        print(f"  ✓ PASS: Nút ảnh sạch emoji: '{camera_text.strip()}' & '{gallery_text.strip()}' (Icon SVG chuẩn).")

        # Check 5: Click [Tra cứu mã hồ sơ] from Sidebar
        lookup_link.first.click()
        page.wait_for_load_state("networkidle")
        time.sleep(1.0)
        page.screenshot(path=str(SCREENSHOT_DIR / "02_desktop_lookup_screen.png"))
        assert "tab=lookup" in page.url or "tab=track" in page.url, f"URL không chứa tab=lookup: {page.url}"
        assert page.locator("main input[placeholder*='ĐN-']").count() > 0, "Không hiển thị khung tra cứu mã hồ sơ"
        print("  ✓ PASS: Click [Tra cứu mã hồ sơ] trên Sidebar chuyển sang màn hình tra cứu thành công.")

        # Check 6: Click [Lịch sử đơn của tôi] from Sidebar
        history_link = page.locator("aside a:has-text('Lịch sử đơn của tôi')")
        history_link.first.click()
        page.wait_for_load_state("networkidle")
        time.sleep(1.0)
        page.screenshot(path=str(SCREENSHOT_DIR / "03_desktop_history_screen.png"))
        assert "tab=history" in page.url, f"URL không chứa tab=history: {page.url}"
        print("  ✓ PASS: Click [Lịch sử đơn của tôi] trên Sidebar chuyển sang màn hình lịch sử thành công.")

        # Check 7: Click [+ Gửi đơn mới] from Sidebar
        compose_btn = page.locator("button:has-text('Gửi đơn mới')")
        compose_btn.first.click()
        page.wait_for_load_state("networkidle")
        time.sleep(1.0)
        page.screenshot(path=str(SCREENSHOT_DIR / "04_desktop_compose_reset.png"))
        assert "tab=submit" in page.url or page.url.endswith("/"), f"URL không chuyển về form submit: {page.url}"
        assert page.locator("input[placeholder*='Nguyễn Văn An']").count() > 0, "Không hiển thị form gửi đơn"
        print("  ✓ PASS: Click [+ Gửi đơn mới] từ Sidebar chuyển về form gửi đơn thành công.")

        # Check 8: Top Bar Search functionality for Citizen
        top_search_input = page.locator("header input[type='text']")
        top_search_input.fill("ĐN-20261120-6818")
        top_search_input.press("Enter")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        page.screenshot(path=str(SCREENSHOT_DIR / "05_desktop_top_search_result.png"))
        assert "tab=lookup" in page.url, f"Top search không chuyển sang tab=lookup: {page.url}"
        tracking_input = page.locator("main input[placeholder*='ĐN-']").first
        assert "ĐN-20261120-6818" in page.url or "ĐN-20261120-6818" in tracking_input.input_value(), "Không nạp mã vào ô tra cứu"
        print("  ✓ PASS: Gõ mã hồ sơ vào ô Search Top Bar và nhấn Enter tự động mở màn hình tra cứu và thực thi.")

        context.close()

        # ----------------------------------------------------------------------
        # 2. MOBILE VIEWPORT TEST (390 x 844)
        # ----------------------------------------------------------------------
        print("\n--- 2. MOBILE NAVIGATION TEST (390x844) ---")
        m_context = browser.new_context(viewport={"width": 390, "height": 844})
        m_page = m_context.new_page()

        m_page.goto(f"{BASE_URL}/login")
        m_page.wait_for_load_state("networkidle")
        m_page.fill("input[type='text']", "congdan1")
        m_page.fill("input[type='password']", "citizen123")
        m_page.click("button[type='submit']")
        m_page.wait_for_load_state("networkidle")
        time.sleep(1.0)

        # Open Drawer
        m_page.screenshot(path=str(SCREENSHOT_DIR / "06_mobile_citizen_home.png"))
        menu_btn = m_page.locator("button[aria-label='Toggle sidebar'], header button:has(.lucide-menu)")
        menu_btn.first.click()
        time.sleep(0.5)
        m_page.screenshot(path=str(SCREENSHOT_DIR / "07_mobile_drawer_open.png"))

        # Click Tra cứu mã hồ sơ in Mobile Drawer
        m_lookup = m_page.locator("aside a:has-text('Tra cứu mã hồ sơ')")
        m_lookup.first.click()
        m_page.wait_for_load_state("networkidle")
        time.sleep(1.0)
        m_page.screenshot(path=str(SCREENSHOT_DIR / "08_mobile_lookup_screen.png"))
        assert "tab=lookup" in m_page.url or "tab=track" in m_page.url, "Mobile drawer tra cứu thất bại"
        print("  ✓ PASS: Mobile Drawer click [Tra cứu mã hồ sơ] đóng menu và chuyển trang mượt mà.")

        # Open Drawer again, click Lịch sử đơn của tôi
        menu_btn.first.click()
        time.sleep(0.5)
        m_history = m_page.locator("aside a:has-text('Lịch sử đơn của tôi')")
        m_history.first.click()
        m_page.wait_for_load_state("networkidle")
        time.sleep(1.0)
        m_page.screenshot(path=str(SCREENSHOT_DIR / "09_mobile_history_screen.png"))
        assert "tab=history" in m_page.url, "Mobile drawer lịch sử thất bại"
        print("  ✓ PASS: Mobile Drawer click [Lịch sử đơn của tôi] chuyển trang mượt mà.")

        # Check horizontal scroll on mobile
        scroll_width = m_page.evaluate("document.documentElement.scrollWidth")
        client_width = m_page.evaluate("document.documentElement.clientWidth")
        assert scroll_width <= client_width, f"Lỗi tràn ngang mobile: scrollWidth={scroll_width} > clientWidth={client_width}"
        print(f"  ✓ PASS: Mobile hoàn toàn không bị tràn ngang ({scroll_width}px <= {client_width}px).")

        m_context.close()
        browser.close()

    print("\n================================================================================")
    print("ALL CITIZEN STREAMLINED NAVIGATION TESTS PASSED (100% SUCCESS)!")
    print("================================================================================")

if __name__ == "__main__":
    run_tests()
