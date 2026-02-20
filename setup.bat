@echo off
REM Setup Script for Windows
REM Install and run both backend and frontend

echo.
echo ========================================
echo  Real or Cap - Setup & Run
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.9+
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+
    pause
    exit /b 1
)

echo [✓] Python and Node.js detected

REM Setup Backend
echo.
echo Setting up Backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo [✓] Backend setup complete

REM Setup Frontend
echo.
echo Setting up Frontend...
cd ..\frontend

if not exist "node_modules" (
    echo Installing Node dependencies...
    call npm install
)

echo.
echo [✓] Frontend setup complete

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo To start the application, run:
echo.
echo 1. In one terminal (Backend):
echo    cd backend
echo    venv\Scripts\activate.bat
echo    python app.py
echo.
echo 2. In another terminal (Frontend):
echo    cd frontend
echo    npm start
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
pause
