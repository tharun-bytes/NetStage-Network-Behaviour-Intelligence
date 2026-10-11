@echo off
echo ========================================================
echo  NetSage — Environment & Dependencies Setup
echo ========================================================

echo [1/3] Setting up Python virtual environment (venv)...
python -m venv venv
if %ERRORLEVEL% neq 0 (
    echo Failed to create virtualenv. Please ensure Python 3.11+ is installed.
    exit /b %ERRORLEVEL%
)

echo [2/3] Installing Backend ML & API dependencies...
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r backend/requirements.txt
if %ERRORLEVEL% neq 0 (
    echo Backend dependencies installation failed.
    exit /b %ERRORLEVEL%
)

echo [3/3] Installing Frontend React / TypeScript dependencies...
cd frontend
call npm install
cd ..

echo ========================================================
echo  Setup Completed Successfully!
echo  Use scripts/run_backend.bat to start FastAPI backend.
echo  Use scripts/run_frontend.bat to start Vite frontend.
echo ========================================================
