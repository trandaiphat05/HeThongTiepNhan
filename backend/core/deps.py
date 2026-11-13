"""
Core Dependencies Re-export (Hierarchical RBAC & Current User)
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

