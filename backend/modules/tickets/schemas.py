"""
Pydantic Schemas cho Module Quản lý Đơn thư (Tickets)
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ApprovalRequest(BaseModel):
    draft_reply: str = Field(..., description="Nội dung văn bản dự thảo đã được cán bộ biên tập/duyệt")
    extracted_text: Optional[str] = Field(None, description="Văn bản bóc tách sau khi chuẩn hóa")
    department_code: Optional[str] = Field(None, description="Mã phòng ban cập nhật")


class TransferRequest(BaseModel):
    target_dept: str = Field(..., description="Mã phòng ban đích cần chuyển tới")
    notes: Optional[str] = Field("", description="Lý do hoặc ghi chú chuyển tuyến")


class ReassignRequest(BaseModel):
    department_code: str = Field(..., description="Mã cơ quan thụ lý mới (SO_GTVT, SO_TNMT, SO_XD, SO_XAYDUNG, UBND_CAP_HUYEN, UBND_TINH)")
    reason: Optional[str] = Field("", description="Lý do chuyển cơ quan thụ lý")
    reassigned_by: Optional[str] = Field("Cán bộ thụ lý", description="Tên hoặc vai trò cán bộ thực hiện chuyển tuyến")


class DispatchRequest(BaseModel):
    ticket_id: int = Field(..., description="ID hồ sơ cần phân luồng")
    target_dept: str = Field(..., description="Đơn vị được chỉ định")
    note: Optional[str] = Field("", description="Ghi chú phân luồng từ Quản trị viên")


class TicketSubmitResponse(BaseModel):
    success: bool
    ticket_id: int
    tracking_code: str
    status: str
    message: str

