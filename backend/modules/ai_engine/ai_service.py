"""
Module AI Engine - Tích hợp Gemini Flash, OCR, RAG và Phân loại Đơn thư Tỉnh Đồng Nai
Đóng gói tầng dịch vụ AI duy nhất tuân thủ quy chuẩn kỹ thuật:
- Sử dụng Gemini Flash ổn định với transport="rest"
- Response Schema nghiêm ngặt theo TicketRoutingResult
- Cập nhật kho tri thức RAG động trong bộ nhớ mà không cần khởi động lại
- Logging rõ ràng: in [GEMINI OK] khi thành công hoặc [GEMINI ERROR]: e khi thất bại
"""

import os
import time
import json
import logging
import warnings
from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Bỏ qua cảnh báo deprecation của thư viện google.generativeai để giữ log sạch đẹp
warnings.filterwarnings("ignore", category=FutureWarning)

import google.generativeai as genai
from google.api_core.exceptions import TooManyRequests
from docx import Document

from core.config import settings, DOCS_DIR, BASE_DIR

logger = logging.getLogger("DongNaiAIEngine")

# Đảm bảo nạp đúng API Key từ file .env
root_dir = os.path.abspath(os.path.join(BASE_DIR, ".."))
root_env = os.path.join(root_dir, ".env")
backend_env = os.path.join(BASE_DIR, ".env")

if os.path.exists(root_env):
    load_dotenv(root_env, override=False)
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=True)

api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key, transport="rest")
    logger.info(f"[GEMINI INIT] Đã nạp thành công GEMINI_API_KEY ({api_key[:6]}...)")
else:
    logger.warning("[GEMINI INIT] ⚠️ Chưa tìm thấy GEMINI_API_KEY trong file .env!")

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", settings.GEMINI_MODEL) or "gemini-3.1-flash-lite"

SIMILARITY_THRESHOLD = 0.65
NO_LEGAL_DOC_MESSAGE = "Chưa tìm thấy căn cứ pháp lý trong kho dữ liệu - Cán bộ thụ lý cần bổ sung"


def load_rules_from_docx(file_path: Optional[str] = None) -> str:
    """Đọc nội dung quy định pháp luật từ file .docx hoặc .md để nạp vào RAG Context."""
    candidate_paths = []
    if file_path:
        candidate_paths.extend([
            file_path,
            os.path.join(DOCS_DIR, os.path.basename(file_path)),
            os.path.join(BASE_DIR, file_path),
        ])

    candidate_paths.extend([
        os.path.join(DOCS_DIR, "rag_knowledge.md"),
        os.path.join(DOCS_DIR, "DacTa_HeThong_DongNai.docx"),
        os.path.join(BASE_DIR, "rag_knowledge.md"),
        os.path.join(BASE_DIR, "DacTa_HeThong_DongNai.docx")
    ])

    target_path = next((p for p in candidate_paths if p and os.path.exists(p)), None)

    if not target_path:
        return (
            "Văn bản quy định phân định thẩm quyền 7 Sở/Ban/Ngành chính thức tỉnh Đồng Nai:\n"
            "- CONG_AN_TINH: Công an Tỉnh Đồng Nai - Quản lý an ninh trật tự, an toàn xã hội, phòng chống tội phạm, trộm cắp, cướp giật, đua xe trái phép, đánh nhau, lừa đảo, tệ nạn xã hội (cờ bạc, ma túy). ĐẶC BIỆT: Mọi vụ việc tiếng ồn khu dân cư, hát karaoke ồn ào lúc nửa đêm, loa kẹo kéo gây rối, say xỉn quậy phá đêm khuya ĐỀU BẮT BUỘC PHÂN VỀ CONG_AN_TINH.\n"
            "- SO_GTVT: Sở Giao thông Vận tải - Quản lý hạ tầng giao thông đường bộ, đường sá, cầu đường, đèn tín hiệu giao thông, xe buýt, xe khách, ngập đường do kết cấu thoát nước giao thông, dặm vá ổ gà, sụt lún, xử lý điểm đen tai nạn.\n"
            "- SO_TNMT: Sở Tài nguyên và Môi trường - Quản lý đất đai, cấp giấy chứng nhận quyền sử dụng đất (sổ đỏ), ô nhiễm môi trường, rác thải, khói bụi, xả thải trái phép KCN, nước thải sông suối, khai thác cát trái phép.\n"
            "- SO_XD: Sở Xây dựng (SO_XAYDUNG) - Quản lý cấp phép xây dựng, thanh tra công trình xây dựng trái phép, không phép, lấn chiếm hành lang xây dựng, lấn chiếm vỉa hè lòng đường, nứt lún nhà liền kề do thi công, quy hoạch phát triển đô thị.\n"
            "- SO_YTE: Sở Y tế (SO_YT) - Quản lý bệnh viện, trạm y tế, phòng khám tư nhân, an toàn vệ sinh thực phẩm, ngộ độc thực phẩm, dịch bệnh truyền nhiễm, chính sách bảo hiểm y tế khám chữa bệnh, viện phí.\n"
            "- SO_GDDT: Sở Giáo dục và Đào tạo - Quản lý trường học các cấp, thu chi học phí, lạm thu, tuyển sinh đầu cấp, bạo lực học đường, tư cách nhà giáo và cơ sở vật chất đào tạo.\n"
            "- SO_LDTBXH: Sở Lao động - Thương binh và Xã hội - Quản lý chế độ tiền lương, chậm trả nợ lương, nợ đóng BHXH, bảo hiểm thất nghiệp, tranh chấp hợp đồng lao động, trợ cấp chính sách người có công, bảo trợ xã hội.\n"
            "- UBND_CAP_HUYEN: Ban Tiếp công dân Tỉnh / UBND Cấp Huyện - Tiếp nhận và điều phối đơn thư, thủ tục hành chính, cấp đổi giấy tờ hộ tịch, chứng thực, hòa giải tranh chấp cơ sở, hoặc các đơn thư chung chung chưa rõ lĩnh vực chuyên sâu để Chuyên viên Tiếp công dân điều phối thủ công. TUYỆT ĐỐI KHÔNG phân các vụ việc tiếng ồn, karaoke, an ninh trật tự về UBND_CAP_HUYEN.\n"
            "- REQUIRE_HUMAN_REVIEW: Đơn nặc danh khiêu khích xúc phạm, hoặc không đủ thông tin, đa ngành phức tạp cần điều phối thủ công."
        )

    try:
        if target_path.endswith(".docx"):
            doc = Document(target_path)
            full_text = [para.text for para in doc.paragraphs if para.text.strip()]
            return "\n".join(full_text)
        elif target_path.endswith(".md") or target_path.endswith(".txt"):
            with open(target_path, "r", encoding="utf-8") as f:
                return f.read()
        return f"Định dạng tệp không được hỗ trợ: {target_path}"
    except Exception as e:
        logger.error(f"Lỗi đọc file quy định RAG ({target_path}): {e}")
        return f"Không thể tải file quy định ({target_path}): {e}"


