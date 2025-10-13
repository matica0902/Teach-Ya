#!/usr/bin/env python3
"""
UI CoreWork - FastAPI 後端服務器
提供聊天、範例、繪圖功能的 REST API
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
import json
import uuid
import time
from datetime import datetime
import os
import base64
import logging
from pathlib import Path
import io
from PIL import Image
import google.generativeai as genai

# 設定日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Gemini AI 設定
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = None

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # 使用最新的 Gemini 2.5 Flash 模型
        GEMINI_MODEL = genai.GenerativeModel('gemini-2.5-flash')
        logger.info("Gemini AI configured successfully with gemini-2.5-flash model")
    except Exception as e:
        logger.error(f"Failed to configure Gemini AI: {e}")
        GEMINI_MODEL = None
        logger.warning("Falling back to test mode")
else:
    logger.warning("GEMINI_API_KEY not found, AI analysis will use fallback mode")

# 創建 FastAPI 應用
app = FastAPI(
    title="UI CoreWork API",
    description="智慧設計協作平台的 REST API",
    version="1.0.0"
)

# 設定 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開發環境允許所有來源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 項目路徑
BASE_DIR = Path(__file__).parent.parent  # backend 的上一層是項目根目錄
DATABASE_PATH = BASE_DIR / "database" / "uicorework.db"
UPLOAD_DIR = BASE_DIR / "uploads"

# 確保目錄存在
DATABASE_PATH.parent.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)

# ============ 資料模型 ============

class ChatMessage(BaseModel):
    message: str
    type: str = "text"
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    id: str
    content: str
    conversation_id: str
    timestamp: int

class DrawingData(BaseModel):
    id: str
    title: Optional[str] = None
    image_data: str  # base64 encoded image
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: Optional[float] = None
    strokes: Optional[List[Dict[str, Any]]] = None  # 添加 strokes 屬性
    canvas: Optional[Dict[str, Any]] = None  # 添加 canvas 屬性
    metadata: Optional[Dict[str, Any]] = None  # 添加 metadata 屬性

class ImageAnalysisRequest(BaseModel):
    image_data: str  # base64 encoded image (data:image/png;base64,...)
    prompt: Optional[str] = "請分析這個UI設計草圖，識別其中的元素，評估設計，並提供改進建議。"

class ImageAnalysisResponse(BaseModel):
    success: bool
    analysis: Optional[str] = None
    suggested_examples: Optional[List[str]] = None
    error: Optional[str] = None

class MathFormulaRequest(BaseModel):
    image_data: str  # base64 encoded image (data:image/png;base64,...)

class MathFormulaResponse(BaseModel):
    success: bool
    latex: Optional[str] = None
    analysis: Optional[str] = None
    confidence: Optional[float] = None
    error: Optional[str] = None

class Example(BaseModel):
    title: str
    description: str
    category: str
    tags: List[str] = []
    thumbnail: Optional[str] = None
    files: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None

# ============ 資料庫操作 ============

def get_db():
    """取得資料庫連線"""
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_database():
    """初始化資料庫結構"""
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    cursor = conn.cursor()
    
    # 聊天記錄表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT,
            sender TEXT,
            message TEXT,
            message_type TEXT DEFAULT 'text',
            timestamp INTEGER,
            context TEXT
        )
    """)
    
    # 會話表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT,
            created_at INTEGER,
            updated_at INTEGER,
            metadata TEXT
        )
    """)
    
    # 繪圖資料表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS drawings (
            id TEXT PRIMARY KEY,
            title TEXT,
            drawing_data TEXT,
            thumbnail TEXT,
            created_at INTEGER,
            updated_at INTEGER,
            metadata TEXT
        )
    """)
    
    # 範例表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS examples (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            category TEXT,
            tags TEXT,
            thumbnail TEXT,
            files TEXT,
            likes INTEGER DEFAULT 0,
            downloads INTEGER DEFAULT 0,
            created_at INTEGER,
            author TEXT,
            metadata TEXT
        )
    """)
    
    # 統計表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS statistics (
            id TEXT PRIMARY KEY,
            event_type TEXT,
            event_data TEXT,
            timestamp INTEGER
        )
    """)
    
    conn.commit()
    conn.close()
    
    # 插入範例資料
    insert_sample_data()
    
    logger.info("Database initialized successfully")

