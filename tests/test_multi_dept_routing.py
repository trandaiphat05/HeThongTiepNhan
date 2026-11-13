"""
Bộ kiểm thử Tự động: Đa Sở Ngành (7 Sở/Ban/Ngành), AI Routing & Keyword Fallback, và Xác thực Tài khoản
Các Sở kiểm thử:
  1. SO_GTVT (Sở Giao thông Vận tải)
  2. SO_TNMT (Sở Tài nguyên và Môi trường)
  3. SO_XD / SO_XAYDUNG (Sở Xây dựng)
  4. SO_YTE (Sở Y tế)
  5. SO_GDDT (Sở Giáo dục và Đào tạo)
  6. SO_LDTBXH (Sở Lao động - Thương binh và Xã hội)
  7. CONG_AN_TINH (Công an Tỉnh Đồng Nai)
Kèm theo:
  - Kiểm thử Fallback từ khóa khi Gemini API gặp sự cố (Network/Timeout/Quota)
  - Kiểm thử Đăng nhập cho 10 tài khoản được cấp quyền (Officer 7 sở + Một cửa + Admin + Công dân)
  - Kiểm thử Tạo đơn qua ticketService có đính kèm kết quả AI phân tích (ai_result)
"""

import sys
import os
import unittest
from unittest.mock import patch, MagicMock

# Đảm bảo đường dẫn import từ backend
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from main import app
from core.database import SessionLocal, init_db
from modules.database.models import Ticket, AIResult, User, Department
from modules.auth.service import authenticate_user, create_access_token, DEFAULT_ACCOUNTS
from modules.tickets.service import create_ticket_service
from modules.ai_engine.ai_service import process_civic_complaint, analyze_ticket


# 7 Phòng ban trọng điểm và nội dung kiểm thử thực tế
DEPT_TEST_CASES = [
    {
        "dept_code": "SO_GTVT",
        "alt_codes": ["SO_GTVT", "SO_GIAOTHONG"],
        "name": "Sở Giao thông Vận tải",
        "sample_text": "Đoạn đường Quốc lộ 1A qua Trảng Bom bị sụt lún ổ gà nghiêm trọng ngập úng khi mưa, đèn tín hiệu giao thông hỏng gây ùn tắc và nguy hiểm cho xe buýt xe máy.",
        "keywords": ["đường", "ổ gà", "ngập", "xe buýt", "đèn tín hiệu", "cầu đường", "giao thông"]
    },
    {
        "dept_code": "SO_TNMT",
        "alt_codes": ["SO_TNMT", "SO_TAINGUYEN"],
        "name": "Sở Tài nguyên và Môi trường",
        "sample_text": "Nhà máy trong khu công nghiệp xả thải nước đen ngòm bốc mùi hôi thối nồng nặc ra suối, bãi rác tự phát gây ô nhiễm môi trường đất đai và tranh chấp sổ đỏ.",
        "keywords": ["sổ đỏ", "đất đai", "xả thải", "ô nhiễm", "rác thải", "khói bụi", "khai thác cát"]
    },
    {
        "dept_code": "SO_XD",
        "alt_codes": ["SO_XD", "SO_XAYDUNG", "XAYDUNG"],
        "name": "Sở Xây dựng",
        "sample_text": "Công trình nhà xưởng liền kề xây dựng không phép trái phép lấn chiếm hành lang công cộng làm nứt tường nhà dân nghiêm trọng, vi phạm trật tự xây dựng đô thị.",
        "keywords": ["xây dựng trái phép", "cấp phép xây dựng", "nứt nhà", "lấn chiếm", "quy hoạch đô thị"]
    },
    {
        "dept_code": "SO_YTE",
        "alt_codes": ["SO_YTE", "SO_YT", "YTE"],
        "name": "Sở Y tế",
        "sample_text": "Bệnh viện và phòng khám tư nhân để xảy ra vụ ngộ độc thực phẩm hàng loạt tại bếp ăn tập thể, trạm y tế thiếu thuốc điều trị dịch bệnh và bảo hiểm y tế từ chối chi trả.",
        "keywords": ["bệnh viện", "trạm y tế", "phòng khám", "ngộ độc thực phẩm", "dịch bệnh", "bảo hiểm y tế"]
    },
    {
        "dept_code": "SO_GDDT",
        "alt_codes": ["SO_GDDT", "GDDT", "GIAODUC"],
        "name": "Sở Giáo dục và Đào tạo",
        "sample_text": "Trường tiểu học tự ý lạm thu các khoản học phí và tiền cơ sở vật chất trái quy định, tuyển sinh đầu cấp thiếu minh bạch và có hiện tượng bạo lực học đường giữa học sinh.",
        "keywords": ["trường học", "học phí", "tuyển sinh", "bạo lực học đường", "giáo viên"]
    },
    {
        "dept_code": "SO_LDTBXH",
        "alt_codes": ["SO_LDTBXH", "LDTBXH", "LAODONG"],
        "name": "Sở Lao động - Thương binh và Xã hội",
        "sample_text": "Công ty may mặc chậm trả tiền lương công nhân 3 tháng liên tiếp, cố tình nợ BHXH bảo hiểm xã hội và không làm thủ tục hưởng bảo hiểm thất nghiệp trợ cấp chính sách.",
        "keywords": ["tiền lương", "chậm trả lương", "nợ bhxh", "bảo hiểm thất nghiệp", "trợ cấp chính sách"]
    },
    {
        "dept_code": "CONG_AN_TINH",
        "alt_codes": ["CONG_AN_TINH", "CONGAN", "CA_TINH"],
        "name": "Công an Tỉnh Đồng Nai",
        "sample_text": "Nhóm thanh thiếu niên thường xuyên tụ tập nẹt pô đua xe lạng lách trên đường vào ban đêm, gây mất an ninh trật tự ANTT, xảy ra nhiều vụ trộm cắp cướp giật và mở nhạc tiếng ồn lớn.",
        "keywords": ["đua xe", "trộm cắp", "cướp giật", "an ninh trật tự", "antt", "tiếng ồn đêm", "tệ nạn"]
    }
]

