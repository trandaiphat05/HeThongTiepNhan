"""
Service Layer cho Module Đơn thư (Tickets)
Kiến trúc Clean Architecture: Tập trung toàn bộ Business Logic, ORM Query và Tích hợp AI/Email.
"""

import os
import json
import uuid
import random
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, BackgroundTasks, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from core.database import SessionLocal
from core.config import UPLOAD_DIR
from modules.tickets.models import Ticket, AIResult, Department
from modules.tickets.schemas import ApprovalRequest, TransferRequest, DispatchRequest, ReassignRequest
from modules.ai_engine import process_civic_complaint

logger = logging.getLogger("TicketService")

DEPT_NAMES = {
    "SO_GTVT": "Sở Giao thông Vận tải",
    "SO_TNMT": "Sở Tài nguyên & Môi trường",
    "SO_XD": "Sở Xây dựng",
    "SO_XAYDUNG": "Sở Xây dựng",
    "SO_YTE": "Sở Y tế",
    "SO_YT": "Sở Y tế",
    "SO_GDDT": "Sở Giáo dục và Đào tạo",
    "SO_LDTBXH": "Sở Lao động - Thương binh và Xã hội",
    "CONG_AN_TINH": "Công an Tỉnh Đồng Nai",
    "UBND_CAP_HUYEN": "UBND Cấp Huyện / TP",
    "UBND_TINH": "UBND Tỉnh Đồng Nai",
    "REQUIRE_HUMAN_REVIEW": "Cần Admin Phân Luồng"
}

dept_header_map = {
    "SO_GTVT": ("SỞ GIAO THÔNG VẬN TẢI TỈNH ĐỒNG NAI", "Số: .../TB-SGTVT"),
    "SO_TNMT": ("SỞ TÀI NGUYÊN VÀ MÔI TRƯỜNG TỈNH ĐỒNG NAI", "Số: .../TB-STNMT"),
    "SO_XD": ("SỞ XÂY DỰNG TỈNH ĐỒNG NAI", "Số: .../TB-SXD"),
    "SO_XAYDUNG": ("SỞ XÂY DỰNG TỈNH ĐỒNG NAI", "Số: .../TB-SXD"),
    "SO_YTE": ("SỞ Y TẾ TỈNH ĐỒNG NAI", "Số: .../TB-SYT"),
    "SO_YT": ("SỞ Y TẾ TỈNH ĐỒNG NAI", "Số: .../TB-SYT"),
    "SO_GDDT": ("SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG NAI", "Số: .../TB-SGDDT"),
    "SO_LDTBXH": ("SỞ LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI TỈNH ĐỒNG NAI", "Số: .../TB-SLDTBXH"),
    "CONG_AN_TINH": ("CÔNG AN TỈNH ĐỒNG NAI", "Số: .../TB-CAT"),
    "UBND_TINH": ("ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI", "Số: .../TB-UBND"),
    "UBND_CAP_HUYEN": ("ỦY BAN NHÂN DÂN CẤP HUYỆN / TP", "Số: .../TB-UBND"),
    "REQUIRE_HUMAN_REVIEW": ("TỔ TIẾP NHẬN & ĐIỀU PHỐI ĐƠN THƯ TỈNH ĐỒNG NAI", "Số: .../TB-TĐP")
}

all_default_depts = [
    Department(dept_code="SO_GTVT", dept_name="Sở Giao thông Vận tải", email_contact="sgtvt@dongnai.gov.vn"),
    Department(dept_code="SO_TNMT", dept_name="Sở Tài nguyên & Môi trường", email_contact="stnmt@dongnai.gov.vn"),
    Department(dept_code="SO_XD", dept_name="Sở Xây dựng", email_contact="sxd@dongnai.gov.vn"),
    Department(dept_code="SO_XAYDUNG", dept_name="Sở Xây dựng", email_contact="sxd@dongnai.gov.vn"),
    Department(dept_code="SO_YTE", dept_name="Sở Y tế", email_contact="syte@dongnai.gov.vn"),
    Department(dept_code="SO_GDDT", dept_name="Sở Giáo dục và Đào tạo", email_contact="sgddt@dongnai.gov.vn"),
    Department(dept_code="SO_LDTBXH", dept_name="Sở Lao động - Thương binh và Xã hội", email_contact="sldtbxh@dongnai.gov.vn"),
    Department(dept_code="CONG_AN_TINH", dept_name="Công an Tỉnh Đồng Nai", email_contact="congan@dongnai.gov.vn"),
    Department(dept_code="UBND_CAP_HUYEN", dept_name="UBND Cấp Huyện / TP", email_contact="ubnd.bienhoa@dongnai.gov.vn"),
    Department(dept_code="UBND_TINH", dept_name="UBND Tỉnh Đồng Nai", email_contact="ubnd@dongnai.gov.vn"),
    Department(dept_code="REQUIRE_HUMAN_REVIEW", dept_name="Cần Admin Phân Luồng", email_contact="admin.donthu@dongnai.gov.vn"),
]


