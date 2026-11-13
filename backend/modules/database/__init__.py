"""
Database Module - Quản lý Kết nối & Mô hình Cơ sở Dữ liệu SQL Server 2025 Express
"""

from modules.database.connection import engine, SessionLocal, Base, get_db, USE_SQLITE
from modules.database.models import Department, User, Ticket, AIResult, RAGDoc

__all__ = [
    "engine",
    "SessionLocal",
    "Base",
    "get_db",
    "USE_SQLITE",
    "Department",
    "User",
    "Ticket",
    "AIResult",
    "RAGDoc",
]

