"""
API Router cho Module Thông báo & Giám sát Email Worker
Kiến trúc Clean Architecture: Router ủy quyền hoàn toàn cho Service Layer.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.config import settings
from modules.auth.deps import require_role, get_current_user_optional, get_current_user
from modules.auth.schemas import LinkGmailRequest, SyncGmailRequest, GmailStatusResponse
from modules.auth.service import link_user_gmail, get_user_gmail_status, disconnect_user_gmail
from modules.notifications.service import get_worker_status_service, sync_email_worker_service
from modules.notifications.email_worker import sync_real_gmail_inbox, verify_gmail_imap_credentials, worker_status

router = APIRouter(tags=["Thông Báo & Giám Sát Email Worker"])


# 1. ADMIN WORKER STATUS & SYNC
@router.get("/api/admin/worker/status", dependencies=[Depends(require_role("ADMIN"))])
def get_worker_status():
    """Lấy trạng thái vận hành của tiến trình quét hòm thư tự động."""
    return get_worker_status_service()


@router.post("/api/admin/worker/sync", dependencies=[Depends(require_role("ADMIN"))])
def sync_email_now():
    """Kích hoạt thủ công tiến trình quét hòm thư công vụ."""
    return sync_email_worker_service()


# 2. 100% REAL GMAIL SYNC & MANAGEMENT ENDPOINTS
@router.post("/api/notifications/link-gmail")
@router.post("/api/gmail/link")
def link_gmail_endpoint(
    req: LinkGmailRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Xác minh và lưu thông tin Gmail thật (Google App Password 16 ký tự).
    Bắt buộc kết nối thành công tới imap.gmail.com:993 trước khi lưu.
    """
    verify_gmail_imap_credentials(req.gmail_account, req.gmail_app_password)
    return link_user_gmail(db, current_user, req)


@router.post("/api/notifications/sync-gmail")
@router.post("/api/gmail/sync")
def sync_gmail_endpoint(
    req: Optional[SyncGmailRequest] = None,
    max_emails: int = Query(5, ge=1, le=100),
    current_user: Optional[dict] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Đồng bộ thư thật từ Gmail IMAP (ZERO MOCK DATA):
    - Kết nối imap.gmail.com:993
    - Chống trùng lặp tuyệt đối bằng original_message_id
    - Bóc tách nội dung, ảnh đính kèm và gọi Gemini AI phân tích
    - Lưu Ticket (source='GMAIL_REAL') vào MS SQL Server
    - Trả về số lượng thư mới được tiếp nhận
    """
    email_account = None
    app_password = None

    if req and req.gmail_account and req.gmail_app_password:
        email_account = req.gmail_account.strip()
        app_password = req.gmail_app_password.strip()
    elif current_user:
        email_account = current_user.get("gmail_account")
        app_password = current_user.get("gmail_app_password")

    if not email_account or not app_password:
        email_account = settings.MAIL_USERNAME
        app_password = settings.MAIL_PASSWORD

    is_placeholder = (
        not email_account
        or not app_password
        or app_password in ["app_password_here", "your_app_password"]
        or "your_email" in (email_account or "")
    )

    if is_placeholder:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chưa cấu hình tài khoản hoặc Mật khẩu ứng dụng Gmail (16 ký tự). Vui lòng liên kết tài khoản Gmail trước khi đồng bộ."
        )

    user_id = current_user.get("user_id") if current_user else None
    limit = req.max_emails if (req and req.max_emails) else max_emails

    return sync_real_gmail_inbox(
        user_id=user_id,
        email_account=email_account,
        app_password=app_password,
        db=db,
        max_emails=limit
    )


@router.post("/api/notifications/disconnect-gmail")
@router.post("/api/gmail/disconnect")
def disconnect_gmail_endpoint(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Hủy liên kết tài khoản Gmail và xóa thông tin xác thực."""
    return disconnect_user_gmail(db, current_user)


@router.get("/api/notifications/gmail-status")
@router.get("/api/gmail/status")
def gmail_status_endpoint(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy trạng thái kết nối, địa chỉ email và thời gian đồng bộ cuối cùng."""
    st = get_user_gmail_status(db, current_user)
    st["connection_status"] = "CONNECTED" if st.get("is_linked") else "DISCONNECTED"
    st["worker_last_sync"] = worker_status.get("last_sync")
    return st

