"""
Tickets Module - Quản lý Đơn Thư & Nghiệp Vụ
"""

from modules.tickets.models import Ticket, Department, AIResult, RAGDoc
from modules.tickets.router import router as tickets_router
from modules.tickets.service import submit_ticket_service, create_ticket_service

__all__ = ["tickets_router", "Ticket", "Department", "AIResult", "RAGDoc", "submit_ticket_service", "create_ticket_service"]
