@echo off
title CampusShield - C++ Server & Gatekeeper Login Portal Launcher
echo ========================================================
echo   CampusShield - AI Women's Safety & Campus Monitoring
echo   C++ Server + Gatekeeper Login Portal
echo ========================================================
echo.

echo [1/3] Compiling C++ Core Engine (backend/campus_shield.cpp)...
C:\MinGW\bin\g++.exe -O2 -std=c++11 backend/campus_shield.cpp -lws2_32 -o backend/campus_shield.exe

if %errorlevel% neq 0 (
    echo [!] C++ compilation failed. Running pre-compiled backend...
)

echo [2/3] Starting C++ WinSock REST & HTTP Server Daemon on port 8080...
start /b backend\campus_shield.exe

echo [3/3] Opening CampusShield Gatekeeper Login Portal in browser...
timeout /t 2 /nobreak >nul
start "" "login.html"

echo.
echo ========================================================
echo   ✅ CampusShield C++ Backend is RUNNING on http://localhost:8080
echo   ✅ Gatekeeper Login Portal Opened (login.html)!
echo   Press CTRL+C or close this window to stop server.
echo ========================================================
pause