class EntityInfo(BaseModel):
    locations: List[str] = Field(default_factory=list, description="Địa danh phát hiện")
    issues: List[str] = Field(default_factory=list, description="Vấn đề / sự cố chính")


class TicketRoutingResult(BaseModel):
    extracted_text: str = Field(description="Toàn bộ văn bản bóc tách liền mạch logic từ các ảnh hoặc văn bản gốc")
    summary: str = Field(description="Tóm tắt sự việc cốt lõi dưới 30 từ")
    department_code: str = Field(description="Mã đơn vị: CONG_AN_TINH, SO_GTVT, SO_TNMT, SO_XD, SO_YTE, SO_GDDT, SO_LDTBXH, UBND_CAP_HUYEN, REQUIRE_HUMAN_REVIEW")
    priority: str = Field(description="Mức độ ưu tiên: CAO, TRUNG_BINH, THAP")
    entities: EntityInfo = Field(default_factory=EntityInfo)
    legal_basis: str = Field(description="Trích dẫn điều khoản luật từ RAG context")
    draft_reply: str = Field(description="Dự thảo thông báo trả lời công dân chuẩn Nghị định 30")
    confidence_score: float = Field(description="Độ tin cậy từ 0.0 đến 1.0")


def compress_pil_in_memory(img, max_dim: int = 1600, quality: int = 80):
    """Nén ảnh trực tiếp trong RAM bằng BytesIO (resize tối đa 1600px, quality 80), không ghi đĩa."""
    from PIL import Image
    import io
    if img.mode != "RGB":
        img = img.convert("RGB")
    img.thumbnail((max_dim, max_dim))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    buf.seek(0)
    return Image.open(buf)


