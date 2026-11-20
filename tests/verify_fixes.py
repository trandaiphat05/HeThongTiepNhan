import requests

BASE = "http://localhost:8000"

p1 = requests.post(f"{BASE}/api/rag/ingest", data={"category": "CHUNG"})
print("1. POST /api/rag/ingest (no auth):", p1.status_code, "(PASS: 401)" if p1.status_code == 401 else "FAIL")

p2 = requests.post(f"{BASE}/api/admin/rag", data={"category": "CHUNG"})
print("2. POST /api/admin/rag (no auth):", p2.status_code, "(PASS: 401)" if p2.status_code == 401 else "FAIL")

p3 = requests.delete(f"{BASE}/api/rag/docs/1")
print("3. DELETE /api/rag/docs/1 (no auth):", p3.status_code, "(PASS: 401)" if p3.status_code == 401 else "FAIL")

p4 = requests.post(f"{BASE}/api/gmail/disconnect")
print("4. POST /api/gmail/disconnect (no auth):", p4.status_code, "(PASS: 401)" if p4.status_code == 401 else "FAIL")

p5 = requests.post(f"{BASE}/api/notifications/disconnect-gmail")
print("5. POST /api/notifications/disconnect-gmail (no auth):", p5.status_code, "(PASS: 401)" if p5.status_code == 401 else "FAIL")

p6 = requests.post(f"{BASE}/api/gmail/link", json={"gmail_account": "a@gmail.com", "gmail_app_password": "123"})
print("6. POST /api/gmail/link (no auth):", p6.status_code, "(PASS: 401)" if p6.status_code == 401 else "FAIL")

p7 = requests.get(f"{BASE}/api/citizen/my-tickets?email=test@example.com")
print("7. GET /api/citizen/my-tickets (no auth):", p7.status_code, "(PASS: 401)" if p7.status_code == 401 else "FAIL")

login_adm = requests.post(f"{BASE}/api/auth/login", json={"username": "admin", "password": "admin123"}).json()
adm_headers = {"Authorization": "Bearer " + login_adm["access_token"]}

p8 = requests.post(f"{BASE}/api/rag/ingest", files={"file": ("malware.bat", b"@echo off\necho hello", "text/plain")}, headers=adm_headers)
print("8. Admin upload malware.bat:", p8.status_code, "(PASS: 400)" if p8.status_code == 400 else "FAIL", p8.json().get("detail"))

login_off = requests.post(f"{BASE}/api/auth/login", json={"username": "canbo_gtvt", "password": "officer123"}).json()
off_headers = {"Authorization": "Bearer " + login_off["access_token"]}

ticks = requests.get(f"{BASE}/api/tickets", headers=off_headers).json()
app_ticket = next((t for t in ticks if t.get("status") in ["APPROVED", "RESOLVED"]), None)
if app_ticket:
    t_id = app_ticket["ticket_id"]
    p9 = requests.put(f"{BASE}/api/tickets/{t_id}/reassign", json={"department_code": "SO_XD", "reason": "Test"}, headers=off_headers)
    print(f"9. Reassign on {app_ticket['status']} ticket {t_id}:", p9.status_code, "(PASS: 400)" if p9.status_code == 400 else "FAIL", p9.json().get("detail"))
    p10 = requests.put(f"{BASE}/api/tickets/{t_id}/draft", json={"draft_reply": "Hacked reply"}, headers=off_headers)
    print(f"10. Edit draft on {app_ticket['status']} ticket {t_id}:", p10.status_code, "(PASS: 400)" if p10.status_code == 400 else "FAIL", p10.json().get("detail"))
else:
    print("9 & 10. No approved ticket currently in DB to test state integrity.")
