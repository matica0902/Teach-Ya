// UI CoreWork - 範例展示模組
class ExamplesModule {
    constructor(containerId, options = {}) {
        this.container = Utils.dom.$(containerId);
        if (!this.container) {
            throw new Error(`Examples container with id "${containerId}" not found`);
        }
        
        // 範例資料
        this.examples = [];
        this.filteredExamples = [];
        this.categories = new Set();
        this.currentCategory = 'all';
        this.currentExample = null;
        
        // UI 狀態
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.isLoading = false;
        
        // 配置選項
        this.options = {
            enableSearch: true,
            enableCategories: true,
            enablePreview: true,
            itemsPerPage: 12,
            autoLoad: true,
            ...options
        };
        
        // API 配置
        this.apiConfig = {
            endpoint: window.UICoreworkConfig?.api?.examples?.endpoint || '/api/examples',
            timeout: window.UICoreworkConfig?.api?.timeout || 30000
        };
        
        // 初始化
        this.init();
        Utils.log.info('Examples module initialized');
    }

    /**
     * 初始化範例模組
     */
    init() {
        this.setupUI();
        this.bindEvents();
        
        if (this.options.autoLoad) {
            this.loadExamples();
        }
    }

    /**
     * 設定 UI 介面
     */
    setupUI() {
        this.container.innerHTML = `
            <div class="examples-header">
                <div class="examples-title">設計範例</div>
                <div class="examples-controls">
                    ${this.options.enableSearch ? `
                        <div class="search-box">
                            <input type="text" id="examples-search" placeholder="搜尋範例..." />
                            <span class="search-icon">🔍</span>
                        </div>
                    ` : ''}
                    
                    <div class="view-controls">
                        <button class="view-button active" data-view="grid" title="網格檢視">⊞</button>
                        <button class="view-button" data-view="list" title="列表檢視">☰</button>
                    </div>
                    
                    <button id="refresh-examples" class="refresh-button" title="重新載入">
                        🔄
                    </button>
                </div>
            </div>
            
            ${this.options.enableCategories ? `
                <div class="examples-categories" id="examples-categories">
                    <button class="category-button active" data-category="all">全部</button>
                </div>
            ` : ''}
            
            <div class="examples-content">
                <div class="examples-list" id="examples-list">
                    <!-- 範例項目將在這裡動態生成 -->
                </div>
                
                <div class="examples-pagination hidden" id="examples-pagination">
                    <button id="prev-page" class="page-button" disabled>上一頁</button>
                    <span class="page-info" id="page-info">1 / 1</span>
                    <button id="next-page" class="page-button" disabled>下一頁</button>
                </div>
                
                <div class="loading-indicator hidden" id="examples-loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">載入範例中...</div>
                </div>
                
                <div class="empty-state hidden" id="examples-empty">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">沒有找到符合條件的範例</div>
                    <button class="reload-button" onclick="examplesModule.loadExamples()">重新載入</button>
                </div>
            </div>
            
            <!-- 範例預覽模態框 -->
            <div class="example-modal hidden" id="example-modal">
                <div class="modal-overlay" onclick="examplesModule.closePreview()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title" id="modal-title">範例預覽</h3>
                        <button class="modal-close" onclick="examplesModule.closePreview()">✕</button>
                    </div>
                    <div class="modal-body" id="modal-body">
                        <!-- 預覽內容 -->
                    </div>
                    <div class="modal-footer">
                        <button class="modal-button secondary" onclick="examplesModule.closePreview()">關閉</button>
                        <button class="modal-button primary" id="apply-example">套用範例</button>
                        <button class="modal-button primary" id="download-example">下載範例</button>
                    </div>
                </div>
            </div>
        `;
        
        // 取得 UI 元素參考
        this.examplesList = Utils.dom.$('#examples-list');
        this.categoriesContainer = Utils.dom.$('#examples-categories');
        this.searchInput = Utils.dom.$('#examples-search');
        this.loadingIndicator = Utils.dom.$('#examples-loading');
        this.emptyState = Utils.dom.$('#examples-empty');
        this.modal = Utils.dom.$('#example-modal');
        this.pagination = Utils.dom.$('#examples-pagination');
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 搜尋功能
        if (this.searchInput) {
            Utils.dom.on(this.searchInput, 'input', Utils.debounce(() => {
                this.handleSearch();
            }, 300));
        }
        
        // 檢視模式切換
        const viewButtons = Utils.dom.$$('.view-button');
        viewButtons.forEach(button => {
            Utils.dom.on(button, 'click', () => {
                this.switchViewMode(button.dataset.view);
            });
        });
        
        // 重新載入按鈕
        Utils.dom.on(Utils.dom.$('#refresh-examples'), 'click', () => {
            this.loadExamples();
        });
        
        // 範例項目點擊事件（事件委派）
        Utils.dom.on(this.examplesList, 'click', (e) => {
            const exampleItem = e.target.closest('.example-item');
            if (exampleItem) {
                const exampleId = exampleItem.dataset.exampleId;
                this.handleExampleClick(exampleId);
            }
        });
        
        // 分類按鈕事件（事件委派）
        if (this.categoriesContainer) {
            Utils.dom.on(this.categoriesContainer, 'click', (e) => {
                if (e.target.classList.contains('category-button')) {
                    this.switchCategory(e.target.dataset.category);
                }
            });
        }
        
        // 分頁按鈕
        Utils.dom.on(Utils.dom.$('#prev-page'), 'click', () => {
            this.previousPage();
        });
        
        Utils.dom.on(Utils.dom.$('#next-page'), 'click', () => {
            this.nextPage();
        });
        
        // 模態框按鈕
        Utils.dom.on(Utils.dom.$('#apply-example'), 'click', () => {
            this.applyExample();
        });
        
        Utils.dom.on(Utils.dom.$('#download-example'), 'click', () => {
            this.downloadExample();
        });
        
        // 鍵盤快捷鍵
        Utils.dom.on(document, 'keydown', (e) => {
            if (e.key === 'Escape' && !Utils.dom.$(this.modal).classList.contains('hidden')) {
                this.closePreview();
            }
        });
    }