def init_civic_router_agent(docx_law_path: Optional[str] = None, custom_rag_text: Optional[str] = None, model_name: Optional[str] = None):
    """Khởi tạo mô hình Gemini đóng vai trò DongNai-CivicRouter-AI với Structured Output."""
    from datetime import datetime
    now = datetime.now()
    current_year = now.year
    current_day = f"{now.day:02d}"
    current_month = f"{now.month:02d}"

    target_model = model_name or DEFAULT_MODEL
    rag_content = custom_rag_text if custom_rag_text else load_rules_from_docx(docx_law_path)

    system_prompt = f"""# DongNai-CivicRouter-AI (Hệ Thống Phân Loại & Định Tuyến Đơn Thư Tỉnh Đồng Nai)

## 1. Nhiệm vụ
Phân tích phản ánh (văn bản hoặc hình ảnh viết tay của công dân), trích xuất thông tin cốt lõi, đối chiếu quy định pháp luật và định tuyến chính xác vào 1 trong các cơ quan sau:

- CONG_AN_TINH: Công an Tỉnh Đồng Nai
  Thẩm quyền: Quản lý an ninh trật tự, an toàn xã hội, phòng chống tội phạm, trộm cắp, cướp giật, đua xe trái phép, đánh nhau, lừa đảo, tội phạm, tệ nạn cờ bạc ma túy. 
  ĐẶC BIỆT LƯU Ý: Mọi phản ánh về ô nhiễm tiếng ồn khu dân cư, hàng xóm hát karaoke ồn ào lúc nửa đêm, loa kẹo kéo gây rối, say xỉn quậy phá đêm khuya ĐỀU BẮT BUỘC PHÂN TUYẾN VỀ CONG_AN_TINH.

- SO_GTVT: Sở Giao thông Vận tải
  Thẩm quyền: Kết cấu hạ tầng giao thông đường bộ, đường sá, cầu đường, đèn tín hiệu giao thông, xe buýt, xe khách, ngập đường do kết cấu thoát nước giao thông, dặm vá ổ gà, sụt lún mặt đường, xử lý điểm đen tai nạn.

- SO_TNMT: Sở Tài nguyên và Môi trường
  Thẩm quyền: Quản lý đất đai, cấp giấy chứng nhận quyền sử dụng đất (sổ đỏ), giải quyết hồ sơ cấp sổ đỏ bị chậm trễ, giải phóng mặt bằng, tranh chấp đất đai, bồi thường tái định cư, ô nhiễm môi trường, rác thải, khói bụi, xả thải trái phép KCN, nước thải sông suối, khai thác cát trái phép (cát tặc).
  ĐẶC BIỆT LƯU Ý: Mọi phản ánh, kiến nghị về cấp sổ đỏ, hồ sơ cấp sổ đỏ bị chậm trễ, thủ tục đất đai, ô nhiễm môi trường xả thải ĐỀU BẮT BUỘC PHÂN TUYẾN VỀ SO_TNMT.

- SO_XD: Sở Xây dựng (Bí danh: SO_XAYDUNG)
  Thẩm quyền: Cấp phép xây dựng, thanh tra công trình xây dựng trái phép, sai phép, không phép, lấn chiếm hành lang an toàn xây dựng, lấn chiếm vỉa hè, nứt lún nhà liền kề do thi công công trình bên cạnh, quy hoạch đô thị.

- SO_YTE: Sở Y tế (Bí danh: SO_YT)
  Thẩm quyền: Bệnh viện, trạm y tế, phòng khám tư nhân, an toàn thực phẩm, ngộ độc thực phẩm, dịch bệnh truyền nhiễm, chính sách bảo hiểm y tế khám chữa bệnh, viện phí.

- SO_GDDT: Sở Giáo dục và Đào tạo
  Thẩm quyền: Trường học các cấp, thu chi học phí, lạm thu đầu năm, tuyển sinh đầu cấp, bạo lực học đường, tư cách nhà giáo, cơ sở vật chất đào tạo.

- SO_LDTBXH: Sở Lao động - Thương binh và Xã hội
  Thẩm quyền: Chế độ tiền lương, chậm trả nợ lương, nợ đóng BHXH, bảo hiểm thất nghiệp, tranh chấp hợp đồng lao động, tai nạn lao động, trợ cấp chính sách người có công, bảo trợ xã hội.

- UBND_CAP_HUYEN: Ban Tiếp công dân Tỉnh / UBND Cấp Huyện
  Thẩm quyền: Tiếp nhận đơn thư, thủ tục hành chính, cấp đổi giấy tờ hộ tịch, chứng thực, hòa giải tranh chấp dân sự nhỏ lẻ tại cơ sở, hoặc các đơn thư chung chung chưa rõ lĩnh vực chuyên sâu để Chuyên viên Tiếp công dân điều phối thủ công. TUYỆT ĐỐI KHÔNG phân các vụ việc tiếng ồn, karaoke (về CONG_AN_TINH) hoặc đất đai, sổ đỏ, môi trường (về SO_TNMT) về UBND_CAP_HUYEN.

- REQUIRE_HUMAN_REVIEW: Đơn nặc danh khiêu khích xúc phạm vô nghĩa, hoặc hồ sơ đa ngành đặc biệt phức tạp cần Admin can thiệp.

## 2. Xử lý Đa trang
Nếu có nhiều ảnh, hãy đọc theo trình tự logic, nối toàn bộ nội dung mạch lạc vào `extracted_text`.

## 3. Căn cứ Pháp luật (RAG Context)
{rag_content}

## 4. Thể thức Dự thảo Văn bản Hành chính (`draft_reply`)
BẮT BUỘC tuân thủ đúng thể thức văn bản hành chính Việt Nam theo Nghị định 30/2020/NĐ-CP:
- TUYỆT ĐỐI KHÔNG dùng dấu gạch chéo '/' hoặc gạch đứng '|' để nối các dòng. Phải xuống dòng (\\n) rõ ràng giữa từng mục.
- Quốc hiệu, Tiêu ngữ:
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-------------------------------
- Tên cơ quan ban hành và Địa danh, ngày tháng năm:
Bắt buộc dùng năm hiện tại ({current_year}), ngày tháng thực tế (Đồng Nai, ngày {current_day} tháng {current_month} năm {current_year}). TUYỆT ĐỐI KHÔNG dùng năm 2024 hay 2025.
- Số ký hiệu văn bản:
BẮT BUỘC dùng định dạng placeholder 'Số: .../TB-[MÃ_CƠ_QUAN]' (Ví dụ: 'Số: .../TB-SGTVT', 'Số: .../TB-STNMT', 'Số: .../TB-SXD', 'Số: .../TB-CAT', 'Số: .../TB-UBND'). TUYỆT ĐỐI CẤM tự ý bịa số cụ thể như 'Số: 123/'.
- Tiêu đề văn bản:
THÔNG BÁO
V/v trả lời phản ánh, kiến nghị của công dân
- Kính gửi: Ông/Bà [Tên công dân nếu có, hoặc Quý công dân],
- Căn cứ pháp lý: Trích dẫn rõ điều khoản luật phù hợp từ RAG Context.
- Nội dung trả lời: Nêu rõ việc tiếp nhận, cử tổ xác minh hiện trường, biện pháp và thời hạn giải quyết.
- QUY TẮC BẮT BUỘC VỀ ĐỊA CHỈ: Nếu trong đơn thư/phản ánh của công dân KHÔNG nêu rõ địa chỉ cụ thể (tên đường, số nhà, khu phố/thôn ấp, phường/xã), phần nội dung trả lời BẮT BUỘC phải có câu:
"Đề nghị Ông/Bà cung cấp bổ sung thông tin địa chỉ, vị trí cụ thể của vụ việc để cơ quan chức năng có cơ sở kiểm tra và xử lý thực tế."
- Nơi nhận:
Nơi nhận:
- Công dân (để biết);
- Ban Giám đốc Sở / Lãnh đạo đơn vị;
- Lưu: VT, Tổ Tiếp nhận.
"""

    return genai.GenerativeModel(
        model_name=target_model,
        system_instruction=system_prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.1,
            response_mime_type="application/json",
            response_schema=TicketRoutingResult,
        ),
    )


