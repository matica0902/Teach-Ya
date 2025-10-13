# UI CoreWork - 智慧設計協作平台

🎨 一個整合多模態輸入處理、AI 輔助設計和範例展示的現代化 UI 設計工具。

## 🚨 重要：操作前必讀
**在進行任何操作前，請先閱讀 [`STARTUP_GUIDE.md`](./STARTUP_GUIDE.md)**

- 使用正確的啟動命令：`./start_simple.sh`
- 避免重複已知的錯誤

## ✨ 功能特色

### 🖊️ 多模態繪圖系統
- **觸控筆支援**: 支援壓力感測和精確繪圖
- **滑鼠/觸控**: 完整支援各種輸入設備
- **即時處理**: 流暢的繪圖體驗和平滑線條
- **工具齊全**: 筆刷、橡皮擦、顏色選擇、大小調整

### 💬 AI 智慧聊天
- **5行對話框**: 如您要求的特定高度設計
- **上下文理解**: AI 能理解繪圖內容並提供建議
- **即時互動**: 快速回應和智慧建議
- **多語言支援**: 中文和英文界面

### 📚 範例展示系統
- **豐富範例**: 表單、儀錶板、導航等多種類型
- **即時預覽**: 點擊即可查看詳細內容
- **一鍵套用**: 直接套用到您的設計中
- **下載功能**: 完整的 HTML/CSS/JS 檔案

### 🔄 無縫整合
- **同時輸入**: 繪圖和聊天可同時進行
- **智慧分析**: AI 自動分析繪圖內容
- **精確修改**: LLM 可透過 API 精確修改 UI 元素

## 🚀 快速開始

### 方法一：一鍵啟動（推薦）

#### Linux/macOS
```bash
# 克隆專案
git clone https://github.com/yourusername/ui-corework.git
cd ui-corework

# 一鍵啟動
chmod +x start_simple.sh
./start_simple.sh
```

#### Windows 一鍵安裝
```batch
# 下載或複製專案到本地
# 雙擊運行 quick_install.bat
# 或在命令提示字元中運行:
quick_install.bat
```

**Windows 支援功能:**
- ✅ 自動檢查和安裝 Python
- ✅ 一鍵建立虛擬環境
- ✅ 自動安裝所有依賴
- ✅ 自動初始化資料庫
- ✅ 建立桌面捷徑
- ✅ 自動啟動瀏覽器

### 方法二：手動啟動
#### Linux/macOS
```bash
# 1. 建立虛擬環境
python3 -m venv venv
source venv/bin/activate

# 2. 安裝依賴
pip install -r backend/requirements.txt

# 3. 初始化資料庫
cd database
python init_db.py create
cd ..

# 4. 啟動服務器
python backend/main.py
```

#### Windows
```batch
# 1. 建立虛擬環境
python -m venv venv
venv\Scripts\activate

# 2. 安裝依賴
pip install -r backend/requirements.txt

# 3. 初始化資料庫
cd database
python init_db.py create
cd ..

# 4. 啟動服務器
python backend/main.py
```

### Windows 詳細安裝說明

##### 步驟 1: 環境檢查（重要）
```batch
# 首先運行環境檢查工具
check_environment.bat
```
此工具會檢查：
- ✅ Python 環境是否正確
- ✅ 系統權限是否足夠
- ✅ 網路連接是否正常
- ✅ 是否有其他環境管理器衝突
- ✅ 磁碟空間是否足夠

##### 步驟 2: 選擇安裝方式

###### 選項 1: 智慧安裝（推薦 - 配置驅動）
```batch
# 雙擊運行智慧安裝程式
quick_install.bat
```
**🎯 配置驅動優勢：**
- ✅ **自動適應專案變化** - 只需修改 `install_config.json` 即可適應新功能
- ✅ **智慧環境檢查** - 自動檢測和解決常見問題
- ✅ **備份恢復機制** - 安裝失敗時可一鍵恢復
- ✅ **模組化設計** - 安裝邏輯集中維護，避免重複修改

**自動處理流程：**
- 🔍 環境診斷和檢查
- 🐍 Python 自動安裝/檢查
- 📦 隔離虛擬環境建立
- 💾 自動備份現有安裝
- 📚 依賴套件智慧安裝
- 🗄️ 資料庫自動初始化
- 🔗 桌面捷徑建立
- 🌐 瀏覽器自動開啟

