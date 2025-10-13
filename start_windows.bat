@echo off
chcp 65001
title UI CoreWork

cd /d "%~dp0"

call venv\Scripts\activate.bat

REM 自動關掉舊的後端程式（Python + main.py）
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000"') do taskkill /PID %%a /F >nul 2>&1

REM 啟動新的後端程式（非阻塞）
start "" python backend\main.py

REM 延遲 2 秒後打開瀏覽器
timeout /t 2 >nul
start "" "http://localhost:8000"

REM 保持視窗開啟
echo.
echo 按任意鍵關閉此視窗...
pause >nul

