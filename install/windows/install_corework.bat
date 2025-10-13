@echo off
chcp 65001 >nul
title 🚀 UI CoreWork 安裝程式

echo ===============================================
echo       🚀 UI CoreWork 自動安裝與啟動
echo ===============================================
echo.

setlocal enabledelayedexpansion
set "ERROR_FLAG=0"

REM === 1. 檢查管理員權限 ===
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ 建議以「系統管理員」身份執行以避免權限錯誤。
    echo.
)

REM === 2. 檢查 Python ===
echo [1/6] 檢查 Python 環境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Python，正在下載並安裝...
    echo.

    bitsadmin /transfer "PythonDL" /download /priority normal ^
    "https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe" "%CD%\python-installer.exe"
    if errorlevel 1 (
        echo ❌ Python 下載失敗，請手動下載並重試。
        set "ERROR_FLAG=1"
        goto :ERROR_HANDLER
    )

    echo 正在安裝 Python，請稍候（約 1~3 分鐘）...
    start /wait python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0

    echo 檢查 Python 是否安裝成功...
    timeout /t 5 >nul
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python 安裝可能未完成，請手動檢查後重試。
        set "ERROR_FLAG=1"
        goto :ERROR_HANDLER
    )

    del python-installer.exe >nul 2>&1
    echo ✅ Python 安裝完成
) else (
    echo ✅ 已檢測到 Python
)

REM === 3. 建立虛擬環境 ===
echo.
echo [2/6] 建立虛擬環境...
if exist venv (
    echo ⚠ 偵測到舊的虛擬環境，重新建立...
    rmdir /s /q venv >nul 2>&1
)
python -m venv venv
if errorlevel 1 (
    echo ❌ 建立虛擬環境失敗。
    set "ERROR_FLAG=1"
    goto :ERROR_HANDLER
)
echo ✅ 虛擬環境建立成功。

REM === 4. 安裝依賴 ===
echo.
echo [3/6] 安裝專案依賴（可能需幾分鐘）...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ 虛擬環境啟動失敗。
    set "ERROR_FLAG=1"
    goto :ERROR_HANDLER
)

echo 升級 pip...
python -m pip install --upgrade pip >nul 2>&1

if not exist "backend\requirements.txt" (
    echo ❌ 缺少 backend\requirements.txt，請確認專案結構。
    set "ERROR_FLAG=1"
    goto :ERROR_HANDLER
)

echo 安裝依賴中，請耐心等候...
set "starttime=%time%"
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo ❌ 依賴安裝失敗。
    set "ERROR_FLAG=1"
    goto :ERROR_HANDLER
)
echo 完成時間：%time%
echo ✅ 依賴安裝完成。

REM === 5. 初始化資料庫 ===
echo.
echo [4/6] 初始化資料庫...
if not exist "database\init_db.py" (
    echo ❌ 找不到 database\init_db.py。
    set "ERROR_FLAG=1"
    goto :ERROR_HANDLER
)
cd database
python init_db.py create
if errorlevel 1 (
    echo ❌ 資料庫初始化失敗。
    cd ..
    set "ERROR_FLAG=1"
    goto :ERROR_HANDLER
)
cd ..
echo ✅ 資料庫初始化完成。

REM === 6. 建立桌面捷徑 ===
echo.
echo [5/6] 建立桌面捷徑...
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\UI CoreWork.lnk"
if exist "%SHORTCUT_PATH%" del "%SHORTCUT_PATH%" >nul 2>&1

echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%SHORTCUT_PATH%" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%CD%\start_windows.bat" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%CD%" >> CreateShortcut.vbs
echo oLink.Description = "UI CoreWork 啟動捷徑" >> CreateShortcut.vbs
echo oLink.IconLocation = "%CD%\venv\Scripts\python.exe, 0" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs
cscript //nologo CreateShortcut.vbs >nul 2>&1
del CreateShortcut.vbs >nul 2>&1
echo ✅ 桌面捷徑建立完成。

REM === 7. 建立啟動腳本 ===
if not exist "start_windows.bat" (
    echo @echo off > start_windows.bat
    echo chcp 65001 ^>nul >> start_windows.bat
    echo title UI CoreWork 啟動 >> start_windows.bat
    echo call venv\Scripts\activate.bat >> start_windows.bat
    echo python backend\main.py >> start_windows.bat
    echo pause >> start_windows.bat
)
echo ✅ 啟動腳本已準備。

REM === 8. 啟動應用 ===
echo.
echo [6/6] 啟動應用程式...
echo ===============================================
echo ✅ 安裝完成，準備啟動 UI CoreWork
echo ===============================================
echo 📍 網址: http://localhost:8000
echo 📍 桌面捷徑: UI CoreWork.lnk
echo.
timeout /t 3 /nobreak >nul
start "" "http://localhost:8000" >nul 2>&1
python backend\main.py
goto :EOF

:ERROR_HANDLER
echo.
echo ===============================================
echo ❌ 安裝過程中出現錯誤，請檢查上方訊息。
echo ===============================================
echo.
echo 常見解法：
echo 1. 檢查網路是否可用。
echo 2. 以管理員身份重新執行此檔。
echo 3. 手動安裝 Python 3.11+ 並確認 PATH。
pause
exit /b 1
