@echo off
echo ==============================================
echo  Paisa Saathi - Local Dev Launcher
echo ==============================================

echo Starting FastAPI Backend in background on http://localhost:8000 ...
start "Paisa Saathi Backend" cmd /k ".\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --port 8000"

echo Starting Vite Frontend on http://localhost:5173 ...
cd frontend
npm run dev
