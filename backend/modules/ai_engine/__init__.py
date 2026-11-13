"""
Module AI Engine - Tầng dịch vụ Trí tuệ Nhân tạo Gemini Flash, OCR & RAG
"""

from modules.ai_engine.ai_service import (
    get_ai_model,
    process_civic_complaint,
    reload_rag_knowledge,
    analyze_ticket,
    init_civic_router_agent,
    load_rules_from_docx,
    get_rag_legal_context,
    classify_complaint_fallback,
    TicketRoutingResult,
    EntityInfo,
    DEFAULT_MODEL,
)

__all__ = [
    "get_ai_model",
    "process_civic_complaint",
    "reload_rag_knowledge",
    "analyze_ticket",
    "init_civic_router_agent",
    "load_rules_from_docx",
    "get_rag_legal_context",
    "classify_complaint_fallback",
    "TicketRoutingResult",
    "EntityInfo",
    "DEFAULT_MODEL",
]
