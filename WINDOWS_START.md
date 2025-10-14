### Windows 啟動快速指南

## 先決條件
- 安裝 Python 3.9+（建議）
- 允許執行批次檔與 PowerShell 指令

## 一鍵啟動（已安裝好環境）
1. 於專案根目錄雙擊 `start_windows.bat`
2. 等待數秒，瀏覽器自動開啟 `http://localhost:8000`

## 首次執行建議流程（若未安裝依賴）
1. 先執行環境檢查：
   - 雙擊 `check_environment.bat`
2. 推薦使用智慧安裝：
   - 雙擊 `quick_install.bat`
   - 或以 PowerShell 執行 `install\windows\install_windows.ps1`
3. 完成後再執行 `start_windows.bat`

## 服務內容
- 後端：FastAPI on `http://localhost:8000`
- 靜態前端：
  - `http://localhost:8000/` → `frontend/ultra_simple.html`
  - `http://localhost:8000/simple`
  - `http://localhost:8000/ultra`
- API Docs：`http://localhost:8000/docs`

## 健康檢查
- 瀏覽 `http://localhost:8000/api/health` 應回傳：`{"status":"ok", ...}`

## 佔用埠 8000 的處理（必要時）
- 關閉先前啟動的命令視窗；或在 PowerShell 以系統管理員權限手動清理：
```powershell
$pids = (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
if ($pids) { $pids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
```

## 啟動腳本行為（`start_windows.bat`）
- 啟用 venv
- 嘗試釋放 8000 埠
- 背景啟動 `python backend\main.py`
- 2 秒後自動開啟瀏覽器至 `http://localhost:8000`

## 常見問題
- 瀏覽器未開啟：直接手動開 `http://localhost:8000/`
- API 無回應：查看終端輸出，或先跑 `quick_install.bat` 安裝依賴
- 權限問題：以系統管理員身分執行終端再重試


