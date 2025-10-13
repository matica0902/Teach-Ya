#!/usr/bin/env python3
"""
UI CoreWork - 資料庫初始化腳本
創建和管理 SQLite 資料庫
"""

import sqlite3
import json
import uuid
import time
from pathlib import Path
from datetime import datetime

# 資料庫路徑
DATABASE_PATH = Path(__file__).parent / "uicorework.db"

def create_database():
    """創建資料庫和表格"""
    print("Creating UI CoreWork database...")
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # 聊天訊息表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            message TEXT NOT NULL,
            message_type TEXT DEFAULT 'text',
            timestamp INTEGER NOT NULL,
            context TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id)
        )
    """)
    
    # 會話表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            metadata TEXT DEFAULT '{}',
            is_archived BOOLEAN DEFAULT 0
        )
    """)
    
    # 繪圖資料表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS drawings (
            id TEXT PRIMARY KEY,
            title TEXT,
            drawing_data TEXT NOT NULL,
            thumbnail TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            metadata TEXT DEFAULT '{}',
            tags TEXT DEFAULT '[]',
            is_public BOOLEAN DEFAULT 0,
            likes_count INTEGER DEFAULT 0
        )
    """)
    
    # 範例表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS examples (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            tags TEXT DEFAULT '[]',
            thumbnail TEXT,
            files TEXT DEFAULT '[]',
            likes INTEGER DEFAULT 0,
            downloads INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER DEFAULT NULL,
            author TEXT,
            metadata TEXT DEFAULT '{}',
            is_featured BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 1
        )
    """)
    
    # 統計表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS statistics (
            id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            event_data TEXT,
            timestamp INTEGER NOT NULL,
            session_id TEXT,
            user_id TEXT,
            ip_address TEXT
        )
    """)
    
    # 使用者設定表（未來擴展用）
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE,
            settings TEXT DEFAULT '{}',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )
    """)
    
    # 創建索引
    create_indexes(cursor)
    
    conn.commit()
    conn.close()
    
    print(f"Database created successfully at: {DATABASE_PATH}")
    return True

def create_indexes(cursor):
    """創建資料庫索引以提升查詢效能"""
    indexes = [
        # 聊天訊息索引
        "CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id)",
        "CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp)",
        
        # 會話索引
        "CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)",
        
        # 繪圖索引
        "CREATE INDEX IF NOT EXISTS idx_drawings_created_at ON drawings(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_drawings_public ON drawings(is_public)",
        
        # 範例索引
        "CREATE INDEX IF NOT EXISTS idx_examples_category ON examples(category)",
        "CREATE INDEX IF NOT EXISTS idx_examples_created_at ON examples(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_examples_featured ON examples(is_featured)",
        "CREATE INDEX IF NOT EXISTS idx_examples_active ON examples(is_active)",
        
        # 統計索引
        "CREATE INDEX IF NOT EXISTS idx_statistics_event_type ON statistics(event_type)",
        "CREATE INDEX IF NOT EXISTS idx_statistics_timestamp ON statistics(timestamp)",
    ]
    
    for index_sql in indexes:
        cursor.execute(index_sql)
    
    print("Database indexes created successfully")

