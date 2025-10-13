@echo off
REM 自動修復自身檔案的編碼和換行符問題 (GitHub ZIP 下載常見問題)
if not exist "%~n0_fixed.bat" (
    type "%~f0" > "%~n0_fixed.bat" 2>nul
    if exist "%~n0_fixed.bat" (
        move "%~n0_fixed.bat" "%~f0" >nul 2>&1
    )
)
chcp 65001 >nul 2>&1
title UI CoreWork 恢復備份 v2.0

echo.
echo ===============================================
echo     🔄 UI CoreWork 恢復備份工具
echo ===============================================
echo.
echo 此工具將從備份恢復之前的安裝狀態
echo.

REM 檢查是否有備份檔案
echo 🔍 正在檢查備份檔案...

set HAS_BACKUP=0

if exist "venv_backup" (
    echo ✅ 發現虛擬環境備份 (venv_backup)
    set HAS_BACKUP=1
) else (
    echo ❌ 未發現虛擬環境備份
)

if exist "database\uicorework.db.backup" (
    echo ✅ 發現資料庫備份 (uicorework.db.backup)
    set HAS_BACKUP=1
) else (
    echo ❌ 未發現資料庫備份
)

if %HAS_BACKUP% == 0 (
    echo.
    echo ❌ 未發現任何備份檔案
    echo 💡 恢復備份需要在安裝失敗後立即運行
    echo    或者確認備份檔案存在
    goto :end
)

echo.
echo 🛠️  發現可恢復的備份，是否繼續?
choice /c YN /m "選擇 Y 繼續恢復，N 取消:"
if errorlevel 2 goto :cancel

echo.
echo 🔄 正在恢復備份...

REM 恢復虛擬環境
if exist "venv_backup" (
    echo 正在恢復虛擬環境...
    if exist "venv" (
        echo 移除當前虛擬環境...
        rmdir /s /q venv
    )
    rename venv_backup venv
    echo ✅ 虛擬環境已恢復
)

REM 恢復資料庫
if exist "database\uicorework.db.backup" (
    echo 正在恢復資料庫...
    if exist "database\uicorework.db" (
        del "database\uicorework.db"
    )
    rename "database\uicorework.db.backup" "uicorework.db"
    move "uicorework.db" "database\"
    echo ✅ 資料庫已恢復
)

echo.
echo ===============================================
echo     ✅ 恢復完成！
echo ===============================================
echo.
echo 🔄 系統已恢復到備份狀態
echo 💡 您可以重新嘗試安裝或直接啟動應用程式
echo.

goto :end

:cancel
echo.
echo 恢復已取消。

:end
echo.
echo 按任意鍵退出...
pause >nul
