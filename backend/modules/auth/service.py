"""
Service Layer cho Module Xác thực & Quản lý Người dùng (Auth)
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from modules.auth.models import User
from modules.auth.schemas import UserCreateRequest, RegisterRequest, LinkGmailRequest
from modules.notifications.email_worker import verify_gmail_imap_credentials

JWT_SECRET = "dongnai_civic_ai_secret_key_2026_jwt"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    """Băm mật khẩu an toàn bằng bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_or_plain: str) -> bool:
    """Xác thực mật khẩu, tương thích cả bcrypt hash và plain text demo."""
    if not hashed_or_plain:
        return False
    if hashed_or_plain.startswith("$2b$") or hashed_or_plain.startswith("$2a$"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_or_plain.encode("utf-8"))
        except Exception:
            return False
    # Fallback cho mật khẩu demo plain text
    return plain_password == hashed_or_plain


# Danh mục tài khoản mặc định phục vụ kiểm thử nhanh và demo
DEFAULT_ACCOUNTS = {
    "admin": {
        "password": "admin123",
        "user_id": 1,
        "username": "admin",
        "full_name": "Quản trị viên Hệ thống",
        "role": "ADMIN",
        "department_code": "ALL",
        "dept_code": "ALL",
        "is_active": True
    },
    "admin_tinh": {
        "password": "admin123",
        "user_id": 10,
        "username": "admin_tinh",
        "full_name": "Nguyễn Văn Minh - UBND Tỉnh",
        "role": "ADMIN",
        "department_code": "UBND_TINH",
        "dept_code": "UBND_TINH",
        "is_active": True
    },
    "canbo_gtvt": {
        "password": "officer123",
        "user_id": 2,
        "username": "canbo_gtvt",
        "full_name": "Lê Thanh Bình - Sở GTVT",
        "role": "OFFICER",
        "department_code": "SO_GTVT",
        "dept_code": "SO_GTVT",
        "is_active": True
    },
    "canbo_tnmt": {
        "password": "officer123",
        "user_id": 3,
        "username": "canbo_tnmt",
        "full_name": "Hoàng Thị Yến - Sở TN&MT",
        "role": "OFFICER",
        "department_code": "SO_TNMT",
        "dept_code": "SO_TNMT",
        "is_active": True
    },
    "canbo_xd": {
        "password": "officer123",
        "user_id": 4,
        "username": "canbo_xd",
        "full_name": "Đặng Quốc Huy - Sở Xây dựng",
        "role": "OFFICER",
        "department_code": "SO_XD",
        "dept_code": "SO_XD",
        "is_active": True
    },
    "canbo_soxd": {
        "password": "officer123",
        "user_id": 4,
        "username": "canbo_soxd",
        "full_name": "Đặng Quốc Huy - Sở Xây dựng",
        "role": "OFFICER",
        "department_code": "SO_XD",
        "dept_code": "SO_XD",
        "is_active": True
    },
    "canbo_xaydung": {
        "password": "officer123",
        "user_id": 11,
        "username": "canbo_xaydung",
        "full_name": "Đặng Quốc Huy - Sở Xây dựng",
        "role": "OFFICER",
        "department_code": "SO_XD",
        "dept_code": "SO_XD",
        "is_active": True
    },
    "canbo_yte": {
        "password": "officer123",
        "user_id": 12,
        "username": "canbo_yte",
        "full_name": "Bác sĩ Phan Văn Nam - Sở Y tế",
        "role": "OFFICER",
        "department_code": "SO_YTE",
        "dept_code": "SO_YTE",
        "is_active": True
    },
    "canbo_gddt": {
        "password": "officer123",
        "user_id": 13,
        "username": "canbo_gddt",
        "full_name": "Thầy Trần Trọng Hiếu - Sở GD&ĐT",
        "role": "OFFICER",
        "department_code": "SO_GDDT",
        "dept_code": "SO_GDDT",
        "is_active": True
    },
    "canbo_ldtbxh": {
        "password": "officer123",
        "user_id": 14,
        "username": "canbo_ldtbxh",
        "full_name": "Lê Thị Thảo - Sở LĐ-TB&XH",
        "role": "OFFICER",
        "department_code": "SO_LDTBXH",
        "dept_code": "SO_LDTBXH",
        "is_active": True
    },
    "canbo_congan": {
        "password": "officer123",
        "user_id": 5,
        "username": "canbo_congan",
        "full_name": "Trung tá Trần Văn An - Công an Tỉnh",
        "role": "OFFICER",
        "department_code": "CONG_AN_TINH",
        "dept_code": "CONG_AN_TINH",
        "is_active": True
    },
    "motcua_bienhoa": {
        "password": "officer123",
        "user_id": 6,
        "username": "motcua_bienhoa",
        "full_name": "Vũ Thị Ngọc - UBND TP. Biên Hòa",
        "role": "OFFICER",
        "department_code": "UBND_CAP_HUYEN",
        "dept_code": "UBND_CAP_HUYEN",
        "is_active": True
    },
    "canbo_motcua": {
        "password": "officer123",
        "user_id": 6,
        "username": "canbo_motcua",
        "full_name": "Vũ Thị Ngọc - Cán bộ Một cửa",
        "role": "OFFICER",
        "department_code": "UBND_CAP_HUYEN",
        "dept_code": "UBND_CAP_HUYEN",
        "is_active": True
    },
    "congdan1": {
        "password": "citizen123",
        "user_id": 7,
        "username": "congdan1",
        "full_name": "Nguyễn Văn Công Dân",
        "role": "CITIZEN",
        "department_code": "CITIZEN",
        "dept_code": "CITIZEN",
        "is_active": True
    }
}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Tạo JWT access token có hạn dùng."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Giải mã và xác minh tính toàn vẹn của JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token xác thực không hợp lệ."
        )


