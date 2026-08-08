@echo off
title CampusShield - C++ Core & Web Launcher
echo ========================================================
echo   CampusShield - AI Women's Safety Platform Launcher
echo ========================================================
echo.
echo [1/2] Starting C++ Core Engine & REST Server (Port 8080)...
start "CampusShield C++ Core Server" cmd /k "backend\campus_shield.exe"

echo [2/2] Opening CampusShield Web User Interface...
timeout /t 2 /nobreak > nul
start "" "%~dp0index.html"

echo.
echo CampusShield is now active and running!
echo Access Web UI at: index.html
echo C++ REST Engine: http://localhost:8080
echo ========================================================
pause
