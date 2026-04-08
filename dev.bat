@echo off
chcp 65001 > nul
title MoneyTracker Development

echo Starting MoneyTracker Development Environment...
echo ============================================
echo.

start "Server" cmd /k "cd /d %~dp0server && npm run dev"
start "Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Server and Client started in separate windows.
echo Close this window to keep them running.
echo Press any key to close all windows...
pause > nul
taskkill /f /fi "WINDOWTITLE eq Server*" > nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Client*" > nul 2>&1