def authenticate_user(db: Session, username: str, password: str) -> Dict[str, Any]:
    """
    Xác thực người dùng:
    1. Kiểm tra trong danh mục tài khoản mặc định (admin, canbo_gtvt, congdan1)
    2. Kiểm tra trong bảng `users` trên CSDL MS SQL Server (hỗ trợ mật khẩu bcrypt an toàn)
    """
    clean_username = username.strip().lower()

    # 1. Kiểm tra tài khoản mặc định trước
    if clean_username in DEFAULT_ACCOUNTS:
        account = DEFAULT_ACCOUNTS[clean_username]
        if account["password"] == password or (clean_username in ["motcua_bienhoa", "canbo_motcua"] and password == "one123"):
            # Tra cứu thêm trong DB nếu user đã có cấu hình Gmail
            db_user = db.query(User).filter(User.username == clean_username).first()
            return {
                "user_id": db_user.user_id if db_user else account["user_id"],
                "username": account["username"],
                "full_name": db_user.full_name if db_user else account["full_name"],
                "role": account["role"],
                "department_code": account["department_code"],
                "dept_code": account["dept_code"],
                "email": db_user.email if db_user else None,
                "gmail_account": db_user.gmail_account if db_user else None,
                "last_synced_at": db_user.last_synced_at.strftime("%Y-%m-%d %H:%M:%S") if (db_user and db_user.last_synced_at) else None,
            }

    # 2. Kiểm tra tài khoản trong bảng users CSDL
    db_user = db.query(User).filter(User.username == clean_username).first()
    if db_user:
        if not db_user.is_active:
            if db_user.role == "OFFICER":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tài khoản đang chờ Quản trị viên xác nhận quyền truy cập."
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản này hiện đang bị khóa tạm thời."
            )
        # Kiểm tra mật khẩu (hỗ trợ cả bcrypt hash lẫn demo plain text)
        if verify_password(password, db_user.password_hash):
            return {
                "user_id": db_user.user_id,
                "username": db_user.username,
                "full_name": db_user.full_name,
                "role": db_user.role,
                "department_code": db_user.dept_code,
                "dept_code": db_user.dept_code,
                "email": db_user.email,
                "phone": getattr(db_user, "phone", None),
                "officer_code": getattr(db_user, "officer_code", None),
                "gmail_account": db_user.gmail_account,
                "last_synced_at": db_user.last_synced_at.strftime("%Y-%m-%d %H:%M:%S") if db_user.last_synced_at else None,
            }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Tên đăng nhập hoặc mật khẩu không chính xác."
    )


