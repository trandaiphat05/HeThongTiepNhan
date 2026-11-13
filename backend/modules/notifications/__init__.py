"""
Notifications & Email Worker Module
"""

from modules.notifications.router import router as notifications_router
from modules.notifications.email_worker import (
    start_email_worker_thread,
    send_official_reply_email,
    worker_status,
    fetch_unseen_emails,
    sync_real_gmail_inbox,
    verify_gmail_imap_credentials,
)

__all__ = [
    "notifications_router",
    "start_email_worker_thread",
    "send_official_reply_email",
    "worker_status",
    "fetch_unseen_emails",
    "sync_real_gmail_inbox",
    "verify_gmail_imap_credentials",
]

