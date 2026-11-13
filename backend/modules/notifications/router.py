"""
API Router cho Module Thông báo & Giám sát Email Worker
Kiến trúc Clean Architecture: Router ủy quyền hoàn toàn cho Service Layer.
"""

from fastapi import APIRouter
from modules.notifications.service import get_worker_status_service, sync_email_worker_service

router = APIRouter(prefix="/api/admin/worker", tags=["Thông Báo & Giám Sát Email Worker"])


@router.get("/status")
def get_worker_status():
    """Lấy trạng thái vận hành của tiến trình quét hòm thư tự động."""
    return get_worker_status_service()


@router.post("/sync")
def sync_email_now():
    """Kích hoạt thủ công tiến trình quét hòm thư công vụ."""
    return sync_email_worker_service()
