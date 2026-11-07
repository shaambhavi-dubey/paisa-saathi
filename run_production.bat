@echo off
echo ==============================================
echo  Paisa Saathi - Production Server Launcher
echo ==============================================

echo [1/2] Building React frontend bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Starting FastAPI backend on http://localhost:8000 ...
.\venv\Scripts\python.exe -m uvicorn backend.app:app --host 0.0.0.0 --port 8000

