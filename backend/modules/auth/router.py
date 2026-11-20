"""
API Router cho Module Xác thực & Phân quyền (Auth)
Kiến trúc Clean Architecture: Tách biệt hoàn toàn tầng Router và Service.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from core.database import get_db
from modules.auth.schemas import (
    LoginRequest,
    LoginResponse,
    UserInfo,
    UserCreateRequest,
    RegisterRequest,
    RegisterResponse,
    LinkGmailRequest,
    GmailStatusResponse,
    SyncGmailRequest
)
from modules.auth.service import (
    authenticate_user,
    create_access_token,
    get_current_user_from_token,
    get_all_users,
    create_new_user,
    toggle_user_status,
    register_user,
    approve_officer_user,
    reject_officer_user,
    link_user_gmail,
    get_user_gmail_status,
    disconnect_user_gmail
)
from modules.auth.deps import (
    get_current_user,
    require_role,
    ROLE_HIERARCHY,
    require_admin,
    require_officer,
    require_citizen,
)

auth_router = APIRouter(tags=["Auth"])
admin_users_router = APIRouter(
    prefix="/api/admin/users",
    tags=["Quản Trị Người Dùng & Phân Quyền"],
    dependencies=[Depends(require_role("ADMIN"))]
)


# ===================== 1. XÁC THỰC NGƯỜI DÙNG (/api/auth) =====================

@auth_router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Đăng nhập hệ thống:
    - Admin: admin / admin123 -> role ADMIN
    - Cán bộ GTVT: canbo_gtvt / officer123 -> role OFFICER, department SO_GTVT
    - Công dân: congdan1 / citizen123 -> role CITIZEN
    """
    user = authenticate_user(db, req.username, req.password)
    access_token = create_access_token(user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@auth_router.get("/me", response_model=UserInfo)
def get_me(user: dict = Depends(get_current_user)):
    """Lấy thông tin người dùng hiện tại từ Access Token."""
    return user


@auth_router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Đăng ký tài khoản công dân / cán bộ mới:
    - Băm mật khẩu bằng thuật toán an toàn bcrypt
    - Lưu vào CSDL MS SQL Server
    """
    return register_user(db, req)


@auth_router.post("/link-gmail")
def link_gmail(
    req: LinkGmailRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Xác minh và liên kết tài khoản Gmail thật (App Password 16 ký tự).
    Bắt buộc phải kết nối thành công tới imap.gmail.com:993 trước khi lưu.
    """
    return link_user_gmail(db, user, req)


@auth_router.get("/gmail-status", response_model=GmailStatusResponse)
def gmail_status(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy trạng thái liên kết Gmail của tài khoản hiện tại."""
    return get_user_gmail_status(db, user)


@auth_router.post("/disconnect-gmail")
def disconnect_gmail(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Hủy liên kết tài khoản Gmail."""
    return disconnect_user_gmail(db, user)


@auth_router.post("/sync-gmail")
def sync_gmail(
    req: Optional[SyncGmailRequest] = None,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Đồng bộ thư thật từ Gmail (ZERO MOCK):
    - Sử dụng tài khoản Gmail đã liên kết của người dùng hoặc thông tin gửi kèm trong request
    - Bóc tách nội dung, trích xuất ảnh hiện trường
    - Gọi Gemini 1.5 Flash bóc tách thực thể & tra cứu RAG
    - Lưu Ticket (source='GMAIL_REAL') vào MS SQL Server
    """
    email_account = None
    app_password = None

    if req and req.gmail_account and req.gmail_app_password:
        email_account = req.gmail_account.strip()
        app_password = req.gmail_app_password.strip()
    else:
        # Lấy từ thông tin user trong DB
        email_account = user.get("gmail_account")
        app_password = user.get("gmail_app_password")

    if not email_account or not app_password:
        raise HTTPException(
            status_code=400,
            detail="Tài khoản chưa liên kết Gmail hoặc thiếu Mật khẩu ứng dụng. Vui lòng bấm 'Liên kết Gmail' trước khi đồng bộ."
        )

    max_emails = req.max_emails if req and req.max_emails else 5
    from modules.notifications.email_worker import sync_real_gmail_inbox

    return sync_real_gmail_inbox(
        user_id=user.get("user_id"),
        email_account=email_account,
        app_password=app_password,
        db=db,
        max_emails=max_emails
    )


# ===================== 2. QUẢN TRỊ DANH SÁCH NGƯỜI DÙNG (/api/admin/users) =====================

@admin_users_router.get("", response_model=List[dict])
@admin_users_router.get("/", response_model=List[dict])
def list_users(db: Session = Depends(get_db)):
    """Lấy danh sách cán bộ và phân quyền."""
    users = get_all_users(db)
    return [
        {
            "user_id": u.user_id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "dept_code": u.dept_code,
            "email": u.email,
            "phone": getattr(u, "phone", None),
            "officer_code": getattr(u, "officer_code", None),
            "is_active": u.is_active,
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else ""
        }
        for u in users
    ]


@admin_users_router.post("", status_code=status.HTTP_201_CREATED)
@admin_users_router.post("/", status_code=status.HTTP_201_CREATED)
def add_user(req: UserCreateRequest, db: Session = Depends(get_db)):
    """Thêm tài khoản cán bộ mới vào hệ thống."""
    user = create_new_user(db, req)
    return {
        "success": True,
        "message": f"Đã khởi tạo tài khoản cán bộ: {user.full_name}",
        "user": {
            "user_id": user.user_id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "dept_code": user.dept_code,
            "email": user.email,
            "phone": getattr(user, "phone", None),
            "officer_code": getattr(user, "officer_code", None),
            "is_active": user.is_active
        }
    }


@admin_users_router.put("/{user_id}/toggle")
def toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Khóa hoặc kích hoạt lại tài khoản cán bộ."""
    new_state = toggle_user_status(db, user_id, current_user=current_user)
    return {
        "success": True,
        "user_id": user_id,
        "is_active": new_state,
        "message": "Đã kích hoạt tài khoản" if new_state else "Đã khóa tài khoản tạm thời"
    }


@admin_users_router.put("/{user_id}/approve")
def approve_user(user_id: int, db: Session = Depends(get_db)):
    """Phê duyệt yêu cầu đăng ký tài khoản cán bộ."""
    user = approve_officer_user(db, user_id)
    return {
        "success": True,
        "message": f"Đã phê duyệt tài khoản cán bộ: {user.full_name}",
        "user": {
            "user_id": user.user_id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "dept_code": user.dept_code,
            "email": user.email,
            "phone": getattr(user, "phone", None),
            "officer_code": getattr(user, "officer_code", None),
            "is_active": user.is_active,
            "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else ""
        }
    }


@admin_users_router.put("/{user_id}/reject")
@admin_users_router.delete("/{user_id}/reject")
@admin_users_router.delete("/{user_id}")
def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Từ chối và hủy bỏ yêu cầu đăng ký tài khoản cán bộ."""
    return reject_officer_user(db, user_id, current_user=current_user)


# Router mặc định để giữ tương thích
router = auth_router
