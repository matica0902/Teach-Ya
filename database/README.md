# UI CoreWork 資料庫架構說明

## 概述
UI CoreWork 使用 SQLite 資料庫來儲存應用程式的所有資料，包括聊天記錄、繪圖資料、範例模板和統計資訊。

## 資料庫檔案
- **檔案位置**: `database/uicorework.db`
- **類型**: SQLite 3
- **編碼**: UTF-8

## 資料表結構

### 1. chat_messages (聊天訊息表)
儲存使用者與 AI 助手的對話記錄。

| 欄位名 | 類型 | 說明 | 約束 |
|--------|------|------|------|
| id | TEXT | 訊息唯一識別符 | PRIMARY KEY |
| conversation_id | TEXT | 會話 ID | NOT NULL, FOREIGN KEY |
| sender | TEXT | 發送者 (user/assistant) | NOT NULL |
| message | TEXT | 訊息內容 | NOT NULL |
| message_type | TEXT | 訊息類型 (text/image/file) | DEFAULT 'text' |
| timestamp | INTEGER | Unix 時間戳 | NOT NULL |
| context | TEXT | 訊息上下文 (JSON) | |
| created_at | DATETIME | 建立時間 | DEFAULT CURRENT_TIMESTAMP |

**索引**:
- `idx_chat_messages_conversation_id` ON conversation_id
- `idx_chat_messages_timestamp` ON timestamp

### 2. conversations (會話表)
儲存聊天會話的元資料。

| 欄位名 | 類型 | 說明 | 約束 |
|--------|------|------|------|
| id | TEXT | 會話唯一識別符 | PRIMARY KEY |
| title | TEXT | 會話標題 | |
| created_at | INTEGER | 建立時間 | NOT NULL |
| updated_at | INTEGER | 更新時間 | NOT NULL |
| metadata | TEXT | 會話元資料 (JSON) | DEFAULT '{}' |
| is_archived | BOOLEAN | 是否已封存 | DEFAULT 0 |

**索引**:
- `idx_conversations_updated_at` ON updated_at

### 3. drawings (繪圖資料表)
儲存使用者的繪圖作品和資料。

| 欄位名 | 類型 | 說明 | 約束 |
|--------|------|------|------|
| id | TEXT | 繪圖唯一識別符 | PRIMARY KEY |
| title | TEXT | 繪圖標題 | |
| drawing_data | TEXT | 繪圖資料 (JSON) | NOT NULL |
| thumbnail | TEXT | 縮圖 (Base64 或 URL) | |
| created_at | INTEGER | 建立時間 | NOT NULL |
| updated_at | INTEGER | 更新時間 | NOT NULL |
| metadata | TEXT | 繪圖元資料 (JSON) | DEFAULT '{}' |
| tags | TEXT | 標籤 (JSON Array) | DEFAULT '[]' |
| is_public | BOOLEAN | 是否公開 | DEFAULT 0 |
| likes_count | INTEGER | 按讚數 | DEFAULT 0 |

**索引**:
- `idx_drawings_created_at` ON created_at
- `idx_drawings_public` ON is_public

**繪圖資料格式 (drawing_data)**:
```json
{
  "strokes": [
    {
      "id": "stroke_uuid",
      "tool": "pen|eraser|brush",
      "color": "#000000",
      "size": 3,
      "opacity": 1,
      "points": [
        {"x": 100, "y": 150, "pressure": 0.8, "timestamp": 1234567890}
      ],
      "timestamp": 1234567890
    }
  ],
  "canvas": {
    "width": 800,
    "height": 600,
    "background": "#ffffff"
  }
}
```

### 4. examples (範例表)
儲存設計範例和模板。

| 欄位名 | 類型 | 說明 | 約束 |
|--------|------|------|------|
| id | TEXT | 範例唯一識別符 | PRIMARY KEY |
| title | TEXT | 範例標題 | NOT NULL |
| description | TEXT | 範例描述 | |
| category | TEXT | 類別 | NOT NULL |
| tags | TEXT | 標籤 (JSON Array) | DEFAULT '[]' |
| thumbnail | TEXT | 縮圖 (Base64 或 URL) | |
| files | TEXT | 檔案資料 (JSON Array) | DEFAULT '[]' |
| likes | INTEGER | 按讚數 | DEFAULT 0 |
| downloads | INTEGER | 下載次數 | DEFAULT 0 |
| views | INTEGER | 瀏覽次數 | DEFAULT 0 |
| created_at | INTEGER | 建立時間 | NOT NULL |
| updated_at | INTEGER | 更新時間 | |
| author | TEXT | 作者 | |
| metadata | TEXT | 元資料 (JSON) | DEFAULT '{}' |
| is_featured | BOOLEAN | 是否為精選 | DEFAULT 0 |
| is_active | BOOLEAN | 是否啟用 | DEFAULT 1 |

