"""
API Router cho Module Đơn thư (Tickets)
Kiến trúc Clean Architecture: Tách biệt hoàn toàn, Router chỉ tiếp nhận HTTP request và ủy quyền cho Service.
"""

from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from modules.auth.deps import get_current_user_optional
from modules.tickets.schemas import ApprovalRequest, TransferRequest, DispatchRequest, ReassignRequest
from modules.tickets.service import (
    submit_ticket_service,
    list_tickets_service,
    get_ticket_by_tracking_code_service,
    approve_ticket_service,
    transfer_ticket_service,
    reassign_ticket_service,
    admin_dispatch_ticket_service,
    mark_ticket_spam_service,
    get_system_stats_service,
    get_citizen_tickets_service,
)

router = APIRouter(tags=["Đơn Thư & Nghiệp Vụ"])


# 1. TIẾP NHẬN ĐƠN THƯ (POST /api/tickets/submit)
@router.post("/api/tickets/submit", status_code=status.HTTP_201_CREATED)
async def submit_ticket(
    background_tasks: BackgroundTasks,
    raw_text: Optional[str] = Form(None),
    citizen_name: Optional[str] = Form(None),
    citizen_phone: Optional[str] = Form(None),
    citizen_email: Optional[str] = Form(None),
    source: Optional[str] = Form("WEB_TEXT"),
    files: list[UploadFile] = File(default=[]),
    image: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
    current_user: Optional[dict] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Tiếp nhận đơn phản ánh từ người dân hoặc Cán bộ Một cửa."""
    upload_list = [f for f in files if f and f.filename] if files else []
    if not upload_list:
        if image and image.filename:
            upload_list.append(image)
        elif file and file.filename:
            upload_list.append(file)

    user_id = current_user.get("user_id") if current_user else None
    final_email = citizen_email or (current_user.get("email") if current_user else None)
    final_name = citizen_name or (current_user.get("full_name") if current_user else None)

    return await submit_ticket_service(
        db=db,
        background_tasks=background_tasks,
        raw_text=raw_text,
        citizen_name=final_name,
        citizen_phone=citizen_phone,
        citizen_email=final_email,
        source=source,
        user_id=user_id,
        images=upload_list
    )


# 1b. LỊCH SỬ ĐƠN THƯ CỦA CÔNG DÂN (GET /api/citizen/my-tickets)
@router.get("/api/citizen/my-tickets")
def get_my_tickets(
    email: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Lấy danh sách các đơn thư đã gửi gắn với tài khoản công dân."""
    return get_citizen_tickets_service(db=db, current_user=current_user, email=email)


# 2. DANH SÁCH HỒ SƠ ĐƠN THƯ (GET /api/tickets)
@router.get("/api/tickets")
def get_tickets(
    department_code: Optional[str] = Query(None),
    dept_code: Optional[str] = Query("ALL"),
    source: Optional[str] = Query("ALL"),
    priority: Optional[str] = Query("ALL"),
    status: Optional[str] = Query("ALL"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Lọc danh sách đơn thư cho Cán bộ thẩm tra theo phòng ban và trạng thái."""
    return list_tickets_service(
        db=db,
        department_code=department_code,
        dept_code=dept_code,
        source=source,
        priority=priority,
        status=status,
        search=search
    )


# 3. TRA CỨU TIẾN ĐỘ HỒ SƠ (GET /api/tickets/lookup/{tracking_code} & /api/tickets/tracking/{tracking_code})
@router.get("/api/tickets/lookup/{tracking_code}")
@router.get("/api/tickets/tracking/{tracking_code}")
def lookup_ticket(tracking_code: str, db: Session = Depends(get_db)):
    """Tra cứu chi tiết một hồ sơ qua mã biên nhận."""
    return get_ticket_by_tracking_code_service(db=db, tracking_code=tracking_code)


# 4. PHÊ DUYỆT ĐƠN THƯ & PHÁT HÀNH EMAIL (PUT /api/tickets/{ticket_id}/approve)
@router.put("/api/tickets/{ticket_id}/approve")
def approve_ticket(
    ticket_id: int,
    req: ApprovalRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Cán bộ cập nhật dự thảo phản hồi, phê duyệt và kích hoạt gửi email chính thức."""
    return approve_ticket_service(
        db=db,
        ticket_id=ticket_id,
        req=req,
        background_tasks=background_tasks
    )


# 5. CHUYỂN TUYẾN / YÊU CẦU ADMIN XỬ LÝ (PUT /api/tickets/{ticket_id}/transfer)
@router.put("/api/tickets/{ticket_id}/transfer")
def transfer_ticket(ticket_id: int, req: TransferRequest, db: Session = Depends(get_db)):
    """Chuyển tiếp hồ sơ sang đơn vị khác hoặc yêu cầu Admin phân luồng."""
    return transfer_ticket_service(db=db, ticket_id=ticket_id, req=req)


# 5b. CHUYỂN CƠ QUAN THỤ LÝ THỦ CÔNG (PUT /api/tickets/{ticket_id}/reassign)
@router.put("/api/tickets/{ticket_id}/reassign")
def reassign_ticket(ticket_id: int, req: ReassignRequest, db: Session = Depends(get_db)):
    """Cán bộ chuyển cơ quan thụ lý đúng thẩm quyền: cập nhật department_code, ghi nhận reassigned_by và lưu vết lịch sử."""
    return reassign_ticket_service(db=db, ticket_id=ticket_id, req=req)



# 6. ADMIN ĐIỀU PHỐI NGOẠI LỆ (POST /api/admin/dispatch)
@router.post("/api/admin/dispatch")
def admin_dispatch(req: DispatchRequest, db: Session = Depends(get_db)):
    """Quản trị viên chỉ định đơn vị thụ lý cho hồ sơ ngoại lệ."""
    return admin_dispatch_ticket_service(db=db, req=req)


# 7. ADMIN ĐÁNH DẤU ĐƠN RÁC (PUT /api/admin/tickets/{ticket_id}/spam)
@router.put("/api/admin/tickets/{ticket_id}/spam")
def mark_spam(
    ticket_id: int,
    reason: Optional[str] = "Đơn rác hoặc nặc danh vô nghĩa",
    db: Session = Depends(get_db)
):
    """Đánh dấu loại bỏ đơn rác, spam hoặc quấy rối."""
    return mark_ticket_spam_service(db=db, ticket_id=ticket_id, reason=reason)


# 8. THỐNG KÊ GIÁM SÁT HỆ THỐNG (GET /api/admin/stats & GET /api/tickets/stats)
@router.get("/api/admin/stats")
@router.get("/api/tickets/stats")
def get_system_stats(db: Session = Depends(get_db)):
    """Thống kê hồ sơ theo cơ quan, trạng thái xử lý và độ tin cậy AI cho màn hình Admin."""
    return get_system_stats_service(db=db)


# 9. ĐỒNG BỘ GMAIL THẬT (POST /api/tickets/sync-gmail)
@router.post("/api/tickets/sync-gmail")
@router.post("/api/v1/tickets/sync-gmail")
def sync_tickets_from_gmail(
    req: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    """
    Kích hoạt đồng bộ thư phản ánh thật từ hộp thư Gmail (ZERO MOCK).
    Hỗ trợ truyền gmail_account + gmail_app_password trực tiếp hoặc quét từ hòm thư công vụ hệ thống.
    """
    from core.config import settings
    from modules.notifications.email_worker import sync_real_gmail_inbox

    account = None
    password = None
    max_emails = 5

    if req:
        account = req.get("gmail_account") or req.get("email")
        password = req.get("gmail_app_password") or req.get("password")
        max_emails = int(req.get("max_emails", 5))

    if not account or not password:
        account = settings.MAIL_USERNAME
        password = settings.MAIL_PASSWORD

    is_placeholder = (
        not password
        or password in ["app_password_here", "your_app_password"]
        or "your_email" in (account or "")
    )

    if is_placeholder:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chưa cấu hình tài khoản hoặc Mật khẩu ứng dụng Gmail (16 ký tự). Vui lòng nhập tài khoản và App Password để đồng bộ."
        )

    return sync_real_gmail_inbox(
        user_id=None,
        email_account=account,
        app_password=password,
        db=db,
        max_emails=max_emails
    )

