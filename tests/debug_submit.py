from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('console', lambda msg: print(f"[CONSOLE {msg.type}] {msg.text}"))
    page.on('response', lambda res: print(f"[RESPONSE] {res.status} {res.url}") if '/api/' in res.url else None)
    
    page.goto('http://localhost:3000/login')
    page.locator("button:has-text('congdan1')").first.click()
    page.wait_for_url('http://localhost:3000/')
    time.sleep(1)
    
    page.fill("input[placeholder*='Nguyễn Văn An']", 'Trần Đại Phát')
    page.fill("input[placeholder*='0912']", '0901234567')
    page.fill("input[placeholder*='vidu@gmail.com']", 'test@gmail.com')
    page.fill("textarea[placeholder*='Mô tả cụ thể sự việc']", 'Doanh nghiệp xả nước thải đen đặc bốc mùi hôi thối ra kênh thoát nước KCN Biên Hòa 2 gây ô nhiễm môi trường nghiêm trọng.')
    page.set_input_files("input[type='file']", 'tests/sample_images/don_moi_truong.png')
    time.sleep(1)
    
    print("[DEBUG] Clicking submit...")
    page.locator("button:has-text('Gửi Phản Ánh, Kiến Nghị')").click()
    time.sleep(10)
    browser.close()

