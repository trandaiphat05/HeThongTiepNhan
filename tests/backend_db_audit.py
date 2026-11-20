"""
Script Backend & DB Comprehensive Audit
Thực hiện toàn bộ các bài test kiểm thử bảo mật, phân quyền RBAC/IDOR, upload tệp, tính nhất quán trạng thái, RAG và Gmail.
"""

import os
import sys
import json
import io
from typing import Dict, Any, List
import httpx

BASE_URL = "http://localhost:8000"

def log_test(title: str):
    print(f"\n{'='*70}\n[TEST] {title}\n{'='*70}")

def run_backend_audit():
    findings = []
    
    # Khởi tạo HTTP Client
    client = httpx.Client(base_url=BASE_URL, timeout=30.0)
    
    # 0. Lấy Token đăng nhập cho các Roles
    log_test("0. Đăng nhập và lấy Access Tokens")
    tokens = {}
    users_info = {}
    for role_name, username, password in [
        ("ADMIN", "admin", "admin123"),
        ("OFFICER_GTVT", "canbo_gtvt", "officer123"),
        ("CITIZEN", "congdan1", "citizen123"),
    ]:
        resp = client.post("/api/auth/login", json={"username": username, "password": password})
        if resp.status_code == 200:
            data = resp.json()
            tokens[role_name] = data["access_token"]
            users_info[role_name] = data["user"]
            print(f"[OK] {role_name} ({username}) đăng nhập thành công.")
        else:
            print(f"[FAIL] Không thể đăng nhập {role_name}: {resp.status_code} {resp.text}")

    admin_header = {"Authorization": f"Bearer {tokens.get('ADMIN')}"}
    officer_header = {"Authorization": f"Bearer {tokens.get('OFFICER_GTVT')}"}
    citizen_header = {"Authorization": f"Bearer {tokens.get('CITIZEN')}"}

    # =========================================================================
    # 1. RBAC & IDOR AUDIT
    # =========================================================================
    log_test("1. RBAC & IDOR: Kiểm tra truy cập khi chưa xác thực (Unauthenticated)")
    
    unauth_checks = [
        ("GET", "/api/tickets", 401),
        ("GET", "/api/tickets/1", 401),
        ("PUT", "/api/tickets/1/reassign", 401, {"department_code": "SO_XD", "reason": "test"}),
        ("PUT", "/api/tickets/1/approve", 401, {"draft_reply": "test"}),
        ("PUT", "/api/tickets/1/draft", 401, {"draft_reply": "test"}),
        ("PUT", "/api/tickets/1/star", 401, {}),
        ("GET", "/api/admin/users", 401),
        ("POST", "/api/admin/users", 401, {"username": "hacker", "password": "123", "full_name": "x", "role": "OFFICER"}),
        ("PUT", "/api/admin/users/1/toggle", 401),
        ("DELETE", "/api/admin/users/1", 401),
        ("GET", "/api/admin/stats", 401),
        ("GET", "/api/tickets/stats", 401),
        ("GET", "/api/admin/worker/status", 401),
        ("POST", "/api/admin/worker/sync", 401),
        ("POST", "/api/tickets/sync-gmail", 401),
        # RAG endpoints
        ("POST", "/api/rag/ingest", 401, {"title": "Hack", "content": "RAG injection"}),
        ("POST", "/api/admin/rag", 401, {"title": "Hack", "content": "RAG injection"}),
        ("DELETE", "/api/rag/docs/1", 401),
        # Gmail endpoints
        ("POST", "/api/notifications/link-gmail", 401, {"gmail_account": "bad@gmail.com", "gmail_app_password": "xxxx xxxx xxxx xxxx"}),
        ("POST", "/api/gmail/link", 401, {"gmail_account": "bad@gmail.com", "gmail_app_password": "xxxx xxxx xxxx xxxx"}),
        ("POST", "/api/notifications/disconnect-gmail", 401),
        ("POST", "/api/gmail/disconnect", 401),
        # Citizen history
        ("GET", "/api/citizen/my-tickets?email=test@example.com", 401),
    ]

    for item in unauth_checks:
        method = item[0]
        url = item[1]
        expected_status = item[2]
        payload = item[3] if len(item) > 3 else None

        if method == "GET":
            r = client.get(url)
        elif method == "POST":
            r = client.post(url, json=payload if payload else {})
        elif method == "PUT":
            r = client.put(url, json=payload if payload else {})
        elif method == "DELETE":
            r = client.delete(url)

        if r.status_code in (401, 403):
            print(f"[SECURE] {method} {url} -> {r.status_code} (Chặn thành công)")
        else:
            print(f"[VULNERABILITY] {method} {url} -> Status {r.status_code} (Mong đợi 401/403, nhưng lọt!)")
            findings.append({
                "severity": "P0" if "admin" in url or "rag" in url or "disconnect" in url else "P1",
                "route": f"{method} {url}",
                "issue": f"Endpoint thiếu xác thực (Unauthenticated access permitted, returned {r.status_code})",
                "response": r.text[:200]
            })

    # 1b. CITIZEN token gọi các sensitive routes
    log_test("1b. RBAC: Kiểm tra tài khoản CITIZEN gọi các endpoint nhạy cảm")
    citizen_prohibited = [
        ("GET", "/api/tickets", 403),
        ("PUT", "/api/tickets/1/reassign", 403, {"department_code": "SO_XD", "reason": "test"}),
        ("PUT", "/api/tickets/1/approve", 403, {"draft_reply": "test"}),
        ("PUT", "/api/tickets/1/draft", 403, {"draft_reply": "test"}),
        ("PUT", "/api/tickets/1/star", 403, {}),
        ("GET", "/api/admin/users", 403),
        ("POST", "/api/admin/users", 403, {"username": "hacker2", "password": "123", "full_name": "x", "role": "OFFICER"}),
        ("PUT", "/api/admin/users/1/toggle", 403),
        ("GET", "/api/admin/stats", 403),
        ("GET", "/api/admin/worker/status", 403),
        ("POST", "/api/admin/worker/sync", 403),
        ("POST", "/api/admin/dispatch", 403, {"ticket_id": 1, "target_dept": "SO_XD"}),
        ("PUT", "/api/admin/tickets/1/spam", 403, {"reason": "spam"}),
        ("POST", "/api/tickets/sync-gmail", 403),
        ("POST", "/api/rag/ingest", 403, {"title": "Citizen Ingest", "content": "Content"}),
        ("DELETE", "/api/rag/docs/1", 403),
    ]

    for item in citizen_prohibited:
        method = item[0]
        url = item[1]
        expected_status = item[2]
        payload = item[3] if len(item) > 3 else None

        if method == "GET":
            r = client.get(url, headers=citizen_header)
        elif method == "POST":
            r = client.post(url, json=payload if payload else {}, headers=citizen_header)
        elif method == "PUT":
            r = client.put(url, json=payload if payload else {}, headers=citizen_header)
        elif method == "DELETE":
            r = client.delete(url, headers=citizen_header)

        if r.status_code == 403:
            print(f"[SECURE] CITIZEN -> {method} {url} -> 403 Forbidden")
        elif r.status_code == 404:
            print(f"[PASS/404] CITIZEN -> {method} {url} -> 404 Not Found")
        else:
            print(f"[VULNERABILITY] CITIZEN -> {method} {url} -> Status {r.status_code} (Lọt quyền!)")
            findings.append({
                "severity": "P0" if "admin" in url or "rag" in url else "P1",
                "route": f"CITIZEN -> {method} {url}",
                "issue": f"Tài khoản CITIZEN thực hiện được thao tác bị cấm (Status {r.status_code})",
                "response": r.text[:200]
            })

    # 1c. OFFICER token gọi ADMIN endpoints
    log_test("1c. RBAC: Kiểm tra tài khoản OFFICER (canbo_gtvt) gọi ADMIN endpoints")
    officer_prohibited_admin = [
        ("GET", "/api/admin/users", 403),
        ("POST", "/api/admin/users", 403, {"username": "hacker3", "password": "123", "full_name": "x", "role": "OFFICER"}),
        ("PUT", "/api/admin/users/1/toggle", 403),
        ("GET", "/api/admin/worker/status", 403),
        ("POST", "/api/admin/worker/sync", 403),
        ("POST", "/api/admin/dispatch", 403, {"ticket_id": 1, "target_dept": "SO_XD"}),
        ("PUT", "/api/admin/tickets/1/spam", 403, {"reason": "spam"}),
        ("POST", "/api/tickets/sync-gmail", 403),
        ("POST", "/api/rag/ingest", 403, {"title": "Officer Ingest", "content": "Content"}),
        ("DELETE", "/api/rag/docs/1", 403),
    ]

    for item in officer_prohibited_admin:
        method = item[0]
        url = item[1]
        expected_status = item[2]
        payload = item[3] if len(item) > 3 else None

        if method == "GET":
            r = client.get(url, headers=officer_header)
        elif method == "POST":
            r = client.post(url, json=payload if payload else {}, headers=officer_header)
        elif method == "PUT":
            r = client.put(url, json=payload if payload else {}, headers=officer_header)
        elif method == "DELETE":
            r = client.delete(url, headers=officer_header)

        if r.status_code == 403:
            print(f"[SECURE] OFFICER -> {method} {url} -> 403 Forbidden")
        else:
            print(f"[VULNERABILITY] OFFICER -> {method} {url} -> Status {r.status_code} (Lọt quyền Admin!)")
            findings.append({
                "severity": "P1",
                "route": f"OFFICER -> {method} {url}",
                "issue": f"Tài khoản OFFICER thực hiện được endpoint của ADMIN (Status {r.status_code})",
                "response": r.text[:200]
            })

    # 1d. IDOR Audit: Officer GTVT can access / reassign / draft on SO_TNMT tickets?
    log_test("1d. IDOR: Cán bộ GTVT thao tác trên hồ sơ của Sở khác (SO_TNMT)")
    # Tìm 1 ticket của SO_TNMT
    tickets_resp = client.get("/api/tickets?dept_code=ALL", headers=admin_header)
    all_tickets = tickets_resp.json() if tickets_resp.status_code == 200 else []
    tnmt_ticket = next((t for t in all_tickets if t.get("dept_code") == "SO_TNMT"), None)
    
    if tnmt_ticket:
        tnmt_id = tnmt_ticket["ticket_id"]
        print(f"Thử nghiệm IDOR với Ticket ID {tnmt_id} (Sở TNMT)...")
        
        # Thử xem chi tiết bằng officer_header (GTVT)
        r_view = client.get(f"/api/tickets/{tnmt_id}", headers=officer_header)
        if r_view.status_code == 403:
            print(f"[SECURE] Xem ticket khác cơ quan -> 403 Forbidden")
        else:
            print(f"[IDOR VULN] Cán bộ GTVT xem được ticket SO_TNMT! Status: {r_view.status_code}")
            findings.append({
                "severity": "P1",
                "route": f"GET /api/tickets/{tnmt_id}",
                "issue": f"IDOR: Cán bộ Sở GTVT xem được thông tin hồ sơ của Sở TNMT (Status {r_view.status_code})",
                "response": r_view.text[:200]
            })

        # Thử reassign bằng officer_header (GTVT)
        r_reassign = client.put(
            f"/api/tickets/{tnmt_id}/reassign",
            json={"department_code": "SO_GTVT", "reason": "IDOR Attack"},
            headers=officer_header
        )
        if r_reassign.status_code == 403:
            print(f"[SECURE] Reassign ticket khác cơ quan -> 403 Forbidden")
        else:
            print(f"[IDOR VULN] Cán bộ GTVT chuyển tuyến được ticket SO_TNMT! Status: {r_reassign.status_code}")
            findings.append({
                "severity": "P0",
                "route": f"PUT /api/tickets/{tnmt_id}/reassign",
                "issue": f"IDOR: Cán bộ GTVT tự ý chuyển tuyến hồ sơ của Sở TNMT (Status {r_reassign.status_code})",
                "response": r_reassign.text[:200]
            })

        # Thử draft bằng officer_header (GTVT)
        r_draft = client.put(
            f"/api/tickets/{tnmt_id}/draft",
            json={"draft_reply": "IDOR Draft"},
            headers=officer_header
        )
        if r_draft.status_code == 403:
            print(f"[SECURE] Sửa draft ticket khác cơ quan -> 403 Forbidden")
        else:
            print(f"[IDOR VULN] Cán bộ GTVT sửa được draft ticket SO_TNMT! Status: {r_draft.status_code}")
            findings.append({
                "severity": "P1",
                "route": f"PUT /api/tickets/{tnmt_id}/draft",
                "issue": f"IDOR: Cán bộ GTVT sửa được dự thảo của Sở TNMT (Status {r_draft.status_code})",
                "response": r_draft.text[:200]
            })
    else:
        print("[SKIP] Không tìm thấy ticket mẫu của SO_TNMT")

    # 1e. IDOR Citizen my-tickets by arbitrary email
    log_test("1e. IDOR: Thu thập dữ liệu công dân qua GET /api/citizen/my-tickets?email=...")
    r_leak = client.get("/api/citizen/my-tickets?email=test@dongnai.gov.vn")
    print(f"GET /api/citizen/my-tickets without auth -> Status: {r_leak.status_code}, Body: {r_leak.text[:100]}")
    if r_leak.status_code == 200:
        findings.append({
            "severity": "P1",
            "route": "GET /api/citizen/my-tickets?email=...",
            "issue": "IDOR / Tiết lộ thông tin: Bất kỳ ai không đăng nhập cũng có thể tra cứu toàn bộ danh sách đơn thư của một email bất kỳ",
            "response": f"Returned 200 with {len(r_leak.json())} items"
        })

    # =========================================================================
    # 2. MALFORMED / MALICIOUS FILE UPLOADS
    # =========================================================================
    log_test("2. Malformed & Malicious File Uploads")

    # 2a. POST /api/tickets/submit
    files_to_test = [
        ("malicious.bat", b"@echo off\r\necho Hacked!\r\n", "application/x-bat"),
        ("malicious.exe", b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00", "application/x-dosexec"),
        ("disguised.jpg", b"This is plain text pretending to be a JPG image file.", "image/jpeg"),
        ("zero_byte.jpg", b"", "image/jpeg"),
        ("large_file.jpg", b"A" * (25 * 1024 * 1024), "image/jpeg"), # 25MB
    ]

    for filename, content, mime in files_to_test:
        files = {"files": (filename, content, mime)}
        data = {
            "citizen_name": "QA Tester",
            "citizen_phone": "0912345678",
            "raw_text": f"Kiem thu upload tap tin: {filename}"
        }
        try:
            r_up = client.post("/api/tickets/submit", data=data, files=files)
            if r_up.status_code == 400:
                print(f"[SECURE] Submit {filename} ({len(content)} bytes) -> 400 Bad Request (Tu choi hop le)")
            elif r_up.status_code in (200, 201):
                print(f"[VULNERABILITY] Submit {filename} ({len(content)} bytes) -> Status {r_up.status_code} (DA BI CHAP NHAN!)")
                findings.append({
                    "severity": "P1" if "bat" in filename or "exe" in filename else "P2",
                    "route": "POST /api/tickets/submit",
                    "issue": f"Tệp tải lên không an toàn ({filename}) được chấp nhận tiếp nhận (Status {r_up.status_code})",
                    "response": r_up.text[:200]
                })
            else:
                print(f"[INFO] Submit {filename} -> Status {r_up.status_code}")
        except Exception as e:
            print(f"[ERR] Exception testing {filename}: {e}")

    # 2b. POST /api/rag/ingest
    rag_files_to_test = [
        ("virus.bat", b"@echo off\r\ndel C:\\* /q\r\n", "application/x-bat"),
        ("malware.exe", b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00", "application/x-dosexec"),
        ("empty.pdf", b"", "application/pdf"),
        ("giant_file.txt", ("Quy dinh phap luat " * 1000000).encode("utf-8"), "text/plain"), # ~19MB
    ]

    for filename, content, mime in rag_files_to_test:
        files = {"file": (filename, content, mime)}
        data = {
            "title": f"Tài liệu {filename}",
            "category": "CHUNG"
        }
        try:
            r_rag = client.post("/api/rag/ingest", data=data, files=files)
            if r_rag.status_code == 400:
                print(f"[SECURE] RAG Ingest {filename} -> 400 Bad Request (Tu choi hop le)")
            elif r_rag.status_code in (200, 201):
                print(f"[VULNERABILITY] RAG Ingest {filename} -> Status {r_rag.status_code} (DA NẠP FILE KHÔNG AN TOÀN VÀO CSDL RAG!)")
                findings.append({
                    "severity": "P1",
                    "route": "POST /api/rag/ingest",
                    "issue": f"Kho RAG chấp nhận nạp tệp {filename} mà không xác thực định dạng hoặc độ an toàn",
                    "response": r_rag.text[:200]
                })
            else:
                print(f"[INFO] RAG Ingest {filename} -> Status {r_rag.status_code}")
        except Exception as e:
            print(f"[ERR] Exception RAG Ingest {filename}: {e}")

    # =========================================================================
    # 3. TICKET STATE TRANSITIONS & DATA CONSISTENCY
    # =========================================================================
    log_test("3. Data Consistency: Trạng thái hồ sơ đã Phê Duyệt (APPROVED/RESOLVED)")
    approved_ticket = next((t for t in all_tickets if t.get("status") == "APPROVED"), None)
    if approved_ticket:
        app_id = approved_ticket["ticket_id"]
        print(f"Đang kiểm thử hồ sơ APPROVED ID {app_id} ({approved_ticket['tracking_code']})...")

        # Thử reassign hồ sơ đã APPROVED
        r_reassign_app = client.put(
            f"/api/tickets/{app_id}/reassign",
            json={"department_code": "SO_XD", "reason": "Chuyen tuyen don da duyet"},
            headers=admin_header
        )
        if r_reassign_app.status_code in (400, 422, 409):
            print(f"[SECURE] Không thể reassign hồ sơ đã APPROVED -> {r_reassign_app.status_code}")
        elif r_reassign_app.status_code == 200:
            print(f"[VULNERABILITY] Hồ sơ APPROVED bị reassign và đổi trạng thái về ROUTED! Status {r_reassign_app.status_code}")
            findings.append({
                "severity": "P1",
                "route": f"PUT /api/tickets/{app_id}/reassign",
                "issue": "Hồ sơ đã APPROVED/RESOLVED vẫn cho phép Cán bộ/Admin chuyển tuyến (reassign) và reset trạng thái về ROUTED!",
                "response": r_reassign_app.text[:200]
            })

        # Thử sửa draft hồ sơ đã APPROVED
        r_draft_app = client.put(
            f"/api/tickets/{app_id}/draft",
            json={"draft_reply": "Thay doi noi dung sau khi da duyet ban hanh"},
            headers=admin_header
        )
        if r_draft_app.status_code in (400, 422, 409):
            print(f"[SECURE] Không thể sửa draft hồ sơ đã APPROVED -> {r_draft_app.status_code}")
        elif r_draft_app.status_code == 200:
            print(f"[VULNERABILITY] Cho phép sửa bản thảo của hồ sơ đã APPROVED! Status {r_draft_app.status_code}")
            findings.append({
                "severity": "P2",
                "route": f"PUT /api/tickets/{app_id}/draft",
                "issue": "Hồ sơ đã hoàn tất phê duyệt văn bản vẫn cho phép chỉnh sửa nội dung bản thảo trả lời mà không có kiểm soát phiên bản",
                "response": r_draft_app.text[:200]
            })
    else:
        print("[SKIP] Không có hồ sơ APPROVED để kiểm thử.")

    # =========================================================================
    # 4. RAG SIMILARITY THRESHOLD & ANTI-HALLUCINATION
    # =========================================================================
    log_test("4. RAG: Similarity Threshold (0.65) & Anti-Hallucination")
    
    # Query liên quan
    r_rag_valid = client.post("/api/rag/search", json={"query": "ổ gà ngập nước đường Đồng Khởi", "top_k": 3})
    if r_rag_valid.status_code == 200:
        matches = r_rag_valid.json().get("matches", [])
        print(f"[OK] Query thực tế có {len(matches)} kết quả:")
        for m in matches:
            print(f"  - Score: {m.get('relevance_score')} | Title: {m.get('title')}")
    else:
        print(f"[FAIL] Query RAG thất bại: {r_rag_valid.status_code}")

    # Query vô nghĩa / anti-hallucination test
    nonsense_query = "Tàu vũ trụ người ngoài hành tinh đáp xuống sao Hỏa sao Kim sao Mộc ăn phở bò"
    r_rag_nonsense = client.post("/api/rag/search", json={"query": nonsense_query, "top_k": 3})
    if r_rag_nonsense.status_code == 200:
        matches_ns = r_rag_nonsense.json().get("matches", [])
        print(f"Query vô nghĩa có {len(matches_ns)} matches:")
        for m in matches_ns:
            score = m.get('relevance_score', 0)
            print(f"  - Score: {score} | Title: {m.get('title')}")
            if score >= 0.65:
                print(f"[WARNING] Query vô nghĩa đạt điểm cao >= 0.65: {score}!")
    
    # Kiểm tra retrieve_legal_context_for_prompt logic qua script backend
    # Sẽ được kiểm tra trong phần DB check

    # =========================================================================
    # 5. GMAIL SYNC STATUS
    # =========================================================================
    log_test("5. Gmail Sync: Kiểm tra khi chưa có tài khoản thật")
    r_gmail_status = client.get("/api/notifications/gmail-status")
    print(f"GET /api/notifications/gmail-status -> {r_gmail_status.status_code}: {r_gmail_status.text}")

    r_gmail_sync = client.post("/api/notifications/sync-gmail", headers=admin_header)
    print(f"POST /api/notifications/sync-gmail -> {r_gmail_sync.status_code}: {r_gmail_sync.text}")

    r_ticket_sync = client.post("/api/tickets/sync-gmail", headers=admin_header)
    print(f"POST /api/tickets/sync-gmail -> {r_ticket_sync.status_code}: {r_ticket_sync.text}")

    # Tổng kết lỗi Backend & DB
    print("\n" + "="*70)
    print(f"TỔNG KẾT BÁO CÁO KIỂM THỬ BACKEND ({len(findings)} VẤN ĐỀ ĐƯỢC PHÁT HIỆN)")
    print("="*70)
    for idx, f in enumerate(findings, 1):
        print(f"{idx}. [{f['severity']}] {f['route']} - {f['issue']}")

    with open("tests/backend_audit_results.json", "w", encoding="utf-8") as out_f:
        json.dump(findings, out_f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    run_backend_audit()