# ============ AI 圖像分析功能 ============

async def analyze_image_with_ai(image_data: str, prompt: str) -> Dict[str, Any]:
    """使用 Gemini AI 分析圖像"""
    try:
        if not GEMINI_API_KEY:
            return {
                "success": False,
                "error": "AI 服務未配置，請設定 GEMINI_API_KEY 環境變數"
            }
        
        # 處理 base64 圖像數據
        if image_data.startswith('data:image'):
            # 移除 data:image/png;base64, 前綴
            image_data = image_data.split(',')[1]
        
        # 解碼 base64 圖像
        image_bytes = base64.b64decode(image_data)
        
        # 使用 PIL 處理圖像
        image = Image.open(io.BytesIO(image_bytes))
        
        # 構建簡化分析提示詞
        analysis_prompt = f"""
        請分析這個手繪圖像，重點完成以下兩項任務：

        {prompt}

        請提供：
        1. **畫布中的文字內容** - 列出圖中所有可以識別的文字、標籤、按鈕文字等
        2. **繪圖內容說明** - 簡單描述畫了什麼東西，有哪些圖形、元素或設計

        請用繁體中文回答，格式清楚簡潔。
        """
        
        # 使用 Gemini 2.5 Flash 進行真正的 AI 分析
        if GEMINI_MODEL:
            try:
                # Use the Gemini model for real analysis
                response = GEMINI_MODEL.generate_content([
                    analysis_prompt,
                    image
                ])
                analysis_text = response.text
                logger.info("Successfully analyzed image with Gemini 2.5 Flash")
            except Exception as e:
                logger.error(f"Gemini AI analysis failed: {e}")
                # Fall back to simple response
                analysis_text = f"""
        ## 📝 圖像分析結果 (後備模式)

        **1. 畫布中的文字內容**:
        - 無法自動識別文字內容（需要AI服務）

        **2. 繪圖內容說明**:
        - 檢測到手繪內容
        - 包含線條和圖形元素
        - 建議使用AI分析功能獲得詳細說明

        *(注意：Gemini AI 分析失敗，使用基本分析模式)*
                """
        else:
            # No API key configured, use fallback
            analysis_text = f"""
        ## 📝 圖像分析結果 (測試模式)

        **1. 畫布中的文字內容**:
        - 無法識別文字內容（需要設定API密鑰）

        **2. 繪圖內容說明**:
        - 檢測到畫布中有繪圖內容
        - 包含手繪的線條和圖形
        - 需要AI服務來提供詳細分析

        *(注意：請設定 GEMINI_API_KEY 環境變數以啟用AI文字識別和圖像分析功能)*
            """
        
        # 根據分析結果提取建議的範例類型
        suggested_examples = []
        text_lower = analysis_text.lower()
        if "按鈕" in analysis_text or "button" in text_lower:
            suggested_examples.append("按鈕")
        if "表單" in analysis_text or "輸入" in analysis_text or "form" in text_lower:
            suggested_examples.append("表單")
        if "導航" in analysis_text or "選單" in analysis_text or "nav" in text_lower or "menu" in text_lower:
            suggested_examples.append("導航")
        if "卡片" in analysis_text or "card" in text_lower:
            suggested_examples.append("卡片")
        # 如果有文字內容，加入文字設計範例
        if "文字" in analysis_text or "text" in text_lower:
            suggested_examples.append("文字設計")
        
        return {
            "success": True,
            "analysis": analysis_text,
            "suggested_examples": suggested_examples if suggested_examples else ["界面設計"]
        }
        
    except Exception as e:
        logger.error(f"AI image analysis error: {str(e)}")
        return {
            "success": False,
            "error": f"AI 分析失敗: {str(e)}"
        }

