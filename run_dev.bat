@echo off
chcp 65001 >nul
title KHOI DONG HE THONG DIEU PHOI DON THU AI - DONG NAI
echo ===================================================================
echo   HỆ THỐNG ĐIỀU PHỐI ĐƠN THƯ AI - TỈNH ĐỒNG NAI
echo ===================================================================
echo.
echo [1/2] Đang khởi động Backend FastAPI (Cổng 8000)...
start "Backend FastAPI" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Đang khởi động Frontend React Vite (Cổng 3000)...
start "Frontend React" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================================
echo ✓ Cả hai phân hệ đã được khởi chạy trong 2 cửa sổ riêng biệt!
echo.
echo - Frontend:  http://localhost:3000
echo - Backend:   http://127.0.0.1:8000
echo - Swagger:   http://127.0.0.1:8000/docs
echo ===================================================================
echo.
pause