def get_current_user_from_token(token: str, db: Session) -> Dict[str, Any]:
    """Trích xuất và kiểm tra thông tin người dùng từ token."""
    payload = decode_access_token(token)
    username = payload.get("username")
    if not username:
        raise HTTPException(status_code=401, detail="Token không chứa thông tin định danh.")

    # Kiểm tra trong DB trước để lấy dữ liệu đồng bộ mới nhất (Gmail, tên đầy đủ, v.v.)
    db_user = db.query(User).filter(User.username == username).first()
    if db_user:
        return {
            "user_id": db_user.user_id,
            "username": db_user.username,
            "full_name": db_user.full_name,
            "role": db_user.role,
            "department_code": db_user.dept_code,
            "dept_code": db_user.dept_code,
            "email": db_user.email,
            "gmail_account": db_user.gmail_account,
            "gmail_app_password": db_user.gmail_app_password,
            "last_synced_at": db_user.last_synced_at.strftime("%Y-%m-%d %H:%M:%S") if db_user.last_synced_at else None,
        }

    # Fallback DEFAULT_ACCOUNTS
    if username in DEFAULT_ACCOUNTS:
        acc = DEFAULT_ACCOUNTS[username]
        return {
            "user_id": acc["user_id"],
            "username": acc["username"],
            "full_name": acc["full_name"],
            "role": acc["role"],
            "department_code": acc["department_code"],
            "dept_code": acc["dept_code"],
            "email": None,
            "gmail_account": None,
            "gmail_app_password": None,
            "last_synced_at": None,
        }

    return payload


def register_user(db: Session, req: RegisterRequest) -> Dict[str, Any]:
    """
    Đăng ký tài khoản người dùng mới (Công dân hoặc Cán bộ):
    - Kiểm tra tính duy nhất của tên đăng nhập
    - Băm mật khẩu bằng bcrypt
    - Lưu vào CSDL MS SQL Server
    """
    clean_username = req.username.strip().lower()

    if len(clean_username) < 3:
        raise HTTPException(status_code=400, detail="Tên đăng nhập phải có ít nhất 3 ký tự.")

    # Kiểm tra trùng với tài khoản mặc định
    if clean_username in DEFAULT_ACCOUNTS:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại trong danh mục hệ thống.")

    # Kiểm tra trùng trong DB
    existing_user = db.query(User).filter(User.username == clean_username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.")

    # Chuẩn hóa vai trò (mặc định CITIZEN)
    allowed_roles = ["CITIZEN", "OFFICER", "ADMIN"]
    user_role = req.role.upper().strip() if req.role else "CITIZEN"
    if user_role not in allowed_roles:
        user_role = "CITIZEN"

    if user_role == "OFFICER":
        if not req.email or "@dongnai.gov.vn" not in req.email.strip().lower():
            raise HTTPException(
                status_code=400,
                detail="Đăng ký tài khoản Cán bộ bắt buộc phải sử dụng email công vụ (@dongnai.gov.vn)."
            )
        if not req.dept_code:
            raise HTTPException(
                status_code=400,
                detail="Vui lòng chọn Đơn vị công tác (Sở GTVT, Sở TN&MT, Sở Xây dựng, UBND Cấp Huyện/TP)."
            )
        is_active = False
        message = "Yêu cầu đăng ký tài khoản Cán bộ đã được ghi nhận và đang chờ Quản trị viên phê duyệt."
    else:
        is_active = True
        message = f"Đăng ký tài khoản thành công cho Ông/Bà {req.full_name.strip()}! Tài khoản đã được kích hoạt."

    new_user = User(
        username=clean_username,
        password_hash=hash_password(req.password),
        full_name=req.full_name.strip(),
        email=req.email.strip() if req.email else None,
        phone=req.phone.strip() if req.phone else None,
        officer_code=req.officer_code.strip() if req.officer_code else None,
        role=user_role,
        dept_code=req.dept_code if user_role == "OFFICER" else None,
        is_active=is_active,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": message,
        "user": {
            "user_id": new_user.user_id,
            "username": new_user.username,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "department_code": new_user.dept_code,
            "dept_code": new_user.dept_code,
            "email": new_user.email,
            "phone": getattr(new_user, "phone", None),
            "officer_code": getattr(new_user, "officer_code", None),
            "is_active": new_user.is_active,
            "gmail_account": new_user.gmail_account,
            "last_synced_at": None,
        }
    }


def approve_officer_user(db: Session, user_id: int) -> User:
    """Quản trị viên phê duyệt tài khoản cán bộ đăng ký mới."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản cán bộ.")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


def reject_officer_user(db: Session, user_id: int) -> Dict[str, Any]:
    """Quản trị viên từ chối và xóa yêu cầu đăng ký tài khoản cán bộ."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản cán bộ.")
    user_name = user.full_name
    db.delete(user)
    db.commit()
    return {
        "success": True,
        "message": f"Đã từ chối và hủy bỏ yêu cầu đăng ký của cán bộ {user_name}."
    }


