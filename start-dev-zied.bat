@echo off
REM Start backend and wait for it to launch
start "Backend" cmd /k "cd backend && npm run start:dev"
:waitloop
timeout /t 2 >nul
REM Check if backend is running by looking for the process (node)
tasklist | findstr /i "node.exe" >nul
if errorlevel 1 (
    goto waitloop
)
REM Now start frontend
start "Frontend" cmd /k "cd frontend && npm run dev"