async def analyze_math_formula(image_data: str) -> Dict[str, Any]:
    """
    專門的數學公式分析函數
    使用 Gemini 2.5 Flash 專用的數學公式識別提示詞
    """
    try:
        # 解碼 base64 圖片
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # 專門的數學公式分析提示詞
        math_prompt = """
        你是一個專業的數學公式識別專家。請分析這個圖像中的數學內容。

        圖像可能包含：
        - 手寫的數學公式
        - 印刷體的數學公式
        - 混合的數學表達式和手寫內容
        
        你的任務：
        1. 識別圖像中**所有**的數學內容（包括已經是標準格式的）
        2. 將所有數學內容轉換為 LaTeX 格式
        3. **重要**：保持原始的排版結構（如果是多行，使用多行格式）

        輸出格式：
        - 直接輸出 LaTeX 代碼，用 \\[ 和 \\] 包圍
        - 只輸出純 LaTeX，不要其他說明文字
        - **多行公式請使用 \\begin{aligned} ... \\end{aligned} 格式**
        - 確保 LaTeX 語法正確，可被 KaTeX 渲染
        
        範例 1（單行）：
        輸入圖片：x²+1
        輸出：\\[x^2 + 1\\]
        
        範例 2（多行）：
        輸入圖片：
          2x + 1 = 5
          y - 3 = 0
        輸出：\\[\\begin{aligned} 2x + 1 &= 5 \\\\ y - 3 &= 0 \\end{aligned}\\]
        
        重要：
        1. 保持原始排版結構（多行就用多行格式）
        2. 即使圖像已經是標準印刷公式，也要完整識別
        """
        
        # 使用 Gemini 2.5 Flash 進行數學公式分析
        if GEMINI_MODEL:
            try:
                response = GEMINI_MODEL.generate_content([
                    math_prompt,
                    image
                ])
                analysis_text = response.text
                logger.info("Successfully analyzed math formula with Gemini 2.5 Flash")
                
                # 從回應中提取 LaTeX 公式
                latex_formula = extract_latex_from_analysis(analysis_text)
                confidence = calculate_math_confidence(analysis_text)
                
                return {
                    "success": True,
                    "analysis": analysis_text,
                    "latex": latex_formula,
                    "confidence": confidence
                }
                
            except Exception as e:
                logger.error(f"Gemini math analysis error: {str(e)}")
                return {
                    "success": False,
                    "error": f"數學公式分析失敗: {str(e)}"
                }
        else:
            # 沒有 API key 的情況
            return {
                "success": False,
                "error": "GEMINI_API_KEY 未設置，無法進行數學公式分析"
            }
            
    except Exception as e:
        logger.error(f"Math formula analysis error: {str(e)}")
        return {
            "success": False,
            "error": f"數學公式分析失敗: {str(e)}"
        }

def extract_latex_from_analysis(analysis_text: str) -> Optional[str]:
    """
    從 Gemini 分析結果中提取 LaTeX 公式
    """
    import re
    
    # 尋找 LaTeX 格式的數學公式
    patterns = [
        r'\\\[(.*?)\\\]',       # \[...\] 格式（非貪婪，支持\\等特殊字符）
        r'\\\((.*?)\\\)',       # \(...\) 格式（非貪婪）
        r'LaTeX:\s*([^\n]+)',   # LaTeX: ... 格式
        r'\$\$([^$]+)\$\$',     # $$...$$ 格式
        r'\$([^$]+)\$'          # $...$ 格式
    ]
    
    for pattern in patterns:
        matches = re.search(pattern, analysis_text)
        if matches:
            latex_content = matches.group(1).strip()
            # 確保格式正確
            if not latex_content.startswith('\\[') and not latex_content.startswith('\\('):
                # 如果是複雜公式，使用獨立公式格式
                if any(symbol in latex_content for symbol in ['=', '+', '-', '*', '/', '^', '_']):
                    return f"\\[{latex_content}\\]"
                else:
                    return f"\\({latex_content}\\)"
            return latex_content
    
    return None

