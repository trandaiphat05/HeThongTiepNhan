import os
from PIL import Image, ImageDraw, ImageFont

def get_font(font_name="arial.ttf", size=24):
    font_paths = [
        os.path.join("C:\\Windows\\Fonts", font_name),
        os.path.join("C:\\Windows\\Fonts", "times.ttf"),
        os.path.join("C:\\Windows\\Fonts", "calibri.ttf"),
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_notebook_paper(width=1200, height=1600):
    # Khởi tạo nền giấy kẻ ngang hơi ngả vàng/kem
    img = Image.new("RGB", (width, height), color=(253, 252, 248))
    draw = ImageDraw.Draw(img)

    # Đường kẻ đỏ lề trái
    margin_x = 120
    draw.line([(margin_x, 0), (margin_x, height)], fill=(235, 130, 130), width=2)

    # Các đường kẻ ngang xanh nhạt
    line_spacing = 42
    start_y = 120
    for y in range(start_y, height - 60, line_spacing):
        draw.line([(0, y), (width, y)], fill=(215, 230, 245), width=1)

    return img, draw

def generate_page_1(output_path):
    img, draw = draw_notebook_paper()
    font_header = get_font("arialbd.ttf", 26)
    font_sub = get_font("arial.ttf", 22)
    font_title = get_font("arialbd.ttf", 30)
    font_body = get_font("arial.ttf", 23)
    font_bold = get_font("arialbd.ttf", 23)

    margin_x = 150
    curr_y = 95

    # Quốc hiệu & Tiêu ngữ
    draw.text((400, curr_y), "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", fill=(20, 20, 20), font=font_header)
    curr_y += 35
    draw.text((490, curr_y), "Độc lập - Tự do - Hạnh phúc", fill=(20, 20, 20), font=font_sub)
    curr_y += 15
    draw.line([(470, curr_y + 15), (730, curr_y + 15)], fill=(40, 40, 40), width=2)
    curr_y += 75

    # Tiêu đề đơn
    draw.text((450, curr_y), "ĐƠN PHẢN ÁNH", fill=(10, 40, 100), font=font_title)
    curr_y += 40
    draw.text((290, curr_y), "V/v Sụt lún, ổ voi ổ gà nguy hiểm trên Quốc lộ 1K", fill=(10, 40, 100), font=font_header)
    curr_y += 70

    # Kính gửi
    draw.text((margin_x, curr_y), "Kính gửi: ", fill=(20, 20, 20), font=font_bold)
    draw.text((margin_x + 110, curr_y), "Sở Giao thông Vận tải tỉnh Đồng Nai", fill=(20, 20, 20), font=font_body)
    curr_y += 45
    draw.text((margin_x + 110, curr_y), "Ủy ban nhân dân thành phố Biên Hòa", fill=(20, 20, 20), font=font_body)
    curr_y += 65

    # Thông tin người làm đơn
    draw.text((margin_x, curr_y), "Tôi tên là: ", fill=(20, 20, 20), font=font_bold)
    draw.text((margin_x + 120, curr_y), "Nguyễn Văn An                Sinh năm: 1982", fill=(20, 20, 20), font=font_body)
    curr_y += 45

    draw.text((margin_x, curr_y), "Số CCCD: ", fill=(20, 20, 20), font=font_bold)
    draw.text((margin_x + 120, curr_y), "075082009876 cấp ngày 15/03/2021 tại Cục CSQLHC", fill=(20, 20, 20), font=font_body)
    curr_y += 45

    draw.text((margin_x, curr_y), "Thường trú: ", fill=(20, 20, 20), font=font_bold)
    draw.text((margin_x + 140, curr_y), "Số 142 Bùi Hữu Nghĩa, P. Hóa An, TP. Biên Hòa, Đồng Nai", fill=(20, 20, 20), font=font_body)
    curr_y += 45

    draw.text((margin_x, curr_y), "Số điện thoại: ", fill=(20, 20, 20), font=font_bold)
    draw.text((margin_x + 160, curr_y), "0918.234.567", fill=(20, 20, 20), font=font_body)
    curr_y += 65

    # Nội dung phản ánh
    draw.text((margin_x, curr_y), "Nội dung phản ánh sự việc như sau:", fill=(20, 20, 20), font=font_bold)
    curr_y += 45

    body_lines = [
        "Hiện nay, đoạn đường Quốc lộ 1K đi qua địa phận phường Hóa An, TP Biên Hòa",
        "(ngay đoạn gần ngã ba Cầu Hóa An, đối diện trường Tiểu học Hóa An) xuất hiện",
        "tình trạng sụt lún mặt đường nhựa nghiêm trọng kéo dài hơn 25 mét.",
        "Mặt đường có nhiều ổ gà, ổ voi sâu từ 15cm đến 20cm đọng nước đen bẩn.",
        "Mỗi ngày tuyến đường này có lưu lượng xe tải nặng và xe container lưu thông",
        "rất lớn gây rung chấn, làm sụt lún ngày càng sâu và lan rộng.",
        "Trong tuần qua, đã có ít nhất 4 trường hợp người dân đi xe máy vào ban đêm",
        "bị sụp hố ngã té, chấn thương tay chân rất nguy hiểm đến tính mạng.",
    ]

    for line in body_lines:
        draw.text((margin_x, curr_y), line, fill=(30, 30, 30), font=font_body)
        curr_y += 42

    # Footer trang
    draw.text((540, 1530), "--- Trang 1 / 2 ---", fill=(120, 120, 120), font=font_sub)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, quality=90)
    print(f"[OK] Đã tạo thành công ảnh Trang 1: {output_path}")