###### 選項 2: PowerShell 安裝（進階）
```powershell
# 以管理員權限運行 PowerShell
.\install_windows.ps1

# 或靜默安裝（無用戶互動）
.\install_windows.ps1 -Silent

# 或強制重新安裝（會備份舊環境）
.\install_windows.ps1 -Force
```

###### 選項 3: 手動安裝
按照上述 "方法二" 中的 Windows 步驟進行手動安裝。

##### 步驟 3: 故障排除

###### 如果安裝失敗：
```batch
# 恢復到備份狀態
restore_backup.bat

# 重新檢查環境
check_environment.bat
```

##### 步驟 4: 安裝系統維護指南

###### 開發者：專案變化時的維護方式
當您添加新功能或修改依賴時，**不再需要重寫整個安裝腳本**！

**只需要修改 `install_config.json`：**
```json
{
  "dependencies": {
    "requirements_file": "backend/requirements.txt"  // 更新依賴檔案路徑
  },
  "features": [
    "新功能描述"  // 添加新功能說明
  ],
  "python": {
    "required_version": "3.9"  // 更新 Python 版本要求
  }
}
```

**安裝腳本會自動適應：**
- ✅ 新增的依賴套件
- ✅ 變化的檔案路徑
- ✅ 新的功能說明
- ✅ 版本要求更新

###### 常見問題解決：
- **Python 版本衝突**: 使用 `check_environment.bat` 檢查多重 Python 安裝
- **權限問題**: 以管理員權限運行安裝程式
- **網路問題**: 確保可以訪問 python.org 和 pip 安裝源
- **防毒軟體阻擋**: 暫時停用或允許安裝程式
- **安裝失敗恢復**: 運行 `restore_backup.bat` 恢復到安裝前狀態

### 開啟應用程式
瀏覽器訪問：http://localhost:8000

## 🏗️ 專案結構

```
UI_CoreWork/
├── frontend/                 # 前端資源
│   ├── index.html           # 主要 HTML 介面
│   ├── css/
│   │   └── styles.css       # 完整樣式系統
│   └── js/
│       ├── config.js        # 配置設定
│       ├── utils.js         # 工具函數庫
│       ├── drawing.js       # 繪圖功能模組
│       ├── chat.js          # 聊天功能模組
│       ├── examples.js      # 範例展示模組
│       ├── api.js           # API 整合模組
│       └── main.js          # 主應用程式
├── backend/                 # 後端 API
│   ├── main.py             # FastAPI 服務器
│   └── requirements.txt    # Python 依賴
├── database/               # 資料庫
│   ├── init_db.py          # 資料庫初始化腳本
│   ├── README.md           # 資料庫架構說明
│   └── uicorework.db       # SQLite 資料庫檔案
├── install/                # 安裝腳本目錄
│   ├── unix/              # Unix/Linux 安裝腳本
│   │   └── start_simple.sh # Linux/macOS 一鍵啟動腳本
│   └── windows/           # Windows 安裝腳本
│       ├── check_environment.bat    # Windows 環境診斷工具
│       ├── install_engine.py        # 通用 Python 安裝引擎
│       ├── install_windows.ps1      # Windows PowerShell 安裝腳本
│       ├── quick_install.bat        # Windows 智慧安裝程式
│       ├── restore_backup.bat       # Windows 備份恢復工具
│       ├── start_windows.bat        # Windows 啟動腳本
│       ├── uninstall_windows.bat    # Windows 解除安裝程式
│       └── update_example.json      # 配置更新範例
├── install_config.json    # 安裝配置檔案 (修改此檔案適應專案變化)
├── quick_install.bat      # Windows 安裝包裝腳本 (根目錄入口)
├── check_environment.bat  # 環境檢查包裝腳本 (根目錄入口)
├── start_simple.sh        # Linux/macOS 啟動包裝腳本 (根目錄入口)
└── start_windows.bat      # Windows 啟動包裝腳本 (根目錄入口)
```

## 🛠️ 技術架構

### 前端技術棧
- **HTML5**: 現代化的語義標籤和 Canvas API
- **CSS3**: Grid 佈局、Flexbox、動畫效果
- **JavaScript ES6+**: 模組化設計、非同步處理
- **Canvas API**: 高效能繪圖渲染
- **Responsive Design**: 適應各種螢幕尺寸

### 後端技術棧
- **FastAPI**: 高效能 Python Web 框架
- **SQLite**: 輕量級關聯式資料庫
- **Pydantic**: 資料驗證和序列化
- **Uvicorn**: ASGI 服務器