def link_user_gmail(db: Session, current_user: dict, req: LinkGmailRequest) -> Dict[str, Any]:
    """
    Xác minh thông tin IMAP Gmail thật và liên kết với tài khoản người dùng:
    - Bắt buộc phải xác thực thành công với máy chủ Gmail IMAP SSL (993)
    - Lưu email và mật khẩu ứng dụng an toàn vào CSDL
    """
    # 1. Xác thực kết nối IMAP thật trước
    verify_gmail_imap_credentials(req.gmail_account, req.gmail_app_password)

    username = current_user.get("username")
    clean_account = req.gmail_account.strip()
    clean_password = req.gmail_app_password.strip().replace(" ", "")

    # 2. Tìm hoặc tạo bản ghi user trong DB
    db_user = db.query(User).filter(User.username == username).first()
    if not db_user:
        # Nếu là tài khoản mặc định chưa có dòng trong bảng users, tạo mới
        db_user = User(
            username=username,
            password_hash=hash_password(DEFAULT_ACCOUNTS.get(username, {}).get("password", "citizen123")),
            full_name=current_user.get("full_name", username),
            role=current_user.get("role", "CITIZEN"),
            dept_code=current_user.get("dept_code"),
            email=clean_account,
            gmail_account=clean_account,
            gmail_app_password=clean_password,
            is_active=True
        )
        db.add(db_user)
    else:
        db_user.gmail_account = clean_account
        db_user.gmail_app_password = clean_password
        if not db_user.email:
            db_user.email = clean_account

    db.commit()
    db.refresh(db_user)

    return {
        "success": True,
        "message": f"Đã xác thực và liên kết thành công với tài khoản Gmail: {clean_account}!",
        "gmail_account": clean_account,
    }


def get_user_gmail_status(db: Session, current_user: dict) -> Dict[str, Any]:
    """Lấy trạng thái liên kết Gmail của người dùng hiện tại."""
    username = current_user.get("username")
    db_user = db.query(User).filter(User.username == username).first()
    
    if db_user and db_user.gmail_account and db_user.gmail_app_password:
        return {
            "is_linked": True,
            "gmail_account": db_user.gmail_account,
            "last_synced_at": db_user.last_synced_at.strftime("%Y-%m-%d %H:%M:%S") if db_user.last_synced_at else None,
        }
    return {
        "is_linked": False,
        "gmail_account": None,
        "last_synced_at": None,
    }


def get_all_users(db: Session) -> List[User]:
    return db.query(User).order_by(User.user_id.asc()).all()


def create_new_user(db: Session, req: UserCreateRequest) -> User:
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại trên hệ thống.")

    user = User(
        username=req.username,
        password_hash="default123",  # Mặc định mật khẩu ban đầu
        full_name=req.full_name,
        role=req.role,
        dept_code=req.dept_code,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def toggle_user_status(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")
    
    user.is_active = not user.is_active
    db.commit()
    return user.is_active
