@echo off
chcp 65001 >nul
echo =====================================================================
echo  HỆ THỐNG ĐIỀU PHỐI ĐƠN THƯ AI TỈNH ĐỒNG NAI (DONGNAI CIVIC ROUTER)
echo  Khởi chạy đồng thời Backend FastAPI và Frontend React Vite...
echo =====================================================================
echo.

:: 1. Khởi chạy Backend FastAPI trong cửa sổ riêng
echo [1/2] Đang khởi động Backend FastAPI (Port 8000)...
start "Backend FastAPI (DongNai Civic Router)" cmd /k "title Backend FastAPI && cd /d %~dp0backend && (if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat) && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Đợi 2 giây để Backend khởi tạo CSDL và Socket
ping 127.0.0.1 -n 3 >nul

:: 2. Khởi chạy Frontend React trong cửa sổ riêng
echo [2/2] Đang khởi động Frontend React Vite (Port 5173)...
start "Frontend React (DongNai Civic Portal)" cmd /k "title Frontend React && cd /d %~dp0frontend && npm run dev"

echo.
echo =====================================================================
echo  ✓ Cả hai dịch vụ đã được khởi chạy thành công trong 2 cửa sổ riêng biệt!
echo  - Cổng Công Dân & Bàn Làm Việc: http://localhost:5173
echo  - API Tài Liệu Swagger Backend : http://localhost:8000/docs
echo  - Dừng nhanh toàn bộ hệ thống : Chạy file 'stop.bat'
echo =====================================================================
pause
