@echo off
REM 自動修復自身檔案的編碼和換行符問題 (GitHub ZIP 下載常見問題)
if not exist "%~n0_fixed.bat" (
    type "%~f0" > "%~n0_fixed.bat" 2>nul
    if exist "%~n0_fixed.bat" (
        move "%~n0_fixed.bat" "%~f0" >nul 2>&1
    )
)
chcp 65001 >nul 2>&1
title UI CoreWork 環境診斷工具 v2.0

echo.
echo ===============================================
echo     🔍 UI CoreWork 環境診斷工具
echo ===============================================
echo.
echo 此工具將檢查您的系統環境是否適合運行 UI CoreWork
echo 並提供解決方案建議。
echo.

echo 📋 正在檢查系統資訊...
echo.

REM 檢查 Windows 版本
echo === Windows 版本資訊 ===
ver
echo.

REM 檢查系統架構
echo === 系統架構 ===
echo %PROCESSOR_ARCHITECTURE% %PROCESSOR_IDENTIFIER%
echo.

REM 檢查權限
echo === 權限檢查 ===
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 當前以管理員權限運行
) else (
    echo ⚠️  當前以一般用戶權限運行
    echo    建議以管理員權限運行以獲得最佳體驗
)
echo.

REM 檢查網路連接
echo === 網路檢查 ===
ping -n 1 google.com >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 網路連接正常
) else (
    echo ❌ 網路連接失敗
    echo    安裝過程需要下載 Python 和依賴套件
)
echo.

REM 檢查 Python 環境
echo === Python 環境檢查 ===
set PYTHON_FOUND=0

echo 檢查 python 命令...
python --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ python 命令可用
    python --version
    set PYTHON_FOUND=1
) else (
    echo ❌ python 命令不可用
)

echo 檢查 py 命令...
py --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ py 命令可用
    py --version
    set PYTHON_FOUND=1
) else (
    echo ❌ py 命令不可用
)

echo 檢查 python3 命令...
python3 --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ python3 命令可用
    python3 --version
    set PYTHON_FOUND=1
) else (
    echo ❌ python3 命令不可用
)

if %PYTHON_FOUND% == 0 (
    echo.
    echo ❌ 未找到 Python
    echo 💡 解決方案:
    echo    1. 從 https://www.python.org/downloads/ 下載安裝 Python 3.8+
    echo    2. 安裝時勾選 "Add Python to PATH"
    echo    3. 或運行安裝程式，它會自動下載 Python
) else (
    echo.
    echo ✅ Python 環境正常
)
echo.

REM 檢查其他環境管理器
echo === 其他環境管理器檢查 ===
where conda >nul 2>&1
if %errorLevel% == 0 (
    echo ⚠️  檢測到 conda (可能造成衝突)
    echo 💡 建議: 使用 conda deactivate 退出 conda 環境
) else (
    echo ✅ 未檢測到 conda
)

where pipenv >nul 2>&1
if %errorLevel% == 0 (
    echo ⚠️  檢測到 pipenv (可能造成衝突)
    echo 💡 建議: 確保未在 pipenv shell 中運行
) else (
    echo ✅ 未檢測到 pipenv
)
echo.

REM 檢查專案目錄
echo === 專案目錄檢查 ===
if exist "backend\requirements.txt" (
    echo ✅ 專案檔案完整
) else (
    echo ❌ 專案檔案不完整
    echo 💡 請確保在 UI_CoreWork 根目錄下運行此工具
    goto :end
)

if exist "venv" (
    echo ✅ 虛擬環境已存在 (venv)
) else (
    echo ℹ️  虛擬環境不存在
)

if exist "database\uicorework.db" (
    echo ✅ 資料庫檔案已存在
) else (
    echo ℹ️  資料庫檔案不存在 (將在首次運行時建立)
)
echo.

REM 檢查磁碟空間
echo === 磁碟空間檢查 ===
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do (
    set FREE_SPACE=%%a
)
echo 可用磁碟空間: %FREE_SPACE% bytes
REM 轉換為 MB (粗略計算)
set /a FREE_MB=%FREE_SPACE%/1048576
echo 大約可用空間: %FREE_MB% MB

if %FREE_MB% lss 500 (
    echo ⚠️  磁碟空間不足 (建議至少 500MB)
    echo 💡 請清理磁碟空間後重試
) else (
    echo ✅ 磁碟空間充足
)
echo.

REM 檢查防毒軟體
echo === 防毒軟體檢查 ===
echo 正在檢查常見防毒軟體...

where "C:\Program Files\Windows Defender\MpCmdRun.exe" >nul 2>&1
if %errorLevel% == 0 (
    echo ℹ️  檢測到 Windows Defender
    echo 💡 確保防毒軟體不會阻擋 Python 和網路下載
)

where "C:\Program Files\Avast\AvastUI.exe" >nul 2>&1
if %errorLevel% == 0 (
    echo ℹ️  檢測到 Avast 防毒軟體
    echo 💡 確保防毒軟體不會阻擋安裝過程
)

where "C:\Program Files\AVG\Antivirus\AVGUI.exe" >nul 2>&1
if %errorLevel% == 0 (
    echo ℹ️  檢測到 AVG 防毒軟體
    echo 💡 確保防毒軟體不會阻擋安裝過程
)
echo.

echo ===============================================
echo                診斷完成
echo ===============================================
echo.
echo 📋 總結:
if %PYTHON_FOUND% == 0 (
    echo ❌ 需要安裝 Python
) else (
    echo ✅ Python 環境正常
)

if exist "venv" (
    echo ✅ 虛擬環境已存在
) else (
    echo ℹ️  需要建立虛擬環境
)

if exist "database\uicorework.db" (
    echo ✅ 資料庫已初始化
) else (
    echo ℹ️  需要初始化資料庫
)

echo.
echo 🎯 下一步操作建議:
if %PYTHON_FOUND% == 0 (
    echo 1. 安裝 Python 3.8+ (或運行 quick_install.bat 自動安裝)
) else (
    if exist "venv" (
        echo 1. 直接運行 start_windows.bat 啟動應用程式
    ) else (
        echo 1. 運行 quick_install.bat 進行完整安裝
    )
)
echo.

:end
echo 按任意鍵退出...
pause >nul
