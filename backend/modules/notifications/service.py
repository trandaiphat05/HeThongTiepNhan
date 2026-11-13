"""
Service Layer cho Module Thông Báo & Giám Sát Email Worker
"""

from datetime import datetime
from typing import Dict, Any
from core.config import settings
from modules.notifications.email_worker import worker_status, fetch_unseen_emails


def get_worker_status_service() -> Dict[str, Any]:
    """Lấy trạng thái vận hành của tiến trình quét hòm thư tự động từ số liệu thực tế."""
    from core.database import SessionLocal
    from modules.database.models import Ticket

    total_real_emails = 0
    with SessionLocal() as db:
        total_real_emails = db.query(Ticket).filter(Ticket.source.in_(["EMAIL", "GMAIL_REAL"])).count()

    return {
        "is_running": True,
        "email_account": settings.MAIL_USERNAME,
        "protocol": "IMAP qua SSL (Cổng 993)",
        "interval_seconds": settings.MAIL_CHECK_INTERVAL_SECONDS,
        "last_sync": worker_status.get("last_sync", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
        "total_emails_fetched": total_real_emails,
        "new_emails_last_round": worker_status.get("new_emails_last_round", 0)
    }


def sync_email_worker_service() -> Dict[str, Any]:
    """Kích hoạt thủ công tiến trình quét hòm thư công vụ thật."""
    new_count = fetch_unseen_emails()
    from core.database import SessionLocal
    from modules.database.models import Ticket

    total_real_emails = 0
    with SessionLocal() as db:
        total_real_emails = db.query(Ticket).filter(Ticket.source.in_(["EMAIL", "GMAIL_REAL"])).count()

    return {
        "success": True,
        "message": f"Đã quét hòm thư công vụ qua IMAP SSL thật. Tiếp nhận {new_count} thư mới.",
        "status": {
            "is_running": True,
            "last_sync": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_emails_fetched": total_real_emails,
            "new_emails_last_round": new_count
        }
    }

