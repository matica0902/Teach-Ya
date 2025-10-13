// UI CoreWork - 工具函數庫
class UICoreworkUtils {
    /**
     * 日誌輸出工具
     */
    static log = {
        debug: (message, ...args) => {
            if (window.UICoreworkConfig?.debug?.enabled && 
                ['debug', 'info', 'warn', 'error'].includes(window.UICoreworkConfig.debug.logLevel)) {
                console.log(`[UI CoreWork Debug] ${message}`, ...args);
            }
        },
        
        info: (message, ...args) => {
            if (window.UICoreworkConfig?.debug?.enabled && 
                ['info', 'warn', 'error'].includes(window.UICoreworkConfig.debug.logLevel)) {
                console.info(`[UI CoreWork Info] ${message}`, ...args);
            }
        },
        
        warn: (message, ...args) => {
            if (window.UICoreworkConfig?.debug?.enabled && 
                ['warn', 'error'].includes(window.UICoreworkConfig.debug.logLevel)) {
                console.warn(`[UI CoreWork Warning] ${message}`, ...args);
            }
        },
        
        error: (message, ...args) => {
            if (window.UICoreworkConfig?.debug?.enabled) {
                console.error(`[UI CoreWork Error] ${message}`, ...args);
            }
        }
    };

    /**
     * DOM 操作工具
     */
    static dom = {
        /**
         * 安全的元素選擇器
         */
        $(selector) {
            return document.querySelector(selector);
        },
        
        /**
         * 選擇多個元素
         */
        $$(selector) {
            return document.querySelectorAll(selector);
        },
        
        /**
         * 創建元素
         */
        create(tagName, attributes = {}, textContent = '') {
            const element = document.createElement(tagName);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            
            if (textContent) {
                element.textContent = textContent;
            }
            
            return element;
        },
        
        /**
         * 添加事件監聽器
         */
        on(element, event, handler, options = {}) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.addEventListener(event, handler, options);
            }
        },
        
        /**
         * 移除事件監聽器
         */
        off(element, event, handler) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.removeEventListener(event, handler);
            }
        },
        
        /**
         * 顯示/隱藏元素
         */
        show(element) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.style.display = '';
            }
        },
        
        hide(element) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.style.display = 'none';
            }
        },
        
        /**
         * 添加/移除 CSS 類
         */
        addClass(element, className) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.classList.add(className);
            }
        },
        
        removeClass(element, className) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.classList.remove(className);
            }
        },
        
        toggleClass(element, className) {
            if (typeof element === 'string') {
                element = this.$(element);
            }
            if (element) {
                element.classList.toggle(className);
            }
        }
    };

    /**
     * 網路請求工具
     */
    static http = {
        async request(url, options = {}) {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: window.UICoreworkConfig?.api?.timeout || 30000
            };
            
            const config = { ...defaultOptions, ...options };
            
            try {
                // 創建 AbortController 用於超時控制
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);
                
                const response = await fetch(url, {
                    ...config,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                } else {
                    return await response.text();
                }
                
            } catch (error) {
                UICoreworkUtils.log.error('HTTP request failed:', error);
                throw error;
            }
        },
        
        get(url, options = {}) {
            return this.request(url, { ...options, method: 'GET' });
        },
        
        post(url, data, options = {}) {
            return this.request(url, {
                ...options,
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        put(url, data, options = {}) {
            return this.request(url, {
                ...options,
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        delete(url, options = {}) {
            return this.request(url, { ...options, method: 'DELETE' });
        }
    };

    /**
     * 本地儲存工具
     */
    static storage = {
        set(key, value) {
            try {
                const serializedValue = JSON.stringify(value);
                localStorage.setItem(key, serializedValue);
                return true;
            } catch (error) {
                UICoreworkUtils.log.error('Storage set error:', error);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                UICoreworkUtils.log.error('Storage get error:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                UICoreworkUtils.log.error('Storage remove error:', error);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                UICoreworkUtils.log.error('Storage clear error:', error);
                return false;
            }
        },
        
        size() {
            try {
                let size = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        size += localStorage[key].length + key.length;
                    }
                }
                return size;
            } catch (error) {
                UICoreworkUtils.log.error('Storage size calculation error:', error);
                return 0;
            }
        }
    };

    /**
     * 時間工具
     */
    static time = {
        now() {
            return Date.now();
        },
        
        format(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
            const date = new Date(timestamp);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        },
        
        elapsed(startTime) {
            return Date.now() - startTime;
        }
    };

    /**
     * 節流和防抖工具
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static debounce(func, delay) {
        let debounceTimer;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    }

    /**
     * 座標工具
     */
    static coordinates = {
        /**
         * 取得滑鼠/觸控相對於元素的座標
         */
        getRelativeCoords(event, element) {
            const rect = element.getBoundingClientRect();
            const clientX = event.clientX || (event.touches && event.touches[0].clientX);
            const clientY = event.clientY || (event.touches && event.touches[0].clientY);
            
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        },
        
        /**
         * 計算兩點之間的距離
         */
        distance(point1, point2) {
            const dx = point2.x - point1.x;
            const dy = point2.y - point1.y;
            return Math.sqrt(dx * dx + dy * dy);
        },
        
        /**
         * 計算角度
         */
        angle(point1, point2) {
            return Math.atan2(point2.y - point1.y, point2.x - point1.x);
        },
        
        /**
         * 檢查點是否在矩形內
         */
        isPointInRect(point, rect) {
            return point.x >= rect.x && 
                   point.x <= rect.x + rect.width && 
                   point.y >= rect.y && 
                   point.y <= rect.y + rect.height;
        }
    };

    /**
     * 字符串工具
     */
    static string = {
        /**
         * 清理 HTML 標籤
         */
        stripHtml(html) {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            return temp.textContent || temp.innerText || '';
        },
        
        /**
         * 截取字符串
         */
        truncate(str, length, suffix = '...') {
            if (str.length <= length) return str;
            return str.substring(0, length) + suffix;
        },
        
        /**
         * 轉換為 kebab-case
         */
        toKebabCase(str) {
            return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
        },
        
        /**
         * 轉換為 camelCase
         */
        toCamelCase(str) {
            return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        }
    };

    /**
     * 檔案處理工具
     */
    static file = {
        /**
         * 讀取檔案為 Base64
         */
        toBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        },
        
        /**
         * 驗證檔案類型
         */
        validateType(file, allowedTypes) {
            return allowedTypes.includes(file.type);
        },
        
        /**
         * 驗證檔案大小
         */
        validateSize(file, maxSize) {
            return file.size <= maxSize;
        },
        
        /**
         * 下載檔案
         */
        download(content, filename, contentType = 'text/plain') {
            const blob = new Blob([content], { type: contentType });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        }
    };

    /**
     * 事件發布訂閱系統
     */
    static events = {
        _events: {},
        
        on(event, callback) {
            if (!this._events[event]) {
                this._events[event] = [];
            }
            this._events[event].push(callback);
        },
        
        off(event, callback) {
            if (!this._events[event]) return;
            
            if (callback) {
                this._events[event] = this._events[event].filter(cb => cb !== callback);
            } else {
                delete this._events[event];
            }
        },
        
        emit(event, ...args) {
            if (!this._events[event]) return;
            
            this._events[event].forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    UICoreworkUtils.log.error(`Event handler error for ${event}:`, error);
                }
            });
        }
    };

    /**
     * 瀏覽器檢測工具
     */
    static browser = {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isTablet: /iPad/i.test(navigator.userAgent),
        hasTouch: 'ontouchstart' in window,
        supportsPointer: 'PointerEvent' in window,
        supportsCanvas: !!document.createElement('canvas').getContext,
        
        getBrowserName() {
            const userAgent = navigator.userAgent;
            if (userAgent.includes('Chrome')) return 'Chrome';
            if (userAgent.includes('Firefox')) return 'Firefox';
            if (userAgent.includes('Safari')) return 'Safari';
            if (userAgent.includes('Edge')) return 'Edge';
            return 'Unknown';
        }
    };

    /**
     * 唯一 ID 生成器
     */
    static generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 深拷貝對象
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    /**
     * 格式化檔案大小
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 全域工具函數快捷方式
window.Utils = UICoreworkUtils;
window.$ = UICoreworkUtils.dom.$;
window.$$ = UICoreworkUtils.dom.$$;