# Singleton cache model
_cached_model = None

def get_ai_model(force_refresh: bool = False, model_name: Optional[str] = None):
    """Lấy thể hiện duy nhất của Gemini Agent, hỗ trợ làm mới khi cập nhật kho luật RAG."""
    global _cached_model
    if _cached_model is None or force_refresh or model_name:
        _cached_model = init_civic_router_agent(model_name=model_name)
    return _cached_model


def get_rag_legal_context(user_text: str, db=None) -> str:
    """Truy xuất các điều khoản quy phạm pháp luật liên quan nhất từ CSDL SQL Server."""
    try:
        from modules.rag.service import retrieve_legal_context_for_prompt
        if db is not None:
            return retrieve_legal_context_for_prompt(db, user_text, top_k=4)
        else:
            from modules.database.connection import SessionLocal
            with SessionLocal() as session:
                return retrieve_legal_context_for_prompt(session, user_text, top_k=4)
    except Exception as e:
        logger.warning(f"Không thể truy xuất RAG context từ CSDL: {e}")
        return ""


def load_and_normalize_images(images_input) -> list:
    """Chuẩn hóa và mở toàn bộ hình ảnh thành danh sách phẳng 1 chiều (PIL.Image hoặc Part byte dict)."""
    from PIL import Image
    import io

    raw_items = []
    def _flatten(items):
        if items is None:
            return
        if isinstance(items, (list, tuple, set)):
            for sub in items:
                _flatten(sub)
        else:
            raw_items.append(items)

    _flatten(images_input)

    loaded = []
    for idx, item in enumerate(raw_items):
        if item is None:
            continue

        if isinstance(item, Image.Image):
            try:
                loaded.append(compress_pil_in_memory(item))
            except Exception:
                loaded.append(item)
            continue

        if isinstance(item, (str, os.PathLike)):
            path_str = str(item).strip()
            clean_path = os.path.abspath(path_str)
            if os.path.exists(clean_path):
                try:
                    img = Image.open(clean_path)
                    compressed = compress_pil_in_memory(img)
                    loaded.append(compressed)
                    logger.info(f"[Gemini AI Engine] Nạp và nén in-memory ảnh #{idx+1} ({compressed.size}) từ: {clean_path}")
                    continue
                except Exception as pil_err:
                    logger.warning(f"[Gemini AI Engine] Lỗi mở PIL cho {clean_path}: {pil_err}")
                    try:
                        ext = os.path.splitext(clean_path)[1].lower()
                        mime = "image/png" if ext == ".png" else ("image/webp" if ext == ".webp" else "image/jpeg")
                        with open(clean_path, "rb") as f:
                            loaded.append({"mime_type": mime, "data": f.read()})
                        continue
                    except Exception as byte_err:
                        logger.error(f"[Gemini AI Engine] Không thể đọc bytes từ {clean_path}: {byte_err}")
            else:
                logger.warning(f"[Gemini AI Engine] Đường dẫn ảnh không tồn tại: {clean_path}")
                continue

        if isinstance(item, dict) and "data" in item:
            try:
                img = Image.open(io.BytesIO(item["data"]))
                loaded.append(compress_pil_in_memory(img))
            except Exception:
                loaded.append(item)
            continue

        if isinstance(item, (bytes, bytearray)):
            try:
                img = Image.open(io.BytesIO(item))
                loaded.append(compress_pil_in_memory(img))
            except Exception:
                loaded.append({"mime_type": "image/jpeg", "data": bytes(item)})
            continue

        loaded.append(item)

    return loaded