def calculate_math_confidence(analysis_text: str) -> float:
    """
    根據分析結果計算數學公式識別的信心度
    """
    confidence = 0.0
    
    # 檢查是否包含數學關鍵詞
    math_keywords = ['LaTeX', '公式', '方程', '數學', '運算', '符號', '變數']
    for keyword in math_keywords:
        if keyword in analysis_text:
            confidence += 0.15
    
    # 檢查是否包含 LaTeX 語法
    latex_symbols = ['\\[', '\\]', '\\(', '\\)', '^', '_', '=', '+', '-']
    for symbol in latex_symbols:
        if symbol in analysis_text:
            confidence += 0.1
    
    return min(confidence, 1.0)

def fallback_image_analysis(image_data: str) -> Dict[str, Any]:
    """後備的基本圖像分析"""
    try:
        # 處理 base64 圖像數據
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # 基本圖像信息
        width, height = image.size
        mode = image.mode
        
        # 基本分析
        analysis = f"""📊 **圖像基本分析：**

🖼️ **圖像信息：**
• 尺寸: {width} × {height} 像素
• 色彩模式: {mode}

🎨 **設計建議：**
• 建議考慮添加更多對比色來突出重要元素
• 可以嘗試使用網格系統來組織佈局
• 考慮添加文字標籤來說明功能
• 保持設計的一致性和可用性

💡 **提示：** 設定 GEMINI_API_KEY 環境變數可啟用 AI 智能分析功能！"""
        
        return {
            "success": True,
            "analysis": analysis.strip(),
            "suggested_examples": ["界面設計"]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"圖像處理失敗: {str(e)}"
        }

def insert_sample_data():
    """插入範例資料"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # 檢查是否已有範例資料
    cursor.execute("SELECT COUNT(*) FROM examples")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return
    
    sample_examples = [
        {
            'id': str(uuid.uuid4()),
            'title': '登入表單',
            'description': '現代化的使用者登入介面，包含響應式設計和表單驗證',
            'category': 'forms',
            'tags': json.dumps(['login', 'form', 'responsive', 'validation']),
            'thumbnail': None,
            'files': json.dumps([
                {'name': 'login.html', 'type': 'html', 'content': '<form>...</form>'},
                {'name': 'login.css', 'type': 'css', 'content': '.login-form {...}'},
                {'name': 'login.js', 'type': 'javascript', 'content': 'function validateForm() {...}'}
            ]),
            'likes': 145,
            'downloads': 89,
            'created_at': int(time.time()),
            'author': 'UI CoreWork',
            'metadata': json.dumps({})
        },
        {
            'id': str(uuid.uuid4()),
            'title': '儀錶板小工具',
            'description': '包含圖表、統計卡片和數據視覺化的儀錶板組件',
            'category': 'dashboard',
            'tags': json.dumps(['dashboard', 'widgets', 'charts', 'analytics']),
            'thumbnail': None,
            'files': json.dumps([
                {'name': 'dashboard.html', 'type': 'html', 'content': '<div class="dashboard">...</div>'},
                {'name': 'dashboard.css', 'type': 'css', 'content': '.dashboard {...}'},
                {'name': 'charts.js', 'type': 'javascript', 'content': 'function renderChart() {...}'}
            ]),
            'likes': 203,
            'downloads': 156,
            'created_at': int(time.time()),
            'author': 'UI CoreWork',
            'metadata': json.dumps({})
        },
        {
            'id': str(uuid.uuid4()),
            'title': '手機導航選單',
            'description': '適合行動裝置的漢堡選單導航，支援手勢操作',
            'category': 'navigation',
            'tags': json.dumps(['mobile', 'navigation', 'hamburger', 'responsive']),
            'thumbnail': None,
            'files': json.dumps([
                {'name': 'mobile-nav.html', 'type': 'html', 'content': '<nav>...</nav>'},
                {'name': 'mobile-nav.css', 'type': 'css', 'content': '.mobile-nav {...}'},
                {'name': 'mobile-nav.js', 'type': 'javascript', 'content': 'function toggleMenu() {...}'}
            ]),
            'likes': 167,
            'downloads': 134,
            'created_at': int(time.time()),
            'author': 'UI CoreWork',
            'metadata': json.dumps({})
        }
    ]
    
    for example in sample_examples:
        cursor.execute("""
            INSERT INTO examples 
            (id, title, description, category, tags, thumbnail, files, likes, downloads, created_at, author, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            example['id'], example['title'], example['description'], example['category'],
            example['tags'], example['thumbnail'], example['files'], example['likes'],
            example['downloads'], example['created_at'], example['author'], example['metadata']
        ))
    
    conn.commit()
    conn.close()
    logger.info("Sample data inserted successfully")