def format_administrative_draft(
    dept_code: str,
    citizen_name: str,
    summary: str,
    legal_basis: str,
    core_reply: str,
    tracking_code: str = ""
) -> str:
    """Định dạng văn bản dự thảo theo đúng thể thức hành chính Việt Nam (Nghị định 30/2020/NĐ-CP)."""
    org_title, doc_number = dept_header_map.get(dept_code, ("ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI", "Số: .../TB-UBND"))
    today = datetime.now()
    
    # Nếu core_reply đã có tiêu ngữ thì giữ nguyên
    if core_reply and "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" in core_reply:
        return core_reply

    return (
        f"CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n"
        f"Độc lập - Tự do - Hạnh phúc\n"
        f"-------------------------------\n\n"
        f"{org_title}\n"
        f"{doc_number}                               Đồng Nai, ngày {today.day:02d} tháng {today.month:02d} năm {today.year}\n\n"
        f"THÔNG BÁO\n"
        f"V/v trả lời phản ánh, kiến nghị của công dân {citizen_name or '...'}\n"
        f"(Mã hồ sơ: {tracking_code or '...'})\n\n"
        f"Kính gửi: Ông/Bà {citizen_name or 'Quý công dân'},\n\n"
        f"- Căn cứ pháp lý: {legal_basis or 'Luật Khiếu nại 2011, Luật Tiếp công dân 2013 và các quy định pháp luật chuyên ngành'};\n"
        f"- Xét nội dung phản ánh: \"{summary or 'Đơn thư phản ánh hiện trường'}\".\n\n"
        f"{org_title} có ý kiến trả lời/hướng dẫn xử lý chi tiết như sau:\n\n"
        f"{core_reply.strip() if core_reply else 'Hồ sơ đã được tiếp nhận và giao cơ quan chuyên môn xác minh giải quyết.'}\n\n"
        f"Nơi nhận:\n"
        f"- Công dân {citizen_name or 'gửi đơn'} (để biết);\n"
        f"- Ban Giám đốc Sở;\n"
        f"- Lưu: VT, Tổ xử lý đơn thư."
    )


def format_ticket_detail(t: Ticket) -> Dict[str, Any]:
    """Chuyển đổi ORM Ticket sang dictionary chuẩn hóa."""
    ai_data = None
    if t.ai_result:
        entities = {}
        try:
            entities = json.loads(t.ai_result.entities_json)
        except Exception:
            entities = {"locations": [], "issues": []}

        ai_data = {
            "extracted_text": t.ai_result.extracted_text,
            "summary": t.ai_result.summary,
            "department_code": t.ai_result.department_code,
            "priority": t.ai_result.priority,
            "entities": entities,
            "legal_basis": t.ai_result.legal_basis,
            "draft_reply": t.ai_result.draft_reply,
            "confidence_score": t.ai_result.confidence_score
        }

    img_list = t.get_image_urls_list() if hasattr(t, "get_image_urls_list") else []
    if not img_list and t.image_url:
        img_list = [t.image_url]
    primary_img = img_list[0] if img_list else (t.image_url or None)

    return {
        "ticket_id": t.ticket_id,
        "ticket_code": t.tracking_code,
        "tracking_code": t.tracking_code,
        "source": t.source,
        "citizen_name": t.citizen_name,
        "citizen_phone": t.citizen_phone,
        "citizen_email": t.citizen_email,
        "raw_text": t.raw_text,
        "image_url": primary_img,
        "image_urls": img_list,
        "status": t.status,
        "dept_code": t.dept_code,
        "department_code": t.dept_code,
        "dept_name": t.dept_name,
        "priority": t.priority,
        "admin_note": t.admin_note,
        "rejection_reason": t.rejection_reason,
        "created_at": t.created_at.strftime("%Y-%m-%d %H:%M:%S") if t.created_at else "",
        "ai_result": ai_data
    }


