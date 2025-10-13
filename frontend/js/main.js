// UI CoreWork - 主要應用程式模組
class UICoreworkApp {
    constructor() {
        // 應用程式狀態
        this.isInitialized = false;
        this.isLoading = false;
        this.modules = {};
        
        // 應用程式配置
        this.config = window.UICoreworkConfig || {};
        
        // 事件處理器
        this.eventHandlers = new Map();
        
        // 初始化
        this.init();
    }

    /**
     * 初始化應用程式
     */
    async init() {
        try {
            Utils.log.info('Initializing UI CoreWork application...');
            this.isLoading = true;
            
            // 顯示載入畫面
            this.showLoadingScreen();
            
            // 初始化核心系統
            await this.initCore();
            
            // 初始化模組
            await this.initModules();
            
            // 設定事件監聽
            this.setupEventListeners();
            
            // 綁定全域事件
            this.bindGlobalEvents();
            
            // 初始化 UI 狀態
            this.initUIState();
            
            // 隱藏載入畫面
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            this.isLoading = false;
            
            Utils.log.info('UI CoreWork application initialized successfully');
            Utils.events.emit('app:initialized');
            
        } catch (error) {
            Utils.log.error('Application initialization failed:', error);
            this.showError('應用程式初始化失敗，請重新整理頁面。', error);
        }
    }

    /**
     * 初始化核心系統
     */
    async initCore() {
        // 檢查必要的依賴
        this.checkDependencies();
        
        // 初始化工具函數
        if (typeof Utils === 'undefined') {
            throw new Error('Utils module not loaded');
        }
        
        // 初始化配置
        this.validateConfig();
        
        // 設定錯誤處理
        this.setupErrorHandling();
        
        Utils.log.debug('Core systems initialized');
    }

    /**
     * 檢查依賴
     */
    checkDependencies() {
        const requiredGlobals = ['Utils'];
        
        for (const global of requiredGlobals) {
            if (typeof window[global] === 'undefined') {
                throw new Error(`Required dependency ${global} not found`);
            }
        }
    }

    /**
     * 驗證配置
     */
    validateConfig() {
        if (!this.config.api) {
            this.config.api = {
                baseURL: 'http://localhost:8000/api',
                timeout: 30000
            };
        }
        
        if (!this.config.debug) {
            this.config.debug = {
                enabled: true,
                logLevel: 'info'
            };
        }
    }

    /**
     * 設定錯誤處理
     */
    setupErrorHandling() {
        // 全域錯誤處理
        window.addEventListener('error', (event) => {
            Utils.log.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });
        
        // 未處理的 Promise 拒絕
        window.addEventListener('unhandledrejection', (event) => {
            Utils.log.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });
    }

    /**
     * 初始化模組
     */
    async initModules() {
        const moduleConfigs = [
            {
                name: 'drawing',
                class: DrawingModule,
                element: '#drawing-canvas',
                required: true
            },
            {
                name: 'chat',
                class: ChatModule,
                element: '#chat-container',
                required: true
            },
            {
                name: 'examples',
                class: ExamplesModule,
                element: '#examples-container',
                required: true
            }
        ];
        
        for (const config of moduleConfigs) {
            try {
                await this.initModule(config);
            } catch (error) {
                Utils.log.error(`Failed to initialize ${config.name} module:`, error);
                
                if (config.required) {
                    throw new Error(`Required module ${config.name} failed to initialize`);
                }
            }
        }
    }

    /**
     * 初始化單一模組
     */
    async initModule(config) {
        // 檢查元素是否存在
        const element = Utils.dom.$(config.element);
        if (!element) {
            if (config.required) {
                throw new Error(`Required element ${config.element} not found for ${config.name} module`);
            } else {
                Utils.log.warn(`Element ${config.element} not found, skipping ${config.name} module`);
                return;
            }
        }
        
        // 檢查類別是否存在
        if (typeof config.class !== 'function') {
            throw new Error(`Module class ${config.class.name} not found`);
        }
        
        // 建立模組實例
        const moduleInstance = new config.class(config.element, config.options || {});
        
        // 儲存模組參考
        this.modules[config.name] = moduleInstance;
        
        // 設定模組間通信
        this.setupModuleCommunication(config.name, moduleInstance);
        
        Utils.log.debug(`${config.name} module initialized`);
    }

