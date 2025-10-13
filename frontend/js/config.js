// UI CoreWork - 配置檔案
window.UICoreworkConfig = {
    // API 端點設定
    api: {
        baseUrl: 'http://localhost:5000/api',
        endpoints: {
            chat: '/chat',
            drawing: '/drawing',
            examples: '/examples',
            recognition: '/recognition',
            veo: '/veo'
        },
        timeout: 30000 // 30 秒超時
    },

    // Google Cloud 設定
    googleCloud: {
        projectId: 'your-project-id', // 請替換為實際的專案 ID
        location: 'asia-east1',
        veoModel: 'veo-001'
    },

    // 繪圖設定
    drawing: {
        canvas: {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff'
        },
        tools: {
            pen: {
                color: '#000000',
                width: 2,
                opacity: 1.0
            },
            eraser: {
                width: 10
            },
            rectangle: {
                strokeColor: '#000000',
                fillColor: 'transparent',
                strokeWidth: 2
            },
            circle: {
                strokeColor: '#000000',
                fillColor: 'transparent',
                strokeWidth: 2
            }
        },
        recognition: {
            throttleDelay: 500, // 即時識別節流延遲 (毫秒)
            minStrokeLength: 5, // 最小筆劃長度
            shapeThreshold: 0.8 // 形狀識別閾值
        }
    },

    // 對話設定
    chat: {
        maxMessages: 100, // 最大消息數量
        autoScroll: true, // 自動滾動到底部
        typingIndicator: true, // 顯示打字指示器
        messageTimeout: 30000 // 消息超時時間
    },

    // 範例設定
    examples: {
        categories: [
            'buttons',
            'forms', 
            'navigation',
            'cards',
            'modals',
            'layouts'
        ],
        maxResults: 20, // 最大搜尋結果數量
        imageFormats: ['jpg', 'jpeg', 'png', 'svg', 'webp'],
        enableWebSearch: true, // 啟用網路搜尋 (預留)
        enableRAG: true // 啟用 RAG 功能 (預留)
    },

    // UI 設定
    ui: {
        theme: 'light', // 主題: light, dark, auto
        animations: true, // 啟用動畫
        sounds: false, // 音效
        autoSave: true, // 自動儲存
        autoSaveInterval: 30000 // 自動儲存間隔 (毫秒)
    },

    // 調試設定
    debug: {
        enabled: true, // 啟用調試模式
        logLevel: 'info', // 日誌等級: error, warn, info, debug
        showCoordinates: true, // 顯示滑鼠座標
        showRecognitionDetails: true // 顯示識別詳情
    },

    // 效能設定
    performance: {
        enableThrottling: true, // 啟用節流
        canvasOptimization: true, // Canvas 優化
        memoryCleanup: true, // 記憶體清理
        maxHistorySize: 50 // 最大歷史記錄大小
    },

    // 本地化設定
    i18n: {
        defaultLanguage: 'zh-TW',
        supportedLanguages: ['zh-TW', 'en-US'],
        dateFormat: 'YYYY-MM-DD HH:mm:ss'
    },

    // 儲存設定
    storage: {
        useLocalStorage: true, // 使用本地儲存
        storageKeys: {
            chatHistory: 'uiCorework_chatHistory',
            drawingHistory: 'uiCorework_drawingHistory',
            userSettings: 'uiCorework_userSettings',
            examples: 'uiCorework_examples'
        },
        maxStorageSize: 10 * 1024 * 1024 // 10MB
    },

    // 安全設定
    security: {
        enableCSRF: true, // 啟用 CSRF 保護
        sanitizeInput: true, // 清理輸入
        validateFileTypes: true, // 驗證檔案類型
        maxFileSize: 5 * 1024 * 1024 // 5MB 最大檔案大小
    }
};

