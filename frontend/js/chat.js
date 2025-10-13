// UI CoreWork - 聊天功能模組
class ChatModule {
    constructor(containerId, options = {}) {
        this.container = Utils.dom.$(containerId);
        if (!this.container) {
            throw new Error(`Chat container with id "${containerId}" not found`);
        }
        
        // 聊天狀態
        this.isConnected = false;
        this.isTyping = false;
        this.currentConversation = null;
        this.messages = [];
        
        // UI 元素
        this.messagesContainer = null;
        this.inputArea = null;
        this.sendButton = null;
        this.statusIndicator = null;
        
        // 配置選項
        this.options = {
            maxMessages: 1000,
            enableMarkdown: true,
            enableEmoji: true,
            enableFileUpload: true,
            autoScroll: true,
            typingIndicator: true,
            maxInputLength: 4000,
            ...options
        };
        
        // API 配置
        this.apiConfig = {
            endpoint: window.UICoreworkConfig?.api?.chat?.endpoint || '/api/chat',
            timeout: window.UICoreworkConfig?.api?.timeout || 30000,
            retryCount: 3
        };
        
        // 初始化
        this.init();
        Utils.log.info('Chat module initialized');
    }

    /**
     * 初始化聊天模組
     */
    init() {
        this.setupUI();
        this.bindEvents();
        this.loadConversationHistory();
        this.connectWebSocket();
    }

    /**
     * 設定 UI 介面
     */
    setupUI() {
        this.container.innerHTML = `
            <div class="chat-header">
                <div class="chat-title">AI 助手</div>
                <div class="chat-status">
                    <span class="status-indicator offline" id="chat-status"></span>
                    <span class="status-text">離線</span>
                </div>
            </div>
            
            <div class="chat-messages" id="chat-messages">
                <div class="welcome-message">
                    <div class="message assistant">
                        <div class="message-content">
                            歡迎使用 UI CoreWork！我是您的 AI 設計助手，可以協助您進行介面設計和程式開發。
                        </div>
                        <div class="message-time">${Utils.time.format(Date.now())}</div>
                    </div>
                </div>
            </div>
            
            <div class="typing-indicator hidden" id="typing-indicator">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span class="typing-text">AI 正在輸入中...</span>
            </div>
            
            <div class="chat-input-container">
                <div class="chat-input-wrapper">
                    <textarea 
                        id="chat-input" 
                        class="chat-input" 
                        placeholder="輸入訊息... (支援 Markdown 格式)"
                        rows="5"
                        maxlength="${this.options.maxInputLength}"
                    ></textarea>
                    <div class="input-actions">
                        <button id="attach-file" class="action-button" title="附加檔案" ${!this.options.enableFileUpload ? 'disabled' : ''}>
                            📎
                        </button>
                        <button id="clear-input" class="action-button" title="清除">
                            🗑️
                        </button>
                        <button id="send-message" class="send-button" disabled>
                            <span class="send-text">發送</span>
                            <span class="send-icon">📤</span>
                        </button>
                    </div>
                </div>
                <div class="input-info">
                    <span class="char-count">0/${this.options.maxInputLength}</span>
                    <span class="shortcuts">Ctrl+Enter 發送 | Shift+Enter 換行</span>
                </div>
            </div>
            
            <input type="file" id="file-input" style="display: none;" multiple 
                accept=".txt,.md,.json,.csv,.pdf,.jpg,.jpeg,.png,.gif,.svg">
        `;
        
        // 取得 UI 元素參考
        this.messagesContainer = Utils.dom.$('#chat-messages');
        this.inputArea = Utils.dom.$('#chat-input');
        this.sendButton = Utils.dom.$('#send-message');
        this.statusIndicator = Utils.dom.$('#chat-status');
        this.typingIndicator = Utils.dom.$('#typing-indicator');
        this.fileInput = Utils.dom.$('#file-input');
        this.charCount = Utils.dom.$('.char-count');
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 發送按鈕
        Utils.dom.on(this.sendButton, 'click', () => {
            this.sendMessage();
        });
        
        // 輸入框事件
        Utils.dom.on(this.inputArea, 'input', () => {
            this.handleInputChange();
        });
        
        Utils.dom.on(this.inputArea, 'keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        Utils.dom.on(this.inputArea, 'paste', (e) => {
            this.handlePaste(e);
        });
        