    /**
     * 設定模組間通信
     */
    setupModuleCommunication(moduleName, moduleInstance) {
        // 繪圖模組事件
        if (moduleName === 'drawing') {
            Utils.events.on('drawing:start', (data) => {
                this.handleDrawingStart(data);
            });
            
            Utils.events.on('stroke:complete', (stroke) => {
                this.handleStrokeComplete(stroke);
            });
            
            Utils.events.on('canvas:clear', () => {
                this.handleCanvasClear();
            });
        }
        
        // 聊天模組事件
        if (moduleName === 'chat') {
            Utils.events.on('chat:message:sent', (data) => {
                this.handleChatMessage(data);
            });
            
            Utils.events.on('chat:connection', (data) => {
                this.handleChatConnection(data);
            });
        }
        
        // 範例模組事件
        if (moduleName === 'examples') {
            Utils.events.on('example:apply', (data) => {
                this.handleExampleApply(data);
            });
            
            Utils.events.on('example:download', (data) => {
                this.handleExampleDownload(data);
            });
        }
    }

    /**
     * 設定事件監聽
     */
    setupEventListeners() {
        // API 連線狀態
        Utils.events.on('api:connection', (data) => {
            this.updateConnectionStatus(data.isConnected);
        });
        
        // 認證事件
        Utils.events.on('api:auth:error', () => {
            this.handleAuthError();
        });
        
        // 應用程式事件
        Utils.events.on('app:error', (error) => {
            this.handleAppError(error);
        });
    }

