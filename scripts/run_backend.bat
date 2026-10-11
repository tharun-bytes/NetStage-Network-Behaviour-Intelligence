@echo off
echo ========================================================
echo  Starting NetSage FastAPI Backend on http://127.0.0.1:8000
echo ========================================================
.\venv\Scripts\uvicorn.exe backend.app.main:app --host 127.0.0.1 --port 8000 --reload