# ============ 工具函數 ============

def generate_id() -> str:
    """生成唯一 ID"""
    return str(uuid.uuid4())

def get_timestamp() -> int:
    """取得當前時間戳"""
    return int(time.time())

async def simulate_ai_response(message: str, context: Optional[Dict] = None) -> str:
    """模擬 AI 回應（實際應該調用真實的 AI API）"""
    
    # 簡單的回應邏輯
    if "你好" in message or "hello" in message.lower():
        return "您好！我是 UI CoreWork 的 AI 助手，很高興為您服務。我可以協助您進行介面設計、程式開發和創意發想。有什麼我可以幫助您的嗎？"
    
    elif "繪圖" in message or "畫" in message:
        return "我看到您對繪圖功能感興趣！您可以使用左側的繪圖工具來創作設計稿。我可以幫您分析繪圖內容、提供設計建議，或者根據您的描述生成設計元素。"
    
    elif "範例" in message or "example" in message.lower():
        return "我們有豐富的設計範例庫供您參考！您可以瀏覽右側的範例區域，找到適合的模板並直接套用到您的專案中。目前有表單、儀錶板、導航等多種類型的範例。"
    
    elif "設計" in message or "design" in message.lower():
        return "關於設計，我可以為您提供多方面的協助：\n\n1. 分析您的繪圖並提供改進建議\n2. 推薦適合的色彩搭配和佈局\n3. 協助您選擇合適的UI組件\n4. 提供響應式設計的最佳實踐\n\n請告訴我您具體需要什麼協助？"
    
    elif "顏色" in message or "color" in message.lower():
        return "色彩是設計中非常重要的元素！我建議：\n\n• 主色：選擇品牌色或功能性顏色\n• 輔助色：用於強調和引導\n• 中性色：用於文字和背景\n• 對比度：確保可讀性\n\n您想了解特定的配色方案嗎？"
    
    elif "佈局" in message or "layout" in message.lower():
        return "好的佈局設計原則包括：\n\n• 網格系統：創造視覺秩序\n• 留白空間：讓內容呼吸\n• 視覺層次：引導用戶注意力\n• 響應式設計：適應不同螢幕\n\n您正在設計什麼類型的介面呢？"
    
    else:
        return f"感謝您的問題：「{message}」\n\n我正在思考如何為您提供最有幫助的回應。作為 UI/UX 設計助手，我可以協助您進行介面設計、用戶體驗優化、程式開發等工作。\n\n您可以：\n• 描述您的設計需求\n• 上傳圖片讓我分析\n• 詢問設計相關問題\n• 尋找合適的範例模板\n\n有什麼具體的問題我可以幫您解決嗎？"

# ============ API 端點 ============

@app.get("/api/health")
async def health_check():
    """健康檢查"""
    return {"status": "ok", "timestamp": get_timestamp()}

# ============ AI 圖像分析 API ============

@app.post("/api/analyze-image")
async def analyze_image(request: ImageAnalysisRequest) -> ImageAnalysisResponse:
    """分析上傳的圖像並提供設計建議"""
    try:
        logger.info("Received image analysis request")
        
        # 確保 prompt 始終為字符串
        prompt = request.prompt or "默認分析提示"
        # 嘗試使用 AI 分析
        if GEMINI_API_KEY:
            result = await analyze_image_with_ai(request.image_data, prompt)
        else:
            # 使用後備分析
            result = fallback_image_analysis(request.image_data)
        
        return ImageAnalysisResponse(**result)
        
    except Exception as e:
        logger.error(f"Image analysis API error: {str(e)}")
        return ImageAnalysisResponse(
            success=False,
            error=f"圖像分析失敗: {str(e)}"
        )

