"""
Unit Tests cho Luồng Đăng Ký Tài Khoản Phân Tuyến, Duyệt Cán Bộ và Lịch Sử Đơn Thư Công Dân
Tuân thủ chuẩn quy trình hành chính công tỉnh Đồng Nai.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import unittest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from main import app
from core.database import SessionLocal
from modules.database.models import User, Ticket

client = TestClient(app)


class TestGovRegistrationAndHistory(unittest.TestCase):

    def setUp(self):
        self.db: Session = SessionLocal()
        # Dọn dẹp tài khoản kiểm thử nếu có
        for username in ["test_citizen_reg_01", "test_officer_pending_01", "test_officer_reject_01"]:
            user = self.db.query(User).filter(User.username == username).first()
            if user:
                self.db.delete(user)
        self.db.commit()

    def tearDown(self):
        for username in ["test_citizen_reg_01", "test_officer_pending_01", "test_officer_reject_01"]:
            user = self.db.query(User).filter(User.username == username).first()
            if user:
                self.db.delete(user)
        self.db.commit()
        self.db.close()

    def test_citizen_registration_instant_activation(self):
        """1. Đăng ký tài khoản Công dân: Kích hoạt ngay lập tức (is_active = True)."""
        payload = {
            "username": "test_citizen_reg_01",
            "password": "Password@123",
            "full_name": "Trần Thị Mai Anh",
            "email": "maianh.tran@gmail.com",
            "phone": "0918112233",
            "role": "CITIZEN"
        }
        res = client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["user"]["is_active"])

        # Đăng nhập ngay lập tức thành công
        login_res = client.post("/api/auth/login", json={
            "username": "test_citizen_reg_01",
            "password": "Password@123"
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertIn("access_token", login_res.json())

    def test_officer_registration_and_admin_approval(self):
        """2. Đăng ký Cán bộ: Phải dùng email công vụ, is_active=False, chờ Admin duyệt mới đăng nhập được."""
        # 2a. Thiếu email công vụ @dongnai.gov.vn -> Lỗi 400
        invalid_email_payload = {
            "username": "test_officer_pending_01",
            "password": "Password@123",
            "full_name": "Nguyễn Văn Chuyên Viên",
            "email": "chuyenvien@gmail.com",
            "role": "OFFICER",
            "dept_code": "SO_GTVT",
            "officer_code": "CB-GTVT-88"
        }
        res_err = client.post("/api/auth/register", json=invalid_email_payload)
        self.assertEqual(res_err.status_code, 400)
        self.assertIn("@dongnai.gov.vn", res_err.json()["detail"])

        # 2b. Đăng ký đúng chuẩn -> Ghi nhận chờ duyệt (is_active = False)
        valid_payload = {
            "username": "test_officer_pending_01",
            "password": "Password@123",
            "full_name": "Nguyễn Văn Chuyên Viên",
            "email": "chuyenvien.gtvt@dongnai.gov.vn",
            "role": "OFFICER",
            "dept_code": "SO_GTVT",
            "officer_code": "CB-GTVT-88"
        }
        res_ok = client.post("/api/auth/register", json=valid_payload)
        self.assertEqual(res_ok.status_code, 201)
        data = res_ok.json()
        self.assertFalse(data["user"]["is_active"])
        self.assertIn("chờ Quản trị viên phê duyệt", data["message"])

        user_id = data["user"]["user_id"]

        # 2c. Cố tình đăng nhập khi chưa được duyệt -> HTTP 403 với thông báo rõ ràng
        login_fail = client.post("/api/auth/login", json={
            "username": "test_officer_pending_01",
            "password": "Password@123"
        })
        self.assertEqual(login_fail.status_code, 403)
        self.assertIn("Tài khoản đang chờ Quản trị viên xác nhận quyền truy cập.", login_fail.json()["detail"])

        # 2d. Quản trị viên đăng nhập lấy token để duyệt
        admin_login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        self.assertEqual(admin_login.status_code, 200)
        admin_token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}

        # 2e. Quản trị viên phê duyệt tài khoản cán bộ
        approve_res = client.put(f"/api/admin/users/{user_id}/approve", headers=headers)
        self.assertEqual(approve_res.status_code, 200)
        self.assertTrue(approve_res.json()["user"]["is_active"])

        # 2f. Sau khi duyệt: Cán bộ đăng nhập thành công ngay lập tức
        login_success = client.post("/api/auth/login", json={
            "username": "test_officer_pending_01",
            "password": "Password@123"
        })
        self.assertEqual(login_success.status_code, 200)
        self.assertIn("access_token", login_success.json())

    def test_citizen_ticket_history(self):
        """3. Tra cứu lịch sử đơn thư đã gửi của tài khoản công dân."""
        # Gọi API lấy đơn thư theo email
        res = client.get("/api/citizen/my-tickets", params={"email": "nguyenthanh.dongnai@gmail.com"})
        self.assertEqual(res.status_code, 200)
        tickets = res.json()
        self.assertIsInstance(tickets, list)
        self.assertGreaterEqual(len(tickets), 1)
        self.assertEqual(tickets[0]["tracking_code"], "ĐN-20261104-001")


if __name__ == "__main__":
    unittest.main()
