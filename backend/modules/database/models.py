"""
Định nghĩa Mô hình Bảng Cơ sở Dữ liệu (SQLAlchemy ORM 2.0)
Hệ thống Tiếp nhận & Điều phối Đơn thư Trí tuệ Nhân tạo - Tỉnh Đồng Nai
Tuân thủ chuẩn Unicode (NVARCHAR / NVARCHAR(MAX)) cho Microsoft SQL Server 2025 Express.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, Unicode, UnicodeText, Float, Boolean, DateTime, ForeignKey, event, inspect
)
from sqlalchemy.dialects.mssql import NVARCHAR
from sqlalchemy.orm import relationship

from modules.database.connection import Base

# Kiểu dữ liệu văn bản Unicode không giới hạn:
# Trên MSSQL sinh ra NVARCHAR(MAX), trên SQLite sinh ra TEXT.
NVarCharMax = UnicodeText().with_variant(NVARCHAR(None), "mssql")


# Bảng Phòng Ban Chuyên Trách (departments)
class Department(Base):
    __tablename__ = "departments"

    dept_id = Column(Integer, primary_key=True, index=True)
    dept_code = Column(Unicode(50), unique=True, nullable=False, index=True)
    dept_name = Column(Unicode(255), nullable=False)
    email_contact = Column(Unicode(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tickets = relationship("Ticket", back_populates="department")


DEPT_NAMES = {
    "SO_GTVT": "Sở Giao thông Vận tải",
    "SO_TNMT": "Sở Tài nguyên & Môi trường",
    "SO_XD": "Sở Xây dựng",
    "SO_XAYDUNG": "Sở Xây dựng",
    "SO_YTE": "Sở Y tế",
    "SO_YT": "Sở Y tế",
    "SO_GDDT": "Sở Giáo dục và Đào tạo",
    "SO_LDTBXH": "Sở Lao động - Thương binh và Xã hội",
    "CONG_AN_TINH": "Công an Tỉnh Đồng Nai",
    "UBND_CAP_HUYEN": "UBND Cấp Huyện / TP",
    "UBND_TINH": "UBND Tỉnh Đồng Nai",
    "REQUIRE_HUMAN_REVIEW": "Cần Admin Phân Luồng",
}

dept_header_map = {
    "SO_GTVT": ("SỞ GIAO THÔNG VẬN TẢI TỈNH ĐỒNG NAI", "Số: .../TB-SGTVT"),
    "SO_TNMT": ("SỞ TÀI NGUYÊN VÀ MÔI TRƯỜNG TỈNH ĐỒNG NAI", "Số: .../TB-STNMT"),
    "SO_XD": ("SỞ XÂY DỰNG TỈNH ĐỒNG NAI", "Số: .../TB-SXD"),
    "SO_XAYDUNG": ("SỞ XÂY DỰNG TỈNH ĐỒNG NAI", "Số: .../TB-SXD"),
    "SO_YTE": ("SỞ Y TẾ TỈNH ĐỒNG NAI", "Số: .../TB-SYT"),
    "SO_YT": ("SỞ Y TẾ TỈNH ĐỒNG NAI", "Số: .../TB-SYT"),
    "SO_GDDT": ("SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG NAI", "Số: .../TB-SGDDT"),
    "SO_LDTBXH": ("SỞ LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI TỈNH ĐỒNG NAI", "Số: .../TB-SLDTBXH"),
    "CONG_AN_TINH": ("CÔNG AN TỈNH ĐỒNG NAI", "Số: .../TB-CAT"),
    "UBND_TINH": ("ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI", "Số: .../TB-UBND"),
    "UBND_CAP_HUYEN": ("ỦY BAN NHÂN DÂN CẤP HUYỆN / TP", "Số: .../TB-UBND"),
    "REQUIRE_HUMAN_REVIEW": ("TỔ TIẾP NHẬN & ĐIỀU PHỐI ĐƠN THƯ TỈNH ĐỒNG NAI", "Số: .../TB-TĐP"),
}

# Bảng Người Dùng & Cán Bộ (users)
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(Unicode(50), unique=True, nullable=False, index=True)
    password_hash = Column(Unicode(255), nullable=False)
    full_name = Column(Unicode(100), nullable=False)
    role = Column(Unicode(20), nullable=False)  # 'ADMIN', 'OFFICER', 'ONE_STOP', 'CITIZEN'
    dept_code = Column(Unicode(50), nullable=True)
    officer_code = Column(Unicode(50), nullable=True)
    phone = Column(Unicode(20), nullable=True)
    email = Column(Unicode(100), nullable=True)
    gmail_account = Column(Unicode(100), nullable=True)
    gmail_app_password = Column(Unicode(255), nullable=True)
    last_synced_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tickets = relationship("Ticket", back_populates="user")


class TicketStatus:
    PROCESSING = "PROCESSING"
    ROUTED = "ROUTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    AI_FAILED = "AI_FAILED"


# Bảng Hồ Sơ Đơn Thư Tiếp Nhận (tickets)
class Ticket(Base):
    __tablename__ = "tickets"

    ticket_id = Column(Integer, primary_key=True, index=True)
    tracking_code = Column(Unicode(30), unique=True, nullable=False, index=True)
    source = Column(Unicode(20), nullable=False)  # 'WEB_TEXT', 'WEB_IMAGE', 'ONE_STOP', 'EMAIL', 'GMAIL_REAL'
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    original_message_id = Column(Unicode(255), nullable=True, index=True)
    citizen_name = Column(Unicode(100), nullable=True)
    citizen_email = Column(Unicode(100), nullable=True)
    citizen_phone = Column(Unicode(20), nullable=True)
    raw_text = Column(NVarCharMax, nullable=True)
    image_url = Column(Unicode(500), nullable=True)
    image_urls = Column(NVarCharMax, nullable=True)  # Chuỗi JSON mảng các đường dẫn ảnh: '["/uploads/img1.jpg", ...]'
    status = Column(Unicode(30), default="PROCESSING")  # 'PROCESSING', 'ROUTED', 'APPROVED', 'REJECTED', 'HUMAN_REVIEW', 'AI_FAILED'
    dept_code = Column(Unicode(50), ForeignKey("departments.dept_code"), nullable=True)
    dept_name = Column(Unicode(255), nullable=True)
    priority = Column(Unicode(20), default="TRUNG_BINH")  # 'CAO', 'TRUNG_BINH', 'THAP'
    is_starred = Column(Boolean, default=False, nullable=True)  # Đánh dấu sao ưu tiên
    admin_note = Column(NVarCharMax, nullable=True)
    rejection_reason = Column(NVarCharMax, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("Department", back_populates="tickets")
    user = relationship("User", back_populates="tickets")
    ai_result = relationship("AIResult", back_populates="ticket", uselist=False, cascade="all, delete-orphan")

    def get_image_urls_list(self) -> list:
        """Trả về danh sách URL ảnh đính kèm, hỗ trợ cả JSON mảng mới và bản ghi cũ (1 chuỗi)."""
        import json
        if self.image_urls:
            try:
                parsed = json.loads(self.image_urls)
                if isinstance(parsed, list):
                    return [str(u) for u in parsed if u]
                elif isinstance(parsed, str) and parsed.strip():
                    return [parsed.strip()]
            except Exception:
                pass
        if self.image_url and self.image_url.strip():
            return [self.image_url.strip()]
        return []



class TicketStatusEvent(Base):
    __tablename__ = "ticket_status_events"

    event_id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey("tickets.ticket_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Unicode(30), nullable=False)
    occurred_at = Column(DateTime, nullable=False, default=datetime.utcnow)


def _record_ticket_status(connection, ticket):
    connection.execute(TicketStatusEvent.__table__.insert().values(
        ticket_id=ticket.ticket_id,
        status=ticket.status,
        occurred_at=ticket.updated_at or datetime.utcnow(),
    ))


@event.listens_for(Ticket, "after_insert")
def _record_initial_ticket_status(mapper, connection, ticket):
    _record_ticket_status(connection, ticket)


@event.listens_for(Ticket, "after_update")
def _record_ticket_status_change(mapper, connection, ticket):
    if inspect(ticket).attrs.status.history.has_changes():
        _record_ticket_status(connection, ticket)


# Bảng Kết Quả Bóc Tách từ Gemini AI (ai_results)
class AIResult(Base):
    __tablename__ = "ai_results"

    result_id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.ticket_id"), unique=True, nullable=False)
    extracted_text = Column(NVarCharMax, nullable=False)
    summary = Column(Unicode(500), nullable=False)
    department_code = Column(Unicode(50), nullable=False)
    priority = Column(Unicode(20), nullable=False)
    entities_json = Column(NVarCharMax, nullable=False)  # Thực thể: locations, issues dạng JSON
    legal_basis = Column(NVarCharMax, nullable=True)     # Cơ sở pháp lý tra cứu từ kho RAG
    draft_reply = Column(NVarCharMax, nullable=False)    # Dự thảo phản hồi công dân chuẩn hành chính
    confidence_score = Column(Float, nullable=False)  # Điểm độ tin cậy từ 0.0 đến 1.0
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="ai_result")


# Bảng Kho Văn Bản Pháp Luật RAG (rag_docs)
class RAGDoc(Base):
    __tablename__ = "rag_docs"

    doc_id = Column(Integer, primary_key=True, index=True)
    title = Column(Unicode(255), nullable=False)
    category = Column(Unicode(50), nullable=True)
    regulation_content = Column(NVarCharMax, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def content_chunk(self):
        """Bí danh (alias) tương thích ngược cho regulation_content."""
        return self.regulation_content

    @content_chunk.setter
    def content_chunk(self, value):
        self.regulation_content = value


all_default_depts = [
    Department(dept_code=u"SO_GTVT", dept_name=u"Sở Giao thông Vận tải", email_contact=u"sgtvt@dongnai.gov.vn"),
    Department(dept_code=u"SO_TNMT", dept_name=u"Sở Tài nguyên & Môi trường", email_contact=u"stnmt@dongnai.gov.vn"),
    Department(dept_code=u"SO_XD", dept_name=u"Sở Xây dựng", email_contact=u"sxd@dongnai.gov.vn"),
    Department(dept_code=u"SO_XAYDUNG", dept_name=u"Sở Xây dựng", email_contact=u"sxd@dongnai.gov.vn"),
    Department(dept_code=u"SO_YTE", dept_name=u"Sở Y tế", email_contact=u"syte@dongnai.gov.vn"),
    Department(dept_code=u"SO_YT", dept_name=u"Sở Y tế", email_contact=u"syte@dongnai.gov.vn"),
    Department(dept_code=u"SO_GDDT", dept_name=u"Sở Giáo dục và Đào tạo", email_contact=u"sgddt@dongnai.gov.vn"),
    Department(dept_code=u"SO_LDTBXH", dept_name=u"Sở Lao động - Thương binh và Xã hội", email_contact=u"sldtbxh@dongnai.gov.vn"),
    Department(dept_code=u"CONG_AN_TINH", dept_name=u"Công an Tỉnh Đồng Nai", email_contact=u"congan@dongnai.gov.vn"),
    Department(dept_code=u"UBND_CAP_HUYEN", dept_name=u"UBND Cấp Huyện / TP", email_contact=u"ubnd.bienhoa@dongnai.gov.vn"),
    Department(dept_code=u"UBND_TINH", dept_name=u"UBND Tỉnh Đồng Nai", email_contact=u"ubnd@dongnai.gov.vn"),
    Department(dept_code=u"REQUIRE_HUMAN_REVIEW", dept_name=u"Cần Admin Phân Luồng", email_contact=u"admin.donthu@dongnai.gov.vn"),
]
