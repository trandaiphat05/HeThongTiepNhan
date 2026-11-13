"""
Dependencies Module cho Xác thực và Phân quyền Kế thừa (Hierarchical RBAC)
Hệ thống Tiếp nhận & Xử lý Đơn thư AI - Tỉnh Đồng Nai
"""

from typing import Optional, List, Dict, Any
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from core.database import get_db
from modules.auth.service import get_current_user_from_token

# Mô hình Kế thừa Phân tầng (Hierarchical RBAC)
# - CITIZEN: Chỉ có quyền của Công dân
# - OFFICER: Kế thừa quyền của Công dân + quyền Cán bộ (vừa nộp/tra cứu vừa duyệt đơn)
# - ADMIN: Có tất cả các quyền (Công dân + Cán bộ + Quản trị)
ROLE_HIERARCHY: Dict[str, List[str]] = {
    "ADMIN": ["ADMIN", "OFFICER", "CITIZEN"],
    "OFFICER": ["OFFICER", "CITIZEN"],
    "CITIZEN": ["CITIZEN"]
}

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Dependency trích xuất user hiện tại từ Bearer token."""
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yêu cầu cung cấp Bearer token trong Header Authorization."
        )

    return get_current_user_from_token(token, db)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[Dict[str, Any]]:
    """Dependency trích xuất user hiện tại từ Bearer token (nếu có, không bắt buộc)."""
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()

    if not token:
        return None

    try:
        return get_current_user_from_token(token, db)
    except Exception:
        return None


def require_role(required_role: str):
    """
    Dependency kiểm tra phân quyền Kế thừa Phân tầng (Hierarchical RBAC):
    - Cán bộ (OFFICER) tự động kế thừa quyền của Công dân (CITIZEN).
    - Quản trị viên (ADMIN) tự động kế thừa tất cả các quyền (CITIZEN, OFFICER, ADMIN).
    """
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role") if isinstance(current_user, dict) else getattr(current_user, "role", None)
        user_allowed_roles = ROLE_HIERARCHY.get(user_role or "", [])
        if required_role not in user_allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Tài khoản không đủ quyền hạn. Yêu cầu quyền {required_role}"
            )
        return current_user

    return role_checker


# Tiện ích gọi nhanh
require_admin = require_role("ADMIN")
require_officer = require_role("OFFICER")
require_citizen = require_role("CITIZEN")