def process_ticket_background(ticket_id: int, raw_text: str, image_paths: Optional[Any] = None):
    """
    Tiến trình chạy ngầm: gọi Gemini AI bóc tách thực thể, OCR nhiều ảnh,
    tự động phân tích ngữ cảnh, ghép nối logic đa trang và định tuyến kết hợp RAG.
    Đảm bảo thời gian phản hồi HTTP dưới 500ms cho người dùng.
    """
    paths_list = []
    if isinstance(image_paths, list):
        paths_list = [p for p in image_paths if p]
    elif isinstance(image_paths, str) and image_paths.strip():
        paths_list = [image_paths.strip()]

    logger.info(f"Bắt đầu xử lý AI ngầm cho ticket_id={ticket_id} với {len(paths_list)} ảnh đính kèm.")
    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
        if not ticket:
            logger.warning(f"Không tìm thấy ticket_id={ticket_id} để xử lý ngầm")
            return

        image_parts = []
        for img_item in paths_list:
            # Trường hợp 1: Đã là đối tượng PIL Image trong RAM
            if hasattr(img_item, "size") and (hasattr(img_item, "load") or hasattr(img_item, "copy")):
                image_parts.append(img_item)
            # Trường hợp 2: Là chuỗi đường dẫn tệp file trên đĩa
            elif isinstance(img_item, str) and img_item and os.path.exists(img_item):
                try:
                    from PIL import Image
                    img = Image.open(img_item)
                    img.load()
                    image_parts.append(img)
                except Exception as img_err:
                    logger.warning(f"Lỗi mở ảnh bằng PIL ({img_item}): {img_err}. Thử nạp Part byte...")
                    try:
                        ext = os.path.splitext(img_item)[1].lower()
                        mime = "image/png" if ext == ".png" else ("image/webp" if ext == ".webp" else "image/jpeg")
                        with open(img_item, "rb") as f:
                            img_data = f.read()
                        image_parts.append({
                            "mime_type": mime,
                            "data": img_data
                        })
                    except Exception as e_raw:
                        logger.error(f"Lỗi đọc file ảnh {img_item}: {e_raw}")

        logger.info(f"Đã chuẩn bị {len(image_parts)} ảnh cho đơn {ticket.tracking_code}. Bắt đầu nạp vào Gemini 1.5 Flash...")

        # Gọi AI Engine tích hợp RAG động từ SQL Server
        ai_res_dict = process_civic_complaint(
            user_text=raw_text or "Đơn thư viết tay gửi qua hình ảnh",
            image_bytes_or_part=image_parts if image_parts else None,
            db=db
        )

        routed_dept = ai_res_dict.get("department_code", "REQUIRE_HUMAN_REVIEW")
        status_val = "HUMAN_REVIEW" if routed_dept == "REQUIRE_HUMAN_REVIEW" else "ROUTED"

        # Cập nhật thông tin hồ sơ
        ticket.status = status_val
        ticket.dept_code = routed_dept
        ticket.dept_name = DEPT_NAMES.get(routed_dept, routed_dept)
        ticket.priority = ai_res_dict.get("priority", "TRUNG_BINH")

        # Lưu bản ghi kết quả AI
        entities = ai_res_dict.get("entities", {"locations": [], "issues": []})
        entities_json_str = json.dumps(entities, ensure_ascii=False) if isinstance(entities, dict) else "{}"

        raw_draft = ai_res_dict.get("draft_reply", "") or ai_res_dict.get("draft_response", "")
        formatted_draft = format_administrative_draft(
            dept_code=routed_dept,
            citizen_name=ticket.citizen_name or "Quý công dân",
            summary=ai_res_dict.get("summary", ""),
            legal_basis=ai_res_dict.get("legal_basis", ""),
            core_reply=raw_draft,
            tracking_code=ticket.tracking_code
        )

        existing_ai = db.query(AIResult).filter(AIResult.ticket_id == ticket_id).first()
        if existing_ai:
            existing_ai.extracted_text = ai_res_dict.get("extracted_text", raw_text)
            existing_ai.summary = ai_res_dict.get("summary", "")
            existing_ai.department_code = routed_dept
            existing_ai.priority = ticket.priority
            existing_ai.entities_json = entities_json_str
            existing_ai.legal_basis = ai_res_dict.get("legal_basis", "")
            existing_ai.draft_reply = formatted_draft
            existing_ai.confidence_score = float(ai_res_dict.get("confidence_score", 0.0))
        else:
            ai_record = AIResult(
                ticket_id=ticket_id,
                extracted_text=ai_res_dict.get("extracted_text", raw_text),
                summary=ai_res_dict.get("summary", ""),
                department_code=routed_dept,
                priority=ticket.priority,
                entities_json=entities_json_str,
                legal_basis=ai_res_dict.get("legal_basis", ""),
                draft_reply=formatted_draft,
                confidence_score=float(ai_res_dict.get("confidence_score", 0.0))
            )
            db.add(ai_record)

        db.commit()
        print(f"\033[96m[SQL SERVER]\033[0m Transaction commit thành công vào bảng tickets & ai_results cho đơn {ticket.tracking_code}.", flush=True)
        logger.info(f"✓ Hoàn tất xử lý AI background cho đơn {ticket.tracking_code} -> {routed_dept}")
    except Exception as e:
        logger.error(f"Lỗi trong BackgroundTask ticket {ticket_id}: {e}")
        db.rollback()
    finally:
        db.close()


