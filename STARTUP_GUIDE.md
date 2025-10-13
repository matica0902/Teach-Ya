# 啟動指南

## 專案結構

- **backend/**: 後端程式碼，基於 FastAPI 框架。
  - `main.py`: FastAPI 應用的入口，定義了 API 路由、資料庫初始化邏輯，以及 AI 圖像分析功能。
  - `requirements.txt`: 定義後端所需的 Python 套件。
  - `test_app.py`: 後端測試程式。
  - `database/`: 包含資料庫相關邏輯與上傳檔案的目錄。
    - `uploads/`: 用於存放上傳的檔案。
- **database/**: 資料庫初始化腳本與 SQLite 資料庫。
  - `init_db.py`: 建立資料庫表格與插入範例數據。
  - `uicorework.db`: SQLite 資料庫檔案。
- **frontend/**: 前端靜態檔案。
  - `index.html`: 主頁面，包含繪圖區域、對話區域與範例展示。
  - `ultra_simple.html`: 簡化版的測試頁面。
  - `css/`: 儲存樣式表。
  - `js/`: 前端 JavaScript 程式碼。
    - `main.js`: 前端應用的入口，負責初始化模組。
    - `drawing.js`: 繪圖模組邏輯。
    - `config.js`: 配置檔案，定義 API 基本路徑等。
- **uploads/**: 用於存放上傳的檔案。
- **啟動腳本**:
  - `start_simple.sh`: 一鍵啟動腳本，包含依賴安裝、資料庫初始化與後端啟動。

## 啟動步驟

1. **建立虛擬環境**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **安裝依賴**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **初始化資料庫**
   ```bash
   python database/init_db.py
   ```

4. **啟動應用程式**
   ```bash
   ./start_simple.sh
   ```

5. **開啟前端頁面**
   - 在瀏覽器中訪問 `http://localhost:8000`。

## 測試範例

- **API 測試**:
  - 使用工具（如 curl 或 Postman）測試 API，例如：
    ```bash
    curl http://localhost:8000/api/examples
    ```

- **前端測試**:
  - 確保頁面正常加載，並檢查 Console 是否有錯誤訊息。

---

如有問題，請檢查 `fail_to_Valued.md` 紀錄的錯誤與解決方案。