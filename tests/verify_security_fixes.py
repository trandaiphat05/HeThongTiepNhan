"""
Verification Script for Security Fixes (Phase 3)
Tests all security endpoints required by coordinator:
1. RAG Ingest & Delete RBAC + Malicious File Uploads
2. Gmail Disconnect Auth
3. Citizen My-Tickets IDOR Protection
4. State Transition Integrity on APPROVED Tickets
"""

import httpx
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"

def run_verification():
    print("================================================================================")
    print("STARTING SECURITY FIXES VERIFICATION (PHASE 3)")
    print("================================================================================")

    results = []

    def check(name, condition, details=""):
        status = "PASS" if condition else "FAIL"
        icon = "✓" if condition else "✗"
        print(f"[{icon} {status}] {name}: {details}")
        results.append({"name": name, "status": status, "details": details})

    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 0. Lấy token cho các vai trò
        print("\n--- 0. Authenticating test accounts ---")
        tokens = {}
        for role, u, p in [
            ("ADMIN", "admin", "admin123"),
            ("OFFICER", "canbo_gtvt", "officer123"),
            ("CITIZEN", "congdan1", "citizen123"),
        ]:
            r = client.post("/api/auth/login", json={"username": u, "password": p})
            if r.status_code == 200:
                tokens[role] = r.json()["access_token"]
                print(f"  + Authenticated {role} ({u})")
            else:
                print(f"  - Failed {role}: {r.status_code}")

        admin_hdr = {"Authorization": f"Bearer {tokens['ADMIN']}"}
        officer_hdr = {"Authorization": f"Bearer {tokens['OFFICER']}"}
        citizen_hdr = {"Authorization": f"Bearer {tokens['CITIZEN']}"}

        # 1. RAG Ingest & Admin RAG Endpoints
        print("\n--- 1. Testing RAG Ingest RBAC & File Type Validation ---")
        # 1a. Unauth POST /api/rag/ingest -> 401
        r = client.post("/api/rag/ingest", data={"title": "Test", "content": "Sample content"})
        check("RAG Ingest Unauthenticated", r.status_code == 401, f"Status: {r.status_code}")

        # 1b. Unauth POST /api/admin/rag -> 401
        r = client.post("/api/admin/rag", data={"title": "Test", "content": "Sample content"})
        check("Admin RAG Unauthenticated", r.status_code == 401, f"Status: {r.status_code}")

        # 1c. Citizen token POST /api/rag/ingest -> 403
        r = client.post("/api/rag/ingest", headers=citizen_hdr, data={"title": "Test", "content": "Sample content"})
        check("RAG Ingest Citizen Forbidden", r.status_code == 403, f"Status: {r.status_code}")

        # 1d. Officer token POST /api/rag/ingest -> 403
        r = client.post("/api/rag/ingest", headers=officer_hdr, data={"title": "Test", "content": "Sample content"})
        check("RAG Ingest Officer Forbidden", r.status_code == 403, f"Status: {r.status_code}")

        # 1e. Admin token with .bat file -> 400 Bad Request
        files = {"file": ("malicious.bat", b"@echo off\necho Hacked", "application/x-bat")}
        r = client.post("/api/rag/ingest", headers=admin_hdr, data={"title": "Malicious Bat"}, files=files)
        check("RAG Reject .bat File", r.status_code == 400, f"Status: {r.status_code} ({r.text[:100]})")

        # 1f. Admin token with .exe file -> 400 Bad Request
        files = {"file": ("malware.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-dosexec")}
        r = client.post("/api/rag/ingest", headers=admin_hdr, data={"title": "Malware Exe"}, files=files)
        check("RAG Reject .exe File", r.status_code == 400, f"Status: {r.status_code} ({r.text[:100]})")

        # 2. DELETE /api/rag/docs/{id}
        print("\n--- 2. Testing DELETE RAG Doc RBAC ---")
        # 2a. Unauth -> 401
        r = client.delete("/api/rag/docs/999999")
        check("DELETE RAG Doc Unauthenticated", r.status_code == 401, f"Status: {r.status_code}")

        # 2b. Citizen -> 403
        r = client.delete("/api/rag/docs/999999", headers=citizen_hdr)
        check("DELETE RAG Doc Citizen Forbidden", r.status_code == 403, f"Status: {r.status_code}")

        # 2c. Officer -> 403
        r = client.delete("/api/rag/docs/999999", headers=officer_hdr)
        check("DELETE RAG Doc Officer Forbidden", r.status_code == 403, f"Status: {r.status_code}")

        # 3. Gmail Disconnect Endpoints
        print("\n--- 3. Testing Gmail Disconnect Auth Protection ---")
        # 3a. POST /api/gmail/disconnect without auth -> 401
        r = client.post("/api/gmail/disconnect")
        check("POST /api/gmail/disconnect Unauthenticated", r.status_code == 401, f"Status: {r.status_code}")

        # 3b. POST /api/notifications/disconnect-gmail without auth -> 401
        r = client.post("/api/notifications/disconnect-gmail")
        check("POST /api/notifications/disconnect-gmail Unauthenticated", r.status_code == 401, f"Status: {r.status_code}")

        # 4. Citizen My-Tickets IDOR Protection
        print("\n--- 4. Testing Citizen My-Tickets IDOR Protection ---")
        # 4a. Unauth -> 401
        r = client.get("/api/citizen/my-tickets?email=victim@example.com")
        check("GET /api/citizen/my-tickets Unauthenticated", r.status_code == 401, f"Status: {r.status_code}")

        # 4b. With Citizen token -> 200
        r = client.get("/api/citizen/my-tickets", headers=citizen_hdr)
        check("GET /api/citizen/my-tickets Authenticated", r.status_code == 200, f"Status: {r.status_code}")

        # 5. State Transition Enforcement on APPROVED Tickets
        print("\n--- 5. Testing State Transition Integrity on APPROVED Tickets ---")
        # Find an APPROVED ticket in database or create/approve one
        r = client.get("/api/tickets?status=APPROVED", headers=admin_hdr)
        approved_ticket_id = None
        data = r.json() if r.status_code == 200 else []
        items = data if isinstance(data, list) else data.get("items", [])
        if items:
            approved_ticket_id = items[0]["ticket_id"]
            print(f"  + Found existing APPROVED ticket #{approved_ticket_id}")
        else:
            # Look for any ticket and approve it
            r_all = client.get("/api/tickets", headers=admin_hdr)
            all_data = r_all.json() if r_all.status_code == 200 else []
            all_items = all_data if isinstance(all_data, list) else all_data.get("items", [])
            if all_items:
                candidate_id = all_items[0]["ticket_id"]
                r_app = client.put(f"/api/tickets/{candidate_id}/approve", headers=admin_hdr, json={"draft_reply": "Phe duyet test"})
                if r_app.status_code == 200:
                    approved_ticket_id = candidate_id
                    print(f"  + Approved ticket #{candidate_id} for test")

        if approved_ticket_id:
            # 5a. Reassign an APPROVED ticket -> 400 Bad Request
            r = client.put(
                f"/api/tickets/{approved_ticket_id}/reassign",
                headers=admin_hdr,
                json={"department_code": "SO_XD", "reason": "Test reassign approved ticket"}
            )
            check(
                "Reject Reassign on APPROVED Ticket",
                r.status_code == 400,
                f"Status: {r.status_code} ({r.text[:100]})"
            )

            # 5b. Edit draft on an APPROVED ticket -> 400 Bad Request
            r = client.put(
                f"/api/tickets/{approved_ticket_id}/draft",
                headers=admin_hdr,
                json={"draft_reply": "Malicious draft override"}
            )
            check(
                "Reject Draft Edit on APPROVED Ticket",
                r.status_code == 400,
                f"Status: {r.status_code} ({r.text[:100]})"
            )
        else:
            check("Find/Create APPROVED Ticket", False, "Could not locate an approved ticket for test")

    # Lưu kết quả
    output_path = Path("tests/security_fixes_verification_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nSaved security verification results to {output_path}")

    passed = sum(1 for r in results if r["status"] == "PASS")
    total = len(results)
    print(f"\nSUMMARY: {passed}/{total} tests PASSED ({int(passed/total*100)}%)")

if __name__ == "__main__":
    run_verification()