async def submit_ticket_service(
    db: Session,
    background_tasks: Optional[BackgroundTasks] = None,
    raw_text: Optional[str] = None,
    citizen_name: Optional[str] = None,
    citizen_phone: Optional[str] = None,
    citizen_email: Optional[str] = None,
    source: Optional[str] = "WEB_TEXT",
    user_id: Optional[int] = None,
    images: Optional[List[UploadFile]] = None,
    image: Optional[UploadFile] = None
) -> Dict[str, Any]:
    """Tiếp nhận đơn thư (hỗ trợ nhiều ảnh đính kèm), tạo mã tracking và phân việc ngầm cho AI Engine."""
    upload_list = []
    if images:
        upload_list.extend([img for img in images if img and img.filename])
    if image and image.filename and image not in upload_list:
        upload_list.append(image)

    if not raw_text and not upload_list:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp nội dung phản ánh hoặc ít nhất 1 hình ảnh đơn thư.")

    today_str = datetime.now().strftime("%Y%m%d")
    random_suffix = f"{random.randint(1000, 9999)}"
    tracking_code = f"ĐN-{today_str}-{random_suffix}"

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_image_urls = []
    in_memory_images = []

    for idx, img_file in enumerate(upload_list):
        clean_filename = os.path.basename(img_file.filename)
        filename = f"{tracking_code}_p{idx+1}_{clean_filename}"
        saved_path = os.path.abspath(os.path.join(UPLOAD_DIR, filename))
        content = await img_file.read()

        # Nén trực tiếp trong RAM bằng io.BytesIO (resize max 1600px, quality 80)
        try:
            from PIL import Image
            import io
            pil_img = Image.open(io.BytesIO(content)).convert("RGB")
            pil_img.thumbnail((1600, 1600))
            out_buf = io.BytesIO()
            pil_img.save(out_buf, format="JPEG", quality=80, optimize=True)
            compressed_bytes = out_buf.getvalue()
            with open(saved_path, "wb") as f:
                f.write(compressed_bytes)
            out_buf.seek(0)
            in_memory_images.append(Image.open(out_buf))
        except Exception as e:
            with open(saved_path, "wb") as f:
                f.write(content)
            in_memory_images.append(saved_path)

        saved_image_urls.append(f"/uploads/{filename}")

    primary_image_url = saved_image_urls[0] if saved_image_urls else None
    image_urls_json = json.dumps(saved_image_urls, ensure_ascii=False) if saved_image_urls else None

    logger.info(f"Tiếp nhận đơn {tracking_code}: Đã nén RAM và lưu {len(saved_image_urls)} file ảnh vào uploads.")
    print(f"\033[94m[INCOMING]\033[0m Nhận hồ sơ: {tracking_code} | Số lượng ảnh: {len(saved_image_urls)} | Nguồn: {source or 'WEB'}", flush=True)

    # Phân tích AI đa phương thức kết hợp RAG ngay trong request
    ai_res_dict = None
    try:
        ai_res_dict = process_civic_complaint(
            user_text=raw_text or "Đơn phản ánh trực tuyến của công dân qua hình ảnh",
            image_bytes_or_part=in_memory_images if in_memory_images else None,
            db=db
        )
    except Exception as ai_err:
        logger.error(f"Lỗi khi gọi process_civic_complaint cho đơn {tracking_code}: {ai_err}")
        from modules.ai_engine.ai_service import classify_complaint_fallback
        ai_res_dict = classify_complaint_fallback(raw_text or "")

    routed_dept = ai_res_dict.get("department_code", "REQUIRE_HUMAN_REVIEW") if ai_res_dict else "REQUIRE_HUMAN_REVIEW"
    status_val = "HUMAN_REVIEW" if routed_dept == "REQUIRE_HUMAN_REVIEW" else "ROUTED"
    priority_val = ai_res_dict.get("priority", "TRUNG_BINH") if ai_res_dict else "TRUNG_BINH"
    dept_name_val = DEPT_NAMES.get(routed_dept, routed_dept)
    summary_val = ai_res_dict.get("summary", "") if ai_res_dict else (raw_text[:120] if raw_text else "Đơn phản ánh trực tuyến của công dân")

    new_ticket = Ticket(
        tracking_code=tracking_code,
        source=source or ("WEB_IMAGE" if saved_image_urls else "WEB_TEXT"),
        user_id=user_id,
        citizen_name=citizen_name or "Công dân",
        citizen_phone=citizen_phone,
        citizen_email=citizen_email,
        raw_text=raw_text or "Đơn phản ánh trực tuyến của công dân",
        image_url=primary_image_url,
        image_urls=image_urls_json,
        status=status_val,
        dept_code=routed_dept,
        dept_name=dept_name_val,
        priority=priority_val
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    # Lưu AIResult vào DB
    raw_draft = (ai_res_dict.get("draft_reply", "") or ai_res_dict.get("draft_response", "")) if ai_res_dict else ""
    formatted_draft = format_administrative_draft(
        dept_code=routed_dept,
        citizen_name=new_ticket.citizen_name or "Quý công dân",
        summary=summary_val,
        legal_basis=ai_res_dict.get("legal_basis", "") if ai_res_dict else "",
        core_reply=raw_draft,
        tracking_code=new_ticket.tracking_code
    )
    entities = ai_res_dict.get("entities", {"locations": [], "issues": []}) if ai_res_dict else {"locations": [], "issues": []}
    entities_json_str = json.dumps(entities, ensure_ascii=False) if isinstance(entities, dict) else "{}"

    ai_record = AIResult(
        ticket_id=new_ticket.ticket_id,
        extracted_text=ai_res_dict.get("extracted_text", raw_text or "") if ai_res_dict else (raw_text or ""),
        summary=summary_val,
        department_code=routed_dept,
        priority=priority_val,
        entities_json=entities_json_str,
        legal_basis=ai_res_dict.get("legal_basis", "") if ai_res_dict else "",
        draft_reply=formatted_draft,
        confidence_score=float(ai_res_dict.get("confidence_score", 0.0)) if ai_res_dict else 0.0
    )
    db.add(ai_record)
    db.commit()
    db.refresh(new_ticket)

    ai_data = {
        "extracted_text": ai_record.extracted_text,
        "summary": ai_record.summary,
        "department_code": ai_record.department_code,
        "dept_code": ai_record.department_code,
        "priority": ai_record.priority,
        "entities": entities,
        "legal_basis": ai_record.legal_basis,
        "draft_reply": ai_record.draft_reply,
        "confidence_score": ai_record.confidence_score
    }

    formatted_time = new_ticket.created_at.strftime("%d/%m/%Y %H:%M:%S") if new_ticket.created_at else datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    return {
        "success": True,
        "ticket_id": new_ticket.ticket_id,
        "ticket_code": tracking_code,
        "tracking_code": tracking_code,
        "created_at": formatted_time,
        "total_images": len(saved_image_urls),
        "image_urls": saved_image_urls,
        "status": "Đã tiếp nhận - Chờ xử lý" if new_ticket.status == "ROUTED" else "Chờ phân luồng",
        "status_code": new_ticket.status,
        "dept_code": new_ticket.dept_code,
        "department_code": new_ticket.dept_code,
        "dept_name": new_ticket.dept_name,
        "department_name": new_ticket.dept_name,
        "priority": new_ticket.priority,
        "summary": summary_val,
        "ai_result": ai_data,
        "message": f"Đã tiếp nhận và phân tích hồ sơ thành công vào hệ thống CSDL tỉnh Đồng Nai ({len(saved_image_urls)} ảnh)."
    }


def create_ticket_service(
    db: Session,
    raw_text: Optional[str] = None,
    citizen_name: Optional[str] = None,
    citizen_phone: Optional[str] = None,
    citizen_email: Optional[str] = None,
    source: Optional[str] = "WEB_TEXT",
    user_id: Optional[int] = None,
    images: Optional[List[Any]] = None,
    image: Optional[Any] = None,
    background_tasks: Optional[BackgroundTasks] = None
) -> Dict[str, Any]:
    """
    Hàm tạo đơn thư đồng bộ (Synchronous wrapper), hỗ trợ gọi trực tiếp trong test script
    hoặc service nội bộ mà không cần event loop hoặc tham số background_tasks.
    """
    upload_list = []
    if images:
        upload_list.extend([img for img in images if img])
    if image and image not in upload_list:
        upload_list.append(image)

    if not raw_text and not upload_list:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp nội dung phản ánh hoặc ít nhất 1 hình ảnh đơn thư.")

    today_str = datetime.now().strftime("%Y%m%d")
    random_suffix = f"{random.randint(1000, 9999)}"
    tracking_code = f"ĐN-{today_str}-{random_suffix}"

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_image_urls = []
    in_memory_images = []

    for idx, img_item in enumerate(upload_list):
        if hasattr(img_item, "filename") and hasattr(img_item, "file"):
            clean_filename = os.path.basename(img_item.filename)
            filename = f"{tracking_code}_p{idx+1}_{clean_filename}"
            saved_path = os.path.abspath(os.path.join(UPLOAD_DIR, filename))
            try:
                content = img_item.file.read()
                from PIL import Image
                import io
                pil_img = Image.open(io.BytesIO(content)).convert("RGB")
                pil_img.thumbnail((1600, 1600))
                out_buf = io.BytesIO()
                pil_img.save(out_buf, format="JPEG", quality=80, optimize=True)
                with open(saved_path, "wb") as f:
                    f.write(out_buf.getvalue())
                out_buf.seek(0)
                in_memory_images.append(Image.open(out_buf))
            except Exception:
                pass
            saved_image_urls.append(f"/uploads/{filename}")
        elif isinstance(img_item, str) and os.path.exists(img_item):
            in_memory_images.append(img_item)
            saved_image_urls.append(img_item)
        elif hasattr(img_item, "size"):
            in_memory_images.append(img_item)

    primary_image_url = saved_image_urls[0] if saved_image_urls else None
    image_urls_json = json.dumps(saved_image_urls, ensure_ascii=False) if saved_image_urls else None

    # Phân tích AI đa phương thức kết hợp RAG ngay trong request
    ai_res_dict = None
    try:
        ai_res_dict = process_civic_complaint(
            user_text=raw_text or "Đơn phản ánh trực tuyến của công dân qua hình ảnh",
            image_bytes_or_part=in_memory_images if in_memory_images else None,
            db=db
        )
    except Exception as ai_err:
        logger.error(f"Lỗi khi gọi process_civic_complaint cho đơn {tracking_code}: {ai_err}")
        from modules.ai_engine.ai_service import classify_complaint_fallback
        ai_res_dict = classify_complaint_fallback(raw_text or "")

    routed_dept = ai_res_dict.get("department_code", "REQUIRE_HUMAN_REVIEW") if ai_res_dict else "REQUIRE_HUMAN_REVIEW"
    status_val = "HUMAN_REVIEW" if routed_dept == "REQUIRE_HUMAN_REVIEW" else "ROUTED"
    priority_val = ai_res_dict.get("priority", "TRUNG_BINH") if ai_res_dict else "TRUNG_BINH"
    dept_name_val = DEPT_NAMES.get(routed_dept, routed_dept)
    summary_val = ai_res_dict.get("summary", "") if ai_res_dict else (raw_text[:120] if raw_text else "Đơn phản ánh trực tuyến của công dân")

    new_ticket = Ticket(
        tracking_code=tracking_code,
        source=source or ("WEB_IMAGE" if saved_image_urls else "WEB_TEXT"),
        user_id=user_id,
        citizen_name=citizen_name or "Công dân",
        citizen_phone=citizen_phone,
        citizen_email=citizen_email,
        raw_text=raw_text or "Đơn phản ánh trực tuyến của công dân",
        image_url=primary_image_url,
        image_urls=image_urls_json,
        status=status_val,
        dept_code=routed_dept,
        dept_name=dept_name_val,
        priority=priority_val
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    # Lưu AIResult vào DB
    raw_draft = (ai_res_dict.get("draft_reply", "") or ai_res_dict.get("draft_response", "")) if ai_res_dict else ""
    formatted_draft = format_administrative_draft(
        dept_code=routed_dept,
        citizen_name=new_ticket.citizen_name or "Quý công dân",
        summary=summary_val,
        legal_basis=ai_res_dict.get("legal_basis", "") if ai_res_dict else "",
        core_reply=raw_draft,
        tracking_code=new_ticket.tracking_code
    )
    entities = ai_res_dict.get("entities", {"locations": [], "issues": []}) if ai_res_dict else {"locations": [], "issues": []}
    entities_json_str = json.dumps(entities, ensure_ascii=False) if isinstance(entities, dict) else "{}"

    ai_record = AIResult(
        ticket_id=new_ticket.ticket_id,
        extracted_text=ai_res_dict.get("extracted_text", raw_text or "") if ai_res_dict else (raw_text or ""),
        summary=summary_val,
        department_code=routed_dept,
        priority=priority_val,
        entities_json=entities_json_str,
        legal_basis=ai_res_dict.get("legal_basis", "") if ai_res_dict else "",
        draft_reply=formatted_draft,
        confidence_score=float(ai_res_dict.get("confidence_score", 0.0)) if ai_res_dict else 0.0
    )
    db.add(ai_record)
    db.commit()
    db.refresh(new_ticket)

    ai_data = {
        "extracted_text": ai_record.extracted_text,
        "summary": ai_record.summary,
        "department_code": ai_record.department_code,
        "dept_code": ai_record.department_code,
        "priority": ai_record.priority,
        "entities": entities,
        "legal_basis": ai_record.legal_basis,
        "draft_reply": ai_record.draft_reply,
        "confidence_score": ai_record.confidence_score
    }

    formatted_time = new_ticket.created_at.strftime("%d/%m/%Y %H:%M:%S") if new_ticket.created_at else datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    return {
        "success": True,
        "ticket_id": new_ticket.ticket_id,
        "ticket_code": tracking_code,
        "tracking_code": tracking_code,
        "created_at": formatted_time,
        "total_images": len(saved_image_urls),
        "image_urls": saved_image_urls,
        "status": "Đã tiếp nhận - Chờ xử lý" if new_ticket.status == "ROUTED" else "Chờ phân luồng",
        "status_code": new_ticket.status,
        "dept_code": new_ticket.dept_code,
        "department_code": new_ticket.dept_code,
        "dept_name": new_ticket.dept_name,
        "department_name": new_ticket.dept_name,
        "priority": new_ticket.priority,
        "summary": summary_val,
        "ai_result": ai_data,
        "message": f"Đã tiếp nhận và phân tích hồ sơ thành công vào hệ thống CSDL tỉnh Đồng Nai ({len(saved_image_urls)} ảnh)."
    }


def list_tickets_service(
    db: Session,
    department_code: Optional[str] = None,
    dept_code: Optional[str] = "ALL",
    source: Optional[str] = "ALL",
    priority: Optional[str] = "ALL",
    status: Optional[str] = "ALL",
    search: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Lọc danh sách đơn thư theo tiêu chí phòng ban, nguồn, độ ưu tiên, trạng thái."""
    query = db.query(Ticket)

    target_dept = department_code or dept_code
    if target_dept and target_dept != "ALL":
        query = query.filter(Ticket.dept_code == target_dept)

    if source and source != "ALL":
        query = query.filter(Ticket.source == source)

    if priority and priority != "ALL":
        query = query.filter(Ticket.priority == priority)

    if status and status != "ALL":
        query = query.filter(Ticket.status == status)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Ticket.tracking_code.ilike(search_fmt),
                Ticket.raw_text.ilike(search_fmt),
                Ticket.citizen_name.ilike(search_fmt)
            )
        )

    tickets = query.order_by(Ticket.created_at.desc()).all()
    return [format_ticket_detail(t) for t in tickets]


def get_ticket_by_tracking_code_service(db: Session, tracking_code: str) -> Dict[str, Any]:
    """Tra cứu tiến độ hồ sơ theo mã biên nhận hành chính."""
    clean_code = tracking_code.strip().upper()
    ticket = db.query(Ticket).filter(Ticket.tracking_code == clean_code).first()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy hồ sơ với mã: {clean_code}")
    return format_ticket_detail(ticket)


def approve_ticket_service(
    db: Session,
    ticket_id: int,
    req: ApprovalRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Cán bộ phê duyệt dự thảo trả lời và kích hoạt phát hành email công vụ tự động."""
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại.")

    ticket.status = "APPROVED"
    if req.department_code:
        normalized_dept = "SO_XD" if req.department_code == "SO_XAYDUNG" else ("UBND_CAP_HUYEN" if req.department_code == "UBND_TINH" else req.department_code)
        ticket.dept_code = normalized_dept
        ticket.dept_name = DEPT_NAMES.get(req.department_code, DEPT_NAMES.get(normalized_dept, req.department_code))

    legal_basis_str = ""
    if ticket.ai_result:
        ticket.ai_result.draft_reply = req.draft_reply
        legal_basis_str = ticket.ai_result.legal_basis or ""
        if req.extracted_text:
            ticket.ai_result.extracted_text = req.extracted_text

    db.commit()
    db.refresh(ticket)
    print(f"\033[92m[OFFICER APPROVED]\033[0m Cán bộ đã phê duyệt hồ sơ {ticket.tracking_code} | Cơ quan phát hành: {ticket.dept_name}", flush=True)

    email_status = "Không có địa chỉ email công dân để gửi"
    if ticket.citizen_email and "@" in ticket.citizen_email:
        from modules.notifications.email_worker import send_official_reply_email
        background_tasks.add_task(
            send_official_reply_email,
            to_email=ticket.citizen_email,
            citizen_name=ticket.citizen_name or "Quý công dân",
            tracking_code=ticket.tracking_code,
            draft_reply=req.draft_reply,
            legal_basis=legal_basis_str,
            dept_name=ticket.dept_name or "Sở/Ban/Ngành có thẩm quyền"
        )
        email_status = f"Đang gửi email trả lời tới {ticket.citizen_email}"

    return {
        "success": True,
        "message": "Đã phê duyệt hồ sơ thành công.",
        "ticket_id": ticket_id,
        "email_status": email_status
    }


def transfer_ticket_service(db: Session, ticket_id: int, req: TransferRequest) -> Dict[str, Any]:
    """Chuyển tiếp hồ sơ sang đơn vị khác hoặc yêu cầu Admin phân luồng (Human Override)."""
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại.")

    target = req.target_dept
    # Chuẩn hóa nếu nhận SO_XAYDUNG hoặc UBND_TINH
    normalized_target = "SO_XD" if target == "SO_XAYDUNG" else ("UBND_CAP_HUYEN" if target == "UBND_TINH" else target)
    
    old_dept = ticket.dept_name or ticket.dept_code or "Ban đầu"
    new_dept_name = DEPT_NAMES.get(target, DEPT_NAMES.get(normalized_target, target))
    
    ticket.dept_code = normalized_target
    ticket.dept_name = new_dept_name
    ticket.status = "HUMAN_REVIEW" if normalized_target == "REQUIRE_HUMAN_REVIEW" else "ROUTED"
    
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    reason_str = req.notes.strip() if req.notes else "Cán bộ chuyên trách điều chỉnh đơn vị thụ lý"
    audit_entry = f"[{now_str}] Chuyển tuyến từ {old_dept} -> {new_dept_name}. Lý do: {reason_str}"
    
    if ticket.admin_note:
        ticket.admin_note = f"{ticket.admin_note}\n{audit_entry}"
    else:
        ticket.admin_note = audit_entry

    db.commit()
    db.refresh(ticket)
    
    print(f"\033[95m[TRANSFER OVERRIDE]\033[0m Cán bộ đã chuyển tuyến hồ sơ {ticket.tracking_code} sang {ticket.dept_name} | Lý do: {reason_str}", flush=True)
    
    return {
        "success": True, 
        "message": f"Đã chuyển hồ sơ sang {ticket.dept_name}.",
        "ticket_id": ticket_id,
        "dept_code": ticket.dept_code,
        "dept_name": ticket.dept_name,
        "status": ticket.status,
        "admin_note": ticket.admin_note
    }


def reassign_ticket_service(db: Session, ticket_id: int, req: ReassignRequest) -> Dict[str, Any]:
    """Cán bộ chuyển tuyến thủ công (Human Override): PUT /api/tickets/{id}/reassign."""
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại.")

    target = req.department_code
    normalized_target = "SO_XD" if target == "SO_XAYDUNG" else target
    old_dept = ticket.dept_name or ticket.dept_code or "Ban đầu"
    new_dept_name = DEPT_NAMES.get(target, DEPT_NAMES.get(normalized_target, target))

    ticket.dept_code = normalized_target
    ticket.dept_name = new_dept_name
    ticket.status = "ROUTED"

    reassigned_by = req.reassigned_by or "Cán bộ thẩm tra"
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    reason_str = req.reason.strip() if req.reason else "Chuyển cơ quan đúng thẩm quyền giải quyết"
    audit_entry = f"[{now_str}] {reassigned_by} chuyển tuyến từ {old_dept} -> {new_dept_name}. Lý do: {reason_str}"

    if ticket.admin_note:
        ticket.admin_note = f"{ticket.admin_note}\n{audit_entry}"
    else:
        ticket.admin_note = audit_entry

    db.commit()
    db.refresh(ticket)

    print(f"\033[95m[HUMAN OVERRIDE REASSIGN]\033[0m {reassigned_by} đã chuyển tuyến hồ sơ {ticket.tracking_code} sang {ticket.dept_name} | Lý do: {reason_str}", flush=True)

    return {
        "success": True,
        "message": f"Đã chuyển hồ sơ sang {ticket.dept_name}.",
        "ticket_id": ticket_id,
        "ticket_code": ticket.tracking_code,
        "tracking_code": ticket.tracking_code,
        "department_code": ticket.dept_code,
        "dept_code": ticket.dept_code,
        "dept_name": ticket.dept_name,
        "status": ticket.status,
        "admin_note": ticket.admin_note,
        "reassigned_by": reassigned_by
    }



def admin_dispatch_ticket_service(db: Session, req: DispatchRequest) -> Dict[str, Any]:
    """Admin phân bổ đơn vị chủ trì cho các hồ sơ phức tạp/ngoại lệ."""
    ticket = db.query(Ticket).filter(Ticket.ticket_id == req.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại.")

    ticket.dept_code = req.target_dept
    ticket.status = "ROUTED"
    if req.note:
        ticket.admin_note = req.note

    ticket.dept_name = DEPT_NAMES.get(req.target_dept, req.target_dept)
    db.commit()
    return {"success": True, "message": f"Admin đã điều phối hồ sơ về {ticket.dept_name}."}


def mark_ticket_spam_service(db: Session, ticket_id: int, reason: Optional[str] = None) -> Dict[str, Any]:
    """Đánh dấu loại bỏ đơn rác, spam hoặc khiêu khích."""
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại.")

    ticket.status = "REJECTED"
    ticket.rejection_reason = reason or "Đơn rác hoặc nặc danh vô nghĩa"
    ticket.dept_name = "Đã Loại Bỏ (Đơn Rác)"
    db.commit()
    return {"success": True, "message": "Đã chuyển hồ sơ sang trạng thái hủy bỏ."}


def get_system_stats_service(db: Session) -> Dict[str, Any]:
    """Tổng hợp số liệu thống kê giám sát hệ thống cho Quản trị viên."""
    tickets = db.query(Ticket).all()
    total = len(tickets)

    by_dept = {
        "SO_GTVT": 0,
        "SO_TNMT": 0,
        "SO_XD": 0,
        "SO_XAYDUNG": 0,
        "UBND_CAP_HUYEN": 0,
        "UBND_TINH": 0,
        "REQUIRE_HUMAN_REVIEW": 0
    }

    by_status = {
        "ROUTED": 0,
        "APPROVED": 0,
        "REJECTED": 0,
        "HUMAN_REVIEW": 0,
        "PROCESSING": 0
    }

    conf_scores = []

    for t in tickets:
        d = t.dept_code or "REQUIRE_HUMAN_REVIEW"
        if d in by_dept:
            by_dept[d] += 1
        elif d == "SO_XAYDUNG":
            by_dept["SO_XD"] += 1
        else:
            by_dept[d] = by_dept.get(d, 0) + 1

        st = t.status or "ROUTED"
        by_status[st] = by_status.get(st, 0) + 1

        if t.ai_result and t.ai_result.confidence_score:
            conf_scores.append(t.ai_result.confidence_score)

    so_xd_total = by_dept.get("SO_XD", 0) + by_dept.get("SO_XAYDUNG", 0)
    by_dept["SO_XD"] = so_xd_total
    by_dept["SO_XAYDUNG"] = so_xd_total

    avg_conf = round(sum(conf_scores) / len(conf_scores), 2) if conf_scores else 0.95

    return {
        "total_tickets": total,
        "departments": {
            "SO_GTVT": {"code": "SO_GTVT", "name": "Sở Giao thông Vận tải", "count": by_dept.get("SO_GTVT", 0)},
            "SO_TNMT": {"code": "SO_TNMT", "name": "Sở Tài nguyên & Môi trường", "count": by_dept.get("SO_TNMT", 0)},
            "SO_XD": {"code": "SO_XD", "name": "Sở Xây dựng", "count": so_xd_total},
            "UBND_CAP_HUYEN": {"code": "UBND_CAP_HUYEN", "name": "UBND Cấp Huyện / TP", "count": by_dept.get("UBND_CAP_HUYEN", 0)},
            "UBND_TINH": {"code": "UBND_TINH", "name": "UBND Tỉnh Đồng Nai", "count": by_dept.get("UBND_TINH", 0)},
            "REQUIRE_HUMAN_REVIEW": {"code": "REQUIRE_HUMAN_REVIEW", "name": "Hàng Đợi Ngoại Lệ", "count": by_dept.get("REQUIRE_HUMAN_REVIEW", 0) + by_status.get("HUMAN_REVIEW", 0)}
        },
        "status_counts": by_status,
        "ai_avg_confidence": avg_conf,
        "ai_avg_confidence_percent": int(avg_conf * 100)
    }


def get_citizen_tickets_service(
    db: Session,
    current_user: Optional[Dict[str, Any]] = None,
    email: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Lấy toàn bộ các đơn đã gửi gắn với tài khoản công dân đang đăng nhập:
    - Đơn nộp trực tiếp trên web (theo user_id hoặc email)
    - Đơn gửi từ địa chỉ email đã đăng ký tới tiepnhandonthu@dongnai.gov.vn (nguồn EMAIL)
    """
    conditions = []
    
    user_email = None
    if current_user:
        u_id = current_user.get("user_id")
        if u_id:
            conditions.append(Ticket.user_id == u_id)
        user_email = current_user.get("email") or current_user.get("gmail_account")

    target_email = email.strip().lower() if email and email.strip() else (user_email.strip().lower() if user_email else None)
    
    if target_email:
        conditions.append(func.lower(Ticket.citizen_email) == target_email)

    if not conditions:
        return []

    tickets = db.query(Ticket).filter(or_(*conditions)).order_by(Ticket.created_at.desc()).all()
    return [format_ticket_detail(t) for t in tickets]