@app.post("/api/analyze-math", response_model=MathFormulaResponse)
async def analyze_math_formula_api(request: MathFormulaRequest) -> MathFormulaResponse:
    """專門的數學公式分析API端點"""
    logger.info("Received math formula analysis request")
    
    try:
        # 調用專門的數學公式分析函數
        result = await analyze_math_formula(request.image_data)
        
        return MathFormulaResponse(**result)
        
    except Exception as e:
        logger.error(f"Math formula analysis API error: {str(e)}")
        return MathFormulaResponse(
            success=False,
            error=f"數學公式分析失敗: {str(e)}"
        )

# ============ 聊天 API ============

@app.post("/api/chat", response_model=ChatResponse)
async def send_chat_message(message: ChatMessage, db: sqlite3.Connection = Depends(get_db)):
    """發送聊天訊息"""
    logger.info("Received chat message: %s", message.dict())
    try:
        # 生成或使用現有的會話 ID
        conversation_id = message.conversation_id or generate_id()
        logger.info("Using conversation ID: %s", conversation_id)
        
        # 儲存使用者訊息
        user_msg_id = generate_id()
        timestamp = get_timestamp()
        
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO chat_messages (id, conversation_id, sender, message, message_type, timestamp, context)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_msg_id, conversation_id, "user", message.message, 
            message.type, timestamp, json.dumps(message.context or {})
        ))
        logger.info("User message saved with ID: %s", user_msg_id)
        
        # 生成 AI 回應
        ai_response = await simulate_ai_response(message.message, message.context)
        logger.info("Generated AI response: %s", ai_response)
        
        # 儲存 AI 回應
        ai_msg_id = generate_id()
        cursor.execute("""
            INSERT INTO chat_messages (id, conversation_id, sender, message, message_type, timestamp, context)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            ai_msg_id, conversation_id, "assistant", ai_response, 
            "text", timestamp + 1, json.dumps({})
        ))
        logger.info("AI response saved with ID: %s", ai_msg_id)
        
        # 更新或創建會話
        cursor.execute("""
            INSERT OR REPLACE INTO conversations (id, title, created_at, updated_at, metadata)
            VALUES (?, ?, ?, ?, ?)
        """, (
            conversation_id, message.message[:50] + "..." if len(message.message) > 50 else message.message,
            timestamp, timestamp, json.dumps({})
        ))
        logger.info("Conversation updated with ID: %s", conversation_id)
        
        db.commit()
        
        return ChatResponse(
            id=ai_msg_id,
            content=ai_response,
            conversation_id=conversation_id,
            timestamp=timestamp + 1
        )
    except Exception as e:
        logger.error("Error processing chat message: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/chat/conversations")
async def get_conversations(db: sqlite3.Connection = Depends(get_db)):
    """取得會話列表"""
    cursor = db.cursor()
    cursor.execute("""
        SELECT id, title, created_at, updated_at 
        FROM conversations 
        ORDER BY updated_at DESC 
        LIMIT 50
    """)
    
    conversations = []
    for row in cursor.fetchall():
        conversations.append({
            "id": row[0],
            "title": row[1],
            "created_at": row[2],
            "updated_at": row[3]
        })
    
    return {"conversations": conversations}

@app.get("/api/chat/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, db: sqlite3.Connection = Depends(get_db)):
    """取得會話訊息"""
    cursor = db.cursor()
    cursor.execute("""
        SELECT id, sender, message, message_type, timestamp 
        FROM chat_messages 
        WHERE conversation_id = ? 
        ORDER BY timestamp ASC
    """, (conversation_id,))
    
    messages = []
    for row in cursor.fetchall():
        messages.append({
            "id": row[0],
            "sender": row[1],
            "content": row[2],
            "type": row[3],
            "timestamp": row[4]
        })
    
    return {"messages": messages}

# ============ 範例 API ============

@app.get("/api/examples")
async def get_examples(
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: sqlite3.Connection = Depends(get_db)
):
    """取得範例列表"""
    offset = (page - 1) * limit
    
    # 建構查詢
    query = "SELECT * FROM examples WHERE 1=1"
    params = []
    
    if category and category != 'all':
        query += " AND category = ?"
        params.append(category)
    
    if search:
        query += " AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)"
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term])
    
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor = db.cursor()
    cursor.execute(query, params)
    
    examples = []
    for row in cursor.fetchall():
        examples.append({
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "category": row[3],
            "tags": json.loads(row[4] or "[]"),
            "thumbnail": row[5],
            "files": json.loads(row[6] or "[]"),
            "likes": row[7],
            "downloads": row[8],
            "created_at": row[9],
            "author": row[10]
        })
    
    # 取得總數
    count_query = "SELECT COUNT(*) FROM examples WHERE 1=1"
    count_params = []
    
    if category and category != 'all':
        count_query += " AND category = ?"
        count_params.append(category)
    
    if search:
        count_query += " AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)"
        search_term = f"%{search}%"
        count_params.extend([search_term, search_term, search_term])
    
    cursor.execute(count_query, count_params)
    total = cursor.fetchone()[0]
    
    return {
        "examples": examples,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@app.get("/api/examples/{example_id}")
async def get_example(example_id: str, db: sqlite3.Connection = Depends(get_db)):
    """取得單一範例詳情"""
    cursor = db.cursor()
    cursor.execute("SELECT * FROM examples WHERE id = ?", (example_id,))
    row = cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Example not found")
    
    return {
        "id": row[0],
        "title": row[1],
        "description": row[2],
        "category": row[3],
        "tags": json.loads(row[4] or "[]"),
        "thumbnail": row[5],
        "files": json.loads(row[6] or "[]"),
        "likes": row[7],
        "downloads": row[8],
        "created_at": row[9],
        "author": row[10],
        "metadata": json.loads(row[11] or "{}")
    }

@app.post("/api/examples")
async def create_example(example: Example, db: sqlite3.Connection = Depends(get_db)):
    """創建新範例"""
    example_id = generate_id()
    timestamp = get_timestamp()
    
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO examples 
        (id, title, description, category, tags, thumbnail, files, likes, downloads, created_at, author, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        example_id, example.title, example.description, example.category,
        json.dumps(example.tags), example.thumbnail, json.dumps(example.files or []),
        0, 0, timestamp, "User", json.dumps(example.metadata or {})
    ))
    
    db.commit()
    
    return {"id": example_id, "message": "Example created successfully"}

# ============ 繪圖 API ============

@app.post("/api/drawings")
async def save_drawing(drawing: DrawingData, db: sqlite3.Connection = Depends(get_db)):
    """儲存繪圖"""
    drawing_id = generate_id()
    timestamp = get_timestamp()
    
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO drawings (id, title, drawing_data, thumbnail, created_at, updated_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        drawing_id, 
        f"Drawing {datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')}",
        json.dumps({
            "strokes": drawing.strokes,
            "canvas": drawing.canvas
        }),
        drawing.image_data,  # 保存 base64 圖像數據到 thumbnail 字段
        timestamp, timestamp,
        json.dumps(drawing.metadata or {})
    ))
    
    db.commit()
    
    return {"id": drawing_id, "message": "Drawing saved successfully"}

@app.get("/api/drawings/{drawing_id}")
async def load_drawing(drawing_id: str, db: sqlite3.Connection = Depends(get_db)):
    """載入繪圖"""
    cursor = db.cursor()
    cursor.execute("SELECT * FROM drawings WHERE id = ?", (drawing_id,))
    row = cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Drawing not found")
    
    drawing_data = json.loads(row[2])
    
    return {
        "id": row[0],
        "title": row[1],
        "drawing_data": drawing_data,
        "created_at": row[4],
        "updated_at": row[5],
        "metadata": json.loads(row[6] or "{}")
    }

@app.get("/api/drawings")
async def get_drawings(page: int = 1, limit: int = 10, db: sqlite3.Connection = Depends(get_db)):
    """取得繪圖列表"""
    offset = (page - 1) * limit
    
    cursor = db.cursor()
    cursor.execute("""
        SELECT id, title, thumbnail, created_at, updated_at
        FROM drawings 
        ORDER BY updated_at DESC 
        LIMIT ? OFFSET ?
    """, (limit, offset))
    
    drawings = []
    for row in cursor.fetchall():
        drawings.append({
            "id": row[0],
            "title": row[1],
            "thumbnail": row[2],
            "created_at": row[3],
            "updated_at": row[4]
        })
    
    return {"drawings": drawings}

# ============ AI 分析 API ============

@app.post("/api/ai/analyze-image")
async def simulate_analyze_image(data: Dict[str, Any]):
    """模擬 AI 圖像分析功能"""
    
    # 這裡應該整合真實的 AI 服務，如 OpenAI Vision API 或 Google Cloud Vision
    # 目前提供模擬回應
    
    analysis_result = {
        "analysis_id": generate_id(),
        "timestamp": get_timestamp(),
        "elements": [
            {"type": "shape", "name": "矩形", "confidence": 0.95, "position": {"x": 100, "y": 150}},
            {"type": "text", "name": "標題文字", "confidence": 0.87, "position": {"x": 50, "y": 80}},
            {"type": "color", "name": "主色調", "value": "#3498db", "percentage": 0.45}
        ],
        "suggestions": [
            "建議調整文字和背景的對比度以提升可讀性",
            "考慮使用更一致的間距來改善視覺平衡",
            "可以添加更多的視覺層次來引導使用者注意力"
        ],
        "style_analysis": {
            "design_style": "現代簡約",
            "color_scheme": "單色調",
            "complexity": "簡單"
        }
    }
    
    return analysis_result

# ============ 統計 API ============

@app.post("/api/statistics/{event_type}")
async def record_statistic(event_type: str, data: Dict[str, Any], db: sqlite3.Connection = Depends(get_db)):
    """記錄統計資料"""
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO statistics (id, event_type, event_data, timestamp)
        VALUES (?, ?, ?, ?)
    """, (generate_id(), event_type, json.dumps(data), get_timestamp()))
    
    db.commit()
    
    return {"message": "Statistics recorded"}

