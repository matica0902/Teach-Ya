@echo off
REM 自動修復自身檔案的編碼和換行符問題 (GitHub ZIP 下載常見問題)
if not exist "%~n0_fixed.bat" (
    type "%~f0" > "%~n0_fixed.bat" 2>nul
    if exist "%~n0_fixed.bat" (
        move "%~n0_fixed.bat" "%~f0" >nul 2>&1
    )
)
chcp 65001 >nul 2>&1
title UI CoreWork 解除安裝程式 v2.0

echo.
echo ===============================================
echo     🗑️  UI CoreWork 解除安裝程式
echo ===============================================
echo.
echo 此程式將移除以下內容:
echo • 虛擬環境 (venv 資料夾)
echo • 桌面捷徑
echo • 上傳檔案 (uploads 資料夾)
echo • 資料庫檔案 (database/uicorework.db)
echo.
echo ⚠️  警告: 此操作無法復原！
echo.

choice /c YN /m "確定要解除安裝 UI CoreWork 嗎?"
if errorlevel 2 (
    echo.
    echo 解除安裝已取消。
    pause
    exit /b 0
)

echo.
echo 🗑️  正在移除檔案...

REM 刪除虛擬環境
if exist "venv" (
    echo 移除虛擬環境...
    rmdir /s /q venv
    echo ✅ 虛擬環境已移除
) else (
    echo ℹ️  虛擬環境不存在
)

REM 刪除桌面捷徑
if exist "%USERPROFILE%\Desktop\UI CoreWork.lnk" (
    echo 移除桌面捷徑...
    del "%USERPROFILE%\Desktop\UI CoreWork.lnk"
    echo ✅ 桌面捷徑已移除
) else (
    echo ℹ️  桌面捷徑不存在
)

REM 刪除上傳檔案
if exist "uploads" (
    echo 移除上傳檔案...
    rmdir /s /q uploads 2>nul
    mkdir uploads
    echo. > uploads\.gitkeep
    echo ✅ 上傳檔案已清理
)

REM 刪除資料庫檔案
if exist "database\uicorework.db" (
    echo 移除資料庫檔案...
    del "database\uicorework.db"
    echo ✅ 資料庫檔案已移除
)

echo.
echo ===============================================
echo     ✅ 解除安裝完成！
echo ===============================================
echo.
echo 已移除的內容:
echo • Python 虛擬環境
echo • 桌面捷徑
echo • 使用者上傳檔案
echo • 本地資料庫檔案
echo.
echo 💡 保留的內容:
echo • 原始程式碼
echo • 設定檔案
echo • 日誌檔案
echo.
echo 如需完全移除，請手動刪除整個 UI_CoreWork 資料夾
echo.

pause