def classify_complaint_fallback(user_text: str, legal_context: Optional[str] = None) -> dict:
    """
    Fallback phân loại dựa trên đối sánh từ khóa thông minh (Keyword Matching)
    khi Gemini API gặp sự cố (mạng, hạn mức, sai khóa API).
    Phủ toàn diện 7 Sở/Ban/Ngành chính thức của tỉnh Đồng Nai và Ban Tiếp công dân Tỉnh.
    Nếu đơn không rõ lĩnh vực, chuyển về UBND_CAP_HUYEN (Ban Tiếp công dân Tỉnh) điều phối thủ công,
    TUYỆT ĐỐI KHÔNG mặc định gán SO_GTVT.
    """
    t = (user_text or "").lower()

    dept_keywords = {
        "CONG_AN_TINH": [
            "karaoke", "hát karaoke", "tiếng ồn", "ồn ào", "tiếng ồn đêm", "nửa đêm", "loa kẹo kéo",
            "công an", "an ninh", "trật tự", "an ninh trật tự", "mất an ninh", "gây rối", "gây mất trật tự",
            "trộm", "trộm cắp", "cắp", "cướp", "cướp giật", "đua xe", "đánh nhau", "say xỉn",
            "tệ nạn", "cờ bạc", "ma túy", "lừa đảo", "tố giác tội phạm", "tội phạm",
            "khu dân cư ồn ào", "gây mất trật tự an ninh"
        ],
        "SO_TNMT": [
            "sổ đỏ", "cấp sổ đỏ", "đất đai", "chậm trễ", "giải phóng mặt bằng", "rác", "rác thải", "bãi rác", "ô nhiễm", "môi trường",
            "khói bụi", "xả thải", "nước thải", "mùi hôi", "hôi thối", "giấy chứng nhận",
            "quyền sử dụng đất", "tranh chấp đất", "khai thác cát", "cát tặc", "khoáng sản",
            "sông đồng nai", "suối", "chất thải nguy hại", "lấn chiếm đất công", "phân lô", "ô nhiễm môi trường"
        ],
        "SO_XD": [
            "xây dựng", "vỉa hè", "lấn chiếm vỉa hè", "lấn chiếm", "sai phép", "trái phép", "không phép",
            "cấp phép xây dựng", "giấy phép xây dựng", "công trình", "lấn chiếm hành lang",
            "nứt nhà", "nứt tường", "quy hoạch", "quy hoạch đô thị", "đô thị", "chung cư", "đào móng",
            "sụp đổ công trình", "trật tự xây dựng", "nhà liền kề", "thoát nước đô thị"
        ],
        "SO_GTVT": [
            "đường bộ", "ổ gà", "sụt lún", "đèn tín hiệu", "kẹt xe", "vận tải", "cầu cống", "tai nạn giao thông",
            "giao thông", "đường sá", "đường xá", "cầu đường", "đèn đỏ", "đèn giao thông", "xe buýt", "xe khách",
            "dặm vá", "ngập đường", "ngập nước đường", "ùn tắc", "phân luồng", "lòng lề đường", "tuyến đường", "quốc lộ", "tỉnh lộ", "ngã tư"
        ],
        "SO_YTE": [
            "y tế", "bệnh viện", "trạm y tế", "phòng khám", "bác sĩ", "y tá", "dược phẩm",
            "thuốc", "ngộ độc", "an toàn thực phẩm", "vệ sinh an toàn thực phẩm", "dịch bệnh",
            "bảo hiểm y tế", "bhyt", "tiêm chủng", "vắc xin", "khám chữa bệnh", "viện phí"
        ],
        "SO_GDDT": [
            "giáo dục", "trường học", "trường mầm non", "trường tiểu học", "thcs", "thpt",
            "học phí", "lạm thu", "tuyển sinh", "bạo lực học đường", "giáo viên", "thầy cô",
            "học sinh", "điểm thi", "bằng cấp", "dạy thêm", "học thêm", "sách giáo khoa"
        ],
        "SO_LDTBXH": [
            "tiền lương", "nợ lương", "chậm trả lương", "chậm lương", "bảo hiểm xã hội", "nợ bhxh",
            "thất nghiệp", "bảo hiểm thất nghiệp", "tranh chấp lao động", "chế độ thai sản", "tai nạn lao động", "trợ cấp",
            "người có công", "thương binh", "liệt sĩ", "bảo trợ xã hội", "đình công",
            "người lao động", "hợp đồng lao động", "chính sách xã hội"
        ],
        "UBND_CAP_HUYEN": [
            "hộ tịch", "chứng thực", "hòa giải", "thủ tục hành chính", "tiếp công dân", "ban tiếp công dân", "khai sinh", "khai tử",
            "kết hôn", "xác nhận dân sự", "ubnd huyện", "ubnd xã", "ubnd phường", "ủy ban nhân dân", "cấp huyện"
        ]
    }

    # Tính tổng số từ khóa khớp của từng Sở
    scores = {dept: 0 for dept in dept_keywords}
    for dept, kws in dept_keywords.items():
        for kw in kws:
            if kw in t:
                # Trọng số: cụm từ có dấu cách được 2 điểm, từ đơn 1 điểm
                scores[dept] += 2 if " " in kw else 1

    max_score = max(scores.values())

    # Chọn Sở có điểm cao nhất nếu có từ khóa khớp
    if max_score > 0:
        assigned_dept = max(scores, key=scores.get)
        confidence = min(0.92, 0.75 + 0.05 * max_score)
    else:
        # Nếu không rõ lĩnh vực, tuyệt đối KHÔNG gán SO_GTVT mà chuyển về UBND_CAP_HUYEN điều phối thủ công
        assigned_dept = "UBND_CAP_HUYEN"
        confidence = 0.60

    # Kiểm tra mức độ ưu tiên
    urgent_keywords = ["khẩn cấp", "sụp đổ", "nguy hiểm", "tai nạn", "chết người", "cháy", "ô nhiễm nghiêm trọng", "nứt toác", "khẩn", "gấp", "ngộ độc", "cướp", "bạo lực"]
    low_keywords = ["hỏi về", "tra cứu", "xin hỏi", "hướng dẫn", "thủ tục", "tham khảo"]
    
    if any(k in t for k in urgent_keywords):
        priority = "CAO"
    elif any(k in t for k in low_keywords):
        priority = "THAP"
    else:
        priority = "TRUNG_BINH"

    # Trích xuất địa danh Đồng Nai
    locations = []
    for loc in ["Biên Hòa", "Long Thành", "Nhơn Trạch", "Trảng Bom", "Vĩnh Cửu", "Định Quán", "Tân Phú", "Thống Nhất", "Cẩm Mỹ", "Xuân Lộc", "Long Khánh", "Đồng Nai", "Nguyễn Ái Quốc", "Tân Phong"]:
        if loc.lower() in t:
            locations.append(loc)

    legal_bases = {
        "CONG_AN_TINH": "Nghị định số 144/2021/NĐ-CP về an ninh trật tự, an toàn xã hội và Luật Công an nhân dân.",
        "SO_TNMT": "Luật Đất đai 2024 và Luật Bảo vệ môi trường 2020 quy định về quản lý đất đai và bảo vệ môi trường.",
        "SO_XD": "Luật Xây dựng và Nghị định số 16/2022/NĐ-CP quy định xử phạt vi phạm hành chính về trật tự xây dựng.",
        "SO_GTVT": "Luật Đường bộ 2024 và Nghị định số 11/2010/NĐ-CP về quản lý và bảo vệ kết cấu hạ tầng giao thông đường bộ.",
        "SO_YTE": "Luật An toàn thực phẩm và Luật Khám bệnh, chữa bệnh về bảo vệ và chăm sóc sức khỏe nhân dân.",
        "SO_GDDT": "Luật Giáo dục 2019 và Điều lệ trường học ban hành theo Thông tư của Bộ Giáo dục và Đào tạo.",
        "SO_LDTBXH": "Bộ luật Lao động 2019 và Luật Bảo hiểm xã hội quy định về quyền lợi người lao động và an sinh xã hội.",
        "UBND_CAP_HUYEN": "Luật Tiếp công dân 2013 và Luật Tổ chức chính quyền địa phương quy định về giải quyết thủ tục hành chính và tiếp công dân.",
        "REQUIRE_HUMAN_REVIEW": "Quy chế tiếp nhận và điều phối đơn thư của UBND tỉnh Đồng Nai."
    }

    dept_names = {
        "CONG_AN_TINH": "Công an Tỉnh Đồng Nai",
        "SO_TNMT": "Sở Tài nguyên & Môi trường",
        "SO_XD": "Sở Xây dựng",
        "SO_GTVT": "Sở Giao thông Vận tải",
        "SO_YTE": "Sở Y tế",
        "SO_GDDT": "Sở Giáo dục và Đào tạo",
        "SO_LDTBXH": "Sở Lao động - Thương binh và Xã hội",
        "UBND_CAP_HUYEN": "Ban Tiếp công dân Tỉnh",
        "REQUIRE_HUMAN_REVIEW": "Ban Tiếp công dân Tỉnh"
    }

    import re
    # Bóc tách và làm sạch tiền tố thẻ kỹ thuật nếu có
    cleaned_text = re.sub(r'\[Địa chỉ:[^\]]*\]', '', user_text)
    cleaned_text = re.sub(r'\[Tiêu đề:[^\]]*\]', '', cleaned_text).strip()
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
    if not cleaned_text:
        cleaned_text = user_text.strip()

    clean_summary = cleaned_text
    if len(cleaned_text) > 300:
        clean_summary = cleaned_text[:300].rsplit(" ", 1)[0] + "..."
    if not clean_summary:
        clean_summary = "Phản ánh, kiến nghị trực tuyến của công dân"

    dept_label = dept_names.get(assigned_dept, assigned_dept)
    if legal_context == NO_LEGAL_DOC_MESSAGE:
        legal_basis = NO_LEGAL_DOC_MESSAGE
    else:
        legal_basis = legal_bases.get(assigned_dept, "Quy chế tiếp nhận và điều phối đơn thư tỉnh Đồng Nai.")
    draft = f"Kính gửi Quý công dân, phản ánh của quý vị đã được hệ thống tiếp nhận và chuyển đến {dept_label} để thẩm tra, kiểm tra thực địa và xử lý theo thẩm quyền."

    return {
        "is_fallback": True,
        "extracted_text": user_text,
        "summary": clean_summary,
        "department_code": assigned_dept,
        "dept_code": assigned_dept,
        "dept_name": dept_label,
        "department_name": dept_label,
        "priority": priority,
        "entities": {"locations": locations, "issues": ["Phản ánh, kiến nghị"]},
        "legal_basis": legal_basis,
        "draft_response": draft,
        "draft_reply": draft,
        "confidence_score": confidence,
    }