def generate_page_2(output_path):
    img, draw = draw_notebook_paper()
    font_sub = get_font("arial.ttf", 22)
    font_body = get_font("arial.ttf", 23)
    font_bold = get_font("arialbd.ttf", 23)
    font_sig = get_font("times.ttf", 28)

    margin_x = 150
    curr_y = 120

    body_lines = [
        "(Tiếp theo nội dung đơn phản ánh trang 1)",
        "",
        "Trước thực trạng mất an toàn giao thông nghiêm trọng nêu trên,",
        "tôi làm đơn này kính đề nghị Ban Giám đốc Sở Giao thông Vận tải tỉnh Đồng Nai",
        "chỉ đạo các đơn vị duy tu, bảo trì đường bộ khẩn trương thực hiện:",
        "",
        "1. Cử cán bộ kỹ thuật kiểm tra hiện trường, đặt biển cảnh báo đoạn đường sụt lún.",
        "2. Sớm triển khai thi công san lấp, cào bóc và thảm lại bê tông nhựa nóng dứt điểm.",
        "3. Lắp đặt bổ sung hệ thống chiếu sáng đô thị để đảm bảo an toàn cho bà con.",
        "",
        "Tôi xin cam đoan các nội dung phản ánh trên là hoàn toàn đúng sự thật khách quan.",
        "Nếu có bất kỳ điều gì sai sự thật, tôi xin chịu hoàn toàn trách nhiệm trước pháp luật.",
        "",
        "Kính mong Quý Cơ quan sớm xem xét, giải quyết thỏa đáng.",
        "Tôi xin chân thành cảm ơn!"
    ]

    for line in body_lines:
        if line.startswith("1.") or line.startswith("2.") or line.startswith("3."):
            draw.text((margin_x + 30, curr_y), line, fill=(20, 20, 20), font=font_bold)
        else:
            draw.text((margin_x, curr_y), line, fill=(30, 30, 30), font=font_body)
        curr_y += 42

    curr_y += 60
    # Ngày tháng & Ký tên
    draw.text((680, curr_y), "Biên Hòa, ngày 11 tháng 11 năm 2026", fill=(30, 30, 30), font=font_body)
    curr_y += 40
    draw.text((760, curr_y), "Người làm đơn", fill=(20, 20, 20), font=font_bold)
    curr_y += 30
    draw.text((740, curr_y), "(Ký và ghi rõ họ tên)", fill=(100, 100, 100), font=font_sub)
    
    # Mô phỏng chữ ký tay
    curr_y += 60
    draw.text((750, curr_y), "NguyenVanAn", fill=(10, 30, 120), font=font_sig)
    
    curr_y += 50
    draw.text((750, curr_y), "Nguyễn Văn An", fill=(20, 20, 20), font=font_bold)

    # Footer trang
    draw.text((540, 1530), "--- Trang 2 / 2 ---", fill=(120, 120, 120), font=font_sub)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, quality=90)
    print(f"[OK] Đã tạo thành công ảnh Trang 2: {output_path}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sample_dir = os.path.join(base_dir, "sample_tickets")
    p1 = os.path.join(sample_dir, "page_1_khieunai.jpg")
    p2 = os.path.join(sample_dir, "page_2_chuki.jpg")
    generate_page_1(p1)
    generate_page_2(p2)

