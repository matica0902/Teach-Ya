@echo off
REM 自動修復自身檔案的編碼和換行符問題 (GitHub ZIP 下載常見問題)
if not exist "%~n0_fixed.bat" (
    type "%~f0" > "%~n0_fixed.bat" 2>nul
    if exist "%~n0_fixed.bat" (
        move "%~n0_fixed.bat" "%~f0" >nul 2>&1
    )
)
chcp 65001 >nul 2>&1
title UI CoreWork 一鍵啟動 v2.0

echo.
echo ===============================================
echo     🎨 UI CoreWork - 智慧設計協作平台
echo ===============================================
echo.

echo ✅ 正在檢查 Python 環境...

REM 檢查 Python 是否安裝
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 錯誤: 未找到 Python，請先安裝 Python 3.8+
    echo    下載地址: https://www.python.org/downloads/
    echo.
    echo 按任意鍵退出...
    pause >nul
    exit /b 1
)

echo ✅ Python 環境檢查通過

REM 檢查是否在正確目錄
if not exist "backend\requirements.txt" (
    echo ❌ 錯誤: 請確保在 UI_CoreWork 專案根目錄下運行此腳本
    echo.
    echo 按任意鍵退出...
    pause >nul
    exit /b 1
)

echo.
echo 📦 正在建立虛擬環境...

REM 建立虛擬環境
if not exist "venv" (
    python -m venv venv
    if errorlevel 1 (
        echo ❌ 錯誤: 無法建立虛擬環境
        pause
        exit /b 1
    )
)

echo ✅ 虛擬環境建立完成

echo.
echo 📦 正在安裝依賴套件...

REM 啟動虛擬環境並安裝依賴
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ 錯誤: 無法啟動虛擬環境
    pause
    exit /b 1
)

pip install -r backend\requirements.txt --quiet
if errorlevel 1 (
    echo ❌ 錯誤: 依賴安裝失敗
    echo 請檢查網路連接或手動執行: pip install -r backend\requirements.txt
    pause
    exit /b 1
)

echo ✅ 依賴安裝完成

echo.
echo 🗄️ 正在初始化資料庫...

REM 初始化資料庫
cd database
python init_db.py create >nul 2>&1
cd ..
if errorlevel 1 (
    echo ❌ 警告: 資料庫初始化可能有問題，但繼續執行...
)

echo ✅ 資料庫初始化完成

echo.
echo 🚀 正在啟動 UI CoreWork 服務器...

echo ===============================================
echo 🎉 UI CoreWork 準備完成！
echo ===============================================
echo.
echo 📂 服務器地址: http://localhost:8000
echo 🔧 功能包含:
echo    • 多模態繪圖系統（觸控筆支援）
echo    • AI 智慧聊天（5行對話框）
echo    • 範例展示和套用
echo    • 即時設計協作
echo.
echo 💡 提示: 服務器啟動後，請在瀏覽器中開啟上述地址
echo.
echo ===============================================

REM 自動開啟瀏覽器（延遲 3 秒）
timeout /t 3 /nobreak >nul
start http://localhost:8000

REM 啟動服務器
python backend/main.py

REM 如果服務器停止，按任意鍵退出
echo.
echo 服務器已停止，按任意鍵退出...
pause >nul