    /**
     * 載入範例資料
     */
    async loadExamples() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // 從 API 載入範例
            const response = await Utils.http.get(this.apiConfig.endpoint, {
                timeout: this.apiConfig.timeout
            });
            
            if (response.examples) {
                this.examples = response.examples;
                this.processExamples();
                this.renderExamples();
            } else {
                // 使用預設範例資料
                this.examples = this.getDefaultExamples();
                this.processExamples();
                this.renderExamples();
            }
            
            Utils.events.emit('examples:loaded', { count: this.examples.length });
            
        } catch (error) {
            Utils.log.error('Load examples error:', error);
            
            // 載入失敗時使用預設範例
            this.examples = this.getDefaultExamples();
            this.processExamples();
            this.renderExamples();
            
            this.showError('無法從服務器載入範例，顯示預設範例。');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    /**
     * 取得預設範例資料
     */
    getDefaultExamples() {
        return [
            {
                id: 'login-form',
                title: '登入表單',
                description: '現代化的使用者登入介面，包含響應式設計和表單驗證',
                category: 'forms',
                tags: ['login', 'form', 'responsive', 'validation'],
                thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjUwIiB5PSI0MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSI3MCIgcng9IjgiIGZpbGw9IndoaXRlIiBzdHJva2U9IiNFMEUwRTAiLz4KPHN2ZyB4PSI3NSIgeT0iNTUiIHdpZHRoPSI1MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDUwIDQwIj4KPHN2ZyB4PSIxNSIgeT0iNSIgd2lkdGg9IjIwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRDBEMEQwIi8+CjxzdmcgeD0iMTUiIHk9IjIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIGZpbGw9IiNEMEQwRDAiLz4KPHN2ZyB4PSIxNSIgeT0iMzUiIHdpZHRoPSIyMCIgaGVpZ2h0PSI1IiBmaWxsPSIjNDA3N0ZGIi8+Cjwvc3ZnPgo8L3N2Zz4K',
                createdAt: '2024-01-15',
                author: 'UI CoreWork',
                likes: 145,
                downloads: 89,
                preview: {
                    type: 'html',
                    content: '<div class="login-form">...</div>'
                },
                files: [
                    { name: 'login.html', type: 'html', content: '...' },
                    { name: 'login.css', type: 'css', content: '...' },
                    { name: 'login.js', type: 'javascript', content: '...' }
                ]
            },
            {
                id: 'dashboard-widgets',
                title: '儀錶板小工具',
                description: '包含圖表、統計卡片和數據視覺化的儀錶板組件',
                category: 'dashboard',
                tags: ['dashboard', 'widgets', 'charts', 'analytics'],
                thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjRTBFMEUwIi8+CjxyZWN0IHg9IjExMCIgeT0iMTAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI2MCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI0UwRTBFMCIvPgo8cmVjdCB4PSIxMCIgeT0iODAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI2MCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI0UwRTBFMCIvPgo8cmVjdCB4PSIxMTAiIHk9IjgwIiB3aWR0aD0iODAiIGhlaWdodD0iNjAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiNFMEUwRTAiLz4KPC9zdmc+Cg==',
                createdAt: '2024-01-10',
                author: 'UI CoreWork',
                likes: 203,
                downloads: 156
            },
            {
                id: 'mobile-navigation',
                title: '手機導航選單',
                description: '適合行動裝置的漢堡選單導航，支援手勢操作',
                category: 'navigation',
                tags: ['mobile', 'navigation', 'hamburger', 'responsive'],
                thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjMwIiB5PSIyMCIgd2lkdGg9IjE0MCIgaGVpZ2h0PSIxMTAiIHJ4PSIxMCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI0UwRTBFMCIvPgo8cGF0aCBkPSJNNTAgNDVINjVNNTAgNjBINjVNNTAgNzVINjUiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==',
                createdAt: '2024-01-08',
                author: 'UI CoreWork',
                likes: 167,
                downloads: 134
            },
            {
                id: 'card-layout',
                title: '卡片佈局',
                description: '彈性的卡片佈局系統，適用於內容展示和產品列表',
                category: 'layout',
                tags: ['cards', 'layout', 'grid', 'responsive'],
                thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjcwIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjRTBFMEUwIi8+CjxyZWN0IHg9IjgwIiB5PSIyMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjcwIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjRTBFMEUwIi8+CjxyZWN0IHg9IjE0MCIgeT0iMjAiIHdpZHRoPSI1MCIgaGVpZ2h0PSI3MCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI0UwRTBFMCIvPgo8L3N2Zz4K',
                createdAt: '2024-01-05',
                author: 'UI CoreWork',
                likes: 89,
                downloads: 67
            }
        ];
    }

    /**
     * 處理範例資料
     */
    processExamples() {
        // 收集所有分類
        this.categories.clear();
        this.examples.forEach(example => {
            if (example.category) {
                this.categories.add(example.category);
            }
        });
        
        // 更新分類選單
        this.updateCategories();
        
        // 初始化過濾後的範例
        this.filteredExamples = [...this.examples];
        
        // 按建立時間排序
        this.filteredExamples.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * 更新分類選單
     */
    updateCategories() {
        if (!this.categoriesContainer || !this.options.enableCategories) return;
        
        const categoryButtons = Array.from(this.categories).map(category => {
            const displayName = this.getCategoryDisplayName(category);
            return `<button class="category-button" data-category="${category}">${displayName}</button>`;
        }).join('');
        
        // 保留「全部」按鈕，添加其他分類
        const allButton = this.categoriesContainer.querySelector('[data-category="all"]');
        this.categoriesContainer.innerHTML = allButton.outerHTML + categoryButtons;
    }

    /**
     * 取得分類顯示名稱
     */
    getCategoryDisplayName(category) {
        const categoryNames = {
            'forms': '表單',
            'dashboard': '儀錶板',
            'navigation': '導航',
            'layout': '佈局',
            'buttons': '按鈕',
            'components': '組件',
            'animations': '動畫',
            'charts': '圖表'
        };
        
        return categoryNames[category] || category;
    }

    /**
     * 渲染範例列表
     */
    renderExamples() {
        if (this.filteredExamples.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.hideEmptyState();
        
        // 清空現有內容
        this.examplesList.innerHTML = '';
        
        // 渲染範例項目
        this.filteredExamples.forEach(example => {
            const exampleEl = this.createExampleElement(example);
            this.examplesList.appendChild(exampleEl);
        });
        
        // 更新檢視模式
        this.updateViewMode();
    }

    /**
     * 建立範例元素
     */
    createExampleElement(example) {
        const exampleDiv = Utils.dom.create('div', {
            className: 'example-item',
            'data-example-id': example.id
        });
        
        const thumbnailHtml = example.thumbnail ? 
            `<img src="${example.thumbnail}" alt="${example.title}" class="example-thumbnail" />` :
            `<div class="example-placeholder">🎨</div>`;
        
        exampleDiv.innerHTML = `
            <div class="example-image">
                ${thumbnailHtml}
                <div class="example-overlay">
                    <button class="preview-button" title="預覽">👁</button>
                    <button class="apply-button" title="套用">📋</button>
                    <button class="download-button" title="下載">💾</button>
                </div>
            </div>
            
            <div class="example-info">
                <h3 class="example-title">${example.title}</h3>
                <p class="example-description">${Utils.string.truncate(example.description, 80)}</p>
                
                <div class="example-meta">
                    <span class="example-category">${this.getCategoryDisplayName(example.category)}</span>
                    <span class="example-date">${Utils.time.format(new Date(example.createdAt), 'MM/DD')}</span>
                </div>
                
                <div class="example-stats">
                    <span class="stat-item">
                        <span class="stat-icon">❤️</span>
                        <span class="stat-count">${example.likes || 0}</span>
                    </span>
                    <span class="stat-item">
                        <span class="stat-icon">📥</span>
                        <span class="stat-count">${example.downloads || 0}</span>
                    </span>
                </div>
                
                ${example.tags ? `
                    <div class="example-tags">
                        ${example.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        return exampleDiv;
    }

    /**
     * 處理範例點擊
     */
    handleExampleClick(exampleId) {
        const example = this.examples.find(ex => ex.id === exampleId);
        if (!example) return;
        
        if (this.options.enablePreview) {
            this.showPreview(example);
        } else {
            this.applyExample(example);
        }
        
        Utils.events.emit('example:click', { example });
    }

    /**
     * 顯示範例預覽
     */
    showPreview(example) {
        this.currentExample = example;
        
        // 更新模態框內容
        Utils.dom.$('#modal-title').textContent = example.title;
        
        const modalBody = Utils.dom.$('#modal-body');
        modalBody.innerHTML = `
            <div class="preview-container">
                <div class="preview-image">
                    ${example.thumbnail ? 
                        `<img src="${example.thumbnail}" alt="${example.title}" />` :
                        '<div class="preview-placeholder">🎨</div>'
                    }
                </div>
                
                <div class="preview-details">
                    <div class="detail-section">
                        <h4>描述</h4>
                        <p>${example.description}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>資訊</h4>
                        <div class="detail-list">
                            <div class="detail-item">
                                <span class="detail-label">分類:</span>
                                <span class="detail-value">${this.getCategoryDisplayName(example.category)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">作者:</span>
                                <span class="detail-value">${example.author || '未知'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">建立時間:</span>
                                <span class="detail-value">${Utils.time.format(new Date(example.createdAt))}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${example.tags ? `
                        <div class="detail-section">
                            <h4>標籤</h4>
                            <div class="preview-tags">
                                ${example.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${example.files ? `
                        <div class="detail-section">
                            <h4>包含檔案</h4>
                            <div class="file-list">
                                ${example.files.map(file => `
                                    <div class="file-item">
                                        <span class="file-icon">${this.getFileIcon(file.type)}</span>
                                        <span class="file-name">${file.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // 顯示模態框
        Utils.dom.removeClass(this.modal, 'hidden');
        document.body.style.overflow = 'hidden';
        
        Utils.events.emit('example:preview', { example });
    }

    /**
     * 取得檔案圖示
     */
    getFileIcon(fileType) {
        const icons = {
            'html': '📄',
            'css': '🎨',
            'javascript': '📜',
            'js': '📜',
            'json': '📋',
            'svg': '🖼️',
            'png': '🖼️',
            'jpg': '🖼️',
            'jpeg': '🖼️'
        };
        
        return icons[fileType] || '📄';
    }

    /**
     * 關閉預覽
     */
    closePreview() {
        Utils.dom.addClass(this.modal, 'hidden');
        document.body.style.overflow = '';
        this.currentExample = null;
        
        Utils.events.emit('example:preview:close');
    }

    /**
     * 套用範例
     */
    applyExample(example = null) {
        const targetExample = example || this.currentExample;
        if (!targetExample) return;
        
        // 觸發套用事件，讓其他模組處理
        Utils.events.emit('example:apply', { 
            example: targetExample,
            source: 'examples_module'
        });
        
        // 關閉預覽
        this.closePreview();
        
        // 顯示成功訊息
        this.showMessage(`已套用範例: ${targetExample.title}`, 'success');
        
        Utils.log.info('Example applied:', targetExample.id);
    }

    /**
     * 下載範例
     */
    downloadExample(example = null) {
        const targetExample = example || this.currentExample;
        if (!targetExample) return;
        
        // 準備下載資料
        const downloadData = {
            title: targetExample.title,
            description: targetExample.description,
            files: targetExample.files || [],
            metadata: {
                id: targetExample.id,
                category: targetExample.category,
                tags: targetExample.tags,
                author: targetExample.author,
                createdAt: targetExample.createdAt
            }
        };
        
        // 建立並下載 ZIP 檔案（簡化版本）
        const jsonContent = JSON.stringify(downloadData, null, 2);
        const filename = `${Utils.string.toKebabCase(targetExample.title)}.json`;
        
        Utils.file.download(jsonContent, filename, 'application/json');
        
        Utils.events.emit('example:download', { example: targetExample });
        Utils.log.info('Example downloaded:', targetExample.id);
    }

    /**
     * 處理搜尋
     */
    handleSearch() {
        const query = this.searchInput.value.toLowerCase().trim();
        
        if (query === '') {
            this.filteredExamples = [...this.examples];
        } else {
            this.filteredExamples = this.examples.filter(example => {
                return (
                    example.title.toLowerCase().includes(query) ||
                    example.description.toLowerCase().includes(query) ||
                    (example.tags && example.tags.some(tag => tag.toLowerCase().includes(query))) ||
                    example.category.toLowerCase().includes(query)
                );
            });
        }
        
        // 應用分類過濾
        if (this.currentCategory !== 'all') {
            this.filteredExamples = this.filteredExamples.filter(example => 
                example.category === this.currentCategory
            );
        }
        
        this.renderExamples();
        
        Utils.events.emit('examples:search', { query, count: this.filteredExamples.length });
    }

    /**
     * 切換分類
     */
    switchCategory(category) {
        this.currentCategory = category;
        
        // 更新分類按鈕狀態
        const categoryButtons = Utils.dom.$$('.category-button');
        categoryButtons.forEach(btn => {
            if (btn.dataset.category === category) {
                Utils.dom.addClass(btn, 'active');
            } else {
                Utils.dom.removeClass(btn, 'active');
            }
        });
        
        // 重新搜尋
        this.handleSearch();
        
        Utils.events.emit('examples:category', { category });
    }

    /**
     * 切換檢視模式
     */
    switchViewMode(mode) {
        if (this.viewMode === mode) return;
        
        this.viewMode = mode;
        
        // 更新按鈕狀態
        const viewButtons = Utils.dom.$$('.view-button');
        viewButtons.forEach(btn => {
            if (btn.dataset.view === mode) {
                Utils.dom.addClass(btn, 'active');
            } else {
                Utils.dom.removeClass(btn, 'active');
            }
        });
        
        this.updateViewMode();
    }

    /**
     * 更新檢視模式
     */
    updateViewMode() {
        const viewClass = `view-${this.viewMode}`;
        this.examplesList.className = `examples-list ${viewClass}`;
    }

    /**
     * 顯示載入狀態
     */
    showLoading() {
        Utils.dom.removeClass(this.loadingIndicator, 'hidden');
        Utils.dom.addClass(this.examplesList, 'hidden');
        Utils.dom.addClass(this.emptyState, 'hidden');
    }

    /**
     * 隱藏載入狀態
     */
    hideLoading() {
        Utils.dom.addClass(this.loadingIndicator, 'hidden');
        Utils.dom.removeClass(this.examplesList, 'hidden');
    }

    /**
     * 顯示空狀態
     */
    showEmptyState() {
        Utils.dom.removeClass(this.emptyState, 'hidden');
        Utils.dom.addClass(this.examplesList, 'hidden');
    }

    /**
     * 隱藏空狀態
     */
    hideEmptyState() {
        Utils.dom.addClass(this.emptyState, 'hidden');
        Utils.dom.removeClass(this.examplesList, 'hidden');
    }

    /**
     * 顯示訊息
     */
    showMessage(message, type = 'info') {
        // 簡單的訊息提示實作
        const messageEl = Utils.dom.create('div', {
            className: `message-toast ${type}`
        }, message);
        
        document.body.appendChild(messageEl);
        
        // 添加動畫
        setTimeout(() => Utils.dom.addClass(messageEl, 'show'), 10);
        
        // 自動移除
        setTimeout(() => {
            Utils.dom.removeClass(messageEl, 'show');
            setTimeout(() => document.body.removeChild(messageEl), 300);
        }, 3000);
    }

    /**
     * 顯示錯誤訊息
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * 取得範例資料
     */
    getExamples() {
        return [...this.examples];
    }

    /**
     * 取得過濾後的範例
     */
    getFilteredExamples() {
        return [...this.filteredExamples];
    }

    /**
     * 取得特定範例
     */
    getExample(id) {
        return this.examples.find(example => example.id === id);
    }

    /**
     * 銷毀模組
     */
    destroy() {
        // 清理事件監聽器和資料
        this.examples = [];
        this.filteredExamples = [];
        this.categories.clear();
        
        Utils.log.info('Examples module destroyed');
    }
}

// 匯出到全域
window.ExamplesModule = ExamplesModule;