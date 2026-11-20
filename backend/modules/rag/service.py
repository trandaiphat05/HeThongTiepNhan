"""
Service Layer cho Module Kho Tri Thức Pháp Luật (RAG)
Quản lý nạp dữ liệu, phân mảnh và cung cấp ngữ cảnh căn cứ pháp lý cho Gemini AI.
"""

import os
import re
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

SIMILARITY_THRESHOLD = 0.65
NO_LEGAL_DOC_MESSAGE = "Chưa tìm thấy căn cứ pháp lý trong kho dữ liệu - Cán bộ thụ lý cần bổ sung"


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

    # Tự động xác định danh mục nếu chưa có
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

    # Cắt đoạn văn bản (Chunking)
    chunks = chunk_text(raw_text, chunk_size=800, overlap=120, doc_title=effective_title)
    if not chunks:
        chunks = [{
            "chunk_title": effective_title,
            "content": raw_text.strip(),
            "chunk_index": 1
        }]

    saved_records: List[RAGDoc] = []
    for chunk in chunks:
        # Bỏ qua các đoạn rỗng hoặc quá ngắn không có nội dung
        body_text = chunk.get("content", "").strip()
        if len(body_text) < 25:
            continue

        # 1. Kế thừa danh mục từ mục cha hoặc chunk_text
        chunk_cat = chunk.get("category")
        if not chunk_cat or chunk_cat == "CHUNG":
            chunk_cat = cat

        chunk_text_lower = (chunk["chunk_title"] + " " + body_text[:400]).lower()
        if chunk_cat == "CHUNG" or not chunk_cat:
            if any(k in chunk_text_lower for k in ["so_gtvt", "giao thông vận tải", "cầu đường", "ổ gà", "sụt lún", "đèn tín hiệu"]):
                chunk_cat = "SO_GTVT"
            elif any(k in chunk_text_lower for k in ["so_tnmt", "tài nguyên và môi trường", "xả thải", "khí thải", "nước thải", "sổ đỏ"]):
                chunk_cat = "SO_TNMT"
            elif any(k in chunk_text_lower for k in ["so_xd", "so_xaydung", "xây dựng", "quy hoạch đô thị", "trật tự xây dựng"]):
                chunk_cat = "SO_XD"
            elif any(k in chunk_text_lower for k in ["so_yte", "so_yt", "y tế", "khám chữa bệnh", "an toàn thực phẩm", "ngộ độc", "bệnh viện"]):
                chunk_cat = "SO_YTE"
            elif any(k in chunk_text_lower for k in ["so_gddt", "giáo dục", "đào tạo", "trường học", "học phí", "lạm thu", "bạo lực học đường"]):
                chunk_cat = "SO_GDDT"
            elif any(k in chunk_text_lower for k in ["so_ldtbxh", "lao động", "tiền lương", "nợ lương", "bảo hiểm xã hội", "bhxh", "thương binh"]):
                chunk_cat = "SO_LDTBXH"
            elif any(k in chunk_text_lower for k in ["cong_an_tinh", "công an", "an ninh trật tự", "đua xe", "trộm cắp", "pccc", "căn cước"]):
                chunk_cat = "CONG_AN_TINH"
            elif any(k in chunk_text_lower for k in ["ubnd_cap_huyen", "tiếp công dân", "ban tiếp công dân", "quầy tiếp dân", "hộ tịch", "tiếng ồn", "karaoke"]):
                chunk_cat = "UBND_CAP_HUYEN"
            elif any(k in chunk_text_lower for k in ["require_human_review", "ngoại lệ", "thẩm tra thủ công"]):
                chunk_cat = "REQUIRE_HUMAN_REVIEW"
            else:
                chunk_cat = "CHUNG"

        # Chuẩn hóa mã cơ quan thống nhất
        if chunk_cat == "SO_XAYDUNG":
            chunk_cat = "SO_XD"
        elif chunk_cat == "SO_YT":
            chunk_cat = "SO_YTE"

        # Làm sạch tiêu đề: loại bỏ các chuỗi mã code trong ngoặc như ('SO_XD'), ('SO_TNMT'), (UBND_CAP_HUYEN)
        clean_title = chunk["chunk_title"]
        clean_title = re.sub(r"""\s*\(['"]?([A-Z_]{2,35})['"]?\)""", "", clean_title)
        clean_title = re.sub(r"^#+\s*", "", clean_title).strip()

        new_doc = RAGDoc(
            title=clean_title[:255],
            category=chunk_cat,
            regulation_content=body_text,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(new_doc)
        saved_records.append(new_doc)

    db.commit()

    # Làm mới bộ nhớ Gemini AI với tri thức mới
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
        target_cats = [category]
        if category in ("SO_XD", "SO_XAYDUNG"):
            target_cats = ["SO_XD", "SO_XAYDUNG"]
        elif category in ("BO_PHAN_MOT_CUA", "MOT_CUA"):
            target_cats = ["BO_PHAN_MOT_CUA", "MOT_CUA"]
        elif category in ("UBND_CAP_HUYEN", "UBND_HUYEN"):
            target_cats = ["UBND_CAP_HUYEN", "UBND_HUYEN"]
        query = query.filter(RAGDoc.category.in_(target_cats))

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                RAGDoc.title.ilike(search_fmt),
                RAGDoc.regulation_content.ilike(search_fmt)
            )
        )

    records = query.order_by(RAGDoc.doc_id.asc()).offset(offset).limit(limit).all()

    results = []
    for r in records:
        # Chuẩn hóa title hiển thị: xóa mã code thô trong ngoặc
        disp_title = re.sub(r"""\s*\(['"]?([A-Z_]{2,35})['"]?\)""", "", r.title or "")
        disp_title = re.sub(r"^#+\s*", "", disp_title).strip()
        disp_title = re.sub(r"^Quy Định Phân Cấp Hành Chính & Thẩm Quyền Tỉnh Đồng Nai\s*-\s*", "", disp_title).strip()

        content_val = r.regulation_content or ""
        results.append({
            "doc_id": r.doc_id,
            "id": r.doc_id,
            "title": disp_title or r.title,
            "category": r.category,
            "content": content_val,
            "regulation_content": content_val,
            "content_preview": (content_val[:180] + "...") if len(content_val) > 180 else content_val,
            "char_count": len(content_val),
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
    Chỉ lấy tài liệu có điểm phù hợp >= SIMILARITY_THRESHOLD (0.65).
    Nếu không có tài liệu nào đạt ngưỡng, cấm bịa đặt và trả về NO_LEGAL_DOC_MESSAGE.
    """
    relevant = search_relevant_chunks(db, complaint_text, top_k=top_k)
    high_match = [item for item in relevant if item.get("relevance_score", 0.0) >= SIMILARITY_THRESHOLD]
    if not high_match:
        return NO_LEGAL_DOC_MESSAGE

    context_lines = []
    for idx, item in enumerate(high_match, 1):
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
    from sqlalchemy import func
    should_clean = clean_existing
    if not should_clean and db.query(RAGDoc).count() > 0:
        first_doc = db.query(RAGDoc).first()
        has_question = first_doc and "?" in (first_doc.title or "")
        has_yte = db.query(RAGDoc).filter(RAGDoc.category == "SO_YTE").count() > 0
        has_mot_cua = db.query(RAGDoc).filter(RAGDoc.category == "BO_PHAN_MOT_CUA").count() > 0
        has_empty = False
        try:
            has_empty = db.query(RAGDoc).filter(func.len(RAGDoc.regulation_content) < 70).count() > 0
        except Exception:
            try:
                has_empty = db.query(RAGDoc).filter(func.length(RAGDoc.regulation_content) < 70).count() > 0
            except Exception:
                has_empty = False
        
        if has_question or not has_yte or not has_mot_cua or has_empty:
            should_clean = True
            logger.info("Phát hiện kho RAG cũ chưa đủ các Sở/Ngành hoặc có đoạn rỗng/lỗi font. Tự động đồng bộ lại...")
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