// 環境檢測
window.UICoreworkConfig.environment = {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isTablet: /iPad/i.test(navigator.userAgent),
    hasTouch: 'ontouchstart' in window,
    supportsPointer: 'PointerEvent' in window,
    supportsCanvas: !!document.createElement('canvas').getContext,
    supportsWebGL: !!document.createElement('canvas').getContext('webgl'),
    browserName: (function() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
    })()
};

// 錯誤訊息定義
window.UICoreworkConfig.messages = {
    errors: {
        networkError: '網路連線錯誤，請檢查您的網路設定',
        apiError: 'API 呼叫失敗，請稍後再試',
        canvasError: '畫布初始化失敗',
        storageError: '本地儲存錯誤',
        fileError: '檔案處理錯誤',
        authError: '認證失敗，請重新登入'
    },
    success: {
        messageSent: '消息已發送',
        drawingSaved: '繪圖已儲存',
        exampleLoaded: '範例已載入',
        settingsSaved: '設定已儲存'
    },
    info: {
        connecting: '正在連線...',
        loading: '載入中...',
        processing: '處理中...',
        recognizing: '識別中...',
        searching: '搜尋中...'
    }
};

// 工具設定
window.UICoreworkConfig.tools = {
    pen: {
        name: '畫筆',
        icon: 'fas fa-pen',
        cursor: 'crosshair',
        settings: ['color', 'width', 'opacity']
    },
    eraser: {
        name: '橡皮擦',
        icon: 'fas fa-eraser', 
        cursor: 'grab',
        settings: ['width']
    },
    rectangle: {
        name: '矩形',
        icon: 'fas fa-square',
        cursor: 'crosshair',
        settings: ['strokeColor', 'fillColor', 'strokeWidth']
    },
    circle: {
        name: '圓形',
        icon: 'fas fa-circle',
        cursor: 'crosshair',
        settings: ['strokeColor', 'fillColor', 'strokeWidth']
    },
    text: {
        name: '文字',
        icon: 'fas fa-font',
        cursor: 'text',
        settings: ['color', 'fontSize', 'fontFamily']
    },
    select: {
        name: '選擇',
        icon: 'fas fa-mouse-pointer',
        cursor: 'default',
        settings: []
    }
};

// 範例類別定義
window.UICoreworkConfig.exampleCategories = {
    buttons: {
        name: '按鈕',
        icon: 'fas fa-mouse-pointer',
        keywords: ['button', 'btn', 'click', 'submit', 'action']
    },
    forms: {
        name: '表單',
        icon: 'fas fa-wpforms',
        keywords: ['form', 'input', 'field', 'checkbox', 'radio', 'select']
    },
    navigation: {
        name: '導航',
        icon: 'fas fa-bars',
        keywords: ['nav', 'menu', 'breadcrumb', 'tab', 'pagination']
    },
    cards: {
        name: '卡片',
        icon: 'fas fa-id-card',
        keywords: ['card', 'panel', 'tile', 'widget']
    },
    modals: {
        name: '彈窗',
        icon: 'fas fa-window-restore',
        keywords: ['modal', 'popup', 'dialog', 'overlay', 'tooltip']
    },
    layouts: {
        name: '佈局',
        icon: 'fas fa-th-large',
        keywords: ['layout', 'grid', 'flex', 'container', 'sidebar']
    }
};

// 快捷鍵定義
window.UICoreworkConfig.shortcuts = {
    // 一般操作
    'Ctrl+S': 'save',
    'Ctrl+Z': 'undo',
    'Ctrl+Y': 'redo',
    'Ctrl+C': 'copy',
    'Ctrl+V': 'paste',
    'Delete': 'delete',
    'Escape': 'cancel',
    
    // 工具切換
    'P': 'selectPen',
    'E': 'selectEraser',
    'R': 'selectRectangle',
    'C': 'selectCircle',
    'T': 'selectText',
    'S': 'selectSelect',
    
    // 視窗控制
    'Ctrl+Enter': 'sendMessage',
    'F11': 'toggleFullscreen',
    'Ctrl+D': 'toggleDebug'
};

// 匯出配置 (用於 Node.js 環境)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.UICoreworkConfig;
}