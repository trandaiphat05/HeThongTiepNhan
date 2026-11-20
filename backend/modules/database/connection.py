"""
Module Kết nối Cơ sở Dữ liệu SQL Server 2025 Express (SQLAlchemy 2.0)
Hỗ trợ quản lý engine, SessionLocal, và dependency get_db() cho FastAPI.
"""

import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Nạp cấu hình từ .env hoặc settings tập trung
from core.config import settings, BASE_DIR

logger = logging.getLogger("DongNaiCivicDB")
logger.setLevel(logging.INFO)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    r"mssql+pyodbc://@localhost\SQLEXPRESS02/DongNaiCivicDB?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes&TrustServerCertificate=yes"
)

engine = None
USE_SQLITE = False

# Khởi tạo engine kết nối Microsoft SQL Server hoặc SQLite dự phòng
try:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=1800,
        # Đảm bảo pyodbc truyền tải chuỗi Unicode qua SQL_WVARCHAR nguyên bản
        fast_executemany=False,
    )
    # Kiểm tra kết nối thực tế tới SQL Server
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("✓ Kết nối thành công Cơ sở dữ liệu Microsoft SQL Server (SQLEXPRESS02 / DongNaiCivicDB).")
except Exception as e:
    logger.warning(f"Không thể kết nối SQL Server ({e}). Chuyển sang SQLite dự phòng.")
    DB_PATH = os.path.join(BASE_DIR, "dongnai_civic.db")
    engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
    USE_SQLITE = True

# Khởi tạo SessionLocal và Base ORM
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Dependency get_db cung cấp Session cho FastAPI Router
def get_db():
    """Dependency cung cấp Session Database và tự động đóng sau khi hoàn tất request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

