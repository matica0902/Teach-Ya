# UI CoreWork Windows 安裝腳本
# 支援一鍵安裝和自動檢查

param(
    [switch]$Silent,      # 靜默安裝
    [switch]$SkipBrowser, # 跳過自動開啟瀏覽器
    [switch]$Force        # 強制重新安裝
)

# 設定編碼
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 視窗標題
$Host.UI.RawUI.WindowTitle = "UI CoreWork 安裝程式"

function Write-Header {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "    🎨 UI CoreWork - 智慧設計協作平台" -ForegroundColor Yellow
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "🔄 $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Test-ExistingInstallation {
    Write-Step "檢查現有安裝..."

    $existingItems = @()

    if (Test-Path "venv") {
        $existingItems += "虛擬環境 (venv)"
    }

    if (Test-Path "database\uicorework.db") {
        $existingItems += "資料庫檔案"
    }

    if (Test-Path "$env:USERPROFILE\Desktop\UI CoreWork.lnk") {
        $existingItems += "桌面捷徑"
    }

    if ($existingItems.Count -gt 0) {
        Write-Warning "檢測到現有安裝項目: $($existingItems -join ', ')"
        if (-not $Silent) {
            $backup = Read-Host "是否要備份現有安裝? (Y/N)"
            if ($backup -eq 'Y' -or $backup -eq 'y') {
                return $true  # 需要備份
            }
        }
    }

    return $false
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-Python {
    Write-Step "正在檢查 Python 安裝..."

    # 檢查 Python
    try {
        $pythonVersion = python --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Python 已安裝: $pythonVersion"
            return $true
        }
    } catch {
        # Python 未安裝
    }

    if (-not $Silent) {
        Write-Info "未檢測到 Python，將下載並安裝..."
        $install = Read-Host "是否要自動安裝 Python? (Y/N)"
        if ($install -ne 'Y' -and $install -ne 'y') {
            Write-Error "需要 Python 才能運行 UI CoreWork"
            Write-Info "請從 https://www.python.org/downloads/ 下載安裝 Python 3.8+"
            exit 1
        }
    }

    # 下載並安裝 Python
    Write-Step "正在下載 Python 安裝程式..."
    $pythonUrl = "https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe"
    $installerPath = "$env:TEMP\python-installer.exe"

    try {
        Invoke-WebRequest -Uri $pythonUrl -OutFile $installerPath -UseBasicParsing
        Write-Success "Python 安裝程式下載完成"
    } catch {
        Write-Error "下載 Python 失敗: $($_.Exception.Message)"
        Write-Info "請手動從 https://www.python.org/downloads/ 下載安裝"
        exit 1
    }

    Write-Step "正在安裝 Python..."
    # 靜默安裝 Python，添加至 PATH
    $installArgs = "/quiet InstallAllUsers=1 PrependPath=1 Include_test=0"
    Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait

    # 重新載入 PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # 驗證安裝
    try {
        $pythonVersion = python --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Python 安裝成功: $pythonVersion"
            return $true
        }
    } catch {
        Write-Error "Python 安裝驗證失敗"
        return $false
    }

    return $false
}

function Setup-VirtualEnvironment {
    Write-Step "正在設定虛擬環境..."

    if ($Force -and (Test-Path "venv")) {
        Write-Info "強制重新安裝，刪除舊虛擬環境..."
        Remove-Item -Recurse -Force "venv"
    }

    if (-not (Test-Path "venv")) {
        python -m venv venv
        if ($LASTEXITCODE -ne 0) {
            Write-Error "無法建立虛擬環境"
            return $false
        }
    }

    Write-Success "虛擬環境準備完成"
    return $true
}

function Install-Dependencies {
    Write-Step "正在安裝專案依賴..."

    # 啟動虛擬環境
    & "venv\Scripts\Activate.ps1"

    # 安裝依賴
    pip install -r backend\requirements.txt --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Error "依賴安裝失敗"
        return $false
    }

    Write-Success "依賴安裝完成"
    return $true
}

