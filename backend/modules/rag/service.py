"""
Service Layer cho Module Kho Tri Thức Pháp Luật (RAG)
Quản lý nạp dữ liệu, phân mảnh và cung cấp ngữ cảnh căn cứ pháp lý cho Gemini AI.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from core.config import DOCS_DIR
from modules.database.models import RAGDoc
from modules.rag.vector_store import extract_text_from_file, chunk_text, search_relevant_chunks
from modules.ai_engine import reload_rag_knowledge

logger = logging.getLogger("RAGService")


def ingest_document(
    db: Session,
    title: str,
    content: Optional[str] = None,
    file_bytes: Optional[bytes] = None,
    filename: Optional[str] = None,
    category: Optional[str] = "CHUNG"
) -> Dict[str, Any]:
    """
    Nạp tài liệu pháp luật (PDF/DOCX/TXT/MD hoặc văn bản nhập trực tiếp),
    tự động cắt nhỏ (chunking) và lưu từng đoạn vào bảng rag_docs.
    """
    raw_text = content or ""
    effective_title = title or (filename if filename else f"Văn bản pháp luật {datetime.now().strftime('%d/%m/%Y')}")

    if file_bytes and filename:
        extracted = extract_text_from_file(file_bytes, filename)
        if raw_text:
            raw_text = f"{raw_text}\n\n{extracted}"
        else:
            raw_text = extracted

    if not raw_text.strip():
        raise ValueError("Vui lòng nhập nội dung văn bản hoặc đính kèm tệp PDF/DOCX/TXT hợp lệ.")

    # 1. Tự động xác định danh mục nếu chưa có
    cat = category or "CHUNG"
    if cat == "CHUNG" or not cat:
        lower_text = (effective_title + " " + raw_text[:500]).lower()
        if any(k in lower_text for k in ["giao thông", "đường bộ", "cầu đường", "xe buýt"]):
            cat = "SO_GTVT"
        elif any(k in lower_text for k in ["môi trường", "xả thải", "khí thải", "nước thải", "đất đai"]):
            cat = "SO_TNMT"
        elif any(k in lower_text for k in ["xây dựng", "quy hoạch", "ngập úng", "thoát nước"]):
            cat = "SO_XD"
        elif any(k in lower_text for k in ["an ninh", "trật tự", "tiếng ồn", "vỉa hè", "hộ tịch"]):
            cat = "UBND_CAP_HUYEN"

    # 2. Cắt đoạn văn bản thông minh (Chunking)
    chunks = chunk_text(raw_text, chunk_size=800, overlap=120, doc_title=effective_title)
    if not chunks:
        chunks = [{
            "chunk_title": effective_title,
            "content": raw_text.strip(),
            "chunk_index": 1
        }]

    saved_records: List[RAGDoc] = []
    for chunk in chunks:
        chunk_cat = cat
        chunk_text_lower = (chunk["chunk_title"] + " " + chunk["content"][:400]).lower()
        if "so_gtvt" in chunk_text_lower or "giao thông vận tải" in chunk_text_lower or "đường bộ" in chunk["chunk_title"].lower():
            chunk_cat = "SO_GTVT"
        elif "so_tnmt" in chunk_text_lower or "tài nguyên và môi trường" in chunk_text_lower or "môi trường" in chunk["chunk_title"].lower():
            chunk_cat = "SO_TNMT"
        elif "so_xd" in chunk_text_lower or "xây dựng và thoát nước" in chunk_text_lower or "xây dựng" in chunk["chunk_title"].lower():
            chunk_cat = "SO_XD"
        elif "ubnd_cap_huyen" in chunk_text_lower or "an ninh trật tự" in chunk_text_lower or "dân sự" in chunk_text_lower:
            chunk_cat = "UBND_CAP_HUYEN"
        elif "require_human_review" in chunk_text_lower or "ngoại lệ" in chunk_text_lower:
            chunk_cat = "REQUIRE_HUMAN_REVIEW"

        new_doc = RAGDoc(
            title=chunk["chunk_title"][:255],
            category=chunk_cat,
            regulation_content=chunk["content"],
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(new_doc)
        saved_records.append(new_doc)

    db.commit()

    # 3. Làm mới bộ nhớ Gemini AI với tri thức mới
    try:
        reload_rag_knowledge(raw_text[:2000])
    except Exception as e:
        logger.warning(f"Không thể làm mới tức thì cache AI model: {e}")

    logger.info(f"✓ Đã nạp thành công '{effective_title}' vào kho RAG ({len(saved_records)} chunks) thuộc nhóm {cat}.")

    return {
        "success": True,
        "document_title": effective_title,
        "category": cat,
        "total_chunks": len(saved_records),
        "message": f"Đã bóc tách và lưu trữ thành công {len(saved_records)} đoạn quy phạm pháp luật vào CSDL.",
    }


def list_rag_docs(
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = "ALL",
    limit: int = 100,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """Lấy danh sách các tài liệu và đoạn quy phạm pháp luật trong kho RAG."""
    query = db.query(RAGDoc).filter(RAGDoc.is_active == True)

    if category and category != "ALL":
        query = query.filter(RAGDoc.category == category)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                RAGDoc.title.ilike(search_fmt),
                RAGDoc.regulation_content.ilike(search_fmt)
            )
        )

    total_count = query.count()
    records = query.order_by(RAGDoc.doc_id.desc()).offset(offset).limit(limit).all()

    results = []
    for r in records:
        results.append({
            "doc_id": r.doc_id,
            "title": r.title,
            "category": r.category,
            "regulation_content": r.regulation_content,
            "content_preview": (r.regulation_content[:180] + "...") if len(r.regulation_content) > 180 else r.regulation_content,
            "char_count": len(r.regulation_content),
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "",
        })

    return results


def delete_rag_doc(db: Session, doc_id: int) -> bool:
    """Xóa hoặc vô hiệu hóa một đoạn điều luật khỏi kho RAG."""
    doc = db.query(RAGDoc).filter(RAGDoc.doc_id == doc_id).first()
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    logger.info(f"✓ Đã xóa đoạn luật doc_id={doc_id} khỏi kho RAG.")
    return True


def search_rag_service(db: Session, query: str, top_k: int = 4, category: Optional[str] = "ALL") -> Dict[str, Any]:
    """Dịch vụ tra cứu các đoạn điều luật liên quan nhất cho đơn thư."""
    matches = search_relevant_chunks(db=db, query=query, top_k=top_k, category=category)
    return {
        "query": query,
        "count": len(matches),
        "matches": matches
    }


def retrieve_legal_context_for_prompt(
    db: Session,
    complaint_text: str,
    top_k: int = 4
) -> str:
    """
    Tìm kiếm và định dạng các điều khoản luật liên quan nhất thành văn bản
    sẵn sàng chèn trực tiếp vào Prompt của Gemini 3.5 Flash.
    """
    relevant = search_relevant_chunks(db, complaint_text, top_k=top_k)
    if not relevant:
        return (
            "- Quy định chung tỉnh Đồng Nai: Đơn thư phản ánh thuộc thẩm quyền giải quyết "
            "của Sở GTVT, Sở TNMT, Sở Xây dựng hoặc UBND các huyện/thành phố theo phân cấp quản lý nhà nước."
        )

    context_lines = []
    for idx, item in enumerate(relevant, 1):
        context_lines.append(
            f"### [Căn Cứ {idx}] {item['title']} (Lĩnh vực: {item['category']} - Điểm phù hợp: {item['relevance_score']}):\n"
            f"{item['content'].strip()}"
        )

    return "\n\n".join(context_lines)


def seed_default_rag_knowledge(db: Session, clean_existing: bool = False):
    """
    Tự động nạp tài liệu rag_knowledge.md mặc định vào SQL Server.
    Nếu clean_existing=True hoặc phát hiện dữ liệu cũ bị biến đổi ký tự '?', tự động dọn dẹp và nạp mới.
    """
    should_clean = clean_existing
    if not should_clean and db.query(RAGDoc).count() > 0:
        first_doc = db.query(RAGDoc).first()
        if first_doc and "?" in (first_doc.title or ""):
            should_clean = True
            logger.warning("Phát hiện dữ liệu RAG cũ bị lỗi font '?'. Tự động dọn dẹp để nạp lại Unicode chuẩn...")
        else:
            return

    if should_clean:
        db.query(RAGDoc).delete()
        db.commit()
        logger.info("✓ Đã dọn dẹp dữ liệu cũ trong bảng rag_docs.")

    md_path = os.path.join(DOCS_DIR, "rag_knowledge.md")
    if not os.path.exists(md_path):
        return

    try:
        with open(md_path, "r", encoding="utf-8") as f:
            content = f.read()

        logger.info("Đang tự động nạp tri thức mẫu từ docs/rag_knowledge.md vào SQL Server...")
        ingest_document(
            db=db,
            title=u"Quy Định Phân Cấp Hành Chính & Thẩm Quyền Tỉnh Đồng Nai",
            content=content,
            category=u"CHUNG"
        )
        logger.info("✓ Hoàn tất nạp tri thức pháp luật ban đầu vào SQL Server.")
    except Exception as e:
        logger.error(f"Lỗi nạp tri thức RAG mặc định: {e}")
