"""
Script Kiểm thử Tự động E2E - Kiểm tra Triệt để 4 Lỗi Phân hệ Kho Văn Bản RAG
1. Hiển thị nội dung đầy đủ khi bấm mở điều luật (không bị trống).
2. Đồng bộ danh mục 9 Sở/Ngành + Ngoại lệ, không bị gán nhầm SO_GTVT.
3. Dọn gọn giao diện: chỉ 1 nút Thêm, không lặp '+ +', không code thô trong tiêu đề.
4. Modal nạp luật phẳng, không lồng 2 lớp header, dropdown đủ tất cả đơn vị.
"""

import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = Path("d:/Code/DauTruongAI/audit_output/rag_fixes")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


def test_rag_module():
    print("\n=======================================================")
    print("BẮT ĐẦU KIỂM THỬ E2E TOÀN BỘ PHÂN HỆ KHO VĂN BẢN RAG")
    print("=======================================================\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Đăng nhập Admin
        print("1. Đăng nhập tài khoản Quản trị viên (admin)...")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        page.fill("input[type='text']", "admin")
        page.fill("input[type='password']", "admin123")
        page.click("button[type='submit']")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)

        # 2. Điều hướng tới Trang Quản trị và chuyển sang tab Kho Văn Bản
        print("2. Chuyển sang Tab Kho Văn Bản Quy Phạm Pháp Luật...")
        page.goto(f"{BASE_URL}/admin")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)

        # Bấm tab "Kho Văn Bản" trên sidebar/tab admin
        rag_tab_btn = page.locator("button:has-text('Kho Văn Bản')")
        assert rag_tab_btn.count() > 0, "Không tìm thấy nút tab 'Kho Văn Bản'!"
        rag_tab_btn.first.click()
        time.sleep(1.5)

        page.screenshot(path=str(SCREENSHOT_DIR / "01_rag_main_tab.png"))
        print("   -> Đã chụp ảnh tab Kho Văn Bản: 01_rag_main_tab.png")

        # 3. Kiểm tra dọn gọn nút Thêm văn bản và loại bỏ '+ +'
        print("\n3. Kiểm tra nút 'Thêm Văn Bản Luật' (Không bị trùng lặp '+ +')...")
        add_btns = page.locator("button:has-text('Thêm Văn Bản Luật'), button:has-text('Thêm văn bản')").all()
        print(f"   -> Số lượng nút 'Thêm' trên giao diện chính: {len(add_btns)}")
        assert len(add_btns) == 1, f"Yêu cầu DUY NHẤT 1 nút Thêm văn bản luật, nhưng phát hiện {len(add_btns)} nút!"

        btn_text = add_btns[0].inner_text().strip()
        print(f"   -> Nội dung text của nút: '{btn_text}'")
        assert "+ +" not in btn_text, "Nút vẫn còn bị lỗi gõ lặp 2 dấu cộng '+ +'!"
        assert "+ Thêm" not in btn_text, "Nút vẫn còn dấu cộng thừa trong text!"
        print("   -> PASS: Chỉ có 1 nút 'Thêm Văn Bản Luật' duy nhất, icon chuẩn không bị lặp '+ +'.")

        # 4. Kiểm tra danh mục bộ lọc Lĩnh vực (Categories)
        print("\n4. Kiểm tra danh mục bộ lọc Lĩnh vực (Đầy đủ tất cả Sở/Ngành)...")
        expected_cats = [
            "Tất Cả",
            "Quy Định Chung",
            "Sở GTVT",
            "Sở TN&MT",
            "Sở Xây Dựng",
            "Sở Y tế",
            "Sở GD&ĐT",
            "Sở LĐ-TB&XH",
            "Công an Tỉnh",
            "Bộ phận Một cửa",
            "UBND Cấp Huyện / TP",
            "Điều Phối Ngoại Lệ",
        ]

        filter_buttons = page.locator("div.space-y-4 button").all()
        filter_texts = [b.inner_text().strip() for b in filter_buttons if b.inner_text().strip() in expected_cats]
        print(f"   -> Các nút bộ lọc tìm thấy: {filter_texts}")

        for exp in expected_cats:
            assert exp in filter_texts, f"Thiếu nhãn bộ lọc '{exp}'!"
        print(f"   -> PASS: Đầy đủ 100% {len(expected_cats)} danh mục bộ lọc chuẩn.")

        # 5. Kiểm tra tiêu đề văn bản: Không chứa code raw ('SO_XD'), ('SO_TNMT'), v.v.
        print("\n5. Kiểm tra tiêu đề văn bản và nhãn hiển thị...")
        title_elements = page.locator("span.text-xs.font-bold.text-\\[\\#1F1F1F\\].truncate").all()
        print(f"   -> Tìm thấy {len(title_elements)} điều khoản đang hiển thị trên danh sách.")
        assert len(title_elements) >= 18, f"Kỳ vọng ít nhất 18 điều khoản, nhận được {len(title_elements)}"

        for el in title_elements:
            t = el.inner_text().strip()
            for raw_code in ["('SO_GTVT')", "('SO_TNMT')", "('SO_XD')", "('SO_YTE')", "('SO_GDDT')", "('CONG_AN_TINH')", "('UBND_CAP_HUYEN')", "('REQUIRE_HUMAN_REVIEW')"]:
                assert raw_code not in t, f"Tiêu đề vẫn còn chứa chuỗi code raw '{raw_code}': {t}"
        print("   -> PASS: Toàn bộ tiêu đề đã được làm sạch, không còn chuỗi code thô.")

        # 6. Kiểm tra mở Accordion xem nội dung chi tiết (Không bị trống nội dung)
        print("\n6. Kiểm tra mở xem nội dung chi tiết điều luật (Accordion)...")
        # Click mở điều khoản đầu tiên (GTVT)
        first_doc = page.locator("div.bg-white.border.rounded-xl").first
        first_doc.click()
        time.sleep(0.5)

        # Kiểm tra nội dung hiển thị
        content_box_1 = first_doc.locator("div.whitespace-pre-line")
        assert content_box_1.is_visible(), "Khung nội dung chi tiết không hiển thị khi bấm mở điều luật 1!"
        content_text_1 = content_box_1.inner_text().strip()
        print(f"   -> Nội dung điều luật 1 (độ dài {len(content_text_1)} ký tự):")
        print(f"      '{content_text_1[:120]}...'")
        assert len(content_text_1) > 100, "Nội dung điều luật 1 bị rỗng hoặc quá ngắn!"

        # Click mở điều khoản thứ 3 (TN&MT)
        third_doc = page.locator("div.bg-white.border.rounded-xl").nth(2)
        third_doc.click()
        time.sleep(0.5)

        content_box_3 = third_doc.locator("div.whitespace-pre-line")
        assert content_box_3.is_visible(), "Khung nội dung chi tiết không hiển thị khi bấm mở điều luật 3!"
        content_text_3 = content_box_3.inner_text().strip()
        print(f"   -> Nội dung điều luật 3 (độ dài {len(content_text_3)} ký tự):")
        print(f"      '{content_text_3[:120]}...'")
        assert len(content_text_3) > 100, "Nội dung điều luật 3 bị rỗng hoặc quá ngắn!"

        page.screenshot(path=str(SCREENSHOT_DIR / "02_rag_accordion_expanded.png"))
        print("   -> Đã chụp ảnh nội dung accordion mở rộng: 02_rag_accordion_expanded.png")
        print("   -> PASS: Cả 2 điều luật mở ra đều hiển thị đầy đủ nội dung, giữ nguyên xuống dòng đẹp mắt.")

        # 7. Kiểm tra lọc theo từng Sở: Xác minh không bị gán nhầm SO_GTVT
        print("\n7. Kiểm tra lọc danh mục từng đơn vị (Xác minh không bị gán nhầm SO_GTVT)...")
        test_filters = [
            ("Sở TN&MT", "SO_TNMT"),
            ("Sở Xây Dựng", "SO_XD"),
            ("Sở Y tế", "SO_YTE"),
            ("Sở GD&ĐT", "SO_GDDT"),
            ("Sở LĐ-TB&XH", "SO_LDTBXH"),
            ("Công an Tỉnh", "CONG_AN_TINH"),
            ("Bộ phận Một cửa", "BO_PHAN_MOT_CUA"),
            ("UBND Cấp Huyện / TP", "UBND_CAP_HUYEN"),
            ("Điều Phối Ngoại Lệ", "REQUIRE_HUMAN_REVIEW"),
        ]

        for label, expected_code in test_filters:
            btn = page.locator(f"button:has-text('{label}')").first
            btn.click()
            time.sleep(0.5)

            # Lấy các badge danh mục hiện có
            badges = page.locator("span.text-\\[10px\\].font-semibold.px-2").all()
            assert len(badges) > 0, f"Không có điều khoản nào trong danh mục '{label}'!"
            for badge in badges:
                b_text = badge.inner_text().strip()
                assert b_text == label or b_text == expected_code, f"Lỗi phân loại! Đang lọc '{label}' nhưng phát hiện '{b_text}'"
            print(f"   -> Bộ lọc '{label}': {len(badges)} điều khoản chuẩn xác 100%.")

        # Bấm lại 'Tất Cả'
        page.locator("button:has-text('Tất Cả')").first.click()
        time.sleep(0.5)

        # 8. Kiểm tra Modal 'Thêm Văn Bản Luật' (RAGIngestForm)
        print("\n8. Kiểm tra Modal 'Thêm Văn Bản Luật'...")
        add_btn = page.locator("button:has-text('Thêm Văn Bản Luật')").first
        add_btn.click()
        time.sleep(0.5)

        # Kiểm tra không còn tiêu đề con lồng bên trong
        inner_redundant_title = page.locator("h4:has-text('Nạp Văn Bản Quy Phạm Pháp Luật Mới')")
        assert inner_redundant_title.count() == 0, "Modal vẫn còn tiêu đề lồng thừa thãi bên trong!"
        print("   -> PASS: Tiêu đề lồng thừa thãi bên trong đã được xóa bỏ hoàn toàn.")

        # Kiểm tra dropdown Lĩnh Vực Thẩm Quyền có đủ các Sở
        select_field = page.locator("select").first
        options = select_field.locator("option").all()
        option_values = [opt.get_attribute("value") for opt in options]
        print(f"   -> Các option lĩnh vực trong Modal: {option_values}")

        expected_options = [
            "CHUNG",
            "SO_GTVT",
            "SO_TNMT",
            "SO_XD",
            "SO_YTE",
            "SO_GDDT",
            "SO_LDTBXH",
            "CONG_AN_TINH",
            "BO_PHAN_MOT_CUA",
            "UBND_CAP_HUYEN",
            "REQUIRE_HUMAN_REVIEW",
        ]
        for opt in expected_options:
            assert opt in option_values, f"Modal thiếu option '{opt}' trong dropdown!"
        print(f"   -> PASS: Dropdown trong Modal nạp văn bản có đầy đủ {len(expected_options)} đơn vị.")

        page.screenshot(path=str(SCREENSHOT_DIR / "03_rag_ingest_modal.png"))
        print("   -> Đã chụp ảnh Modal nạp văn bản: 03_rag_ingest_modal.png")

        # Đóng modal
        close_modal_btn = page.locator("button[aria-label='Close modal'], button:has-text('✕')").first
        if close_modal_btn.count() > 0:
            close_modal_btn.click()
        else:
            page.keyboard.press("Escape")
        time.sleep(0.5)

        # 9. Kiểm tra Tab "Tra Cứu Văn Bản"
        print("\n9. Kiểm tra Tab Tra Cứu Văn Bản (RAGSearchTest)...")
        search_tab_btn = page.locator("button:has-text('Tra Cứu Văn Bản')").first
        search_tab_btn.click()
        time.sleep(0.5)

        search_input = page.locator("input[placeholder*='Xe chở cát quá tải']")
        assert search_input.is_visible(), "Không thấy ô nhập tra cứu luật!"
        search_input.fill("Xe ben chở quá tải làm rơi đất cát gây sụt lún đường ĐT.768")

        search_btn = page.locator("button:has-text('Tìm Căn Cứ Luật')").first
        search_btn.click()
        time.sleep(1.0)

        results_box = page.locator("text=KẾT QUẢ TRA CỨU")
        assert results_box.is_visible(), "Không hiển thị kết quả tra cứu luật!"

        matches = page.locator("span.font-mono.font-semibold").all()
        print(f"   -> Tìm thấy {len(matches)} căn cứ pháp lý phù hợp với nội dung tra cứu.")
        assert len(matches) > 0, "Không có căn cứ pháp lý nào được trả về!"

        page.screenshot(path=str(SCREENSHOT_DIR / "04_rag_search_test.png"))
        print("   -> Đã chụp ảnh tab Tra Cứu: 04_rag_search_test.png")
        print("   -> PASS: Tra cứu căn cứ pháp luật hoạt động chính xác.")

        # 10. Kiểm tra Tab "Soạn Thảo Trực Tiếp" (RAGRawEditor)
        print("\n10. Kiểm tra Tab Soạn Thảo Trực Tiếp (RAGRawEditor)...")
        raw_tab_btn = page.locator("button:has-text('Soạn Thảo Trực Tiếp')").first
        raw_tab_btn.click()
        time.sleep(0.5)

        raw_textarea = page.locator("textarea[placeholder*='Nhập nội dung quy định']")
        assert raw_textarea.is_visible(), "Không thấy ô soạn thảo trực tiếp!"
        raw_text_val = raw_textarea.input_value()
        print(f"   -> Độ dài văn bản trong editor: {len(raw_text_val)} ký tự.")
        assert "SO_GTVT" in raw_text_val
        assert "SO_TNMT" in raw_text_val
        assert "SO_XD" in raw_text_val
        assert "SO_YTE" in raw_text_val
        assert "SO_GDDT" in raw_text_val
        assert "SO_LDTBXH" in raw_text_val
        assert "CONG_AN_TINH" in raw_text_val
        assert "UBND_CAP_HUYEN" in raw_text_val
        assert "REQUIRE_HUMAN_REVIEW" in raw_text_val
        print("   -> PASS: Soạn thảo trực tiếp chứa đầy đủ cả 9 lĩnh vực chuyên môn.")

        page.screenshot(path=str(SCREENSHOT_DIR / "05_rag_raw_editor.png"))
        print("   -> Đã chụp ảnh tab Soạn thảo: 05_rag_raw_editor.png")

        print("\n=======================================================")
        print("HOÀN TẤT 100% KIỂM THỬ: TẤT CẢ 4 MỤC ĐỀU ĐẠT CHUẨN PASS!")
        print("=======================================================\n")

        browser.close()


if __name__ == "__main__":
    test_rag_module()