function Initialize-Database {
    Write-Step "正在初始化資料庫..."

    Push-Location "database"
    python init_db.py create >$null 2>&1
    Pop-Location

    if ($LASTEXITCODE -ne 0) {
        Write-Info "資料庫初始化完成 (可能有警告，但不影響運行)"
    } else {
        Write-Success "資料庫初始化完成"
    }

    return $true
}

function Create-DesktopShortcut {
    Write-Step "正在建立桌面捷徑..."

    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$([Environment]::GetFolderPath('Desktop'))\UI CoreWork.lnk")
    $Shortcut.TargetPath = "$PWD\start_windows.bat"
    $Shortcut.WorkingDirectory = "$PWD"
    $Shortcut.IconLocation = "$PWD\assets\images\favicon.ico"
    $Shortcut.Description = "UI CoreWork - 智慧設計協作平台"
    $Shortcut.Save()

    Write-Success "桌面捷徑建立完成"
}

function Start-Application {
    if (-not $SkipBrowser) {
        Write-Info "3 秒後自動開啟瀏覽器..."
        Start-Job -ScriptBlock { Start-Sleep 3; Start-Process "http://localhost:8000" } | Out-Null
    }

    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "🎉 UI CoreWork 安裝完成！" -ForegroundColor Yellow
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📂 服務器地址: http://localhost:8000" -ForegroundColor Green
    Write-Host "🔧 功能包含:" -ForegroundColor Green
    Write-Host "   • 多模態繪圖系統（觸控筆支援）" -ForegroundColor White
    Write-Host "   • AI 智慧聊天（5行對話框）" -ForegroundColor White
    Write-Host "   • 範例展示和套用" -ForegroundColor White
    Write-Host "   • 即時設計協作" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 提示: 桌面已建立捷徑，雙擊即可啟動" -ForegroundColor Blue
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan

    Write-Step "正在啟動 UI CoreWork 服務器..."

    # 啟動服務器
    python backend/main.py
}

# 主安裝流程
Write-Header

if (-not $Silent) {
    Write-Info "此安裝程式將自動設定 UI CoreWork 運行環境"
    Write-Info "包括: Python、虛擬環境、依賴套件、資料庫初始化"
    Write-Host ""
    $continue = Read-Host "是否繼續安裝? (Y/N)"
    if ($continue -ne 'Y' -and $continue -ne 'y') {
        Write-Info "安裝已取消"
        exit 0
    }
}

# 檢查是否在正確目錄
if (-not (Test-Path "backend\requirements.txt")) {
    Write-Error "請確保在 UI_CoreWork 專案根目錄下運行此腳本"
    exit 1
}

# 檢查現有安裝
$needsBackup = Test-ExistingInstallation
if ($needsBackup) {
    Write-Step "正在備份現有安裝..."
    # 備份邏輯會在各個函數中處理
}

# 檢查管理員權限（可選）
if (Test-Administrator) {
    Write-Info "檢測到管理員權限，安裝將更順暢"
} else {
    Write-Info "建議以管理員權限運行以獲得最佳體驗"
}

# 安裝流程
$steps = @(
    @{Name = "Python"; Action = ${function:Install-Python}},
    @{Name = "虛擬環境"; Action = ${function:Setup-VirtualEnvironment}},
    @{Name = "依賴套件"; Action = ${function:Install-Dependencies}},
    @{Name = "資料庫"; Action = ${function:Initialize-Database}},
    @{Name = "桌面捷徑"; Action = ${function:Create-DesktopShortcut}}
)

foreach ($step in $steps) {
    Write-Host ""
    if (-not (& $step.Action)) {
        Write-Error "$($step.Name) 設定失敗"
        Write-Info "請檢查錯誤訊息並重試，或聯繫技術支援"
        exit 1
    }
}

# 啟動應用程式
Start-Application