**索引**:
- `idx_examples_category` ON category
- `idx_examples_created_at` ON created_at
- `idx_examples_featured` ON is_featured
- `idx_examples_active` ON is_active

**範例類別**:
- `forms` - 表單
- `dashboard` - 儀錶板
- `navigation` - 導航
- `layout` - 佈局
- `buttons` - 按鈕
- `components` - 組件
- `animations` - 動畫
- `charts` - 圖表
- `ecommerce` - 電商

**檔案資料格式 (files)**:
```json
[
  {
    "name": "login.html",
    "type": "html|css|javascript|json",
    "content": "檔案內容",
    "size": 1024
  }
]
```

### 5. statistics (統計表)
儲存應用程式使用統計資料。

| 欄位名 | 類型 | 說明 | 約束 |
|--------|------|------|------|
| id | TEXT | 統計記錄唯一識別符 | PRIMARY KEY |
| event_type | TEXT | 事件類型 | NOT NULL |
| event_data | TEXT | 事件資料 (JSON) | |
| timestamp | INTEGER | Unix 時間戳 | NOT NULL |
| session_id | TEXT | 會話 ID | |
| user_id | TEXT | 使用者 ID | |
| ip_address | TEXT | IP 位址 | |

**索引**:
- `idx_statistics_event_type` ON event_type
- `idx_statistics_timestamp` ON timestamp

**事件類型**:
- `page_view` - 頁面瀏覽
- `chat_message` - 聊天訊息
- `drawing_create` - 建立繪圖
- `example_view` - 查看範例
- `example_download` - 下載範例
- `tool_usage` - 工具使用

### 6. user_settings (使用者設定表)
儲存使用者個人化設定（未來擴展用）。

| 欄位名 | 類型 | 說明 | 約束 |
|--------|------|------|------|
| id | TEXT | 設定唯一識別符 | PRIMARY KEY |
| user_id | TEXT | 使用者 ID | UNIQUE |
| settings | TEXT | 設定資料 (JSON) | DEFAULT '{}' |
| created_at | INTEGER | 建立時間 | NOT NULL |
| updated_at | INTEGER | 更新時間 | NOT NULL |

**設定資料格式 (settings)**:
```json
{
  "theme": "light|dark",
  "language": "zh-TW|en-US",
  "drawing": {
    "default_tool": "pen",
    "default_color": "#000000",
    "default_size": 3
  },
  "chat": {
    "auto_save": true,
    "show_timestamps": true
  },
  "examples": {
    "preferred_categories": ["forms", "dashboard"],
    "view_mode": "grid|list"
  }
}
```

## 資料庫操作

### 初始化
```bash
cd database
python init_db.py create
```

### 重置資料庫
```bash
python init_db.py reset
```

### 插入範例資料
```bash
python init_db.py sample
```

### 備份資料庫
```bash
python init_db.py backup
```

### 查看資料庫資訊
```bash
python init_db.py info
```

## 資料庫設計原則

### 1. 正規化
- 使用第三正規化 (3NF) 減少資料重複
- 適當使用外鍵維護資料一致性

### 2. 索引策略
- 在經常查詢的欄位上建立索引
- 避免過多索引影響寫入效能

### 3. 資料類型選擇
- 使用 TEXT 儲存 UUID
- 使用 INTEGER 儲存時間戳
- 使用 TEXT 儲存 JSON 資料

### 4. 效能考慮
- 使用 WAL 模式提升併發性
- 定期進行 VACUUM 操作優化資料庫

### 5. 安全性
- 使用參數化查詢防止 SQL 注入
- 定期備份重要資料

## 未來擴展計劃

### 1. 使用者管理
- 新增使用者註冊/登入功能
- 實作使用者權限系統

### 2. 協作功能
- 多人即時協作繪圖
- 範例分享和評論

### 3. 版本控制
- 繪圖版本歷史
- 變更追蹤

### 4. 全文搜尋
- 使用 FTS5 進行全文搜尋
- 智慧搜尋建議

### 5. 分析功能
- 使用者行為分析
- 效能監控