# Danh sách 10 tài khoản kiểm thử chính thức
TEST_ACCOUNTS = [
    {"username": "canbo_gtvt", "password": "officer123", "role": "OFFICER", "dept_code": "SO_GTVT"},
    {"username": "canbo_tnmt", "password": "officer123", "role": "OFFICER", "dept_code": "SO_TNMT"},
    {"username": "canbo_xaydung", "password": "officer123", "role": "OFFICER", "dept_code": "SO_XD", "alt_codes": ["SO_XD", "SO_XAYDUNG"]},
    {"username": "canbo_yte", "password": "officer123", "role": "OFFICER", "dept_code": "SO_YTE", "alt_codes": ["SO_YTE", "SO_YT"]},
    {"username": "canbo_gddt", "password": "officer123", "role": "OFFICER", "dept_code": "SO_GDDT"},
    {"username": "canbo_ldtbxh", "password": "officer123", "role": "OFFICER", "dept_code": "SO_LDTBXH"},
    {"username": "canbo_congan", "password": "officer123", "role": "OFFICER", "dept_code": "CONG_AN_TINH"},
    {"username": "canbo_motcua", "password": "officer123", "role": "OFFICER", "dept_code": "UBND_CAP_HUYEN"},
    {"username": "admin", "password": "admin123", "role": "ADMIN", "dept_code": "ADMIN", "alt_codes": ["ADMIN", "UBND_TINH", "ALL"]},
    {"username": "congdan1", "password": "citizen123", "role": "CITIZEN", "dept_code": None, "alt_codes": [None, "CITIZEN"]},
]


