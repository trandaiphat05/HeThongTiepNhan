"""
Pydantic Schemas cho Module Quản lý Đơn thư (Tickets)
"""

from enum import Enum
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class TicketStatusEnum(str, Enum):
    PROCESSING = "PROCESSING"
    ROUTED = "ROUTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    AI_FAILED = "AI_FAILED"


class ApprovalRequest(BaseModel):
    draft_reply: str = Field(..., description="Nội dung văn bản dự thảo đã được cán bộ biên tập/duyệt")
    extracted_text: Optional[str] = Field(None, description="Văn bản bóc tách sau khi chuẩn hóa")
    department_code: Optional[str] = Field(None, description="Mã phòng ban cập nhật")


class DraftUpdateRequest(BaseModel):
    draft_reply: Optional[str] = Field(None, description="Nội dung văn bản dự thảo")
    summary: Optional[str] = Field(None, description="Trích yếu nội dung vụ việc")
    extracted_text: Optional[str] = Field(None, description="Văn bản bóc tách")
    department_code: Optional[str] = Field(None, description="Mã cơ quan thụ lý")
    legal_basis: Optional[str] = Field(None, description="Căn cứ pháp lý")


class TransferRequest(BaseModel):
    target_dept: str = Field(..., description="Mã phòng ban đích cần chuyển tới")
    notes: Optional[str] = Field("", description="Lý do hoặc ghi chú chuyển tuyến")


class ReassignRequest(BaseModel):
    department_code: str = Field(..., description="Mã cơ quan thụ lý mới (SO_GTVT, SO_TNMT, SO_XD, SO_XAYDUNG, UBND_CAP_HUYEN, UBND_TINH)")
    reason: Optional[str] = Field("", description="Lý do chuyển cơ quan thụ lý")
    reassigned_by: Optional[str] = Field(None, description="Tên hoặc chức danh cán bộ chuyển tuyến")


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


class SpamRequest(BaseModel):
    reason: Optional[str] = None


class StarToggleRequest(BaseModel):
    is_starred: Optional[bool] = Field(None, description="Trạng thái gắn sao (True/False). Nếu bỏ trống sẽ tự đảo trạng thái.")


class TicketStatusMilestone(BaseModel):
    status: str
    occurred_at: Optional[datetime]


class PublicTicketTracking(BaseModel):
    ticket_id: Optional[int] = None
    ticket_code: str
    tracking_code: Optional[str] = None
    title: Optional[str] = "Đơn thư phản ánh"
    dept_code: Optional[str] = None
    department_code: Optional[str] = None
    dept_name: Optional[str] = None
    department_name: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    status_history: List[TicketStatusMilestone] = []
    ai_result: Optional[Dict[str, Any]] = None
    raw_text: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = []
