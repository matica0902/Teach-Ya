@echo off
chcp 65001 >nul
title UI CoreWork 安裝程式

echo ===============================================
echo     🚀 UI CoreWork 安裝程式
echo ===============================================
echo.

REM 檢查 Python
echo 檢查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo 未找到 Python，正在下載安裝...

    REM 下載 Python
    bitsadmin /transfer "PythonDL" /download /priority normal "https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe" "%CD%\python-installer.exe"
    if errorlevel 1 (
        echo 下載失敗，請手動下載 Python 3.11.5
        echo 網址: https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe
        pause
        exit /b 1
    )

    REM 安裝 Python
    echo 安裝 Python...
    python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    timeout /t 10 /nobreak >nul
)

REM 建立虛擬環境
echo 建立虛擬環境...
python -m venv venv
if errorlevel 1 (
    echo 虛擬環境建立失敗
    pause
    exit /b 1
)

REM 啟動虛擬環境
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo 虛擬環境啟動失敗
    pause
    exit /b 1
)

REM 安裝依賴
echo 安裝專案依賴...
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo 依賴安裝失敗
    pause
    exit /b 1
)

REM 初始化資料庫
echo 初始化資料庫...
cd database
python init_db.py create
if errorlevel 1 (
    echo 資料庫初始化失敗
    cd ..
    pause
    exit /b 1
)
cd ..

REM 建立捷徑
echo 建立桌面捷徑...
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = oWS.ExpandEnvironmentStrings("%%USERPROFILE%%\Desktop\UI CoreWork.lnk") >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%CD%\start_windows.bat" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%CD%" >> CreateShortcut.vbs
echo oLink.Description = "UI CoreWork" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs
cscript CreateShortcut.vbs >nul 2>&1
del CreateShortcut.vbs

echo.
echo ===============================================
echo         ✅ 安裝完成！
echo ===============================================
echo.
echo 服務器地址: http://localhost:8000
echo 桌面捷徑: UI CoreWork.lnk
echo.
echo 啟動應用程式...
timeout /t 2 /nobreak >nul
start http://localhost:8000
python backend/main.py