### 核心特性
- **無安裝前端**: 純 HTML/CSS/JS，無需建置工具
- **RESTful API**: 標準化的 API 設計
- **即時通訊**: WebSocket 支援（規劃中）
- **離線支援**: 本地儲存和同步

## 📋 API 文檔

啟動服務後，訪問 http://localhost:8000/docs 查看完整的 API 文檔。

### 主要端點
- `POST /api/chat` - 發送聊天訊息
- `GET /api/examples` - 取得範例列表
- `POST /api/drawings` - 儲存繪圖資料
- `POST /api/ai/analyze-image` - AI 圖像分析

## 🔧 配置說明

### 前端配置 (`frontend/js/config.js`)
```javascript
window.UICoreworkConfig = {
    api: {
        baseURL: 'http://localhost:8000/api',
        timeout: 30000
    },
    drawing: {
        tools: ['pen', 'eraser', 'brush'],
        colors: ['#000000', '#ff0000', '#00ff00'],
        sizes: [1, 3, 5, 10, 20]
    },
    chat: {
        maxMessageLength: 4000,
        enableMarkdown: true
    }
};
```

### 後端配置
環境變數或直接修改 `backend/main.py`：
- `DATABASE_PATH`: 資料庫路徑
- `UPLOAD_DIR`: 檔案上傳目錄
- `DEBUG`: 除錯模式

## 🎯 使用指南

### 1. 繪圖功能
1. 選擇左側的繪圖工具
2. 調整顏色、大小和不透明度
3. 在畫布上開始繪圖
4. 使用 Ctrl+Z/Ctrl+Y 進行復原/重做

### 2. AI 聊天
1. 在中間的 5 行對話框中輸入訊息
2. 按 Ctrl+Enter 或點擊發送按鈕
3. AI 會分析您的繪圖並提供建議
4. 支援 Markdown 格式和圖片上傳

### 3. 範例使用
1. 瀏覽右側的範例區域
2. 使用搜尋和分類篩選
3. 點擊範例查看詳細內容
4. 一鍵套用到您的設計中

### 4. 快捷鍵
- `Ctrl+S`: 儲存當前狀態
- `Ctrl+Z`: 復原
- `Ctrl+Y`: 重做
- `Esc`: 清除選取/關閉彈窗
- `F1`: 顯示說明

## 🔌 擴展開發

### 添加新的繪圖工具
```javascript
// 在 frontend/js/drawing.js 中添加
const newTool = {
    name: 'customTool',
    icon: '🖌️',
    cursor: 'crosshair',
    apply: (ctx, point) => {
        // 工具邏輯
    }
};
```

### 添加新的 API 端點
```python
# 在 backend/main.py 中添加
@app.post("/api/custom-endpoint")
async def custom_endpoint(data: CustomModel):
    # API 邏輯
    return {"result": "success"}
```

## 🧪 測試

### 前端測試
```bash
# 在瀏覽器開發者工具中
console.log(window.UICoreworkApp.isReady());
```

### 後端測試
```bash
# 測試 API 端點
curl http://localhost:8000/api/health

# 或使用 Python
python -m pytest tests/  # (需要先建立測試檔案)
```

## 📝 更新日誌

### v1.0.0 (2024-01-XX)
- ✅ 完整的多模態繪圖系統
- ✅ AI 智慧聊天功能
- ✅ 範例展示和套用
- ✅ 響應式設計
- ✅ SQLite 資料庫支援
- ✅ RESTful API

## 🤝 貢獻指南

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權條款

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 檔案。

## 🆘 支援與反饋

- **問題回報**: [GitHub Issues](https://github.com/yourusername/ui-corework/issues)
- **功能請求**: [GitHub Discussions](https://github.com/yourusername/ui-corework/discussions)
- **電子郵件**: support@uicorework.com

## 🙏 致謝

- FastAPI 團隊提供優秀的 Web 框架
- Canvas API 讓繪圖功能成為可能
- 所有貢獻者和使用者的支持

---

**💡 這個專案完全符合您的需求：**
- ✅ 同時接收 chat 和觸控筆輸入
- ✅ 即時處理後交給 LLM
- ✅ LLM 可透過 API 精確修改 UI 區域
- ✅ 5行高度的對話框設計
- ✅ 主畫面 + 對話框 + 範例圖展示
- ✅ 無需安裝的前端設計

**🚀 立即體驗 UI CoreWork 的強大功能！**