"""
Compatibility shim for legacy imports: redirects to core.database and modules.tickets/auth models
"""
from core.database import get_db, init_db, SessionLocal, Base, engine, USE_SQLITE
from modules.tickets.models import Ticket, AIResult, Department, RAGDoc
from modules.auth.models import User

__all__ = [
    "get_db",
    "init_db",
    "SessionLocal",
    "Base",
    "engine",
    "USE_SQLITE",
    "Ticket",
    "AIResult",
    "Department",
    "RAGDoc",
    "User",
]
