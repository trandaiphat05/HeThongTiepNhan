"""
Kiểm thử Tích hợp: Đăng Ký Tài Khoản & Cơ Chế Đồng Bộ Gmail Thật (Zero Mock Emails)
Hệ Thống Tiếp Nhận & Xử Lý Đơn Thư AI - Tỉnh Đồng Nai
"""

import sys
import os
import unittest
from fastapi.testclient import TestClient

# Cấu hình PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from main import app
from core.database import SessionLocal
from modules.database.models import User, Ticket


class TestRegisterAndGmailSync(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.test_username = "test_citizen_e2e_2026"
        self.test_password = "SecurePassword123!"
        self.test_full_name = "Công Dân Kiểm Thử Tự Động"
        self.test_email = "test.citizen.dongnai@gmail.com"

        # Dọn dẹp tài khoản cũ nếu có
        db = SessionLocal()
        try:
            db.query(User).filter(User.username == self.test_username).delete()
            db.commit()
        finally:
            db.close()

    def tearDown(self):
        # Dọn dẹp sau khi kiểm thử
        db = SessionLocal()
        try:
            db.query(User).filter(User.username == self.test_username).delete()
            db.commit()
        finally:
            db.close()

    def test_01_register_new_user(self):
        """1. Kiểm tra API đăng ký tài khoản công dân mới (/api/auth/register)."""
        payload = {
            "username": self.test_username,
            "password": self.test_password,
            "full_name": self.test_full_name,
            "email": self.test_email,
            "role": "CITIZEN",
        }
        response = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(response.status_code, 201, f"Đăng ký thất bại: {response.text}")

        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data["user"]["username"], self.test_username)
        self.assertEqual(data["user"]["role"], "CITIZEN")

    def test_02_duplicate_username_rejection(self):
        """2. Kiểm tra từ chối đăng ký tên đăng nhập trùng lặp."""
        # Đăng ký lần 1
        payload = {
            "username": self.test_username,
            "password": self.test_password,
            "full_name": self.test_full_name,
            "email": self.test_email,
            "role": "CITIZEN",
        }
        res1 = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res1.status_code, 201)

        # Đăng ký lần 2 với cùng username -> Phải trả về 400
        res2 = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res2.status_code, 400)
        self.assertIn("đã được sử dụng", res2.text)

    def test_03_login_with_registered_user(self):
        """3. Kiểm tra đăng nhập bằng tài khoản vừa đăng ký (/api/auth/login)."""
        # Đăng ký trước
        payload = {
            "username": self.test_username,
            "password": self.test_password,
            "full_name": self.test_full_name,
            "email": self.test_email,
            "role": "CITIZEN",
        }
        self.client.post("/api/auth/register", json=payload)

        # Đăng nhập
        login_res = self.client.post("/api/auth/login", json={
            "username": self.test_username,
            "password": self.test_password,
        })
        self.assertEqual(login_res.status_code, 200)
        token_data = login_res.json()
        self.assertIn("access_token", token_data)
        access_token = token_data["access_token"]

        # Gọi /api/auth/me với Bearer Token
        me_res = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        self.assertEqual(me_res.status_code, 200)
        user_info = me_res.json()
        self.assertEqual(user_info["username"], self.test_username)
        self.assertEqual(user_info["role"], "CITIZEN")

    def test_04_zero_mock_gmail_validation(self):
        """4. Xác minh cơ chế Zero Mock: Từ chối tài khoản Gmail / App Password giả mạo."""
        # Đăng ký & đăng nhập để lấy token
        self.client.post("/api/auth/register", json={
            "username": self.test_username,
            "password": self.test_password,
            "full_name": self.test_full_name,
            "email": self.test_email,
            "role": "CITIZEN",
        })
        login_res = self.client.post("/api/auth/login", json={
            "username": self.test_username,
            "password": self.test_password,
        })
        access_token = login_res.json()["access_token"]

        # Thử liên kết với Gmail giả / App password sai -> Phải bị máy chủ IMAP từ chối và trả về 400
        link_res = self.client.post(
            "/api/auth/link-gmail",
            json={
                "gmail_account": "fake_civic_test_user@gmail.com",
                "gmail_app_password": "invalidpassword123",
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        self.assertEqual(link_res.status_code, 400)
        self.assertIn("Xác thực Gmail thất bại", link_res.text)


if __name__ == "__main__":
    unittest.main()

