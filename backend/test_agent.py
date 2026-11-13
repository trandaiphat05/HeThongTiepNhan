import sys
import time
import json

sys.stdout.reconfigure(encoding="utf-8")

import ai_agent

print("--- Khởi tạo Agent DongNai-CivicRouter-AI ---")
model = ai_agent.init_civic_router_agent()

test_ticket = (
    "Đoạn đường Nguyễn Ái Quốc gần ngã tư Tân Phong, Biên Hòa bị sụt lún xuất hiện ổ gà lớn "
    "gây tai nạn liên tục cho người đi xe máy mấy hôm nay. Đề nghị cơ quan chức năng dặm vá gấp."
)

print(f"\n[Test Input]:\n{test_ticket}\n")
print("Đang phân tích và định tuyến...")

result = ai_agent.analyze_ticket(model, test_ticket)
print("\n[Kết quả phân tích JSON]:")
print(json.dumps(result, ensure_ascii=False, indent=2))

