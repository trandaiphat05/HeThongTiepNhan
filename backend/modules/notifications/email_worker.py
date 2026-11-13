"""
Module Email Worker - Hệ Thống Tiếp Nhận & Điều Phối Đơn Thư AI Tỉnh Đồng Nai
Kiến trúc: Modular Service (IMAP & SMTP Worker)

Chức năng:
1. Kết nối an toàn IMAP SSL (imaplib) quét hòm thư công vụ định kỳ (UNSEEN).
2. Tự động bóc tách tiêu đề, thân thư (plain/html) và tải file ảnh hiện trường đính kèm.
3. Sinh mã hồ sơ chuẩn ĐN-YYYYMMDD-XXXX, tạo Ticket source="EMAIL" và gọi Gemini AI phân loại, định tuyến.
4. Gửi email biên nhận tự động cho người dân chứa mã tra cứu tiến độ.
5. Cung cấp hàm SMTP (smtplib) tự động phát hành email kết quả khi Cán bộ phê duyệt.
6. Chạy linh hoạt: Daemon Thread trong FastAPI, Standalone CLI Script, hoặc BackgroundTask.
"""

import os
import sys

# Cấu hình UTF-8 an toàn cho Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import time
import uuid
import json
import email
import imaplib
import smtplib
import logging
import threading
from email.header import decode_header
from email.utils import parseaddr
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import HTTPException

# Cấu hình & Database từ Core
from core.config import settings, UPLOAD_DIR
from core.database import SessionLocal
from modules.database.models import Ticket, AIResult, Department, User
from modules.ai_engine import process_civic_complaint

logger = logging.getLogger("EmailWorker")
logger.setLevel(logging.INFO)

# Cấu hình IMAP & SMTP tập trung từ settings
IMAP_SERVER = settings.MAIL_SERVER
IMAP_PORT = settings.MAIL_PORT
SMTP_SERVER = settings.MAIL_SMTP_SERVER
SMTP_PORT = settings.MAIL_SMTP_PORT
MAIL_USERNAME = settings.MAIL_USERNAME
MAIL_PASSWORD = settings.MAIL_PASSWORD
MAIL_SENDER_NAME = settings.MAIL_SENDER_NAME
CHECK_INTERVAL = settings.MAIL_CHECK_INTERVAL_SECONDS
ATTACHMENTS_DIR = UPLOAD_DIR

# Danh mục tên Sở/Ban/Ngành phục vụ định tuyến
DEPT_NAMES = {
    "SO_GTVT": "Sở Giao thông Vận tải",
    "SO_TNMT": "Sở Tài nguyên & Môi trường",
    "SO_XD": "Sở Xây dựng",
    "UBND_CAP_HUYEN": "UBND Cấp Huyện / TP",
    "REQUIRE_HUMAN_REVIEW": "Cần Admin Phân Luồng",
}

# Trạng thái giám sát tiến trình worker (Dashboard realtime)
worker_status: Dict[str, Any] = {
    "is_running": False,
    "last_sync": "Chưa quét",
    "total_emails_processed": 0,
    "new_emails_last_round": 0,
    "last_error": None,
}


def decode_mime_text(header_value: Optional[str]) -> str:
    """Giải mã chuỗi mã hóa MIME (UTF-8, Base64, Quoted-Printable) sang chuỗi Unicode tiếng Việt."""
    if not header_value:
        return ""
    try:
        decoded_fragments = decode_header(header_value)
        result = []
        for fragment, encoding in decoded_fragments:
            if isinstance(fragment, bytes):
                try:
                    result.append(fragment.decode(encoding or "utf-8", errors="replace"))
                except Exception:
                    result.append(fragment.decode("utf-8", errors="replace"))
            else:
                result.append(str(fragment))
        return "".join(result).strip()
    except Exception as e:
        logger.warning(f"Lỗi giải mã MIME header: {e}")
        return str(header_value).strip()


