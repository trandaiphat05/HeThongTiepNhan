"""
Module Kho Tri Thức Pháp Luật RAG (Đồng Nai)
"""

from modules.rag.router import router as rag_router
from modules.rag.service import (
    ingest_document,
    list_rag_docs,
    delete_rag_doc,
    retrieve_legal_context_for_prompt,
    seed_default_rag_knowledge
)
from modules.rag.vector_store import search_relevant_chunks

__all__ = [
    "rag_router",
    "ingest_document",
    "list_rag_docs",
    "delete_rag_doc",
    "retrieve_legal_context_for_prompt",
    "seed_default_rag_knowledge",
    "search_relevant_chunks"
]

