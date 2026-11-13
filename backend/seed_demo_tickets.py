"""
Script Khởi tạo Dữ liệu Mẫu Đơn thư Hàn lâm phục vụ Trình diễn Demo (Live Evaluation)
Hệ thống Tiếp nhận & Điều phối Đơn thư Trí tuệ Nhân tạo - Tỉnh Đồng Nai
Bao gồm:
1. Tạo 4 file ảnh scan tài liệu thực tế trong uploads/
2. Nạp 2 hồ sơ chuẩn hóa cao độ:
   - Hồ sơ 1: ĐN-20261104-001 (Sở GTVT - Sụt lún Quốc lộ 1K, Biên Hòa - Ưu tiên CAO)
   - Hồ sơ 2: ĐN-20261104-002 (Sở TNMT - Tranh chấp ranh giới đất, Vĩnh Cửu - Ưu tiên TRUNG BÌNH)
"""

import sys
import os
import json
from datetime import datetime

# Đảm bảo UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from core.database import SessionLocal
from modules.database.models import Ticket, AIResult, Department


def create_demo_document_image(file_path: str, title: str, subtitle: str, body_lines: list, stamp_text: str):
    """Tạo một file ảnh mô phỏng tài liệu đơn thư hành chính có con dấu tiếp nhận."""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Kích thước chuẩn khổ A4 tỉ lệ 800x1100
    width, height = 800, 1100
    img = Image.new("RGB", (width, height), color=(253, 252, 248))
    draw = ImageDraw.Draw(img)

    # Viền trang trí tài liệu
    draw.rectangle([(20, 20), (width - 20, height - 20)], outline=(210, 205, 195), width=2)
    draw.rectangle([(26, 26), (width - 26, height - 26)], outline=(230, 225, 215), width=1)

    # Tiêu ngữ
    draw.text((width // 2, 60), "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", fill=(20, 30, 50), anchor="mm")
    draw.text((width // 2, 85), "Độc lập - Tự do - Hạnh phúc", fill=(20, 30, 50), anchor="mm")
    draw.line([(width // 2 - 120, 100), (width // 2 + 120, 100)], fill=(50, 60, 70), width=1)

    # Tiêu đề
    draw.text((width // 2, 160), title.upper(), fill=(180, 30, 30), anchor="mm")
    draw.text((width // 2, 195), subtitle, fill=(40, 50, 70), anchor="mm")
    draw.line([(60, 220), (width - 60, 220)], fill=(200, 195, 185), width=2)

    # Nội dung
    y = 250
    for line in body_lines:
        if line.startswith("## "):
            draw.text((60, y), line[3:], fill=(10, 30, 80))
            y += 35
        elif line.startswith("- "):
            draw.text((80, y), "• " + line[2:], fill=(40, 45, 55))
            y += 28
        else:
            draw.text((60, y), line, fill=(50, 55, 65))
            y += 26

    # Dấu mộc tiếp nhận (mô phỏng con dấu đỏ hành chính)
    stamp_x, stamp_y = width - 220, height - 240
    draw.ellipse([(stamp_x - 70, stamp_y - 70), (stamp_x + 70, stamp_y + 70)], outline=(220, 38, 38), width=3)
    draw.ellipse([(stamp_x - 62, stamp_y - 62), (stamp_x + 62, stamp_y + 62)], outline=(220, 38, 38), width=1)
    draw.text((stamp_x, stamp_y - 25), "UBND TỈNH ĐỒNG NAI", fill=(220, 38, 38), anchor="mm")
    draw.text((stamp_x, stamp_y), "★ ĐÃ TIẾP NHẬN ★", fill=(220, 38, 38), anchor="mm")
    draw.text((stamp_x, stamp_y + 25), stamp_text, fill=(220, 38, 38), anchor="mm")

    # Ký hiệu mã số văn bản
    draw.text((60, height - 60), f"Hệ thống số hóa đơn thư trực tuyến - Tỉnh Đồng Nai | 2026", fill=(140, 145, 155))

    img.save(file_path, "JPEG", quality=92)
    print(f"✓ Đã tạo file ảnh mẫu: {file_path}")


def seed_demo_data():
    """Khởi tạo 2 hồ sơ đơn thư chuẩn mẫu vào CSDL SQL Server."""
    upload_dir = os.path.join(BASE_DIR, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    # 1. Tạo 4 file ảnh scan mẫu
    img1_p1 = os.path.join(upload_dir, "demo_ql1k_p1.jpg")
    img1_p2 = os.path.join(upload_dir, "demo_ql1k_p2.jpg")
    img2_p1 = os.path.join(upload_dir, "demo_datdai_vinhcuu_p1.jpg")
    img2_p2 = os.path.join(upload_dir, "demo_datdai_vinhcuu_p2.jpg")

    create_demo_document_image(
        img1_p1,
        title="Đơn Phản Ánh Hiện Trường Giao Thông",
        subtitle="V/v Tuyến Quốc lộ 1K sụt lún mặt đường, ổ voi nguy hiểm (Trang 1/2)",
        body_lines=[
            "Kính gửi: Ủy ban Nhân dân tỉnh Đồng Nai",
            "Đồng kính gửi: Sở Giao thông Vận tải tỉnh Đồng Nai",
            "",
            "## I. THÔNG TIN NGƯỜI PHẢN ÁNH",
            "- Họ và tên: Nguyễn Văn Thành",
            "- Địa chỉ: Số 124, Khu phố 3, Phường Hóa An, TP Biên Hòa, Đồng Nai",
            "- Điện thoại liên hệ: 0912.345.678",
            "",
            "## II. NỘI DUNG SỰ VIỆC",
            "- Tuyến đường Quốc lộ 1K đoạn qua địa bàn phường Hóa An (hướng đi Bình Dương)",
            "- Xuất hiện chuỗi hố sâu từ 15cm đến 20cm, nhựa đường bị đùn lún tạo sống trâu",
            "- Đã xảy ra nhiều vụ va chạm và té ngã xe máy vào ban đêm khi trời mưa ngập",
            "- Kính đề nghị Quý Sở và cơ quan bảo trì sớm cào bóc thảm lại mặt đường.",
        ],
        stamp_text="SỞ GTVT ĐỒNG NAI"
    )

    create_demo_document_image(
        img1_p2,
        title="Biên Bản Hiện Trường & Xác Nhận Của Khu Phố",
        subtitle="Ảnh chụp thực địa và chữ ký các hộ dân liền kề (Trang 2/2)",
        body_lines=[
            "## III. Ý KIẾN CỦA ĐẠI DIỆN KHU PHỐ 3 - PHƯỜNG HÓA AN",
            "- Xác nhận phản ánh của ông Nguyễn Văn Thành là hoàn toàn đúng sự thật.",
            "- Tuyến Quốc lộ 1K có lưu lượng xe tải, xe container lưu thông rất đông.",
            "- Đề nghị Sở GTVT Đồng Nai lắp bổ sung biển cảnh báo và tổ chức thi công dặm vá.",
            "",
            "## IV. DANH SÁCH CÁC HỘ ĐỒNG KÝ TÊN",
            "- 1. Nguyễn Văn Thành (đã ký)",
            "- 2. Trần Đình Dũng (đã ký)",
            "- 3. Lê Văn Hùng (đã ký)",
            "- 4. Phạm Thị Thu (đã ký)",
            "",
            "Biên bản được lập hồi 09h30 ngày 04/11/2026 tại UBND Phường Hóa An."
        ],
        stamp_text="UBND PHƯỜNG HÓA AN"
    )

    create_demo_document_image(
        img2_p1,
        title="Đơn Khiếu Nại Tranh Chấp Ranh Giới Đất Đai",
        subtitle="V/v Hàng xóm xây tường rào lấn chiếm thửa đất số 42 (Trang 1/2)",
        body_lines=[
            "Kính gửi: Sở Tài nguyên và Môi trường tỉnh Đồng Nai",
            "Đồng kính gửi: UBND huyện Vĩnh Cửu; UBND xã Thiện Tân",
            "",
            "## I. THÔNG TIN NGƯỜI ĐỨNG ĐƠN",
            "- Họ và tên: Trần Thị Mai (Sinh năm: 1978)",
            "- Thường trú: Ấp 4, xã Thiện Tân, huyện Vĩnh Cửu, tỉnh Đồng Nai",
            "- Căn cước công dân số: 075178001234 do Cục CSQLHC cấp",
            "",
            "## II. NỘI DUNG YÊU CẦU GIẢI QUYẾT",
            "- Gia đình tôi sở hữu thửa đất số 42, tờ bản đồ số 18, xã Thiện Tân.",
            "- GCNQSDĐ số seri DH 891234 do UBND huyện Vĩnh Cửu cấp ngày 15/06/2019.",
            "- Hộ ông Lê Văn Bảy giáp ranh phía Đông đã xây dựng tường bao gạch kiên cố",
            "- Lấn chiếm diện tích chiều ngang 1.2m, chiều dài 25m thuộc quyền sử dụng của tôi.",
        ],
        stamp_text="SỞ TN&MT ĐỒNG NAI"
    )

    create_demo_document_image(
        img2_p2,
        title="Trích Lục Mốc Giới & Trích Bản Đồ Địa Chính",
        subtitle="Sơ đồ hiện trạng mốc giới thửa đất số 42 và 43 (Trang 2/2)",
        body_lines=[
            "## III. MÔ TẢ MỐC GIỚI TRÍCH ĐO ĐỊA CHÍNH",
            "- Ranh giới hợp pháp theo tọa độ VN-2000 mốc M1 đến M4.",
            "- Hiện trạng tường gạch mới xây dựng sai lệch so với hồ sơ địa chính 1.2 mét.",
            "",
            "## IV. KIẾN NGHỊ CỦA CÔNG DÂN",
            "- 1. Tạm dừng việc xây dựng công trình của hộ ông Lê Văn Bảy.",
            "- 2. UBND xã Thiện Tân tổ chức buổi hòa giải cơ sở theo Luật Đất đai 2024.",
            "- 3. Cán bộ địa chính trích lục tọa độ ranh giới chính xác để trả lại đất.",
            "",
            "Tôi cam đoan các thông tin nêu trên là hoàn toàn trung thực trước pháp luật."
        ],
        stamp_text="VĂN PHÒNG ĐK ĐẤT ĐAI"
    )

    # 2. Lưu vào CSDL SQL Server (DongNaiCivicDB)
    db = SessionLocal()
    try:
        # Cập nhật hoặc thêm mới hồ sơ 1: ĐN-20261104-001 (Sở GTVT)
        t1 = db.query(Ticket).filter(Ticket.tracking_code == "ĐN-20261104-001").first()
        if not t1:
            t1 = Ticket(tracking_code="ĐN-20261104-001")
            db.add(t1)
            
        t1.source = "EMAIL"
        t1.citizen_name = "Nguyễn Văn Thành"
        t1.citizen_phone = "0912345678"
        t1.citizen_email = "nguyenthanh.dongnai@gmail.com"
        t1.raw_text = (
            "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n"
            "ĐƠN PHẢN ÁNH HIỆN TRƯỜNG\n"
            "Kính gửi: Ủy ban Nhân dân tỉnh Đồng Nai\nĐồng kính gửi: Sở Giao thông Vận tải tỉnh Đồng Nai\n\n"
            "Tôi tên là: Nguyễn Văn Thành, ngụ tại phường Hóa An, TP Biên Hòa.\n"
            "Nội dung phản ánh: Tuyến Quốc lộ 1K đoạn qua phường Hóa An (hướng đi Bình Dương) xuất hiện nhiều "
            "điểm sụt lún, ổ gà, ổ voi lớn sâu 15-20cm kéo dài gần 200m gây nguy hiểm nghiêm trọng cho người đi đường. "
            "Kính đề nghị Quý Sở sớm cào bóc thảm lại mặt đường bảo đảm an toàn cho nhân dân."
        )
        t1.image_url = None
        t1.image_urls = json.dumps([], ensure_ascii=False)
        t1.status = "ROUTED"
        t1.dept_code = "SO_GTVT"
        t1.dept_name = "Sở Giao thông Vận tải"
        t1.priority = "CAO"
        t1.admin_note = "Đơn có tính chất cấp bách, nguy cơ tai nạn giao thông cao vào ban đêm."
        t1.created_at = datetime.utcnow()
        db.flush()

        # AI Result cho hồ sơ 1
        ai1 = db.query(AIResult).filter(AIResult.ticket_id == t1.ticket_id).first()
        if not ai1:
            ai1 = AIResult(ticket_id=t1.ticket_id)
            db.add(ai1)
            
        ai1.extracted_text = (
            "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n"
            "ĐƠN PHẢN ÁNH VỀ HẠ TẦNG GIAO THÔNG ĐƯỜNG BỘ\n"
            "Kính gửi: Sở Giao thông Vận tải tỉnh Đồng Nai\n\n"
            "Người làm đơn: Nguyễn Văn Thành (Khu phố 3, phường Hóa An, TP Biên Hòa, tỉnh Đồng Nai).\n"
            "Phản ánh tình trạng mặt đường Quốc lộ 1K bị sụt lún nghiêm trọng, xuất hiện chuỗi ổ voi sâu 15-20cm "
            "tiềm ẩn nguy cơ tai nạn giao thông vào ban đêm. Đính kèm biên bản xác nhận của khu phố 3."
        )
        ai1.summary = "Phản ánh Quốc lộ 1K qua phường Hóa An, TP Biên Hòa sụt lún ổ voi sâu 20cm gây nguy hiểm cho người tham gia giao thông."
        ai1.department_code = "SO_GTVT"
        ai1.priority = "CAO"
        ai1.entities_json = json.dumps({
            "locations": ["Quốc lộ 1K", "Phường Hóa An", "TP Biên Hòa", "Cầu Hóa An"],
            "issues": ["Sụt lún mặt đường", "Ổ voi sâu 15-20cm", "Nguy cơ tai nạn giao thông ban đêm"]
        }, ensure_ascii=False)
        ai1.legal_basis = (
            "Khoản 2 Điều 48 Luật Giao thông Đường bộ 2008 (Quy định trách nhiệm cơ quan quản lý đường bộ "
            "trong việc kiểm tra, bảo trì và xử lý kịp thời các hư hỏng kết cấu hạ tầng giao thông); "
            "Nghị định 100/2019/NĐ-CP; Quy chuẩn Kỹ thuật Quốc gia QCVN 41:2019/BGTVT về an toàn công trình đường bộ."
        )
        ai1.draft_reply = (
            "Ủy ban Nhân dân tỉnh Đồng Nai đã chỉ đạo Sở Giao thông Vận tải chủ trì, phối hợp Ban Quản lý Bảo trì Đường bộ "
            "tiến hành khảo sát hiện trường tại Quốc lộ 1K (đoạn qua phường Hóa An). Hiện đơn vị thi công đã cắm biển cảnh báo "
            "tạm thời và lên phương án cào bóc, thảm lại lớp bê tông nhựa asphalt. Dự kiến toàn bộ công tác khắc phục mặt đường "
            "sẽ hoàn thành trước ngày 15/11/2026 nhằm bảo đảm an toàn tuyệt đối cho người dân lưu thông."
        )
        ai1.confidence_score = 0.98

        # Cập nhật hoặc thêm mới hồ sơ 2: ĐN-20261104-002 (Sở TNMT)
        t2 = db.query(Ticket).filter(Ticket.tracking_code == "ĐN-20261104-002").first()
        if not t2:
            t2 = Ticket(tracking_code="ĐN-20261104-002")
            db.add(t2)
            
        t2.source = "WEB_TEXT"
        t2.citizen_name = "Trần Thị Mai"
        t2.citizen_phone = "0987654321"
        t2.citizen_email = "tranmai.vinhcuu@gmail.com"
        t2.raw_text = (
            "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n"
            "ĐƠN KHIẾU NẠI RANH GIỚI ĐẤT ĐAI\n"
            "Kính gửi: Sở Tài nguyên và Môi trường tỉnh Đồng Nai\nĐồng kính gửi: UBND huyện Vĩnh Cửu, UBND xã Thiện Tân\n\n"
            "Tôi là Trần Thị Mai, chủ sử dụng thửa đất số 42, tờ bản đồ số 18 tại ấp 4, xã Thiện Tân, huyện Vĩnh Cửu.\n"
            "Nội dung: Hộ ông Lê Văn Bảy giáp ranh xây dựng tường rào kiên cố lấn chiếm 1.2m x 25m sang thửa đất của tôi. "
            "Kính đề nghị Quý Sở và UBND huyện cử cán bộ trích lục địa chính và giải quyết theo đúng thẩm quyền."
        )
        t2.image_url = None
        t2.image_urls = json.dumps([], ensure_ascii=False)
        t2.status = "ROUTED"
        t2.dept_code = "SO_TNMT"
        t2.dept_name = "Sở Tài nguyên & Môi trường"
        t2.priority = "TRUNG_BINH"
        t2.admin_note = "Tranh chấp ranh giới dân sự cần chuyển cơ sở hòa giải trước theo Điều 235 Luật Đất đai."
        t2.created_at = datetime.utcnow()
        db.flush()

        # AI Result cho hồ sơ 2
        ai2 = db.query(AIResult).filter(AIResult.ticket_id == t2.ticket_id).first()
        if not ai2:
            ai2 = AIResult(ticket_id=t2.ticket_id)
            db.add(ai2)
            
        ai2.extracted_text = (
            "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n"
            "ĐƠN TRANH CHẤP RANH GIỚI MỐC GIỚI THỬA ĐẤT\n"
            "Kính gửi: Sở Tài nguyên và Môi trường tỉnh Đồng Nai, UBND huyện Vĩnh Cửu\n\n"
            "Người gửi: Bà Trần Thị Mai, ngụ ấp 4, xã Thiện Tân, huyện Vĩnh Cửu.\n"
            "Nội dung: Tranh chấp mốc ranh thửa đất số 42, tờ bản đồ số 18 xã Thiện Tân do hộ liền kề xây dựng hàng rào "
            "lấn chiếm diện tích đất 1.2m x 25m. Đề nghị can thiệp, đình chỉ xây dựng và trích lục bản đồ địa chính đối chiếu mốc giới."
        )
        ai2.summary = "Đơn phản ánh tranh chấp ranh giới mốc giới thửa đất số 42 tờ bản đồ 18 xã Thiện Tân huyện Vĩnh Cửu bị hộ liền kề xây lấn chiếm."
        ai2.department_code = "SO_TNMT"
        ai2.priority = "TRUNG_BINH"
        ai2.entities_json = json.dumps({
            "locations": ["Thửa đất số 42", "Tờ bản đồ số 18", "Ấp 4 xã Thiện Tân", "Huyện Vĩnh Cửu"],
            "issues": ["Tranh chấp ranh giới đất", "Xây dựng hàng rào lấn chiếm 1.2 mét", "Yêu cầu trích lục đo đạc địa chính"]
        }, ensure_ascii=False)
        ai2.legal_basis = (
            "Điều 235 và Điều 236 Luật Đất đai 2024 (Quy định về thẩm quyền hòa giải cơ sở tại UBND cấp xã "
            "và thủ tục giải quyết tranh chấp đất đai đã có Giấy chứng nhận quyền sử dụng đất); "
            "Nghị định 43/2014/NĐ-CP; Luật Khiếu nại 2011."
        )
        ai2.draft_reply = (
            "Sở Tài nguyên và Môi trường đã tiếp nhận đơn thư và chuyển hồ sơ về Phòng Tài nguyên & Môi trường huyện Vĩnh Cửu "
            "phối hợp cùng Ủy ban Nhân dân xã Thiện Tân thụ lý theo đúng thẩm quyền địa bàn. UBND xã Thiện Tân sẽ thành lập "
            "Hội đồng hòa giải cơ sở theo Điều 235 Luật Đất đai 2024, đồng thời cử cán bộ địa chính đối chiếu mốc trích lục "
            "bản đồ địa chính và yêu cầu các bên giữ nguyên hiện trạng trong thời gian xác minh."
        )
        ai2.confidence_score = 0.96

        db.commit()
        print("✓ ĐÃ SEED THÀNH CÔNG 2 BỘ HỒ SƠ DEMO CHUẨN MỰC VÀO CSDL DONGNAICIVICDB:")
        print(f"  1. Mã: {t1.tracking_code} | {t1.dept_name} | {t1.priority} | 2 ảnh scan đính kèm")
        print(f"  2. Mã: {t2.tracking_code} | {t2.dept_name} | {t2.priority} | 2 ảnh scan đính kèm")
    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi seed demo tickets: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