def extract_email_data(msg: email.message.Message, tracking_code: str) -> Dict[str, Any]:
    """
    Bóc tách nội dung văn bản (plain text/html) và lưu các tệp ảnh đính kèm (JPG, PNG, WEBP).
    """
    text_content = ""
    html_content = ""
    saved_images: List[str] = []

    for part in msg.walk():
        content_type = part.get_content_type()
        content_disposition = str(part.get("Content-Disposition") or "")

        # 1. Trích xuất thân thư plain text
        if content_type == "text/plain" and "attachment" not in content_disposition:
            payload = part.get_payload(decode=True)
            if payload:
                charset = part.get_content_charset() or "utf-8"
                try:
                    text_content += payload.decode(charset, errors="replace") + "\n"
                except Exception:
                    text_content += payload.decode("utf-8", errors="replace") + "\n"

        # 2. Trích xuất thân thư HTML nếu chưa có plain text
        elif content_type == "text/html" and "attachment" not in content_disposition:
            payload = part.get_payload(decode=True)
            if payload:
                charset = part.get_content_charset() or "utf-8"
                try:
                    html_content += payload.decode(charset, errors="replace") + "\n"
                except Exception:
                    html_content += payload.decode("utf-8", errors="replace") + "\n"

        # 3. Trích xuất tệp ảnh đính kèm hiện trường / đơn viết tay
        if "attachment" in content_disposition or content_type.startswith("image/"):
            raw_filename = part.get_filename()
            if raw_filename:
                decoded_fn = decode_mime_text(raw_filename)
                ext = os.path.splitext(decoded_fn)[1].lower()
                if ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
                    safe_filename = f"{tracking_code}_{uuid.uuid4().hex[:6]}{ext}"
                    filepath = os.path.join(ATTACHMENTS_DIR, safe_filename)
                    file_data = part.get_payload(decode=True)
                    if file_data:
                        with open(filepath, "wb") as f:
                            f.write(file_data)
                        saved_images.append(filepath)
                        logger.info(f"✓ Đã tải tệp ảnh đính kèm từ email: {safe_filename}")

    # Làm sạch nội dung văn bản
    final_text = text_content.strip()
    if not final_text and html_content.strip():
        # Lọc thô thẻ html
        import re
        clean_html = re.sub(r"<[^>]+>", " ", html_content)
        final_text = re.sub(r"\s+", " ", clean_html).strip()

    if not final_text:
        final_text = "Đơn thư gửi kèm hình ảnh hiện trường qua hòm thư điện tử công vụ"

    return {
        "text": final_text,
        "images": saved_images,
    }