    /**
     * 綁定全域事件
     */
    bindGlobalEvents() {
        // 頁面可見性變化
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handlePageVisible();
            } else {
                this.handlePageHidden();
            }
        });
        
        // 視窗大小變化
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleWindowResize();
        }, 100));
        
        // 網路狀態變化
        window.addEventListener('online', () => {
            this.handleNetworkOnline();
        });
        
        window.addEventListener('offline', () => {
            this.handleNetworkOffline();
        });
        
        // 快捷鍵
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });
    }

    /**
     * 初始化 UI 狀態
     */
    initUIState() {
        // 載入使用者偏好設定
        this.loadUserPreferences();
        
        // 設定主題
        this.applyTheme();
        
        // 檢查暗色模式偏好
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.enableDarkMode();
        }
        
        // 監聽主題偏好變化
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (e.matches) {
                    this.enableDarkMode();
                } else {
                    this.disableDarkMode();
                }
            });
        }
    }

    // ============ 事件處理器 ============

    /**
     * 處理繪圖開始
     */
    handleDrawingStart(data) {
        Utils.log.debug('Drawing started:', data);
        
        // 可以在這裡添加繪圖開始的邏輯
        // 例如：停用某些 UI 元素、開始記錄等
    }

    /**
     * 處理筆畫完成
     */
    handleStrokeComplete(stroke) {
        Utils.log.debug('Stroke completed:', stroke.id);
        
        // 自動儲存
        if (this.config.autoSave?.enabled) {
            this.autoSaveDrawing();
        }
        
        // 分析繪圖內容（可選）
        if (this.config.ai?.autoAnalyze) {
            this.analyzeDrawingContent();
        }
    }

    /**
     * 處理畫布清除
     */
    handleCanvasClear() {
        Utils.log.debug('Canvas cleared');
        
        // 清除相關資料
        this.clearDrawingRelatedData();
    }

    /**
     * 處理聊天訊息
     */
    handleChatMessage(data) {
        Utils.log.debug('Chat message sent:', data.message.id);
        
        // 可以在這裡添加訊息處理邏輯
        // 例如：分析、記錄、整合繪圖內容等
    }

    /**
     * 處理聊天連線
     */
    handleChatConnection(data) {
        if (data.isConnected) {
            this.showNotification('聊天服務已連線', 'success');
        } else {
            this.showNotification('聊天服務連線失敗', 'warning');
        }
    }

    /**
     * 處理範例套用
     */
    handleExampleApply(data) {
        Utils.log.info('Applying example:', data.example.id);
        
        // 套用範例到繪圖模組
        if (this.modules.drawing && data.example.drawing_data) {
            this.modules.drawing.importData(data.example.drawing_data);
        }
        
        // 套用範例到聊天模組（如果有相關訊息）
        if (this.modules.chat && data.example.chat_template) {
            this.modules.chat.applyTemplate(data.example.chat_template);
        }
        
        this.showNotification(`已套用範例: ${data.example.title}`, 'success');
    }

    /**
     * 處理範例下載
     */
    handleExampleDownload(data) {
        Utils.log.info('Downloaded example:', data.example.id);
        
        // 記錄下載統計（可選）
        if (window.API) {
            window.API.post('/statistics/download', {
                example_id: data.example.id,
                timestamp: Utils.time.now()
            }).catch(error => {
                Utils.log.warn('Failed to record download statistics:', error);
            });
        }
    }

    /**
     * 處理頁面可見
     */
    handlePageVisible() {
        // 重新檢查連線狀態
        if (window.API) {
            window.API.checkConnection();
        }
        
        // 恢復自動儲存
        this.resumeAutoSave();
    }

    /**
     * 處理頁面隱藏
     */
    handlePageHidden() {
        // 立即儲存
        this.saveCurrentState();
        
        // 暫停自動儲存
        this.pauseAutoSave();
    }

    /**
     * 處理視窗大小變化
     */
    handleWindowResize() {
        // 通知所有模組調整大小
        Object.values(this.modules).forEach(module => {
            if (typeof module.handleResize === 'function') {
                module.handleResize();
            }
        });
        
        Utils.events.emit('app:resize');
    }

    /**
     * 處理網路上線
     */
    handleNetworkOnline() {
        this.showNotification('網路連線已恢復', 'success');
        
        // 重新檢查 API 連線
        if (window.API) {
            window.API.checkConnection();
        }
        
        // 同步離線時的變更
        this.syncOfflineChanges();
    }

    /**
     * 處理網路離線
     */
    handleNetworkOffline() {
        this.showNotification('網路連線中斷，應用程式將在離線模式下運作', 'warning');
        
        // 切換到離線模式
        this.enableOfflineMode();
    }

    /**
     * 處理全域按鍵
     */
    handleGlobalKeydown(event) {
        // Ctrl/Cmd + S: 儲存
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.saveCurrentState();
            return;
        }
        
        // Ctrl/Cmd + Z: 復原
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            if (this.modules.drawing) {
                this.modules.drawing.undo();
            }
            return;
        }
        
        // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y: 重做
        if ((event.ctrlKey || event.metaKey) && 
            ((event.key === 'z' && event.shiftKey) || event.key === 'y')) {
            event.preventDefault();
            if (this.modules.drawing) {
                this.modules.drawing.redo();
            }
            return;
        }
        
        // Escape: 清除選取/關閉模態框
        if (event.key === 'Escape') {
            this.handleEscapeKey();
            return;
        }
        
        // F1: 顯示說明
        if (event.key === 'F1') {
            event.preventDefault();
            this.showHelp();
            return;
        }
    }

    /**
     * 處理 Escape 鍵
     */
    handleEscapeKey() {
        // 關閉開啟的模態框
        const modals = Utils.dom.$$('.modal:not(.hidden)');
        modals.forEach(modal => {
            Utils.dom.addClass(modal, 'hidden');
        });
        
        // 清除工具選取
        if (this.modules.drawing) {
            this.modules.drawing.setTool('pen');
        }
        
        Utils.events.emit('app:escape');
    }

    // ============ 狀態管理 ============

    /**
     * 更新連線狀態
     */
    updateConnectionStatus(isConnected) {
        const statusIndicator = Utils.dom.$('.connection-status');
        if (statusIndicator) {
            if (isConnected) {
                Utils.dom.removeClass(statusIndicator, 'offline');
                Utils.dom.addClass(statusIndicator, 'online');
            } else {
                Utils.dom.removeClass(statusIndicator, 'online');
                Utils.dom.addClass(statusIndicator, 'offline');
            }
        }
    }

    /**
     * 處理認證錯誤
     */
    handleAuthError() {
        this.showNotification('認證已過期，請重新登入', 'error');
        // 可以在這裡添加重新登入的邏輯
    }

    /**
     * 處理應用程式錯誤
     */
    handleAppError(error) {
        Utils.log.error('Application error:', error);
        this.showNotification('應用程式發生錯誤', 'error');
    }

    /**
     * 處理全域錯誤
     */
    handleGlobalError(error) {
        // 記錄錯誤
        Utils.log.error('Global error caught:', error);
        
        // 顯示用戶友好的錯誤訊息
        this.showNotification('發生未預期的錯誤，應用程式仍在運行', 'error');
        
        // 可以在這裡添加錯誤報告邏輯
        this.reportError(error);
    }

    // ============ 工具方法 ============

    /**
     * 顯示載入畫面
     */
    showLoadingScreen() {
        const loadingHTML = `
            <div id="app-loading" class="app-loading">
                <div class="loading-content">
                    <div class="loading-logo">🎨</div>
                    <div class="loading-title">UI CoreWork</div>
                    <div class="loading-spinner"></div>
                    <div class="loading-text">載入中...</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    /**
     * 隱藏載入畫面
     */
    hideLoadingScreen() {
        const loadingScreen = Utils.dom.$('#app-loading');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(loadingScreen);
            }, 300);
        }
    }

    /**
     * 顯示錯誤
     */
    showError(message, error = null) {
        const errorHTML = `
            <div id="app-error" class="app-error">
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <div class="error-title">錯誤</div>
                    <div class="error-message">${message}</div>
                    ${error ? `<div class="error-details">${error.message}</div>` : ''}
                    <button class="error-button" onclick="location.reload()">重新載入</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHTML);
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = Utils.dom.create('div', {
            className: `notification notification-${type}`
        });
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // 添加到頁面
        const container = Utils.dom.$('.notifications-container') || document.body;
        container.appendChild(notification);
        
        // 顯示動畫
        setTimeout(() => {
            Utils.dom.addClass(notification, 'show');
        }, 10);
        
        // 自動移除
        setTimeout(() => {
            if (notification.parentNode) {
                Utils.dom.removeClass(notification, 'show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }

    /**
     * 自動儲存繪圖
     */
    async autoSaveDrawing() {
        if (!this.modules.drawing || !window.API) return;
        
        try {
            const drawingData = this.modules.drawing.exportData();
            const result = await window.API.saveDrawing(drawingData, {
                auto_save: true,
                session_id: this.getSessionId()
            });
            
            Utils.log.debug('Auto-save completed:', result.id);
            
        } catch (error) {
            Utils.log.error('Auto-save failed:', error);
        }
    }

    /**
     * 儲存當前狀態
     */
    saveCurrentState() {
        const state = this.getCurrentState();
        Utils.storage.set('app_state', state);
        
        this.showNotification('已儲存當前狀態', 'success', 2000);
    }

    /**
     * 取得當前狀態
     */
    getCurrentState() {
        const state = {
            timestamp: Utils.time.now(),
            modules: {}
        };
        
        // 收集各模組狀態
        if (this.modules.drawing) {
            state.modules.drawing = this.modules.drawing.exportData();
        }
        
        if (this.modules.chat) {
            state.modules.chat = {
                messages: this.modules.chat.messages,
                conversation_id: this.modules.chat.currentConversation
            };
        }
        
        return state;
    }

    /**
     * 載入使用者偏好
     */
    loadUserPreferences() {
        const preferences = Utils.storage.get('user_preferences', {});
        
        // 應用偏好設定
        if (preferences.theme) {
            this.setTheme(preferences.theme);
        }
        
        if (preferences.language) {
            this.setLanguage(preferences.language);
        }
    }

    /**
     * 應用主題
     */
    applyTheme() {
        const theme = Utils.storage.get('theme', 'light');
        this.setTheme(theme);
    }

    /**
     * 設定主題
     */
    setTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/, '');
        Utils.dom.addClass(document.body, `theme-${theme}`);
        Utils.storage.set('theme', theme);
    }

    /**
     * 啟用暗色模式
     */
    enableDarkMode() {
        this.setTheme('dark');
    }

    /**
     * 停用暗色模式
     */
    disableDarkMode() {
        this.setTheme('light');
    }

    /**
     * 顯示說明
     */
    showHelp() {
        // 可以在這裡顯示說明文檔或引導
        this.showNotification('說明功能尚未實作', 'info');
    }

    /**
     * 取得會話 ID
     */
    getSessionId() {
        let sessionId = Utils.storage.get('session_id');
        if (!sessionId) {
            sessionId = Utils.generateId('session');
            Utils.storage.set('session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * 報告錯誤
     */
    reportError(error) {
        // 可以在這裡發送錯誤報告到服務器
        if (window.API && this.config.errorReporting?.enabled) {
            window.API.post('/errors', {
                message: error.message,
                stack: error.stack,
                timestamp: Utils.time.now(),
                session_id: this.getSessionId(),
                user_agent: navigator.userAgent,
                url: window.location.href
            }).catch(reportError => {
                Utils.log.error('Failed to report error:', reportError);
            });
        }
    }

    // ============ 離線支援 ============

    /**
     * 啟用離線模式
     */
    enableOfflineMode() {
        Utils.dom.addClass(document.body, 'offline-mode');
        Utils.events.emit('app:offline');
    }

    /**
     * 停用離線模式
     */
    disableOfflineMode() {
        Utils.dom.removeClass(document.body, 'offline-mode');
        Utils.events.emit('app:online');
    }

    /**
     * 同步離線變更
     */
    async syncOfflineChanges() {
        // 實作離線變更同步邏輯
        Utils.log.debug('Syncing offline changes...');
    }

    /**
     * 暫停自動儲存
     */
    pauseAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * 恢復自動儲存
     */
    resumeAutoSave() {
        if (this.config.autoSave?.enabled) {
            const interval = this.config.autoSave.interval || 30000; // 30秒
            this.autoSaveTimer = setInterval(() => {
                this.autoSaveDrawing();
            }, interval);
        }
    }

    /**
     * 清除繪圖相關資料
     */
    clearDrawingRelatedData() {
        // 清除相關快取或暫存資料
        Utils.storage.remove('last_drawing_data');
    }

    /**
     * 分析繪圖內容
     */
    async analyzeDrawingContent() {
        if (!this.modules.drawing || !window.API) return;
        
        try {
            const imageData = this.modules.drawing.exportAsImage();
            const analysis = await window.API.analyzeImage(imageData);
            
            // 處理分析結果
            if (analysis && this.modules.chat) {
                const message = `我分析了您的繪圖，發現了${analysis.elements?.length || 0}個設計元素。`;
                this.modules.chat.addMessage({
                    id: Utils.generateId('msg'),
                    type: 'text',
                    content: message,
                    timestamp: Utils.time.now(),
                    sender: 'assistant'
                });
            }
            
        } catch (error) {
            Utils.log.error('Drawing analysis failed:', error);
        }
    }

    // ============ 公開介面 ============

    /**
     * 取得模組
     */
    getModule(name) {
        return this.modules[name];
    }

    /**
     * 取得所有模組
     */
    getModules() {
        return { ...this.modules };
    }

    /**
     * 檢查是否已初始化
     */
    isReady() {
        return this.isInitialized && !this.isLoading;
    }

    /**
     * 重新初始化
     */
    async restart() {
        // 清理現有狀態
        this.cleanup();
        
        // 重新初始化
        await this.init();
    }

    /**
     * 清理資源
     */
    cleanup() {
        // 清理模組
        Object.values(this.modules).forEach(module => {
            if (typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        // 清理計時器
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        // 重置狀態
        this.modules = {};
        this.isInitialized = false;
        this.isLoading = false;
        
        Utils.log.info('Application cleaned up');
    }
}

// 建立全域應用程式實例
let app;

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    app = new UICoreworkApp();
    window.UICoreworkApp = app;
});

// 匯出類別供其他使用
window.UICoreworkAppClass = UICoreworkApp;