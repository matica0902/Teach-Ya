@echo off
REM 自動修復自身檔案的編碼和換行符問題 (GitHub ZIP 下載常見問題)
if not exist "%~n0_fixed.bat" (
    type "%~f0" > "%~n0_fixed.bat" 2>nul
    if exist "%~n0_fixed.bat" (
        move "%~n0_fixed.bat" "%~f0" >nul 2>&1
    )
)
chcp 65001 >nul 2>&1
REM UI CoreWork 快速安裝程式 - 包裝腳本 v2.0
REM 將調用 install/windows/ 目錄中的實際安裝腳本

echo.
echo ===============================================
echo     🚀 UI CoreWork 智慧安裝程式
echo ===============================================
echo.
echo 正在啟動安裝引擎...
echo.

REM 檢查專案檔案
if not exist "install_config.json" (
    echo ❌ 錯誤: 找不到安裝配置文件
    echo 請確保在 UI_CoreWork 根目錄下運行
    pause
    exit /b 1
)

if not exist "install\windows\install_engine.py" (
    echo ❌ 錯誤: 找不到安裝引擎
    echo 請檢查 install\windows\ 目錄是否存在
    pause
    exit /b 1
)

REM 運行實際的安裝引擎
python install\windows\install_engine.py

if errorlevel 1 (
    echo.
    echo ❌ 安裝失敗
    echo.
    echo 💡 問題排查:
    echo    1. 檢查網路連接 (安裝需要下載套件)
    echo    2. 確保有至少 500MB 可用磁碟空間
    echo    3. 建議以管理員權限運行
    echo    4. 運行 install\windows\check_environment.bat 進行詳細診斷
    echo.
    echo 🔄 如果之前安裝過，可以運行 install\windows\restore_backup.bat 恢復
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