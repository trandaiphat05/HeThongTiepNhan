"""
Re-export Models từ Module Database tập trung
"""

from modules.database.models import Department, Ticket, AIResult, RAGDoc

__all__ = ["Department", "Ticket", "AIResult", "RAGDoc"]