class TestMultiDeptRoutingAndAuth(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db(clean_existing=False)
        cls.client = TestClient(app)

    def test_01_verify_all_ten_accounts_login_api(self):
        """Kiểm thử API /api/auth/login xác thực thành công cho tất cả 10 tài khoản."""
        print("\n--- 1. KIỂM THỬ XÁC THỰC 10 TÀI KHOẢN QUA API /api/auth/login ---")
        for acc in TEST_ACCOUNTS:
            with self.subTest(user=acc["username"]):
                resp = self.client.post("/api/auth/login", json={
                    "username": acc["username"],
                    "password": acc["password"]
                })
                self.assertEqual(
                    resp.status_code, 200,
                    f"Đăng nhập thất bại cho tài khoản {acc['username']}: HTTP {resp.status_code} - {resp.text}"
                )
                data = resp.json()
                self.assertIn("access_token", data, f"Không có access_token cho {acc['username']}")
                user_info = data.get("user", {})
                self.assertEqual(user_info.get("role"), acc["role"], f"Sai vai trò cho {acc['username']}")
                
                # Kiểm tra phòng ban
                expected_dept = acc["dept_code"]
                alt_codes = acc.get("alt_codes", [expected_dept] if expected_dept else [None])
                if expected_dept:
                    actual_dept = user_info.get("department_code") or user_info.get("dept_code")
                    self.assertIn(actual_dept, alt_codes, f"Sai phòng ban cho {acc['username']}: {actual_dept} not in {alt_codes}")
                print(f"  ✓ Đăng nhập thành công: {acc['username']} ({acc['role']} - {user_info.get('department_code')})")

    def test_02_verify_keyword_fallback_routing_all_seven_departments(self):
        """Kiểm thử cơ chế fallback từ khóa khi Gemini API gặp lỗi cho cả 7 Sở/Ngành."""
        print("\n--- 2. KIỂM THỬ FALLBACK TỪ KHÓA KHI GEMINI GẶP SỰ CỐ CHO 7 SỞ ---")
        
        # Mock model.generate_content gây lỗi (Exception hoặc Timeout)
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = RuntimeError("Simulated Gemini API Failure / Rate Limit / Network Down")

        for case in DEPT_TEST_CASES:
            with self.subTest(dept=case["dept_code"]):
                # Gọi analyze_ticket với mock_model bị lỗi
                res = analyze_ticket(
                    model=mock_model,
                    user_input_text=case["sample_text"]
                )
                routed_dept = res.get("department_code")
                valid_codes = [case["dept_code"]] + case.get("alt_codes", [])
                self.assertIn(
                    routed_dept, valid_codes,
                    f"Fallback sai cho {case['name']}. Mong muốn thuộc {valid_codes}, thực tế: {routed_dept}. Chi tiết: {res}"
                )
                self.assertIn("draft_reply", res, "Kết quả fallback phải có draft_reply")
                self.assertIn("summary", res, "Kết quả fallback phải có summary")
                print(f"  ✓ Fallback chính xác: {case['name']} -> {routed_dept}")

    def test_03_verify_live_or_robust_ai_routing_all_seven_departments(self):
        """Kiểm thử định tuyến đơn thư thực tế (process_civic_complaint) cho 7 Sở."""
        print("\n--- 3. KIỂM THỬ ĐỊNH TUYẾN TỔNG QUAN (process_civic_complaint) CHO 7 SỞ ---")
        for case in DEPT_TEST_CASES:
            with self.subTest(dept=case["dept_code"]):
                res = process_civic_complaint(case["sample_text"])
                routed_dept = res.get("department_code")
                valid_codes = [case["dept_code"]] + case.get("alt_codes", [])
                
                # Nếu API Gemini trả về REQUIRE_HUMAN_REVIEW vì lý do gì, ghi nhận, nhưng mong muốn đúng Sở
                print(f"  * {case['name']}: Routed to -> {routed_dept} (Confidence: {res.get('confidence_score')})")
                self.assertIn(
                    routed_dept, valid_codes + ["REQUIRE_HUMAN_REVIEW"],
                    f"Định tuyến không hợp lệ cho {case['dept_code']}: {routed_dept}"
                )

    def test_04_verify_ticket_creation_with_ai_result(self):
        """Kiểm thử tạo đơn qua create_ticket_service đính kèm ai_result và lưu CSDL."""
        print("\n--- 4. KIỂM THỬ TẠO ĐƠN QUA TICKET SERVICE & AI RESULT ATTACHED ---")
        db = SessionLocal()
        try:
            # Tạo thử 1 đơn thuộc Sở Tài nguyên và Môi trường
            text_don = "Đoạn kênh Bà Ký gần KCN Biên Hòa 2 bị đổ trộm xả thải bùn độc hại hôi thối, đề nghị xử lý bãi rác tự phát."
            ticket_dict = create_ticket_service(
                db=db,
                citizen_name="Trần Văn Kiểm Thử",
                citizen_phone="0987654321",
                citizen_email="kiemthu@dongnai.gov.vn",
                raw_text=text_don,
                images=[]
            )
            self.assertTrue(ticket_dict.get("success"), "Tạo đơn không thành công")
            self.assertIn("ticket_code", ticket_dict)
            self.assertIn("ai_result", ticket_dict)
            self.assertIsNotNone(ticket_dict["ai_result"], "ticketDict['ai_result'] không được None!")
            
            ai_data = ticket_dict["ai_result"]
            self.assertIn("summary", ai_data, "ai_result phải chứa summary")
            self.assertIn("draft_reply", ai_data, "ai_result phải chứa draft_reply")
            
            # Kiểm tra CSDL
            created_ticket = db.query(Ticket).filter(Ticket.tracking_code == ticket_dict["ticket_code"]).first()
            self.assertIsNotNone(created_ticket, "Không tìm thấy Ticket trong CSDL")
            self.assertIsNotNone(created_ticket.ai_result, "Ticket trong CSDL chưa liên kết AIResult")
            print(f"  ✓ Tạo đơn thành công: Mã {created_ticket.tracking_code} | Phòng ban: {created_ticket.dept_code} | AI Result: {bool(created_ticket.ai_result)}")
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
