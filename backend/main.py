"""
Hệ thống Điều phối & Xử lý Đơn thư AI - Tỉnh Đồng Nai
Main Entrypoint - Kiến trúc Modular FastAPI
"""

import sys
import os

# Cấu hình UTF-8 cho stdout/stderr trên Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings, UPLOAD_DIR
from core.database import init_db
from modules.database.connection import engine, Base
import modules.database.models  # Nạp các model để Base nhận diện trước khi create_all
from modules.ai_engine import get_ai_model
from modules.notifications.email_worker import start_email_worker_thread, worker_status
from modules.tickets import tickets_router
from modules.auth import auth_router, admin_users_router
from modules.notifications import notifications_router
from modules.rag import rag_router, seed_default_rag_knowledge
from core.database import SessionLocal


logger = logging.getLogger("DongNaiCivicServer")

# Quản lý vòng đời ứng dụng (Lifespan)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Tự động gọi lệnh tạo bảng vào Microsoft SQL Server 2025 Express
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("[SQL Server] Da thuc thi Base.metadata.create_all(bind=engine) thanh cong.")
    except Exception as e:
        logger.error(f"Loi khi create_all bang SQL Server: {e}")

    # Nạp dữ liệu cấu hình mẫu ban đầu
    init_db()

    # Tự động nạp tri thức RAG mặc định từ docs/rag_knowledge.md vào SQL Server nếu chưa có
    try:
        with SessionLocal() as db_session:
            seed_default_rag_knowledge(db_session)
    except Exception as e:
        logger.warning(f"Lỗi nạp tri thức RAG ban đầu: {e}")

    # 2. Khởi tạo trước Model Gemini Flash trong bộ nhớ
    try:
        get_ai_model()
    except Exception as e:
        logger.warning(f"Canh bao khoi tao AI Engine: {e}")

    # 3. Khởi chạy Email Worker Daemon quét Gmail định kỳ
    try:
        start_email_worker_thread()
    except Exception as e:
        logger.warning(f"Canh bao khoi chay Email Worker: {e}")

    yield


# Khởi tạo ứng dụng FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Cổng tiếp nhận đa kênh, số hóa đơn giấy (OCR), định tuyến tự động và hỗ trợ cán bộ xử lý đơn thư.",
    version=settings.VERSION,
    lifespan=lifespan
)

# Cấu hình CORS để Frontend React (Vite) gọi API thông suốt
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đảm bảo thư mục static uploads tồn tại và mount phục vụ xem trước ảnh đơn thư
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# Mount các router module nghiệp vụ độc lập
app.include_router(tickets_router)
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth V1"])
app.include_router(admin_users_router)
app.include_router(notifications_router)
app.include_router(rag_router)


# Endpoint kiểm tra sức khỏe hệ thống
@app.get("/health", tags=["Hệ Thống"])
def health_check():
    """Kiểm tra tình trạng hoạt động của API Server."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "email_worker": worker_status
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
