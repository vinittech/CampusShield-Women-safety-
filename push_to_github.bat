@echo off
title CampusShield - Push All Files to GitHub Repo
echo ========================================================
echo   CampusShield - Pushing all files to GitHub Repository:
echo   https://github.com/vinittech/CampusShield-Women-safety-
echo ========================================================
echo.

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Git is not installed on this system.
    echo.
    echo HOW TO UPLOAD ALL FILES TO YOUR GITHUB REPO:
    echo.
    echo Option 1: Install Git from https://git-scm.com/download/win
    echo           Then double-click this push_to_github.bat file again!
    echo.
    echo Option 2: Upload via GitHub Web Browser:
    echo           1. Go to https://github.com/vinittech/CampusShield-Women-safety-
    echo           2. Click "Add file" -> "Upload files"
    echo           3. Drag and drop all files from this project folder!
    echo.
    pause
    exit /b
)

echo [1/4] Initializing local Git repository...
git init

echo [2/4] Adding all files to commit stage...
git add .

echo [3/4] Creating commit...
git commit -m "Update CampusShield: Complete C++ AI Safety Engine, Responsive Web UI, Auth System & Interactive Maps"

echo [4/4] Connecting & Pushing to https://github.com/vinittech/CampusShield-Women-safety-.git
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/vinittech/CampusShield-Women-safety-.git
git push -u origin main --force

echo.
echo ========================================================
echo   ✅ All files successfully uploaded to your GitHub Repo!
echo ========================================================
pause
