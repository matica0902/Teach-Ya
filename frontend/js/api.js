// UI CoreWork - API 整合模組
class APIModule {
    constructor(options = {}) {
        // 配置選項
        this.options = {
            baseURL: window.UICoreworkConfig?.api?.baseURL || 'http://localhost:8000/api',
            timeout: window.UICoreworkConfig?.api?.timeout || 30000,
            retryCount: window.UICoreworkConfig?.api?.retryCount || 3,
            retryDelay: 1000,
            enableAuth: true,
            enableCache: true,
            cacheTimeout: 5 * 60 * 1000, // 5 分鐘
            ...options
        };
        
        // API 狀態
        this.isConnected = false;
        this.authToken = null;
        this.requestQueue = [];
        this.cache = new Map();
        
        // 請求攔截器
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        // 初始化
        this.init();
        Utils.log.info('API module initialized');
    }

    /**
     * 初始化 API 模組
     */
    init() {
        this.setupDefaultInterceptors();
        this.loadAuthToken();
        this.checkConnection();
    }

    /**
     * 設定預設攔截器
     */
    setupDefaultInterceptors() {
        // 請求攔截器 - 添加認證標頭
        this.addRequestInterceptor((config) => {
            if (this.authToken) {
                config.headers = config.headers || {};
                config.headers['Authorization'] = `Bearer ${this.authToken}`;
            }
            return config;
        });
        
        // 請求攔截器 - 添加時間戳
        this.addRequestInterceptor((config) => {
            config.headers = config.headers || {};
            config.headers['X-Request-Time'] = Date.now().toString();
            config.headers['X-Client-Version'] = window.UICoreworkConfig?.version || '1.0.0';
            return config;
        });
        
        // 回應攔截器 - 處理認證錯誤
        this.addResponseInterceptor(
            (response) => response,
            (error) => {
                if (error.status === 401) {
                    this.handleAuthError();
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * 添加請求攔截器
     */
    addRequestInterceptor(fulfilled, rejected = null) {
        this.requestInterceptors.push({ fulfilled, rejected });
    }

    /**
     * 添加回應攔截器
     */
    addResponseInterceptor(fulfilled, rejected = null) {
        this.responseInterceptors.push({ fulfilled, rejected });
    }

    /**
     * 應用請求攔截器
     */
    async applyRequestInterceptors(config) {
        let finalConfig = config;
        
        for (const interceptor of this.requestInterceptors) {
            try {
                finalConfig = await interceptor.fulfilled(finalConfig);
            } catch (error) {
                if (interceptor.rejected) {
                    return interceptor.rejected(error);
                }
                throw error;
            }
        }
        
        return finalConfig;
    }

    /**
     * 應用回應攔截器
     */
    async applyResponseInterceptors(response) {
        let finalResponse = response;
        
        for (const interceptor of this.responseInterceptors) {
            try {
                finalResponse = await interceptor.fulfilled(finalResponse);
            } catch (error) {
                if (interceptor.rejected) {
                    return interceptor.rejected(error);
                }
                throw error;
            }
        }
        
        return finalResponse;
    }

    /**
     * 基礎請求方法
     */
    async request(endpoint, options = {}) {
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: this.options.timeout,
            ...options,
            url: this.buildURL(endpoint)
        };
        
        try {
            // 應用請求攔截器
            const finalConfig = await this.applyRequestInterceptors(config);
            
            // 檢查快取
            if (this.options.enableCache && finalConfig.method === 'GET') {
                const cachedResponse = this.getCachedResponse(finalConfig.url);
                if (cachedResponse) {
                    Utils.log.debug('Cache hit for:', finalConfig.url);
                    return cachedResponse;
                }
            }
            
            // 發送請求
            const response = await this.sendRequest(finalConfig);
            
            // 應用回應攔截器
            const finalResponse = await this.applyResponseInterceptors(response);
            
            // 快取 GET 請求的回應
            if (this.options.enableCache && finalConfig.method === 'GET' && finalResponse.ok) {
                this.setCachedResponse(finalConfig.url, finalResponse);
            }
            
            return finalResponse;
            
        } catch (error) {
            Utils.log.error('API request failed:', error);
            throw this.normalizeError(error);
        }
    }

    /**
     * 發送實際請求
     */
    async sendRequest(config) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        try {
            const response = await fetch(config.url, {
                method: config.method,
                headers: config.headers,
                body: config.body,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const data = await this.parseResponse(response);
            
            return {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: data
            };
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * 解析回應
     */
    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType && contentType.includes('text/')) {
            return await response.text();
        } else {
            return await response.blob();
        }
    }

    /**
     * 建構完整 URL
     */
    buildURL(endpoint) {
        // 如果 endpoint 已經是完整 URL，直接回傳
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        
        // 組合基礎 URL 和端點
        const baseURL = this.options.baseURL.replace(/\/$/, '');
        const cleanEndpoint = endpoint.replace(/^\//, '');
        
        return `${baseURL}/${cleanEndpoint}`;
    }

    /**
     * GET 請求
     */
    async get(endpoint, params = {}, options = {}) {
        const url = new URL(this.buildURL(endpoint));
        
        // 添加查詢參數
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, String(value));
            }
        });
        
        return this.request(url.toString(), {
            method: 'GET',
            ...options
        });
    }

    /**
     * POST 請求
     */
    async post(endpoint, data = {}, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

    /**
     * PUT 請求
     */
    async put(endpoint, data = {}, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }

    /**
     * PATCH 請求
     */
    async patch(endpoint, data = {}, options = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }

    /**
     * DELETE 請求
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }

    /**
     * 上傳檔案
     */
    async uploadFile(endpoint, file, additionalData = {}, options = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // 添加額外資料
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
        
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                // 不設定 Content-Type，讓瀏覽器自動設定
            },
            ...options
        });
    }

    /**
     * 批次請求
     */
    async batchRequest(requests) {
        const promises = requests.map(({ endpoint, method = 'GET', data = null, options = {} }) => {
            const requestMethod = method.toLowerCase();
            
            if (requestMethod === 'get') {
                return this.get(endpoint, data, options);
            } else if (requestMethod === 'post') {
                return this.post(endpoint, data, options);
            } else if (requestMethod === 'put') {
                return this.put(endpoint, data, options);
            } else if (requestMethod === 'patch') {
                return this.patch(endpoint, data, options);
            } else if (requestMethod === 'delete') {
                return this.delete(endpoint, options);
            }
        });
        
        try {
            const results = await Promise.allSettled(promises);
            return results.map((result, index) => ({
                index,
                status: result.status,
                data: result.status === 'fulfilled' ? result.value.data : null,
                error: result.status === 'rejected' ? result.reason : null
            }));
        } catch (error) {
            Utils.log.error('Batch request failed:', error);
            throw error;
        }
    }

    /**
     * 聊天 API
     */
    async sendMessage(message, conversationId = null, context = null) {
        const payload = {
            message: message,
            conversation_id: conversationId,
            context: context,
            timestamp: Utils.time.now()
        };
        
        const response = await this.post('/chat', payload);
        
        if (!response.ok) {
            throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
        }
        
        return response.data;
    }

    /**
     * 取得範例列表
     */
    async getExamples(category = null, search = null, page = 1, limit = 20) {
        const params = {
            page,
            limit
        };
        
        if (category && category !== 'all') {
            params.category = category;
        }
        
        if (search) {
            params.search = search;
        }
        
        const response = await this.get('/examples', params);
        
        if (!response.ok) {
            throw new Error(`Examples API error: ${response.status} ${response.statusText}`);
        }
        
        return response.data;
    }

    /**
     * 取得單一範例詳情
     */
    async getExample(id) {
        const response = await this.get(`/examples/${id}`);
        
        if (!response.ok) {
            throw new Error(`Example API error: ${response.status} ${response.statusText}`);
        }
        
        return response.data;
    }

    /**
     * 儲存繪圖資料
     */
    async saveDrawing(drawingData, metadata = {}) {
        const payload = {
            drawing_data: drawingData,
            metadata: {
                timestamp: Utils.time.now(),
                ...metadata
            }
        };
        
        const response = await this.post('/drawings', payload);
        
        if (!response.ok) {
            throw new Error(`Save drawing API error: ${response.status} ${response.statusText}`);
        }
        
        return response.data;
    }

    /**
     * 載入繪圖資料
     */
    async loadDrawing(id) {
        const response = await this.get(`/drawings/${id}`);
        
        if (!response.ok) {
            throw new Error(`Load drawing API error: ${response.status} ${response.statusText}`);
        }
        
        return response.data;
    }

    /**
     * AI 圖像分析
     */
    async analyzeImage(imageData, analysisType = 'general') {
        const payload = {
            image_data: imageData,
            analysis_type: analysisType,
            timestamp: Utils.time.now()
        };
        
        const response = await this.post('/ai/analyze-image', payload);
        
        if (!response.ok) {
            throw new Error(`Image analysis API error: ${response.status} ${response.statusText}`);
        }
        
        return response.data;
    }

    /**
     * 設定認證 Token
     */
    setAuthToken(token) {
        this.authToken = token;
        Utils.storage.set('auth_token', token);
        Utils.events.emit('api:auth:token-set', { token });
    }

    /**
     * 清除認證 Token
     */
    clearAuthToken() {
        this.authToken = null;
        Utils.storage.remove('auth_token');
        Utils.events.emit('api:auth:token-cleared');
    }

    /**
     * 載入認證 Token
     */
    loadAuthToken() {
        const token = Utils.storage.get('auth_token');
        if (token) {
            this.authToken = token;
            Utils.log.debug('Auth token loaded from storage');
        }
    }

    /**
     * 處理認證錯誤
     */
    handleAuthError() {
        this.clearAuthToken();
        Utils.events.emit('api:auth:error');
        Utils.log.warn('Authentication error, token cleared');
    }

    /**
     * 檢查連線狀態
     */
    async checkConnection() {
        try {
            const response = await this.get('/health', {}, { timeout: 5000 });
            this.isConnected = response.ok;
            
            Utils.events.emit('api:connection', { isConnected: this.isConnected });
            
            if (this.isConnected) {
                Utils.log.info('API connection established');
            } else {
                Utils.log.warn('API connection failed');
            }
            
        } catch (error) {
            this.isConnected = false;
            Utils.events.emit('api:connection', { isConnected: false, error });
            Utils.log.error('API connection check failed:', error);
        }
    }

    /**
     * 取得快取回應
     */
    getCachedResponse(url) {
        const cacheKey = this.getCacheKey(url);
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.options.cacheTimeout) {
            return cached.data;
        }
        
        // 清除過期的快取
        if (cached) {
            this.cache.delete(cacheKey);
        }
        
        return null;
    }

    /**
     * 設定快取回應
     */
    setCachedResponse(url, response) {
        const cacheKey = this.getCacheKey(url);
        
        this.cache.set(cacheKey, {
            data: response,
            timestamp: Date.now()
        });
        
        // 限制快取大小
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * 取得快取鍵
     */
    getCacheKey(url) {
        return btoa(url).replace(/[=+/]/g, '');
    }

    /**
     * 清除快取
     */
    clearCache() {
        this.cache.clear();
        Utils.events.emit('api:cache:cleared');
        Utils.log.debug('API cache cleared');
    }

    /**
     * 正規化錯誤
     */
    normalizeError(error) {
        if (error.name === 'AbortError') {
            return new Error('Request timeout');
        }
        
        if (error.message.includes('Failed to fetch')) {
            return new Error('Network error - check your connection');
        }
        
        if (error.response) {
            return new Error(`API Error: ${error.response.status} ${error.response.statusText}`);
        }
        
        return error;
    }

    /**
     * 重試請求
     */
    async requestWithRetry(endpoint, options = {}, retryCount = null) {
        const maxRetries = retryCount || this.options.retryCount;
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this.request(endpoint, options);
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = this.options.retryDelay * Math.pow(2, attempt); // 指數退避
                    Utils.log.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    Utils.log.error(`Request failed after ${maxRetries + 1} attempts`);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * 取得 API 狀態
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            hasAuth: !!this.authToken,
            cacheSize: this.cache.size,
            queueSize: this.requestQueue.length
        };
    }

    /**
     * 取得 API 統計
     */
    getStats() {
        return {
            totalRequests: this.totalRequests || 0,
            successfulRequests: this.successfulRequests || 0,
            failedRequests: this.failedRequests || 0,
            cacheHits: this.cacheHits || 0,
            averageResponseTime: this.averageResponseTime || 0
        };
    }

    /**
     * 銷毀模組
     */
    destroy() {
        this.clearCache();
        this.clearAuthToken();
        this.requestQueue = [];
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        Utils.log.info('API module destroyed');
    }
}

// 建立全域 API 實例
window.API = new APIModule();

// 匯出類別
window.APIModule = APIModule;