def analyze_ticket(
    model,
    user_input_text: str,
    image_parts=None,
    legal_context: Optional[str] = None,
    max_retries: int = 1
) -> dict:
    """Phân tích nội dung đơn thư và định tuyến phòng ban với fallback an toàn và RAG grounding."""
    loaded_images = load_and_normalize_images(image_parts)
    num_images = len(loaded_images)

    multi_page_guidance = ""
    if num_images > 1:
        multi_page_guidance = (
            f"--- CHỈ DẪN XỬ LÝ HỒ SƠ ĐA TRANG ({num_images} ẢNH ĐÍNH KÈM) ---\n"
            f"Người dân đã đính kèm {num_images} hình ảnh tài liệu. Các ảnh này có thể là các trang liên tiếp của một lá đơn.\n"
            f"Yêu cầu:\n"
            f"1. Xác định chính xác trình tự xuất hiện logic của từng trang.\n"
            f"2. Nối toàn bộ nội dung OCR theo đúng thứ tự logic thành một văn bản mạch lạc duy nhất vào `extracted_text`.\n"
            f"3. Dựa trên văn bản ghép hoàn chỉnh để tóm tắt, phân loại cơ quan thụ lý, trích dẫn luật và soạn dự thảo.\n"
            f"-------------------------------------------------------------------\n\n"
        )

    has_valid_legal = bool(legal_context and legal_context.strip() and legal_context.strip() != NO_LEGAL_DOC_MESSAGE)
    if has_valid_legal:
        main_prompt = (
            f"{multi_page_guidance}"
            f"--- CĂN CỨ PHÁP LUẬT TỈNH ĐỒNG NAI LIÊN QUAN NHẤT (RAG CONTEXT) ---\n"
            f"{legal_context.strip()}\n"
            f"-------------------------------------------------------------------\n\n"
            f"--- NỘI DUNG ĐƠN THƯ PHẢN ÁNH CỦA NGƯỜI DÂN CẦN XỬ LÝ ---\n"
            f"{user_input_text}\n"
            f"---------------------------------------------------------\n\n"
            f"Yêu cầu xử lý bắt buộc:\n"
            f"1. Trích dẫn chính xác tên luật, điều khoản áp dụng vào trường `legal_basis`.\n"
            f"2. Soạn thảo văn bản phản hồi công dân (`draft_response`) đúng chuẩn Nghị định 30.\n"
            f"3. Xác định đúng cơ quan có thẩm quyền trong 7 Sở/Ban/Ngành hoặc Ban Tiếp công dân Tỉnh (`department_code`), mức độ ưu tiên (`priority`), và trích xuất thực thể (`entities`).\n"
            f"4. Trường `summary` phải tóm tắt sự việc cốt lõi dưới 30 từ bằng tiếng Việt tự nhiên, KHÔNG sao chép nhãn tiền tố kỹ thuật như [Tiêu đề: ...] hay [Địa chỉ: ...]."
        )
    else:
        main_prompt = (
            f"{multi_page_guidance}"
            f"--- CĂN CỨ PHÁP LUẬT TỈNH ĐỒNG NAI (RAG CONTEXT) ---\n"
            f"Không có văn bản pháp luật nào trong kho dữ liệu đạt độ tương đồng >= {SIMILARITY_THRESHOLD}.\n"
            f"NGHIÊM CẤM TỰ BỊA ĐẶT CĂN CỨ PHÁP LUẬT (FORBID HALLUCINATING LAW).\n"
            f"Trường `legal_basis` BẮT BUỘC ĐIỀN ĐÚNG NGUYÊN VĂN: \"{NO_LEGAL_DOC_MESSAGE}\".\n"
            f"-------------------------------------------------------------------\n\n"
            f"--- NỘI DUNG ĐƠN THƯ PHẢN ÁNH CỦA NGƯỜI DÂN CẦN XỬ LÝ ---\n"
            f"{user_input_text}\n"
            f"---------------------------------------------------------\n\n"
            f"Yêu cầu xử lý bắt buộc:\n"
            f"1. Trường `legal_basis` BẮT BUỘC ĐIỀN CHÍNH XÁC: \"{NO_LEGAL_DOC_MESSAGE}\".\n"
            f"2. Soạn thảo văn bản phản hồi công dân (`draft_response`) đúng chuẩn Nghị định 30.\n"
            f"3. Xác định đúng cơ quan có thẩm quyền trong 7 Sở/Ban/Ngành hoặc Ban Tiếp công dân Tỉnh (`department_code`), mức độ ưu tiên (`priority`), và trích xuất thực thể (`entities`).\n"
            f"4. Trường `summary` phải tóm tắt sự việc cốt lõi dưới 30 từ bằng tiếng Việt tự nhiên."
        )

    contents = [main_prompt, *loaded_images]

    logger.info(f"[Gemini AI Engine] Bắt đầu gửi payload ({num_images} ảnh) sang Gemini Multimodal...")

    cur_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if not cur_key or cur_key.strip() == "" or cur_key == "your_gemini_api_key_here":
        logger.warning("[Gemini AI Engine] GEMINI_API_KEY chưa được cấu hình. Kích hoạt phân loại dự phòng.")
        return classify_complaint_fallback(user_input_text, legal_context=legal_context)

    # Danh sách các model ứng viên để tự động fallback nếu model chính bị 404 hoặc không hỗ trợ
    candidate_models = [DEFAULT_MODEL, "gemini-3.1-flash-lite", "gemini-1.5-flash"]
    # Khử trùng lặp
    models_to_try = []
    for m in candidate_models:
        if m and m not in models_to_try:
            models_to_try.append(m)

    last_error = None
    for m_name in models_to_try:
        try:
            active_model = get_ai_model(model_name=m_name)
            response = active_model.generate_content(contents, request_options={"timeout": 15})
            result = json.loads(response.text)

            # Đồng bộ hoá tên trường giữa draft_response và draft_reply
            if "draft_response" in result and "draft_reply" not in result:
                result["draft_reply"] = result["draft_response"]
            elif "draft_reply" in result and "draft_response" not in result:
                result["draft_response"] = result["draft_reply"]

            if not has_valid_legal:
                result["legal_basis"] = NO_LEGAL_DOC_MESSAGE

            dept_map = {
                "CONG_AN_TINH": "CONG_AN_TINH", "CONG_AN": "CONG_AN_TINH", "CA_TINH": "CONG_AN_TINH", "CAT": "CONG_AN_TINH",
                "SO_GTVT": "SO_GTVT", "SO_GIAOTHONG": "SO_GTVT", "GTVT": "SO_GTVT", "SGTVT": "SO_GTVT",
                "SO_TNMT": "SO_TNMT", "SO_TAINGUYEN": "SO_TNMT", "TNMT": "SO_TNMT", "STNMT": "SO_TNMT",
                "SO_XD": "SO_XD", "SO_XAYDUNG": "SO_XD", "XAYDUNG": "SO_XD", "SXD": "SO_XD",
                "SO_YTE": "SO_YTE", "SO_YT": "SO_YTE", "YTE": "SO_YTE", "SYT": "SO_YTE",
                "SO_GDDT": "SO_GDDT", "SO_GIAODUC": "SO_GDDT", "GDDT": "SO_GDDT", "SGDDT": "SO_GDDT",
                "SO_LDTBXH": "SO_LDTBXH", "SO_LAODONG": "SO_LDTBXH", "LDTBXH": "SO_LDTBXH", "SLDTBXH": "SO_LDTBXH",
                "UBND_CAP_HUYEN": "UBND_CAP_HUYEN", "UBND_HUYEN": "UBND_CAP_HUYEN", "UBND": "UBND_CAP_HUYEN",
                "UBND_TINH": "UBND_TINH",
                "REQUIRE_HUMAN_REVIEW": "REQUIRE_HUMAN_REVIEW"
            }
            raw_dept = str(result.get("department_code", "")).upper().strip()
            result["department_code"] = dept_map.get(raw_dept, "UBND_CAP_HUYEN" if result.get("confidence_score", 0) >= 0.65 else "REQUIRE_HUMAN_REVIEW")

            prio_map = {
                "CAO": "CAO", "URGENT": "CAO", "HIGH": "CAO", "KHAN_CAP": "CAO",
                "TRUNG_BINH": "TRUNG_BINH", "MEDIUM": "TRUNG_BINH", "NORMAL": "TRUNG_BINH",
                "THAP": "THAP", "LOW": "THAP"
            }
            raw_prio = str(result.get("priority", "")).upper().strip()
            result["priority"] = prio_map.get(raw_prio, "TRUNG_BINH")

            if result.get("confidence_score", 0) < 0.65:
                result["department_code"] = "REQUIRE_HUMAN_REVIEW"

            logger.info(f"[Gemini AI Engine] Phân tích thành công bằng model {m_name} | Đơn vị: {result.get('department_code')} | Độ tin cậy: {int(result.get('confidence_score', 0)*100)}% | Tóm tắt: {result.get('summary', '')[:60]}")
            return result

        except TooManyRequests as tmr:
            last_error = tmr
            logger.warning(f"[Gemini AI Engine] ⚠️ Đạt hạn mức 429 TooManyRequests với model {m_name}.")
            continue

        except Exception as e:
            last_error = e
            err_msg = str(e)
            # Nếu lỗi model không tìm thấy 404, thử model tiếp theo
            if "404" in err_msg or "not found" in err_msg.lower() or "no longer available" in err_msg.lower():
                logger.warning(f"[Gemini AI Engine] Model {m_name} không khả dụng ({err_msg}). Đang chuyển sang model tiếp theo...")
                continue
            else:
                logger.error(f"[Gemini AI Engine] ❌ Lỗi gọi Gemini API ({m_name}): {e}")
                continue

    # Nếu toàn bộ các model đều lỗi hoặc mất kết nối -> Kích hoạt Fallback
    logger.warning(f"[Gemini AI Engine] Lỗi khi gọi Gemini ({last_error}). Kích hoạt phân loại Fallback Keyword Matching...")
    fb_res = classify_complaint_fallback(user_input_text, legal_context=legal_context)
    logger.info(f"[Gemini AI Engine] Đã định tuyến dự phòng về: {fb_res.get('department_code')} ({fb_res.get('dept_name', '')}) | Căn cứ: {fb_res.get('legal_basis')} | Độ tin cậy: {int(fb_res.get('confidence_score', 0)*100)}%")
    return fb_res


def process_civic_complaint(
    user_text: str,
    image_bytes_or_part=None,
    db=None,
    legal_context: Optional[str] = None
) -> Dict[str, Any]:
    """Hàm bao (wrapper) gọi phân tích đơn thư bằng model singleton tích hợp RAG."""
    model = get_ai_model()

    if not legal_context:
        legal_context = get_rag_legal_context(user_text, db=db)

    return analyze_ticket(
        model,
        user_input_text=user_text,
        image_parts=image_bytes_or_part,
        legal_context=legal_context
    )


def reload_rag_knowledge(new_content: Optional[str] = None):
    """Cập nhật lại kho tri thức luật RAG trong bộ nhớ của mô hình mà không cần restart server."""
    global _cached_model
    _cached_model = init_civic_router_agent(custom_rag_text=new_content)
    logger.info("✓ Đã nạp lại kho tri thức RAG vào bộ nhớ Gemini thành công.")
    return True
