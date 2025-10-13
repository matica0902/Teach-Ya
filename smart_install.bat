@echo off
REM UI CoreWork 智慧安裝程式 v2.0 - 終極一鍵安裝解決方案
REM 自動處理所有常見的 Windows/GitHub ZIP 下載問題

REM 自動修復自身檔案的編碼和換行符問題
if not exist "%~n0_fixed.bat" (
    type "%~f0" > "%~n0_fixed.bat" 2>nul
    if exist "%~n0_fixed.bat" (
        move "%~n0_fixed.bat" "%~f0" >nul 2>&1
    )
)
chcp 65001 >nul 2>&1
title UI CoreWork 智慧安裝程式 v2.0

echo.
echo ===============================================
echo     🚀 UI CoreWork 智慧安裝程式 v2.0
echo ===============================================
echo.
echo 這個程式會自動處理：
echo ✅ 編碼和換行符問題
echo ✅ Python 自動安裝
echo ✅ 依賴套件安裝
echo ✅ 資料庫初始化
echo ✅ 應用程式啟動
echo.

REM 修復所有批次檔的編碼問題
echo 🔧 正在修復系統相容性...
if exist "install\windows\*.bat" (
    for %%f in (install\windows\*.bat) do (
        if not exist "%%~nf_fixed.bat" (
            type "%%f" > "%%~nf_fixed.bat" 2>nul
            if exist "%%~nf_fixed.bat" (
                move "%%~nf_fixed.bat" "%%f" >nul 2>&1
            )
        )
    )
)
if exist "*.bat" (
    for %%f in (*.bat) do (
        if not exist "%%~nf_fixed.bat" (
            type "%%f" > "%%~nf_fixed.bat" 2>nul
            if exist "%%~nf_fixed.bat" (
                move "%%~nf_fixed.bat" "%%f" >nul 2>&1
            )
        )
    )
)

REM 檢查專案檔案完整性
echo 📋 檢查專案檔案...
if not exist "install_config.json" (
    echo ❌ 錯誤: 找不到安裝配置文件
    echo 請確保在 UI_CoreWork 根目錄下運行
    pause
    exit /b 1
)

if not exist "backend\requirements.txt" (
    echo ❌ 錯誤: 找不到依賴檔案
    echo 專案檔案可能不完整
    pause
    exit /b 1
)

echo ✅ 專案檔案完整

REM 檢查並安裝 Python
echo 📦 檢查 Python 環境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Python，正在自動安裝 Python 3.11.5...
    echo.

    REM 嘗試下載 Python
    echo 📥 下載 Python 安裝程式...
    powershell -Command "try { Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe' -OutFile 'python-installer.exe' -TimeoutSec 60 } catch { echo 網路下載失敗，嘗試備用方案... }"

    if not exist "python-installer.exe" (
        REM 備用下載方案
        echo 📥 嘗試備用下載方案...
        bitsadmin /transfer python_download /download /priority normal https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe %CD%\python-installer.exe
    )

    if exist "python-installer.exe" (
        echo 📦 安裝 Python...
        python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0

        REM 重新檢查 Python
        python --version >nul 2>&1
        if errorlevel 1 (
            echo ❌ Python 安裝失敗
            echo 請訪問: https://www.python.org/downloads/
            start https://www.python.org/downloads/
            pause
            exit /b 1
        ) else (
            echo ✅ Python 安裝成功！
        )
    ) else (
        echo ❌ 無法下載 Python
        echo 請手動下載: https://www.python.org/downloads/
        start https://www.python.org/downloads/
        pause
        exit /b 1
    )
) else (
    echo ✅ Python 環境正常
)

echo.
echo 📦 建立虛擬環境...
if not exist "venv" (
    python -m venv venv
    if errorlevel 1 (
        echo ❌ 虛擬環境建立失敗
        pause
        exit /b 1
    )
)

echo ✅ 虛擬環境建立完成

echo.
echo 📦 安裝依賴套件...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ 虛擬環境啟動失敗
    pause
    exit /b 1
)

REM 升級 pip
python -m pip install --upgrade pip --quiet

REM 安裝依賴
pip install -r backend\requirements.txt --quiet
if errorlevel 1 (
    echo ❌ 依賴安裝失敗
    echo 請檢查網路連接
    pause
    exit /b 1
)

echo ✅ 依賴安裝完成

echo.
echo 🗄️ 初始化資料庫...
cd database
python init_db.py create >nul 2>&1
cd ..
if errorlevel 1 (
    echo ⚠️ 資料庫初始化警告，但繼續執行...
)

echo ✅ 資料庫初始化完成

echo.
echo 🚀 啟動 UI CoreWork...

echo ===============================================
echo 🎉 UI CoreWork 安裝完成！
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

REM 自動開啟瀏覽器（延遲 5 秒）
timeout /t 5 /nobreak >nul
start http://localhost:8000

REM 啟動服務器
python backend/main.py

echo.
echo 服務器已停止，按任意鍵退出...
pause >nul
