"""
API Router cho Module Kho Tri Thức Pháp Luật RAG (Đồng Nai)
Cung cấp API nạp tài liệu (PDF/DOCX/TXT), tra cứu danh mục và xóa điều luật.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from modules.rag.service import (
    ingest_document,
    list_rag_docs,
    delete_rag_doc,
    search_rag_service,
)

router = APIRouter(tags=["Kho Tri Thức Pháp Luật RAG"])


class SearchRequest(BaseModel):
    query: str = Field(..., description="Nội dung câu hỏi hoặc phản ánh cần tra cứu luật")
    category: Optional[str] = Field("ALL", description="Lĩnh vực lọc: SO_GTVT, SO_TNMT, SO_XD, UBND_CAP_HUYEN, ALL")
    top_k: Optional[int] = Field(4, description="Số lượng căn cứ liên quan cần lấy")


# 1. NẠP VĂN BẢN QUY PHẠM PHÁP LUẬT (POST /api/rag/ingest)
@router.post("/api/rag/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_legal_document(
    title: Optional[str] = Form(None),
    category: Optional[str] = Form("CHUNG"),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Nạp văn bản quy phạm pháp luật vào hệ thống.
    Hỗ trợ tệp đính kèm (PDF, DOCX, TXT, MD) hoặc văn bản nhập trực tiếp.
    Hệ thống tự động cắt đoạn (chunking) và lưu vào SQL Server.
    """
    file_bytes = None
    filename = None
    if file and file.filename:
        filename = file.filename
        file_bytes = await file.read()

    try:
        result = ingest_document(
            db=db,
            title=title or (filename if filename else "Văn bản pháp luật mới"),
            content=content,
            file_bytes=file_bytes,
            filename=filename,
            category=category or "CHUNG"
        )
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý nạp tài liệu: {str(e)}")


# 2. ALIAS CHO POST /api/admin/rag (Tương thích ngược)
@router.post("/api/admin/rag", status_code=status.HTTP_201_CREATED)
async def admin_rag_alias(
    title: Optional[str] = Form(None),
    category: Optional[str] = Form("CHUNG"),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    return await ingest_legal_document(title, category, content, file, db)


# 3. DANH SÁCH CÁC ĐOẠN LUẬT TRONG KHO (GET /api/rag/docs)
@router.get("/api/rag/docs")
def get_rag_documents(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query("ALL"),
    limit: Optional[int] = Query(100),
    offset: Optional[int] = Query(0),
    db: Session = Depends(get_db)
):
    """Lấy danh sách các tài liệu và đoạn quy phạm pháp luật đã được nạp."""
    return list_rag_docs(
        db=db,
        search=search,
        category=category,
        limit=limit,
        offset=offset
    )


# 4. XÓA ĐOẠN LUẬT (DELETE /api/rag/docs/{doc_id})
@router.delete("/api/rag/docs/{doc_id}")
def remove_rag_doc(doc_id: int, db: Session = Depends(get_db)):
    """Xóa một đoạn điều luật khỏi kho RAG."""
    success = delete_rag_doc(db, doc_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy đoạn luật với ID {doc_id}")
    return {"success": True, "message": f"Đã xóa thành công đoạn điều luật ID {doc_id}"}


# 5. TEST TÌM KIẾM CĂN CỨ LUẬT THEO NỘI DUNG (POST /api/rag/search)
@router.post("/api/rag/search")
def search_rag_knowledge(req: SearchRequest, db: Session = Depends(get_db)):
    """Thử nghiệm tìm kiếm các đoạn luật phù hợp với nội dung đơn thư."""
    return search_rag_service(
        db=db,
        query=req.query,
        top_k=req.top_k,
        category=req.category
    )