        // 檔案附加
        Utils.dom.on(Utils.dom.$('#attach-file'), 'click', () => {
            if (this.options.enableFileUpload) {
                this.fileInput.click();
            }
        });
        
        Utils.dom.on(this.fileInput, 'change', (e) => {
            this.handleFileSelect(e);
        });
        
        // 清除輸入
        Utils.dom.on(Utils.dom.$('#clear-input'), 'click', () => {
            this.clearInput();
        });
        
        // 訊息容器滾動事件
        Utils.dom.on(this.messagesContainer, 'scroll', Utils.debounce(() => {
            this.handleScroll();
        }, 100));
    }

    /**
     * 處理輸入變化
     */
    handleInputChange() {
        const text = this.inputArea.value.trim();
        const length = text.length;
        
        // 更新字數統計
        this.charCount.textContent = `${length}/${this.options.maxInputLength}`;
        
        // 更新發送按鈕狀態
        this.sendButton.disabled = length === 0 || !this.isConnected;
        
        // 如果超過限制，標示警告
        if (length > this.options.maxInputLength * 0.9) {
            Utils.dom.addClass(this.charCount, 'warning');
        } else {
            Utils.dom.removeClass(this.charCount, 'warning');
        }
        
        // 觸發輸入事件
        Utils.events.emit('chat:input', { text, length });
    }

    /**
     * 處理鍵盤事件
     */
    handleKeyDown(e) {
        // Ctrl+Enter 發送訊息
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            this.sendMessage();
        }
        
        // Shift+Enter 換行 (預設行為)
        
        // Escape 清除輸入
        if (e.key === 'Escape') {
            this.clearInput();
        }
        
        // 上箭頭編輯最後一條訊息
        if (e.key === 'ArrowUp' && e.ctrlKey) {
            e.preventDefault();
            this.editLastMessage();
        }
    }

    /**
     * 處理貼上事件
     */
    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // 處理圖片貼上
            if (item.type.indexOf('image/') !== -1) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    this.handleImagePaste(file);
                }
                break;
            }
        }
    }

    /**
     * 處理圖片貼上
     */
    async handleImagePaste(file) {
        try {
            const base64 = await Utils.file.toBase64(file);
            const message = {
                type: 'image',
                content: base64,
                filename: file.name || 'pasted-image.png',
                size: file.size,
                timestamp: Utils.time.now()
            };
            
            this.addMessage(message, 'user');
            this.sendMessage(message);
            
        } catch (error) {
            Utils.log.error('Image paste error:', error);
            this.showError('圖片貼上失敗，請重試。');
        }
    }

    /**
     * 處理檔案選擇
     */
    async handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        for (const file of files) {
            // 驗證檔案
            if (!this.validateFile(file)) {
                continue;
            }
            
            try {
                const content = await this.readFile(file);
                const message = {
                    type: 'file',
                    content: content,
                    filename: file.name,
                    size: file.size,
                    mimeType: file.type,
                    timestamp: Utils.time.now()
                };
                
                this.addMessage(message, 'user');
                
            } catch (error) {
                Utils.log.error('File read error:', error);
                this.showError(`檔案 "${file.name}" 讀取失敗。`);
            }
        }
        
        // 清除檔案選擇
        e.target.value = '';
    }

    /**
     * 驗證檔案
     */
    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'text/plain', 'text/markdown', 'application/json',
            'text/csv', 'application/pdf',
            'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'
        ];
        
        if (file.size > maxSize) {
            this.showError(`檔案 "${file.name}" 超過 ${Utils.formatFileSize(maxSize)} 限制。`);
            return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
            this.showError(`不支援的檔案類型: ${file.type}`);
            return false;
        }
        
        return true;
    }

    /**
     * 讀取檔案內容
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                if (file.type.startsWith('image/')) {
                    resolve(e.target.result); // Base64 for images
                } else {
                    resolve(e.target.result); // Text content
                }
            };
            
            reader.onerror = () => reject(reader.error);
            
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    /**
     * 發送訊息
     */
    async sendMessage(messageData = null) {
        let text;
        let type = 'text';
        let content;
        
        if (messageData) {
            // 發送特殊類型訊息（圖片、檔案）
            content = messageData.content;
            type = messageData.type;
        } else {
            // 發送文字訊息
            text = this.inputArea.value.trim();
            if (!text) return;
            
            content = text;
            this.clearInput();
        }
        
        // 建立訊息物件
        const message = {
            id: Utils.generateId('msg'),
            type: type,
            content: content,
            timestamp: Utils.time.now(),
            sender: 'user'
        };
        
        // 如果不是特殊類型，添加到訊息歷史
        if (!messageData) {
            this.addMessage(message, 'user');
        }
        
        // 顯示輸入指示器
        this.showTypingIndicator();
        
        try {
            // 發送到 API
            const response = await this.callChatAPI(message);
            
            // 隱藏輸入指示器
            this.hideTypingIndicator();
            
            // 添加回應訊息
            this.addMessage(response, 'assistant');
            
            // 觸發訊息發送事件
            Utils.events.emit('chat:message:sent', { message, response });
            
        } catch (error) {
            Utils.log.error('Send message error:', error);
            this.hideTypingIndicator();
            this.showError('訊息發送失敗，請檢查網路連線或稍後重試。');
        }
    }

    /**
     * 調用聊天 API
     */
    async callChatAPI(message) {
        const requestData = {
            message: message,
            conversation_id: this.currentConversation,
            context: this.getContextualData()
        };
        
        try {
            const response = await Utils.http.post(this.apiConfig.endpoint, requestData, {
                timeout: this.apiConfig.timeout
            });
            
            // 更新對話 ID
            if (response.conversation_id) {
                this.currentConversation = response.conversation_id;
            }
            
            return {
                id: response.id || Utils.generateId('msg'),
                type: 'text',
                content: response.content || response.message,
                timestamp: response.timestamp || Utils.time.now(),
                sender: 'assistant'
            };
            
        } catch (error) {
            // API 錯誤處理
            if (error.message.includes('timeout')) {
                throw new Error('請求超時，請稍後重試');
            } else if (error.message.includes('429')) {
                throw new Error('請求頻率過高，請稍後重試');
            } else if (error.message.includes('500')) {
                throw new Error('服務器錯誤，請稍後重試');
            }
            throw error;
        }
    }

    /**
     * 取得上下文資料
     */
    getContextualData() {
        const context = {
            drawing_data: null,
            recent_messages: this.getRecentMessages(10),
            ui_state: {
                current_tool: null,
                canvas_zoom: 1,
                selected_example: null
            }
        };
        
        // 取得繪圖資料
        if (window.drawingModule) {
            context.drawing_data = window.drawingModule.exportData();
            context.ui_state.current_tool = window.drawingModule.currentTool;
            context.ui_state.canvas_zoom = window.drawingModule.zoom;
        }
        
        return context;
    }

    /**
     * 取得最近的訊息
     */
    getRecentMessages(count = 10) {
        return this.messages.slice(-count).map(msg => ({
            sender: msg.sender,
            content: msg.type === 'text' ? msg.content : `[${msg.type}]`,
            timestamp: msg.timestamp
        }));
    }

    /**
     * 添加訊息到聊天記錄
     */
    addMessage(message, sender) {
        message.sender = sender;
        this.messages.push(message);
        
        // 限制訊息數量
        if (this.messages.length > this.options.maxMessages) {
            this.messages.shift();
        }
        
        // 添加到 UI
        this.appendMessageToUI(message);
        
        // 自動滾動
        if (this.options.autoScroll) {
            this.scrollToBottom();
        }
        
        // 儲存到本地儲存
        this.saveConversationHistory();
    }

    /**
     * 將訊息添加到 UI
     */
    appendMessageToUI(message) {
        const messageEl = this.createMessageElement(message);
        this.messagesContainer.appendChild(messageEl);
        
        // 添加動畫
        setTimeout(() => {
            Utils.dom.addClass(messageEl, 'visible');
        }, 10);
    }

    /**
     * 建立訊息元素
     */
    createMessageElement(message) {
        const messageDiv = Utils.dom.create('div', {
            className: `message ${message.sender}`,
            'data-message-id': message.id
        });
        
        // 訊息內容
        const contentDiv = Utils.dom.create('div', { className: 'message-content' });
        
        if (message.type === 'text') {
            contentDiv.innerHTML = this.formatMessageContent(message.content);
        } else if (message.type === 'image') {
            contentDiv.innerHTML = `
                <div class="image-message">
                    <img src="${message.content}" alt="上傳的圖片" onclick="this.requestFullscreen()">
                    <div class="image-info">${message.filename || '圖片'} (${Utils.formatFileSize(message.size || 0)})</div>
                </div>
            `;
        } else if (message.type === 'file') {
            contentDiv.innerHTML = `
                <div class="file-message">
                    <div class="file-icon">📄</div>
                    <div class="file-info">
                        <div class="file-name">${message.filename}</div>
                        <div class="file-size">${Utils.formatFileSize(message.size)}</div>
                    </div>
                </div>
            `;
        }
        
        // 時間戳記
        const timeDiv = Utils.dom.create('div', {
            className: 'message-time'
        }, Utils.time.format(message.timestamp));
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        
        return messageDiv;
    }

    /**
     * 格式化訊息內容
     */
    formatMessageContent(content) {
        if (!this.options.enableMarkdown) {
            return Utils.string.stripHtml(content);
        }
        
        // 簡單的 Markdown 支援
        let formatted = content
            // 程式碼區塊
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
            // 行內程式碼
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 粗體
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // 斜體
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // 連結
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            // 換行
            .replace(/\n/g, '<br>');
        
        // Emoji 支援
        if (this.options.enableEmoji) {
            formatted = this.convertEmojis(formatted);
        }
        
        return formatted;
    }

    /**
     * 轉換 Emoji
     */
    convertEmojis(text) {
        const emojiMap = {
            ':)': '😊',
            ':(': '😢',
            ':D': '😃',
            ':P': '😛',
            ';)': '😉',
            '<3': '❤️',
            ':thumbs_up:': '👍',
            ':thumbs_down:': '👎',
            ':fire:': '🔥',
            ':star:': '⭐',
            ':check:': '✅',
            ':cross:': '❌'
        };
        
        let result = text;
        for (const [key, emoji] of Object.entries(emojiMap)) {
            result = result.replace(new RegExp(Utils.string.escapeRegex(key), 'g'), emoji);
        }
        
        return result;
    }

    /**
     * 顯示輸入指示器
     */
    showTypingIndicator() {
        Utils.dom.removeClass(this.typingIndicator, 'hidden');
        this.scrollToBottom();
    }

    /**
     * 隱藏輸入指示器
     */
    hideTypingIndicator() {
        Utils.dom.addClass(this.typingIndicator, 'hidden');
    }

    /**
     * 滾動到底部
     */
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    /**
     * 處理滾動事件
     */
    handleScroll() {
        const container = this.messagesContainer;
        const isAtBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 1;
        
        // 更新自動滾動設定
        this.options.autoScroll = isAtBottom;
    }

    /**
     * 清除輸入
     */
    clearInput() {
        this.inputArea.value = '';
        this.inputArea.style.height = 'auto';
        this.handleInputChange();
        this.inputArea.focus();
    }

    /**
     * 編輯最後一條訊息
     */
    editLastMessage() {
        const userMessages = this.messages.filter(msg => msg.sender === 'user' && msg.type === 'text');
        if (userMessages.length > 0) {
            const lastMessage = userMessages[userMessages.length - 1];
            this.inputArea.value = lastMessage.content;
            this.handleInputChange();
            this.inputArea.focus();
            this.inputArea.setSelectionRange(this.inputArea.value.length, this.inputArea.value.length);
        }
    }

    /**
     * 顯示錯誤訊息
     */
    showError(message) {
        const errorMessage = {
            id: Utils.generateId('error'),
            type: 'text',
            content: `❌ ${message}`,
            timestamp: Utils.time.now(),
            sender: 'system'
        };
        
        this.appendMessageToUI(errorMessage);
    }

    /**
     * 連線 WebSocket (如果可用)
     */
    connectWebSocket() {
        // 暫時設為已連線狀態
        this.setConnectionStatus(true);
        
        // TODO: 實作真實的 WebSocket 連線
        /*
        try {
            this.ws = new WebSocket(this.apiConfig.wsEndpoint);
            
            this.ws.onopen = () => {
                this.setConnectionStatus(true);
                Utils.log.info('WebSocket connected');
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };
            
            this.ws.onclose = () => {
                this.setConnectionStatus(false);
                Utils.log.info('WebSocket disconnected');
            };
            
            this.ws.onerror = (error) => {
                Utils.log.error('WebSocket error:', error);
                this.setConnectionStatus(false);
            };
            
        } catch (error) {
            Utils.log.error('WebSocket connection failed:', error);
            this.setConnectionStatus(false);
        }
        */
    }

    /**
     * 設定連線狀態
     */
    setConnectionStatus(isConnected) {
        this.isConnected = isConnected;
        
        const statusText = this.container.querySelector('.status-text');
        
        if (isConnected) {
            Utils.dom.removeClass(this.statusIndicator, 'offline');
            Utils.dom.addClass(this.statusIndicator, 'online');
            statusText.textContent = '線上';
        } else {
            Utils.dom.removeClass(this.statusIndicator, 'online');
            Utils.dom.addClass(this.statusIndicator, 'offline');
            statusText.textContent = '離線';
        }
        
        // 更新發送按鈕狀態
        this.handleInputChange();
        
        Utils.events.emit('chat:connection', { isConnected });
    }

    /**
     * 載入對話歷史
     */
    loadConversationHistory() {
        const savedHistory = Utils.storage.get('chat_history');
        if (savedHistory && savedHistory.messages) {
            this.messages = savedHistory.messages;
            this.currentConversation = savedHistory.conversation_id;
            
            // 重建 UI
            savedHistory.messages.forEach(message => {
                if (message.sender !== 'system') {
                    this.appendMessageToUI(message);
                }
            });
            
            this.scrollToBottom();
        }
    }

    /**
     * 儲存對話歷史
     */
    saveConversationHistory() {
        const historyData = {
            conversation_id: this.currentConversation,
            messages: this.messages,
            timestamp: Utils.time.now()
        };
        
        Utils.storage.set('chat_history', historyData);
    }

    /**
     * 清除聊天記錄
     */
    clearHistory() {
        this.messages = [];
        this.currentConversation = null;
        this.messagesContainer.innerHTML = '';
        Utils.storage.remove('chat_history');
        
        // 顯示歡迎訊息
        this.setupUI();
        
        Utils.events.emit('chat:clear');
    }

    /**
     * 銷毀模組
     */
    destroy() {
        if (this.ws) {
            this.ws.close();
        }
        
        this.saveConversationHistory();
        Utils.log.info('Chat module destroyed');
    }
}

// 匯出到全域
window.ChatModule = ChatModule;