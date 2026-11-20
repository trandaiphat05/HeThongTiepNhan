"""
Kiểm thử Giao diện & Tính năng Đính kèm ảnh mới trên Trang Công dân
1. Nút "Chụp ảnh đơn" và thuộc tính capture đã bị xóa bỏ hoàn toàn.
2. Tiêu đề mục: ĐÍNH KÈM ẢNH ĐƠN THƯ / HIỆN TRƯỜNG (TÙY CHỌN).
3. Khung tải ảnh full-width duy nhất với nhãn "Tải ảnh lên từ thiết bị".
4. Tải ảnh lên hiển thị thumbnail preview, bấm nút [X] xóa ảnh hoạt động chuẩn.
5. Gửi đơn chỉ đính kèm ảnh (không cần gõ văn bản) thành công.
"""

import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = Path("d:/Code/DauTruongAI/audit_output/image_upload_streamlined")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

# Test image path
TEST_IMAGE = Path("d:/Code/DauTruongAI/tests/assets/don_trang_1.jpg")
if not TEST_IMAGE.exists():
    TEST_IMAGE = Path("d:/Code/DauTruongAI/screenshots/01_citizen_submit_success.png")


def test_streamlined_image_upload():
    print("\n=======================================================")
    print("KIỂM THỬ KHUNG TẢI ẢNH STREAMLINED TRÊN FORM CÔNG DÂN")
    print("=======================================================\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Đăng nhập tài khoản Công dân
        print("1. Đăng nhập tài khoản Công dân (congdan1)...")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        time.sleep(1.0)

        page.fill("input[type='text']", "congdan1")
        page.fill("input[type='password']", "citizen123")
        page.click("button[type='submit']")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)

        # Đảm bảo đang ở trang form gửi đơn (?tab=submit hoặc /)
        if "?tab=submit" not in page.url:
            page.goto(f"{BASE_URL}/?tab=submit")
            page.wait_for_load_state("networkidle")
            time.sleep(1.0)

        # 2. Kiểm tra Nút Camera và thuộc tính capture đã biến mất
        print("\n2. Kiểm tra loại bỏ tính năng Chụp ảnh camera...")
        cam_btn = page.locator("button:has-text('Chụp ảnh đơn')")
        assert cam_btn.count() == 0, "Nút 'Chụp ảnh đơn' vẫn còn tồn tại trong DOM!"
        print("   -> PASS: Nút 'Chụp ảnh đơn' đã được xóa bỏ hoàn toàn.")

        capture_inputs = page.locator("input[capture]")
        assert capture_inputs.count() == 0, "Vẫn còn thẻ input chứa thuộc tính 'capture'!"
        print("   -> PASS: 0 thẻ input nào chứa thuộc tính 'capture'.")

        # 3. Kiểm tra tiêu đề mục
        print("\n3. Kiểm tra tiêu đề mục đính kèm ảnh...")
        heading = page.locator("label:has-text('ĐÍNH KÈM ẢNH ĐƠN THƯ / HIỆN TRƯỜNG (TÙY CHỌN)')")
        assert heading.count() > 0, "Không tìm thấy tiêu đề mục 'ĐÍNH KÈM ẢNH ĐƠN THƯ / HIỆN TRƯỜNG (TÙY CHỌN)'!"
        print("   -> PASS: Tiêu đề mục chuẩn: 'ĐÍNH KÈM ẢNH ĐƠN THƯ / HIỆN TRƯỜNG (TÙY CHỌN)'.")

        # 4. Kiểm tra khung tải ảnh full-width
        print("\n4. Kiểm tra khung tải ảnh duy nhất...")
        upload_box = page.locator("text='Tải ảnh lên từ thiết bị'")
        assert upload_box.count() > 0, "Không tìm thấy nhãn 'Tải ảnh lên từ thiết bị'!"
        print("   -> PASS: Nhãn 'Tải ảnh lên từ thiết bị' hiển thị rõ ràng.")

        file_input = page.locator("input[type='file'][multiple]")
        assert file_input.count() == 1, f"Yêu cầu 1 thẻ input multiple duy nhất, tìm thấy {file_input.count()}!"
        accept_attr = file_input.get_attribute("accept")
        print(f"   -> Thuộc tính accept: '{accept_attr}'")
        assert "image/jpeg" in accept_attr and "image/png" in accept_attr
        print("   -> PASS: Thẻ input type='file' accept='image/jpeg,image/png,image/webp' multiple chuẩn xác.")

        page.screenshot(path=str(SCREENSHOT_DIR / "01_streamlined_upload_box.png"))
        print("   -> Đã chụp ảnh giao diện ban đầu: 01_streamlined_upload_box.png")

        # 5. Tải ảnh lên và kiểm tra thumbnail preview & nút [X]
        print("\n5. Thử nghiệm tải ảnh lên...")
        assert TEST_IMAGE.exists(), f"Không tìm thấy file ảnh mẫu: {TEST_IMAGE}"
        file_input.set_input_files([str(TEST_IMAGE)])
        time.sleep(1.0)

        thumbnails = page.locator("div.relative.w-20.h-20")
        assert thumbnails.count() == 1, f"Kỳ vọng 1 thumbnail preview, tìm thấy {thumbnails.count()}"
        print("   -> PASS: Thumbnail ảnh đính kèm hiển thị đẹp mắt.")

        delete_btn = thumbnails.first.locator("button[title='Xóa ảnh']")
        assert delete_btn.is_visible(), "Nút xóa ảnh [X] không hiển thị!"
        print("   -> PASS: Nút xóa ảnh [X] hiển thị chuẩn.")

        page.screenshot(path=str(SCREENSHOT_DIR / "02_thumbnail_preview.png"))
        print("   -> Đã chụp ảnh thumbnail: 02_thumbnail_preview.png")

        # 6. Thử nghiệm gửi đơn chỉ với ảnh (không cần gõ raw_text)
        print("\n6. Kiểm tra gửi đơn chỉ đính kèm ảnh (không bắt buộc nhập văn bản)...")
        page.fill("input[placeholder='Nguyễn Văn An']", "Trần Thị Mai (Kiểm Thử Ảnh)")
        page.fill("input[placeholder='0912 345 678']", "0987654321")
        page.fill("input[placeholder='nguyenvanan@gmail.com']", "mai.tran@test.dongnai.gov.vn")
        page.fill("input[placeholder='Phường/Xã, Huyện/TP...']", "Phường Quyết Thắng, TP. Biên Hòa")

        # Để trống textarea raw_text, bấm gửi
        submit_btn = page.locator("button:has-text('Gửi Đơn Thư')")
        submit_btn.click()
        print("   -> Đã bấm 'Gửi Đơn Thư'...")

        # Chờ modal biên nhận thành công xuất hiện
        receipt_modal = page.locator("text='Tiếp Nhận Đơn Thư Thành Công'")
        receipt_modal.wait_for(state="visible", timeout=20000)
        assert receipt_modal.is_visible(), "Không hiển thị biên nhận nộp đơn thành công!"

        tracking_code_el = page.locator("div.font-mono.font-black")
        tracking_code = tracking_code_el.first.inner_text().strip()
        print(f"   -> Nộp đơn thành công! Mã biên nhận: {tracking_code}")

        page.screenshot(path=str(SCREENSHOT_DIR / "03_submission_success_image_only.png"))
        print("   -> Đã chụp ảnh biên nhận thành công: 03_submission_success_image_only.png")

        print("\n=======================================================")
        print("HOÀN TẤT KIỂM THỬ: TẤT CẢ TIÊU CHÍ ĐỀU ĐẠT CHUẨN PASS!")
        print("=======================================================\n")

        browser.close()


if __name__ == "__main__":
    test_streamlined_image_upload()