def insert_sample_data():
    """插入範例資料"""
    print("Inserting sample data...")
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # 檢查是否已有範例資料
    cursor.execute("SELECT COUNT(*) FROM examples")
    if cursor.fetchone()[0] > 0:
        print("Sample data already exists, skipping...")
        conn.close()
        return
    
    # 範例資料
    sample_examples = [
        {
            'id': str(uuid.uuid4()),
            'title': '現代登入表單',
            'description': '具備響應式設計的現代登入介面，包含表單驗證、密碼顯示切換、記住我功能等完整特性',
            'category': 'forms',
            'tags': ['login', 'form', 'responsive', 'validation', 'modern'],
            'files': [
                {
                    'name': 'login.html',
                    'type': 'html',
                    'content': '''<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登入</title>
    <link rel="stylesheet" href="login.css">
</head>
<body>
    <div class="login-container">
        <form class="login-form">
            <h2>歡迎回來</h2>
            <div class="form-group">
                <label for="email">電子信箱</label>
                <input type="email" id="email" required>
            </div>
            <div class="form-group">
                <label for="password">密碼</label>
                <input type="password" id="password" required>
            </div>
            <button type="submit">登入</button>
        </form>
    </div>
</body>
</html>'''
                },
                {
                    'name': 'login.css',
                    'type': 'css',
                    'content': '''.login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
}'''
                }
            ],
            'likes': 245,
            'downloads': 156,
            'views': 1023,
            'author': 'UI CoreWork Team',
            'is_featured': True
        },
        {
            'id': str(uuid.uuid4()),
            'title': '互動式儀錶板',
            'description': '包含多種圖表類型的資料視覺化儀錶板，支援即時資料更新和互動操作',
            'category': 'dashboard',
            'tags': ['dashboard', 'charts', 'data-visualization', 'interactive', 'analytics'],
            'files': [
                {
                    'name': 'dashboard.html',
                    'type': 'html',
                    'content': '''<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>資料儀錶板</title>
    <link rel="stylesheet" href="dashboard.css">
</head>
<body>
    <div class="dashboard">
        <header class="dashboard-header">
            <h1>資料總覽</h1>
        </header>
        <div class="dashboard-grid">
            <div class="widget card">
                <h3>總使用者</h3>
                <div class="metric">12,345</div>
            </div>
            <div class="widget card">
                <h3>今日活躍</h3>
                <div class="metric">1,234</div>
            </div>
            <div class="widget chart-widget">
                <canvas id="chart"></canvas>
            </div>
        </div>
    </div>
</body>
</html>'''
                }
            ],
            'likes': 189,
            'downloads': 87,
            'views': 654,
            'author': 'DataViz Pro',
            'is_featured': False
        },
        {
            'id': str(uuid.uuid4()),
            'title': '響應式導航選單',
            'description': '適應各種螢幕尺寸的響應式導航選單，包含下拉選單和漢堡選單功能',
            'category': 'navigation',
            'tags': ['navigation', 'responsive', 'hamburger-menu', 'dropdown', 'mobile'],
            'files': [
                {
                    'name': 'navigation.html',
                    'type': 'html',
                    'content': '''<nav class="navbar">
    <div class="nav-brand">Logo</div>
    <ul class="nav-menu">
        <li><a href="#home">首頁</a></li>
        <li><a href="#about">關於我們</a></li>
        <li><a href="#services">服務</a></li>
        <li><a href="#contact">聯絡我們</a></li>
    </ul>
    <div class="hamburger">
        <span></span>
        <span></span>
        <span></span>
    </div>
</nav>'''
                }
            ],
            'likes': 167,
            'downloads': 134,
            'views': 789,
            'author': 'NavMaster',
            'is_featured': True
        },
        {
            'id': str(uuid.uuid4()),
            'title': '產品卡片佈局',
            'description': '電商網站常用的產品展示卡片佈局，包含圖片、標題、價格和按鈕等元素',
            'category': 'ecommerce',
            'tags': ['product-card', 'ecommerce', 'layout', 'shopping', 'responsive'],
            'files': [
                {
                    'name': 'product-cards.html',
                    'type': 'html',
                    'content': '''<div class="products-grid">
    <div class="product-card">
        <img src="product1.jpg" alt="產品1">
        <h3>產品名稱</h3>
        <p class="price">$199</p>
        <button class="add-to-cart">加入購物車</button>
    </div>
</div>'''
                }
            ],
            'likes': 98,
            'downloads': 67,
            'views': 445,
            'author': 'ShopUI',
            'is_featured': False
        }
    ]
    
    # 插入範例資料
    for example in sample_examples:
        timestamp = int(time.time())
        cursor.execute("""
            INSERT INTO examples 
            (id, title, description, category, tags, thumbnail, files, likes, downloads, views, 
             created_at, author, metadata, is_featured, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            example['id'],
            example['title'],
            example['description'],
            example['category'],
            json.dumps(example['tags']),
            None,  # thumbnail
            json.dumps(example['files']),
            example['likes'],
            example['downloads'],
            example['views'],
            timestamp,
            example['author'],
            json.dumps({}),
            example['is_featured'],
            True
        ))
    
    # 插入範例會話
    conversation_id = str(uuid.uuid4())
    timestamp = int(time.time())
    
    cursor.execute("""
        INSERT INTO conversations (id, title, created_at, updated_at)
        VALUES (?, ?, ?, ?)
    """, (conversation_id, "範例對話", timestamp, timestamp))
    
    # 插入範例聊天訊息
    messages = [
        ("user", "你好，我想學習網頁設計"),
        ("assistant", "您好！很高興為您介紹網頁設計。我可以協助您學習HTML、CSS、JavaScript等技術，也可以提供設計靈感和最佳實踐。您想從哪個部分開始呢？"),
        ("user", "我想先學習如何製作一個登入表單"),
        ("assistant", "很好的選擇！登入表單是網頁開發的基礎組件。我建議您可以參考我們的「現代登入表單」範例，它包含了完整的HTML結構、CSS樣式和表單驗證功能。您可以在右側的範例區域找到它。")
    ]
    
    for i, (sender, message) in enumerate(messages):
        cursor.execute("""
            INSERT INTO chat_messages (id, conversation_id, sender, message, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), conversation_id, sender, message, timestamp + i))
    
    conn.commit()
    conn.close()
    
    print(f"Sample data inserted successfully: {len(sample_examples)} examples, 1 conversation, {len(messages)} messages")

def reset_database():
    """重置資料庫（刪除所有資料）"""
    if DATABASE_PATH.exists():
        DATABASE_PATH.unlink()
        print("Database reset completed")
    else:
        print("Database file not found, nothing to reset")
    
    create_database()
    insert_sample_data()

def backup_database(backup_path=None):
    """備份資料庫"""
    if not DATABASE_PATH.exists():
        print("Database not found, nothing to backup")
        return False
    
    if backup_path is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = DATABASE_PATH.parent / f"backup_uicorework_{timestamp}.db"
    
    try:
        import shutil
        shutil.copy2(DATABASE_PATH, backup_path)
        print(f"Database backed up to: {backup_path}")
        return True
    except Exception as e:
        print(f"Backup failed: {e}")
        return False

def show_database_info():
    """顯示資料庫資訊"""
    if not DATABASE_PATH.exists():
        print("Database not found")
        return
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    print("\n=== Database Information ===")
    print(f"Database path: {DATABASE_PATH}")
    print(f"Database size: {DATABASE_PATH.stat().st_size} bytes")
    
    # 取得表格列表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print(f"\nTables ({len(tables)}):")
    for table in tables:
        table_name = table[0]
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"  - {table_name}: {count} records")
    
    conn.close()

def main():
    """主程式"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python init_db.py create    - Create database and tables")
        print("  python init_db.py reset     - Reset database (delete and recreate)")
        print("  python init_db.py sample    - Insert sample data")
        print("  python init_db.py backup    - Backup database")
        print("  python init_db.py info      - Show database information")
        return
    
    command = sys.argv[1].lower()
    
    if command == "create":
        create_database()
        insert_sample_data()
    elif command == "reset":
        reset_database()
    elif command == "sample":
        insert_sample_data()
    elif command == "backup":
        backup_database()
    elif command == "info":
        show_database_info()
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()