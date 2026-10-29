
@echo off
cd /d "%~dp0"

echo ==========================================
echo          PE-FedHealth Project
echo ==========================================
echo Starting Backend...

start "PE-FedHealth Backend" cmd /k "cd /d ""%~dp0"" && py -3.10 -m uvicorn backend.main:app --host 127.0.0.1 --port 8001"

timeout /t 5 /nobreak >nul

echo Starting Frontend...

start "PE-FedHealth Frontend" cmd /k "cd /d ""%~dp0frontend-ui"" && npm run dev -- --host 127.0.0.1 --port 5174"

timeout /t 5 /nobreak >nul

echo Opening PE-FedHealth Dashboard...
start "" "http://127.0.0.1:5174"

echo.
echo Backend:  http://127.0.0.1:8001/docs
echo Frontend: http://127.0.0.1:5174
echo.
pause
