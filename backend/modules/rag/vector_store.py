"""
Vector Store & Retrieval Engine cho Kho Tri Thức Pháp Luật (RAG) Tỉnh Đồng Nai
Bao gồm:
1. Bóc tách tệp đa định dạng (PDF, DOCX, TXT, MD).
2. Phân đoạn văn bản thông minh (Semantic & Header Chunking).
3. Cơ chế tìm kiếm và xếp hạng độ liên quan văn bản quy phạm pháp luật (Relevance Ranking).
"""

import io
import re
import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from modules.database.models import RAGDoc

logger = logging.getLogger("RAGVectorStore")


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Bóc tách văn bản thô từ các định dạng tệp PDF, Word (.docx), Markdown hoặc Text."""
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            pages_text = [page.extract_text() or "" for page in reader.pages]
            full_text = "\n\n".join(pages_text).strip()
            if full_text:
                return full_text
            logger.warning(f"Tệp PDF {filename} không chứa text bóc tách được (có thể là ảnh quét).")
            return f"[Tệp PDF: {filename}]"
        except Exception as e:
            logger.error(f"Lỗi đọc PDF ({filename}): {e}")
            return f"[Lỗi đọc tệp PDF: {filename} - {str(e)}]"

    elif ext in [".docx", ".doc"]:
        try:
            from docx import Document
            doc = Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs).strip()
        except Exception as e:
            logger.error(f"Lỗi đọc DOCX ({filename}): {e}")
            return f"[Lỗi đọc tệp DOCX: {filename} - {str(e)}]"

    else:
        # Mặc định tệp văn bản .txt, .md
        for enc in ["utf-8", "utf-16", "cp1252", "latin-1"]:
            try:
                return file_bytes.decode(enc).strip()
            except UnicodeDecodeError:
                continue
        return file_bytes.decode("utf-8", errors="replace").strip()


def chunk_text(
    text: str,
    chunk_size: int = 800,
    overlap: int = 150,
    doc_title: str = "Văn bản quy định"
) -> List[Dict[str, Any]]:
    """
    Cắt đoạn văn bản pháp lý thông minh theo cấu trúc Điều/Khoản/Mục và kích thước trần.
    """
    if not text or not text.strip():
        return []

    chunks: List[Dict[str, Any]] = []

    # 1. Thử tách theo các đầu mục pháp lý hoặc tiêu đề Markdown (##, ###, Điều...)
    section_pattern = re.compile(r"(?=(?:^|\n)(?:#{1,4}\s+|Điều\s+\d+|Chương\s+[IVXLCDM\d]+))", re.IGNORECASE)
    raw_sections = [s.strip() for s in section_pattern.split(text) if s.strip()]

    if not raw_sections:
        raw_sections = [text.strip()]

    chunk_idx = 1
    for section in raw_sections:
        # Nếu section nhỏ hơn chunk_size, giữ nguyên làm 1 chunk
        if len(section) <= chunk_size:
            # Lấy dòng đầu tiên làm tiêu đề phụ của chunk
            first_line = section.split("\n")[0][:120].strip("# \t\r")
            title = f"{doc_title} - {first_line}" if first_line else f"{doc_title} (Phần {chunk_idx})"
            chunks.append({
                "chunk_title": title,
                "content": section,
                "chunk_index": chunk_idx,
            })
            chunk_idx += 1
        else:
            # Chia nhỏ theo cửa sổ trượt (Sliding Window) có overlap
            paragraphs = section.split("\n\n")
            current_chunk = ""
            for p in paragraphs:
                p_clean = p.strip()
                if not p_clean:
                    continue

                if len(current_chunk) + len(p_clean) + 2 <= chunk_size:
                    current_chunk += ("\n\n" + p_clean) if current_chunk else p_clean
                else:
                    if current_chunk:
                        first_line = current_chunk.split("\n")[0][:120].strip("# \t\r")
                        chunks.append({
                            "chunk_title": f"{doc_title} - {first_line} (Đoạn {chunk_idx})",
                            "content": current_chunk,
                            "chunk_index": chunk_idx,
                        })
                        chunk_idx += 1
                        # Giữ lại một phần overlap
                        current_chunk = current_chunk[-overlap:] + "\n\n" + p_clean
                    else:
                        # Đoạn văn bản đơn lẻ quá dài, cắt cứng theo ký tự
                        for i in range(0, len(p_clean), chunk_size - overlap):
                            sub_text = p_clean[i : i + chunk_size]
                            chunks.append({
                                "chunk_title": f"{doc_title} (Đoạn {chunk_idx})",
                                "content": sub_text,
                                "chunk_index": chunk_idx,
                            })
                            chunk_idx += 1
                        current_chunk = ""

            if current_chunk.strip():
                first_line = current_chunk.split("\n")[0][:120].strip("# \t\r")
                chunks.append({
                    "chunk_title": f"{doc_title} - {first_line} (Đoạn {chunk_idx})",
                    "content": current_chunk,
                    "chunk_index": chunk_idx,
                })
                chunk_idx += 1

    return chunks


def search_relevant_chunks(
    db: Session,
    query: str,
    top_k: int = 4,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Tìm kiếm và xếp hạng các đoạn văn bản luật liên quan nhất từ bảng rag_docs.
    Áp dụng trọng số từ khóa pháp lý, từ đồng nghĩa và độ khớp trực tiếp.
    """
    if not query or not query.strip():
        return []

    # 1. Truy vấn các văn bản đang kích hoạt trong CSDL SQL Server
    db_query = db.query(RAGDoc).filter(RAGDoc.is_active == True)
    if category and category != "ALL":
        db_query = db_query.filter(RAGDoc.category == category)

    docs = db_query.all()
    if not docs:
        return []

    query_lower = query.lower()

    # 2. Xây dựng bộ từ khóa đặc trưng theo từng lĩnh vực pháp lý tỉnh Đồng Nai
    domain_keywords = {
        "SO_GTVT": [
            "giao thông", "đường", "hạ tầng", "ổ gà", "sụt lún", "kẹt xe", "ùn tắc", 
            "đèn tín hiệu", "biển báo", "tai nạn", "xe buýt", "xe khách", "cầu", 
            "quốc lộ", "đường tỉnh", "nguyễn ái quốc", "tân phong", "biên hòa"
        ],
        "SO_TNMT": [
            "môi trường", "xả thải", "nước thải", "khí thải", "mùi hôi", "hôi thối", 
            "ô nhiễm", "kênh rạch", "sông đồng nai", "rác thải", "bãi rác", "khoáng sản", 
            "hút cát", "bơm cát", "đất đai", "phân lô", "nông nghiệp", "kcn", "amata"
        ],
        "SO_XD": [
            "xây dựng", "giấy phép", "không phép", "sai phép", "chỉ giới", "cốt", 
            "ngập úng", "thoát nước", "cống", "thi công", "đào móng", "nứt tường", 
            "sập nhà", "công trình", "quy hoạch đô thị", "khu dân cư"
        ],
        "UBND_CAP_HUYEN": [
            "an ninh", "trật tự", "khu dân cư", "khu phố", "tiếng ồn", "karaoke", 
            "loa kẹo kéo", "22h", "đêm", "vỉa hè", "lòng đường", "buôn bán", 
            "hàng rong", "lấn chiếm", "mâu thuẫn", "tranh chấp", "hộ tịch", "xã", "phường"
        ],
    }

    # Bóc tách các từ khóa trong câu hỏi
    words = [w for w in re.split(r"[\s,.;:!?()]+", query_lower) if len(w) >= 2]

    scored_docs: List[Tuple[float, RAGDoc]] = []

    for doc in docs:
        content_lower = (doc.regulation_content or "").lower()
        title_lower = (doc.title or "").lower()
        doc_category = doc.category or ""

        score = 0.0

        # Khớp nguyên cụm từ (Exact phrase matching) -> Điểm rất cao
        for phrase_len in range(4, 1, -1):
            for i in range(len(words) - phrase_len + 1):
                phrase = " ".join(words[i : i + phrase_len])
                if phrase in content_lower:
                    score += 5.0 * phrase_len
                if phrase in title_lower:
                    score += 8.0 * phrase_len

        # Khớp từng từ khóa đơn lẻ
        for word in words:
            if word in title_lower:
                score += 3.0
            if word in content_lower:
                score += 1.0

        # Cộng điểm liên kết lĩnh vực nếu khớp từ khóa chuyên ngành
        if doc_category in domain_keywords:
            for kw in domain_keywords[doc_category]:
                if kw in query_lower:
                    if kw in content_lower or kw in title_lower:
                        score += 4.0
                    else:
                        score += 1.5

        if score > 0:
            scored_docs.append((score, doc))

    # Sắp xếp giảm dần theo điểm số
    scored_docs.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, doc in scored_docs[:top_k]:
        results.append({
            "doc_id": doc.doc_id,
            "title": doc.title,
            "category": doc.category,
            "content": doc.regulation_content,
            "relevance_score": round(score, 2),
        })

    return results