def send_official_reply_email(
    to_email: str,
    citizen_name: str,
    tracking_code: str,
    draft_reply: str,
    legal_basis: Optional[str] = None,
    dept_name: str = "Ủy ban nhân dân tỉnh Đồng Nai",
) -> Dict[str, Any]:
    """
    Sử dụng smtplib để gửi email phản hồi chính thức cho người dân khi Cán bộ bấm duyệt.
    """
    if not to_email or "@" not in to_email:
        return {"success": False, "message": "Email người nhận không hợp lệ"}

    subject = f"[UBND TỈNH ĐỒNG NAI] Kết quả giải quyết đơn thư - Mã hồ sơ: {tracking_code}"

    # Soạn thảo nội dung HTML hành chính trang trọng với tông màu #1E3A8A và viền #F59E0B
    html_body = f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #0F172A; margin: 0; padding: 0; background-color: #F8FAFC; }}
        .header {{ background-color: #1E3A8A; color: #FFFFFF; padding: 25px 20px; text-align: center; border-bottom: 4px solid #F59E0B; }}
        .content {{ padding: 30px 20px; max-width: 680px; margin: 0 auto; }}
        .card {{ background: #FFFFFF; border: 1px solid #E2E8F0; padding: 25px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        .badge {{ background-color: #EFF6FF; border: 1px solid #BFDBFE; color: #1E3A8A; padding: 6px 12px; font-weight: bold; font-family: monospace; font-size: 16px; border-radius: 4px; display: inline-block; }}
        .reply-box {{ background-color: #F0FDF4; border-left: 4px solid #16A34A; padding: 18px; margin-top: 15px; border-radius: 4px; font-size: 15px; white-space: pre-wrap; color: #064E3B; line-height: 1.7; }}
        .legal-box {{ background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 15px; margin-top: 15px; border-radius: 4px; font-size: 13px; color: #78350F; }}
        .footer {{ font-size: 12px; color: #64748B; text-align: center; padding: 20px; border-top: 1px solid #E2E8F0; margin-top: 30px; }}
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin: 0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 20px;">ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #FEF3C7; font-weight: 600;">HỆ THỐNG ĐIỀU PHỐI ĐƠN THƯ TRÍ TUỆ NHÂN TẠO (AI CIVIC ROUTER)</p>
      </div>
      
      <div class="content">
        <div class="card">
          <p style="font-size: 15px;">Kính gửi: <strong>{citizen_name or 'Quý công dân'}</strong>,</p>
          <p style="font-size: 14px; color: #334155;">
            Bộ phận Tiếp nhận và Trả kết quả tỉnh Đồng Nai trân trọng thông báo kết quả giải quyết ý kiến, kiến nghị phản ánh của Ông/Bà như sau:
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748B; width: 160px;">Mã tra cứu hồ sơ:</td>
              <td style="padding: 6px 0;"><span class="badge">{tracking_code}</span></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Cơ quan chủ trì xử lý:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1E3A8A;">{dept_name}</td>
            </tr>
          </table>

          {f'<div class="legal-box"><strong>Căn cứ quy định pháp lý:</strong><br/>{legal_basis}</div>' if legal_basis else ''}
          
          <h4 style="color: #1E3A8A; margin-top: 22px; margin-bottom: 8px; border-bottom: 2px solid #E2E8F0; padding-bottom: 6px; font-size: 14px; text-transform: uppercase;">
            NỘI DUNG TRẢ LỜI CHÍNH THỨC:
          </h4>
          <div class="reply-box">{draft_reply}</div>
          
          <p style="margin-top: 25px; font-size: 13px; color: #475569;">
            Ông/Bà có thể sử dụng mã tra cứu <strong>{tracking_code}</strong> để kiểm tra lại toàn bộ tiến độ và văn bản số hóa trên Cổng tiếp nhận đơn thư trực tuyến của Tỉnh.
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p style="margin: 0 0 5px 0;"><strong>ỦY BAN NHÂN DÂN TỈNH ĐỒNG NAI</strong></p>
        <p style="margin: 0 0 5px 0;">Địa chỉ: Số 02 Nguyễn Ái Quốc, Phường Quang Vinh, TP. Biên Hòa, Tỉnh Đồng Nai</p>
        <p style="margin: 0; color: #94A3B8;">Email này được gửi tự động từ hệ thống điều phối điện tử công vụ tỉnh Đồng Nai.</p>
      </div>
    </body>
    </html>
    """

    # Tạo Multipart MIME message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{MAIL_SENDER_NAME} <{MAIL_USERNAME}>"
    msg["To"] = to_email

    msg.attach(MIMEText(draft_reply, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    # Kiểm tra cấu hình mật khẩu thực tế
    is_placeholder = (
        not MAIL_PASSWORD
        or MAIL_PASSWORD in ["app_password_here", "your_app_password"]
        or "your_email" in MAIL_USERNAME
    )

    if not is_placeholder:
        try:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15) as server:
                server.starttls()
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
                server.send_message(msg)
            logger.info(f"✓ Đã gửi email phản hồi chính thức thành công tới: {to_email}")
            return {"success": True, "message": f"Đã gửi email chính thức đến {to_email}"}
        except Exception as e:
            logger.error(f"Lỗi gửi email qua SMTP: {e}")
            return {"success": False, "error": str(e)}
    else:
        logger.warning(
            f"[SMTP] Chưa cấu hình MAIL_PASSWORD/MAIL_USERNAME trong .env để gửi email thực tế đến {to_email} (Mã: {tracking_code})."
        )
        return {
            "success": False,
            "message": "Chưa cấu hình mật khẩu ứng dụng Gmail (MAIL_PASSWORD) trong backend/.env để phát hành email công vụ thực tế.",
        }


def send_received_acknowledgment_email(to_email: str, tracking_code: str, citizen_name: str):
    """Gửi email biên nhận tự động xác nhận tiếp nhận đơn thư kèm mã hồ sơ cho người dân."""
    if not to_email or "@" not in to_email:
        return

    body = (
        f"Kính gửi Ông/Bà {citizen_name or 'Quý công dân'},\n\n"
        f"Bộ phận Tiếp nhận đơn thư trực tuyến tỉnh Đồng Nai trân trọng thông báo: "
        f"Chúng tôi đã nhận được thư điện tử phản ánh/kiến nghị của Ông/Bà.\n\n"
        f"Hồ sơ của Ông/Bà đã được cấp mã biên nhận tra cứu chính thức:\n"
        f"MÃ HỒ SƠ: {tracking_code}\n\n"
        f"Hệ thống Trí tuệ Nhân tạo đang tiến hành đọc nội dung, bóc tách thực thể và định tuyến tự động "
        f"về đơn vị có thẩm quyền giải quyết. Kết quả sẽ được thông báo lại qua địa chỉ email này.\n\n"
        f"Trân trọng cảm ơn sự đóng góp của Ông/Bà vì một Đồng Nai văn minh, phát triển!"
    )

    send_official_reply_email(
        to_email=to_email,
        citizen_name=citizen_name,
        tracking_code=tracking_code,
        draft_reply=body,
        dept_name="Bộ phận Tiếp nhận Đơn thư Công vụ Tỉnh Đồng Nai",
    )


def verify_gmail_imap_credentials(email_account: str, app_password: str) -> bool:
    """
    Xác minh thông tin đăng nhập IMAP SSL với máy chủ Gmail (imap.gmail.com:993).
    Bắt buộc phải là tài khoản Gmail thật và Google App Password 16 ký tự.
    """
    clean_account = (email_account or "").strip()
    clean_password = (app_password or "").strip().replace(" ", "")

    if not clean_account or "@" not in clean_account:
        raise HTTPException(
            status_code=400,
            detail="Địa chỉ Gmail không đúng định dạng. Vui lòng nhập tài khoản Gmail hợp lệ (ví dụ: user@gmail.com)."
        )

    if not clean_password or len(clean_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu ứng dụng (Google App Password) không hợp lệ. Vui lòng nhập mật khẩu ứng dụng 16 ký tự tạo từ tài khoản Google của bạn."
        )

    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT, timeout=12)
        mail.login(clean_account, clean_password)
        mail.logout()
        return True
    except imaplib.IMAP4.error as e:
        err_msg = str(e)
        logger.warning(f"Xác thực IMAP thất bại cho {clean_account}: {err_msg}")
        raise HTTPException(
            status_code=400,
            detail=(
                "Xác thực Gmail thất bại. Vui lòng kiểm tra:\n"
                "1. Tài khoản Google đã bật 'Xác minh 2 bước' (2-Step Verification).\n"
                "2. Sử dụng đúng 'Mật khẩu ứng dụng' (App Password - 16 ký tự) chứ không phải mật khẩu tài khoản chính.\n"
                "3. Đã kích hoạt giao thức IMAP trong Cài đặt Gmail (Settings -> Forwarding and POP/IMAP -> Enable IMAP)."
            )
        )
    except Exception as e:
        logger.error(f"Lỗi kết nối tới máy chủ IMAP {IMAP_SERVER}:{IMAP_PORT}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi kết nối máy chủ thư điện tử ({IMAP_SERVER}): {str(e)}"
        )


def sync_real_gmail_inbox(
    user_id: Optional[int],
    email_account: str,
    app_password: str,
    db: Session,
    max_emails: int = 5
) -> Dict[str, Any]:
    """
    ĐỒNG BỘ GMAIL THẬT (ZERO MOCK EMAILS):
    1. Kết nối IMAP SSL tới imap.gmail.com:993 với thông tin tài khoản và App Password thật.
    2. Quét các email mới nhất (ưu tiên UNSEEN, hoặc ALL).
    3. Chống trùng lặp (Deduplication): So sánh Message-ID của email với original_message_id trong bảng tickets.
    4. Bóc tách nội dung thư, trích xuất ảnh hiện trường đính kèm.
    5. Đưa qua Gemini 1.5 Flash để bóc tách thực thể, định tuyến Sở/Ban/Ngành và tra cứu cơ sở pháp lý RAG.
    6. Lưu Ticket (source='GMAIL_REAL', user_id=user_id) và AIResult vào MS SQL Server.
    7. Đánh dấu đã đọc (\\Seen) trên Gmail.
    8. Cập nhật last_synced_at cho User.
    """
    clean_account = (email_account or "").strip()
    clean_password = (app_password or "").strip().replace(" ", "")

    if not clean_account or not clean_password:
        return {"success": False, "synced_count": 0, "message": "Thiếu tài khoản hoặc mật khẩu ứng dụng Gmail"}

    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT, timeout=15)
        mail.login(clean_account, clean_password)
        mail.select("INBOX")
    except Exception as e:
        logger.error(f"Không thể kết nối hoặc đăng nhập Gmail {clean_account}: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Kết nối tới hộp thư Gmail thất bại: {str(e)}"
        )

    processed_count = 0
    synced_tickets = []

    try:
        # Tìm kiếm email chưa đọc trước
        status, messages = mail.search(None, "UNSEEN")
        msg_ids = messages[0].split() if (status == "OK" and messages and messages[0]) else []

        # Nếu không có email UNSEEN, lấy các email gần nhất (ALL) để hỗ trợ quét thư thực tế
        if not msg_ids:
            status_all, all_messages = mail.search(None, "ALL")
            if status_all == "OK" and all_messages and all_messages[0]:
                all_ids = all_messages[0].split()
                msg_ids = all_ids[-max_emails:]

        # Đảo thứ tự để duyệt từ email mới nhất trở về trước
        msg_ids = list(reversed(msg_ids))[:max_emails]

        for msg_id in msg_ids:
            try:
                res, data = mail.fetch(msg_id, "(RFC822)")
                if res != "OK" or not data or not data[0]:
                    continue

                raw_email_bytes = data[0][1]
                msg = email.message_from_bytes(raw_email_bytes)

                # Bóc tách Message-ID để chống trùng lặp tuyệt đối
                original_msg_id = (msg.get("Message-ID") or "").strip()
                if original_msg_id:
                    existing_ticket = db.query(Ticket).filter(Ticket.original_message_id == original_msg_id).first()
                    if existing_ticket:
                        logger.info(f"Bỏ qua email trùng lặp (Message-ID: {original_msg_id}) -> Đã tồn tại mã: {existing_ticket.tracking_code}")
                        continue

                # 1. Bóc tách người gửi & tiêu đề
                from_header = decode_mime_text(msg.get("From", ""))
                sender_name, sender_email = parseaddr(from_header)
                subject = decode_mime_text(msg.get("Subject", "Phản ánh qua Gmail"))

                # 2. Sinh mã hồ sơ duy nhất chuẩn hành chính
                today_str = datetime.now().strftime("%Y%m%d")
                random_suffix = str(uuid.uuid4().int)[:4]
                tracking_code = f"ĐN-{today_str}-{random_suffix}"

                # 3. Bóc tách thân thư & tải tệp ảnh đính kèm
                extracted = extract_email_data(msg, tracking_code)
                full_raw_text = f"Tiêu đề: {subject}\n{extracted['text']}"
                saved_images = extracted.get("images", [])
                image_urls_list = [f"/uploads/{os.path.basename(img)}" for img in saved_images if os.path.exists(img)]
                primary_image = saved_images[0] if saved_images else None
                primary_image_url = image_urls_list[0] if image_urls_list else None

                # 4. Tạo bản ghi Ticket mới vào SQL Server (source="GMAIL_REAL")
                new_ticket = Ticket(
                    tracking_code=tracking_code,
                    source="GMAIL_REAL",
                    user_id=user_id,
                    original_message_id=original_msg_id or f"gmail_{tracking_code}",
                    citizen_name=sender_name or clean_account,
                    citizen_email=sender_email or clean_account,
                    raw_text=full_raw_text,
                    image_url=primary_image_url,
                    image_urls=json.dumps(image_urls_list, ensure_ascii=False) if image_urls_list else None,
                    status="PROCESSING",
                    dept_code="UBND_CAP_HUYEN",
                    dept_name="Bộ phận Một cửa / UBND Cấp Huyện",
                    priority="TRUNG_BINH",
                )
                db.add(new_ticket)
                db.commit()
                db.refresh(new_ticket)

                # 5. Đưa qua Gemini 1.5 Flash phân tích đa phương thức
                image_part = None
                if primary_image and os.path.exists(primary_image):
                    try:
                        with open(primary_image, "rb") as img_f:
                            image_part = {"mime_type": "image/jpeg", "data": img_f.read()}
                    except Exception as img_err:
                        logger.warning(f"Không thể đọc file ảnh cho AI: {img_err}")

                ai_res_dict = process_civic_complaint(
                    user_text=full_raw_text,
                    image_bytes_or_part=image_part,
                    db=db
                )

                routed_dept = ai_res_dict.get("department_code", "REQUIRE_HUMAN_REVIEW")
                new_ticket.status = "HUMAN_REVIEW" if routed_dept == "REQUIRE_HUMAN_REVIEW" else "ROUTED"
                new_ticket.dept_code = routed_dept
                new_ticket.dept_name = DEPT_NAMES.get(routed_dept, routed_dept)
                new_ticket.priority = ai_res_dict.get("priority", "TRUNG_BINH")

                # 6. Lưu kết quả bóc tách vào bảng ai_results
                entities = ai_res_dict.get("entities", {"locations": [], "issues": []})
                entities_str = json.dumps(entities, ensure_ascii=False) if isinstance(entities, dict) else "{}"

                ai_record = AIResult(
                    ticket_id=new_ticket.ticket_id,
                    extracted_text=ai_res_dict.get("extracted_text", full_raw_text),
                    summary=ai_res_dict.get("summary", subject),
                    department_code=routed_dept,
                    priority=new_ticket.priority,
                    entities_json=entities_str,
                    legal_basis=ai_res_dict.get("legal_basis", ""),
                    draft_reply=ai_res_dict.get("draft_reply", ""),
                    confidence_score=float(ai_res_dict.get("confidence_score", 0.0)),
                )
                db.add(ai_record)
                db.commit()

                # Đánh dấu đã đọc trên hòm thư Gmail
                try:
                    mail.store(msg_id, "+FLAGS", "\\Seen")
                except Exception:
                    pass

                processed_count += 1
                synced_tickets.append({
                    "ticket_id": new_ticket.ticket_id,
                    "tracking_code": tracking_code,
                    "subject": subject,
                    "sender": sender_email or clean_account,
                    "dept_name": new_ticket.dept_name,
                    "priority": new_ticket.priority,
                })
                logger.info(f"✓ [GMAIL THẬT] Đã đồng bộ & phân tích email [{tracking_code}] từ {sender_email} -> {routed_dept}")

            except Exception as single_err:
                logger.error(f"Lỗi khi xử lý thư Gmail {msg_id}: {single_err}")
                db.rollback()

        # Cập nhật thời gian đồng bộ cho user
        if user_id:
            user_rec = db.query(User).filter(User.user_id == user_id).first()
            if user_rec:
                user_rec.last_synced_at = datetime.utcnow()
                if not user_rec.email:
                    user_rec.email = clean_account
                db.commit()

        mail.close()
        mail.logout()

        return {
            "success": True,
            "synced_count": processed_count,
            "message": f"Đã đồng bộ thành công {processed_count} thư mới từ hộp thư Gmail thực tế ({clean_account})!",
            "tickets": synced_tickets
        }

    except Exception as e:
        logger.error(f"Lỗi trong quá trình đọc hộp thư Gmail: {e}")
        try:
            mail.logout()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Lỗi trong quá trình đọc hộp thư Gmail: {str(e)}")


def fetch_unseen_emails() -> int:
    """
    Vòng quét định kỳ hòm thư công vụ cấu hình trong .env (chỉ quét khi đã điền MAIL_PASSWORD thật).
    """
    global worker_status
    worker_status["last_sync"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    is_placeholder = (
        not MAIL_PASSWORD
        or MAIL_PASSWORD in ["app_password_here", "your_app_password"]
        or "your_email" in MAIL_USERNAME
    )

    if is_placeholder:
        logger.info(
            "[IMAP Worker] Chế độ sẵn sàng (Standby). Chờ cấu hình MAIL_USERNAME & MAIL_PASSWORD "
            "trong file backend/.env để bắt đầu quét Gmail thực tế."
        )
        return 0

    db = SessionLocal()
    try:
        result = sync_real_gmail_inbox(
            user_id=None,
            email_account=MAIL_USERNAME,
            app_password=MAIL_PASSWORD,
            db=db,
            max_emails=5
        )
        count = result.get("synced_count", 0)
        worker_status["new_emails_last_round"] = count
        worker_status["total_emails_processed"] += count
        return count
    except Exception as e:
        worker_status["last_error"] = str(e)
        logger.error(f"Lỗi kết nối IMAP Server ({IMAP_SERVER}:{IMAP_PORT}): {e}")
        return 0
    finally:
        db.close()


def run_worker_loop():
    """
    Vòng lặp chạy ngầm quét email định kỳ trên một Daemon Thread riêng biệt,
    không làm nghẽn hoặc ảnh hưởng đến hiệu năng của FastAPI server.
    """
    global worker_status
    worker_status["is_running"] = True
    logger.info(f"✓ Khởi động Email Worker Daemon (Chu kỳ quét: {CHECK_INTERVAL}s/lần)")

    while worker_status["is_running"]:
        try:
            fetch_unseen_emails()
        except Exception as e:
            logger.error(f"Lỗi trong chu kỳ Email Worker: {e}")
        time.sleep(CHECK_INTERVAL)


def start_email_worker_thread() -> threading.Thread:
    """Khởi chạy Email Worker trên một luồng nền độc lập (Daemon Thread) khi ứng dụng FastAPI khởi động."""
    t = threading.Thread(target=run_worker_loop, daemon=True, name="DongNai-EmailWorker-Daemon")
    t.start()
    return t


# Hỗ trợ chạy độc lập như một background script: python -m modules.notifications.email_worker
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="DongNai Civic Complaint Email Worker")
    parser.add_argument("--once", action="store_true", help="Chạy quét một lần rồi thoát")
    args = parser.parse_args()

    print("===================================================================")
    print("  HỆ THỐNG QUÉT EMAIL CÔNG VỤ TỰ ĐỘNG - TỈNH ĐỒNG NAI")
    print(f"  IMAP: {IMAP_SERVER}:{IMAP_PORT} | Tài khoản: {MAIL_USERNAME}")
    print("===================================================================")

    if args.once:
        print("[*] Đang thực hiện quét hòm thư 1 lần...")
        count = fetch_unseen_emails()
        print(f"[✓] Hoàn tất. Đã tiếp nhận {count} đơn thư mới.")
    else:
        print(f"[*] Bắt đầu vòng lặp quét ngầm ({CHECK_INTERVAL}s/lần). Bấm Ctrl+C để dừng.")
        run_worker_loop()
