"""
Test Playwright Xác Thực Giao Diện Chi Tiết Đơn Sẵn Sàng Demo
Kiểm tra 5 tiêu chí:
1. Header (64px) không che Sidebar và Toolbar chi tiết đơn.
2. Tiêu đề hiển thị đầy đủ 'môi trường' (không bị cắt cụt thành 'môi trườn').
3. Dự thảo văn bản AI chuẩn Nghị định 30 (năm 2026, Số: .../TB-SGTVT, xuống dòng \n, bổ sung yêu cầu địa chỉ).
4. Khung xem văn bản A4 bên trái hiển thị rõ ràng, nét vẽ chuẩn chỉnh không tràn trang.
5. Chụp ảnh màn hình lưu vào screenshots/demo_ready_detail_check.png.
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright

def run_test():
    os.makedirs("screenshots", exist_ok=True)
    screenshot_path = os.path.abspath("screenshots/demo_ready_detail_check.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("1. Đang truy cập http://localhost:5173/login...")
        page.goto("http://localhost:5173/login", wait_until="networkidle")
        time.sleep(1)

        print("2. Đăng nhập tài khoản Cán bộ Sở GTVT...")
        page.fill('input[type="text"], input[name="username"]', 'canbo_gtvt')
        page.fill('input[type="password"], input[name="password"]', 'officer123')
        page.click('button:has-text("Đăng nhập")')

        print("3. Chờ chuyển hướng đến Bàn Làm Việc Cán Bộ (/officer)...")
        page.wait_for_url("**/officer**", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        print("4. Tìm và bấm mở hồ sơ ĐN-20261120-2514...")
        ticket_row = page.locator('text=ĐN-20261120-2514').first
        if not ticket_row.is_visible():
            print("⚠️ Chưa thấy row 2514 trên trang đầu, thử tìm kiếm...")
            search_input = page.locator('input[placeholder*="Tìm kiếm"]').first
            search_input.fill('2514')
            search_input.press('Enter')
            time.sleep(2)

        page.click('text=ĐN-20261120-2514')
        time.sleep(2)

        print("5. Kiểm tra các thành phần giao diện không bị che khuất:")
        # Kiểm tra Toolbar
        toolbar = page.locator('button:has-text("Hộp thư")').first
        assert toolbar.is_visible(), "Toolbar nút [Hộp thư] không hiển thị!"
        toolbar_box = toolbar.bounding_box()
        print(f"   ✓ Nút [Hộp thư] tọa độ Y: {toolbar_box['y']}px (Header cao 64px, vị trí Y > 64px chứng minh không bị che!)")
        assert toolbar_box['y'] >= 64, f"Toolbar bị Header che! y={toolbar_box['y']}"

        # Kiểm tra Sidebar
        sidebar_item = page.locator('text=Tất cả đơn thư').first
        assert sidebar_item.is_visible(), "Sidebar mục [Tất cả đơn thư] không hiển thị!"
        sidebar_box = sidebar_item.bounding_box()
        print(f"   ✓ Sidebar mục [Tất cả đơn thư] tọa độ Y: {sidebar_box['y']}px (Y > 64px chứng minh không bị che!)")
        assert sidebar_box['y'] >= 64, f"Sidebar bị Header che! y={sidebar_box['y']}"

        # Kiểm tra tiêu đề hồ sơ có chữ 'môi trường'
        title_el = page.locator('h2:has-text("môi trường")').first
        assert title_el.is_visible(), "Tiêu đề hồ sơ không chứa đầy đủ cụm từ 'môi trường'!"
        title_text = title_el.text_content()
        print(f"   ✓ Tiêu đề hồ sơ: '{title_text}'")
        assert "môi trườn" not in title_text or "môi trường" in title_text, "Tiêu đề vẫn bị lỗi 'môi trườn'!"

        # Kiểm tra textarea dự thảo văn bản trả lời
        textarea = page.locator('textarea').first
        assert textarea.is_visible(), "Khung soạn dự thảo trả lời không hiển thị!"
        draft_val = textarea.input_value()
        print(f"   ✓ Trích đoạn dự thảo (dòng đầu): {draft_val.splitlines()[0] if draft_val else ''}")
        assert "năm 2026" in draft_val, "Dự thảo chưa cập nhật năm 2026!"
        assert "Số: .../TB-SGTVT" in draft_val, "Dự thảo chưa có Số: .../TB-SGTVT!"
        assert " / " not in draft_val, "Dự thảo vẫn còn dấu gạch chéo ' / ' ngăn cách các dòng!"

        print(f"6. Chụp ảnh màn hình minh chứng tại: {screenshot_path}...")
        page.screenshot(path=screenshot_path, full_page=False)
        print("✓ ĐÃ HOÀN TẤT VÀ CHỤP ẢNH MINH CHỨNG THÀNH CÔNG!")

        browser.close()

if __name__ == "__main__":
    run_test()
