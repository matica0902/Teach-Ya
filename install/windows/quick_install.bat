@echo off
REM 自動修復自身檔案的編碼和換行符問題 (GitHub ZIP 下載常見問題)
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
echo     🚀 UI CoreWork 智慧安裝程式
echo ===============================================
echo.
echo 使用配置驅動安裝引擎，自動適應專案變化
echo.

REM 檢查 Python 是否可用
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Python，正在自動安裝 Python 3.11.5...
    echo.

    REM 嘗試下載 Python
    echo 📥 下載 Python 安裝程式...
    powershell -Command "try { Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe' -OutFile 'python-installer.exe' -TimeoutSec 30 } catch { echo 網路下載失敗 }"

    if exist "python-installer.exe" (
        echo 📦 安裝 Python...
        python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0

        REM 重新檢查 Python
        python --version >nul 2>&1
        if errorlevel 1 (
            echo ❌ Python 安裝失敗，請手動安裝:
            echo    https://www.python.org/downloads/
            start https://www.python.org/downloads/
            pause
            exit /b 1
        ) else (
            echo ✅ Python 安裝成功！
            echo.
        )
    ) else (
        echo ❌ 無法下載 Python，請檢查網路或手動安裝
        echo    https://www.python.org/downloads/
        start https://www.python.org/downloads/
        pause
        exit /b 1
    )
)

:install
echo ✅ Python 環境正常
echo.

REM 檢查專案檔案
if not exist "install_config.json" (
    echo ❌ 錯誤: 找不到安裝配置文件
    echo 請確保在 UI_CoreWork 根目錄下運行
    pause
    exit /b 1
)

if not exist "install_engine.py" (
    echo ❌ 錯誤: 找不到安裝引擎
    echo 專案檔案可能不完整，請重新下載
    pause
    exit /b 1
)

echo 🚀 啟動智慧安裝引擎...
echo.

REM 運行 Python 安裝引擎
python install_engine.py

if errorlevel 1 (
    echo.
    echo ❌ 安裝失敗
    echo.
    echo 💡 問題排查:
    echo    1. 檢查網路連接 (安裝需要下載套件)
    echo    2. 確保有至少 500MB 可用磁碟空間
    echo    3. 建議以管理員權限運行
    echo    4. 運行 check_environment.bat 進行詳細診斷
    echo.
    echo 🔄 如果之前安裝過，可以運行 restore_backup.bat 恢復
    echo.
    pause
    exit /b 1
)

echo.
echo 🎉 安裝和啟動完成！
echo.
echo 💡 使用提示:
echo    • 桌面會有 "UI CoreWork" 捷徑 (如果安裝成功)
echo    • 或直接運行 start_windows.bat 啟動應用程式
echo    • 服務器地址: http://localhost:8000
echo.

pause
