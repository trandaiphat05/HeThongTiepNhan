"""
Kiểm thử Mô hình Phân quyền Kế thừa Phân tầng (Hierarchical RBAC)
- CITIZEN: Chỉ có quyền của Công dân.
- OFFICER: Kế thừa quyền Công dân + quyền Cán bộ (vừa nộp/tra cứu vừa duyệt đơn).
- ADMIN: Kế thừa tất cả các quyền (Công dân + Cán bộ + Quản trị).
"""

import sys
import os
import unittest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient

# Cấu hình PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from modules.auth.deps import (
    ROLE_HIERARCHY,
    require_role,
    require_admin,
    require_officer,
    require_citizen,
)
from modules.auth.service import create_access_token


class TestHierarchicalRBAC(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Tạo test app để kiểm tra các mức phân quyền kế thừa
        test_app = FastAPI()

        @test_app.get("/test/citizen")
        def citizen_endpoint(user: dict = Depends(require_citizen)):
            return {"status": "ok", "role": user.get("role")}

        @test_app.get("/test/officer")
        def officer_endpoint(user: dict = Depends(require_officer)):
            return {"status": "ok", "role": user.get("role")}

        @test_app.get("/test/admin")
        def admin_endpoint(user: dict = Depends(require_admin)):
            return {"status": "ok", "role": user.get("role")}

        cls.client = TestClient(test_app)

        # Tạo token cho 3 vai trò
        cls.citizen_token = create_access_token({"username": "congdan1", "role": "CITIZEN"})
        cls.officer_token = create_access_token({"username": "canbo_gtvt", "role": "OFFICER"})
        cls.admin_token = create_access_token({"username": "admin", "role": "ADMIN"})

    def test_01_role_hierarchy_definition(self):
        """1. Kiểm tra định nghĩa bảng kế thừa vai trò (ROLE_HIERARCHY)."""
        self.assertEqual(ROLE_HIERARCHY["ADMIN"], ["ADMIN", "OFFICER", "CITIZEN"])
        self.assertEqual(ROLE_HIERARCHY["OFFICER"], ["OFFICER", "CITIZEN"])
        self.assertEqual(ROLE_HIERARCHY["CITIZEN"], ["CITIZEN"])

    def test_02_citizen_permissions(self):
        """2. CITIZEN chỉ được truy cập endpoint Citizen, bị chặn ở Officer và Admin."""
        headers = {"Authorization": f"Bearer {self.citizen_token}"}

        # Vào endpoint Citizen -> Cho phép (200)
        res_citizen = self.client.get("/test/citizen", headers=headers)
        self.assertEqual(res_citizen.status_code, 200)

        # Vào endpoint Officer -> Bị từ chối (403)
        res_officer = self.client.get("/test/officer", headers=headers)
        self.assertEqual(res_officer.status_code, 403)
        self.assertIn("Yêu cầu quyền OFFICER", res_officer.json()["detail"])

        # Vào endpoint Admin -> Bị từ chối (403)
        res_admin = self.client.get("/test/admin", headers=headers)
        self.assertEqual(res_admin.status_code, 403)
        self.assertIn("Yêu cầu quyền ADMIN", res_admin.json()["detail"])

    def test_03_officer_permissions(self):
        """3. OFFICER kế thừa quyền Citizen + quyền Officer, nhưng bị chặn ở Admin."""
        headers = {"Authorization": f"Bearer {self.officer_token}"}

        # Kế thừa: Vào endpoint Citizen -> Cho phép (200)
        res_citizen = self.client.get("/test/citizen", headers=headers)
        self.assertEqual(res_citizen.status_code, 200)

        # Quyền riêng: Vào endpoint Officer -> Cho phép (200)
        res_officer = self.client.get("/test/officer", headers=headers)
        self.assertEqual(res_officer.status_code, 200)

        # Vào endpoint Admin -> Bị từ chối (403)
        res_admin = self.client.get("/test/admin", headers=headers)
        self.assertEqual(res_admin.status_code, 403)
        self.assertIn("Yêu cầu quyền ADMIN", res_admin.json()["detail"])

    def test_04_admin_permissions(self):
        """4. ADMIN kế thừa toàn bộ quyền (Citizen + Officer + Admin)."""
        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Kế thừa: Vào endpoint Citizen -> Cho phép (200)
        res_citizen = self.client.get("/test/citizen", headers=headers)
        self.assertEqual(res_citizen.status_code, 200)

        # Kế thừa: Vào endpoint Officer -> Cho phép (200)
        res_officer = self.client.get("/test/officer", headers=headers)
        self.assertEqual(res_officer.status_code, 200)

        # Quyền riêng: Vào endpoint Admin -> Cho phép (200)
        res_admin = self.client.get("/test/admin", headers=headers)
        self.assertEqual(res_admin.status_code, 200)

    def test_05_admin_users_api_protection(self):
        """5. Kiểm tra API thật /api/admin/users: Officer và Citizen bị từ chối 403, Admin được phép 200."""
        from main import app
        real_client = TestClient(app)

        # Citizen gọi /api/admin/users -> 403
        res_cit = real_client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {self.citizen_token}"}
        )
        self.assertEqual(res_cit.status_code, 403)

        # Officer gọi /api/admin/users -> 403
        res_off = real_client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {self.officer_token}"}
        )
        self.assertEqual(res_off.status_code, 403)

        # Admin gọi /api/admin/users -> 200
        res_adm = real_client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_adm.status_code, 200)


if __name__ == "__main__":
    unittest.main()