# ============ 檔案上傳 API ============

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """上傳檔案"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # 生成唯一檔名
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
    unique_filename = f"{generate_id()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # 儲存檔案
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        return {
            "filename": unique_filename,
            "original_filename": file.filename,
            "size": len(content),
            "url": f"/uploads/{unique_filename}"
        }
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")

@app.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """取得上傳的檔案"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

# ============ 靜態檔案服務 ============

# 服務前端靜態檔案
app.mount("/static", StaticFiles(directory=BASE_DIR / "frontend"), name="static")
app.mount("/frontend", StaticFiles(directory=BASE_DIR / "frontend"), name="frontend")

@app.get("/")
async def serve_frontend():
    """服務前端主頁"""
    return FileResponse(BASE_DIR / "frontend" / "ultra_simple.html")

@app.get("/simple")
async def serve_simple():
    """服務簡化版前端頁面"""
    return FileResponse(BASE_DIR / "frontend" / "simple.html")

@app.get("/ultra")
async def serve_ultra_simple():
    """服務超簡化版前端頁面"""
    return FileResponse(BASE_DIR / "frontend" / "ultra_simple.html")

# 提供 favicon.ico 靜態資源
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(BASE_DIR / "assets" / "images" / "favicon.ico")

# ============ 錯誤處理 ============

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# ============ 啟動設定 ============

if __name__ == "__main__":
    import uvicorn
    
    # 初始化資料庫
    try:
        init_database()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization error: {e}")
    
    # 啟動服務器
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 開發模式
        log_level="info"
    )