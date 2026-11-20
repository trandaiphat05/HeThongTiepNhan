from playwright.sync_api import sync_playwright
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
AUDIT_DIR = ROOT_DIR / "screenshots" / "audit"
BASE_URL = "http://localhost:5173"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1400, "height": 900})
    page = ctx.new_page()

    page.goto(f"{BASE_URL}/login")
    page.fill("input[type='text']", "canbo_gtvt")
    page.fill("input[type='password']", "officer123")
    page.click("button[type='submit']")
    page.wait_for_load_state("networkidle")
    time.sleep(1.5)

    page.goto(f"{BASE_URL}/officer")
    page.wait_for_load_state("networkidle")
    time.sleep(2.0)

    # Click first row in Inbox
    first_row = page.locator("div.group.cursor-pointer, :text('ĐN-')").first
    print("Found row:", first_row.is_visible())
    first_row.click()
    page.wait_for_load_state("networkidle")
    time.sleep(2.0)
    page.screenshot(path=str(AUDIT_DIR / "10_officer_split_view_detail.png"))
    print("Screenshot 10 captured")

    # Click Reassign modal
    reassign_btn = page.locator("button:has-text('Chuyển Tuyến'), button:has-text('Chuyển cơ quan')")
    if reassign_btn.count() > 0:
        reassign_btn.first.click()
        time.sleep(1.0)
        page.screenshot(path=str(AUDIT_DIR / "11_officer_reassign_modal.png"))
        print("Screenshot 11 captured")
        page.keyboard.press("Escape")
        time.sleep(0.5)

    # Click Approve button to open Confirm Dialog
    approve_btn = page.locator("button:has-text('Phê Duyệt & Ban Hành'), button:has-text('Phê Duyệt')")
    if approve_btn.count() > 0:
        approve_btn.first.click()
        time.sleep(1.0)
        page.screenshot(path=str(AUDIT_DIR / "12_officer_approve_confirm_dialog.png"))
        print("Screenshot 12 captured")
        page.keyboard.press("Escape")
        time.sleep(0.5)

    browser.close()
    print("Done capturing officer detail screenshots")
