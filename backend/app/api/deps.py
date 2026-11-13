"""
Compatibility shim for backend/app/api/deps.py (Hierarchical RBAC)
"""

from modules.auth.deps import (
    ROLE_HIERARCHY,
    get_current_user,
    require_role,
    require_admin,
    require_officer,
    require_citizen,
)

__all__ = [
    "ROLE_HIERARCHY",
    "get_current_user",
    "require_role",
    "require_admin",
    "require_officer",
    "require_citizen",
]

