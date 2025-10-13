// UI CoreWork - 繪圖功能模組
class DrawingModule {
    constructor(canvasId, options = {}) {
        this.canvas = Utils.dom.$(canvasId);
        if (!this.canvas) {
            Utils.log.error(`[DrawingModule Error] Canvas element with id "${canvasId}" not found. Initialization aborted.`);
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }
        
        // 優化：為 Canvas2D 上下文添加 willReadFrequently 屬性
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        // 繪圖狀態
        this.isDrawing = false;
        this.isPanning = false;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.currentSize = 3;
        this.currentOpacity = 1;
        
        // 繪圖歷史
        this.strokes = [];
        this.currentStroke = null;
        this.undoStack = [];
        this.redoStack = [];
        
        // 平移和縮放
        this.pan = { x: 0, y: 0 };
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 5;
        
        // 觸控支援
        this.lastTouchDistance = 0;
        this.touches = {};
        
        // 配置選項
        this.options = {
            enablePressure: true,
            enableSmoothing: true,
            smoothingFactor: 0.5,
            ...options
        };
        
        // 初始化
        this.init();
        Utils.log.info('Drawing module initialized');
    }

    /**
     * 初始化繪圖模組
     */
    init() {
        this.setupCanvas();
        this.bindEvents();
        this.setupUI();
        this.clear();
    }

    /**
     * 設定畫布
     */
    setupCanvas() {
        // 設定畫布尺寸
        this.resizeCanvas();
        
        // 設定畫布樣式
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.imageSmoothingEnabled = true;
        
        // 監聽視窗大小變化
        window.addEventListener('resize', Utils.debounce(() => {
            this.resizeCanvas();
        }, 100));
    }

    /**
     * 調整畫布大小
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) {
            Utils.log.error('[DrawingModule Error] Canvas parent element not found. Resize aborted.');
            return;
        }
        const rect = container.getBoundingClientRect();
        
        // 儲存當前繪圖內容（若畫布尚未設定尺寸或 getImageData 失敗則跳過）
        let imageData = null;
        try {
            if (this.canvas.width > 0 && this.canvas.height > 0) {
                imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            }
        } catch (e) {
            // 可能在未初始化或跨域/上下文狀態下失敗，記錄並繼續（不阻斷初始化）
            Utils.log && Utils.log.warn && Utils.log.warn('Unable to get canvas imageData during resize:', e);
            imageData = null;
        }

        // 調整畫布尺寸
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        
        // 設定 CSS 尺寸
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // 縮放繪圖上下文
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // 恢復繪圖內容（如果有儲存的 imageData）
        if (imageData) {
            try {
                this.ctx.putImageData(imageData, 0, 0);
            } catch (e) {
                Utils.log && Utils.log.warn && Utils.log.warn('Unable to put canvas imageData during resize:', e);
            }
        }
        
        // 重新應用樣式
        this.applyCanvasStyles();
    }

    /**
     * 應用畫布樣式
     */
    applyCanvasStyles() {
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.imageSmoothingEnabled = true;
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 滑鼠事件
        this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleEnd.bind(this));
        this.canvas.addEventListener('mouseout', this.handleEnd.bind(this));
        
        // 觸控事件
        this.canvas.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleEnd.bind(this));
        
        // 指標事件（如果支援）
        if (Utils.browser.supportsPointer) {
            this.canvas.addEventListener('pointerdown', this.handleStart.bind(this));
            this.canvas.addEventListener('pointermove', this.handleMove.bind(this));
            this.canvas.addEventListener('pointerup', this.handleEnd.bind(this));
            this.canvas.addEventListener('pointercancel', this.handleEnd.bind(this));
        }
        
        // 滾輪縮放
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        // 防止右鍵選單
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    /**
     * 處理開始繪圖
     */
    handleStart(event) {
        event.preventDefault();
        
        const coords = this.getEventCoords(event);
        if (!coords) return;
        
        // 檢查是否為多點觸控
        if (event.touches && event.touches.length > 1) {
            this.handleMultiTouch(event);
            return;
        }
        
        // 根據當前工具處理
        switch (this.currentTool) {
            case 'pen':
            case 'eraser':
                this.startDrawing(coords, event);
                break;
            case 'pan':
                this.startPanning(coords);
                break;
            default:
                this.startDrawing(coords, event);
        }
        
        Utils.events.emit('drawing:start', { coords, tool: this.currentTool });
    }

    /**
     * 處理移動
     */
    handleMove(event) {
        event.preventDefault();
        
        const coords = this.getEventCoords(event);
        if (!coords) return;
        
        if (this.isDrawing) {
            this.continueDrawing(coords, event);
        } else if (this.isPanning) {
            this.continuePanning(coords);
        }
        
        // 更新游標位置資訊
        this.updateCursorInfo(coords);
    }

    /**
     * 處理結束繪圖
     */
    handleEnd(event) {
        event.preventDefault();
        
        if (this.isDrawing) {
            this.endDrawing();
        }
        
        if (this.isPanning) {
            this.endPanning();
        }
        
        Utils.events.emit('drawing:end', { tool: this.currentTool });
    }

    /**
     * 處理多點觸控（縮放、旋轉）
     */
    handleMultiTouch(event) {
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            
            if (this.lastTouchDistance > 0) {
                const scale = distance / this.lastTouchDistance;
                this.handleZoom(scale, {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2
                });
            }
            
            this.lastTouchDistance = distance;
        }
    }

    /**
     * 處理滾輪縮放
     */
    handleWheel(event) {
        event.preventDefault();
        
        const delta = event.deltaY;
        const scale = delta > 0 ? 0.9 : 1.1;
        const coords = Utils.coordinates.getRelativeCoords(event, this.canvas);
        
        this.handleZoom(scale, coords);
    }

    /**
     * 獲取事件座標
     */
    getEventCoords(event) {
        let clientX, clientY, pressure = 1;
        
        if (event.touches && event.touches.length > 0) {
            // 觸控事件
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
            pressure = event.touches[0].force || 1;
        } else if (event.clientX !== undefined) {
            // 滑鼠事件
            clientX = event.clientX;
            clientY = event.clientY;
            pressure = event.pressure || 1;
        } else {
            return null;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (clientX - rect.left) / this.zoom - this.pan.x;
        const y = (clientY - rect.top) / this.zoom - this.pan.y;
        
        return { x, y, pressure };
    }

    /**
     * 開始繪圖
     */
    startDrawing(coords, event) {
        this.isDrawing = true;
        
        // 建立新筆畫
        this.currentStroke = {
            id: Utils.generateId('stroke'),
            tool: this.currentTool,
            color: this.currentColor,
            size: this.currentSize,
            opacity: this.currentOpacity,
            points: [{ ...coords, timestamp: Utils.time.now() }],
            timestamp: Utils.time.now()
        };
        
        // 開始繪製路徑
        this.ctx.save();
        this.applyStrokeStyle(this.currentStroke);
        this.ctx.beginPath();
        this.ctx.moveTo(coords.x, coords.y);
        
        // 如果啟用壓力感測
        if (this.options.enablePressure && coords.pressure) {
            this.ctx.lineWidth = this.currentSize * coords.pressure;
        }
    }

    /**
     * 繼續繪圖
     */
    continueDrawing(coords, event) {
        if (!this.isDrawing || !this.currentStroke) return;
        
        // 加入點到當前筆畫
        this.currentStroke.points.push({
            ...coords,
            timestamp: Utils.time.now()
        });
        
        // 如果啟用平滑化
        if (this.options.enableSmoothing && this.currentStroke.points.length >= 3) {
            this.drawSmoothLine();
        } else {
            this.ctx.lineTo(coords.x, coords.y);
            this.ctx.stroke();
        }
        
        // 更新壓力感測
        if (this.options.enablePressure && coords.pressure) {
            this.ctx.lineWidth = this.currentSize * coords.pressure;
        }
    }

    /**
     * 結束繪圖
     */
    endDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.ctx.restore();
        
        if (this.currentStroke && this.currentStroke.points.length > 0) {
            // 加入筆畫到歷史
            this.strokes.push(this.currentStroke);
            this.addToUndoStack();
            
            // 觸發事件
            Utils.events.emit('stroke:complete', this.currentStroke);
        }
        
        this.currentStroke = null;
    }

    /**
     * 繪製平滑線條
     */
    drawSmoothLine() {
        const points = this.currentStroke.points;
        const len = points.length;
        
        if (len < 3) return;
        
        const lastPoint = points[len - 1];
        const secondLastPoint = points[len - 2];
        const thirdLastPoint = points[len - 3];
        
        // 使用二次貝茲曲線平滑化
        const controlX = (secondLastPoint.x + lastPoint.x) / 2;
        const controlY = (secondLastPoint.y + lastPoint.y) / 2;
        
        this.ctx.quadraticCurveTo(
            secondLastPoint.x, secondLastPoint.y,
            controlX, controlY
        );
        this.ctx.stroke();
    }

    /**
     * 應用筆畫樣式
     */
    applyStrokeStyle(stroke) {
        this.ctx.strokeStyle = stroke.color;
        this.ctx.lineWidth = stroke.size;
        this.ctx.globalAlpha = stroke.opacity;
        
        if (stroke.tool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
        }
    }

    /**
     * 開始拖移
     */
    startPanning(coords) {
        this.isPanning = true;
        this.lastPanPoint = coords;
    }

    /**
     * 繼續拖移
     */
    continuePanning(coords) {
        if (!this.isPanning) return;
        
        const deltaX = coords.x - this.lastPanPoint.x;
        const deltaY = coords.y - this.lastPanPoint.y;
        
        this.pan.x += deltaX;
        this.pan.y += deltaY;
        
        this.redraw();
        this.lastPanPoint = coords;
    }

    /**
     * 結束拖移
     */
    endPanning() {
        this.isPanning = false;
        this.lastPanPoint = null;
    }

    /**
     * 處理縮放
     */
    handleZoom(scale, center) {
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * scale));
        
        if (newZoom !== this.zoom) {
            // 調整平移以保持中心點
            this.pan.x = center.x - (center.x - this.pan.x) * (newZoom / this.zoom);
            this.pan.y = center.y - (center.y - this.pan.y) * (newZoom / this.zoom);
            
            this.zoom = newZoom;
            this.redraw();
            
            Utils.events.emit('canvas:zoom', { zoom: this.zoom, center });
        }
    }

    /**
     * 重新繪製畫布
     */
    redraw() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 應用變換
        this.ctx.translate(this.pan.x, this.pan.y);
        this.ctx.scale(this.zoom, this.zoom);
        
        // 重繪所有筆畫
        this.strokes.forEach(stroke => {
            this.drawStroke(stroke);
        });
        
        this.ctx.restore();
    }

    /**
     * 繪製單一筆畫
     */
    drawStroke(stroke) {
        if (!stroke.points || stroke.points.length === 0) return;
        
        this.ctx.save();
        this.applyStrokeStyle(stroke);
        this.ctx.beginPath();
        
        const points = stroke.points;
        this.ctx.moveTo(points[0].x, points[0].y);
        
        if (this.options.enableSmoothing && points.length > 2) {
            // 平滑繪製
            for (let i = 1; i < points.length - 1; i++) {
                const controlX = (points[i].x + points[i + 1].x) / 2;
                const controlY = (points[i].y + points[i + 1].y) / 2;
                this.ctx.quadraticCurveTo(points[i].x, points[i].y, controlX, controlY);
            }
        } else {
            // 直線繪製
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }

    /**
     * 設定工具
     */
    setTool(tool) {
        this.currentTool = tool;
        this.updateCursor();
        Utils.events.emit('tool:change', tool);
    }

    /**
     * 設定顏色
     */
    setColor(color) {
        this.currentColor = color;
        Utils.events.emit('color:change', color);
    }

    /**
     * 設定筆畫大小
     */
    setSize(size) {
        this.currentSize = Math.max(1, Math.min(100, size));
        Utils.events.emit('size:change', this.currentSize);
    }

    /**
     * 設定不透明度
     */
    setOpacity(opacity) {
        this.currentOpacity = Math.max(0, Math.min(1, opacity));
        Utils.events.emit('opacity:change', this.currentOpacity);
    }

    /**
     * 清除畫布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.strokes = [];
        this.undoStack = [];
        this.redoStack = [];
        Utils.events.emit('canvas:clear');
    }

    /**
     * 復原
     */
    undo() {
        if (this.undoStack.length > 0) {
            const state = this.undoStack.pop();
            this.redoStack.push(Utils.deepClone(this.strokes));
            this.strokes = state;
            this.redraw();
            Utils.events.emit('canvas:undo');
        }
    }

    /**
     * 重做
     */
    redo() {
        if (this.redoStack.length > 0) {
            const state = this.redoStack.pop();
            this.addToUndoStack();
            this.strokes = state;
            this.redraw();
            Utils.events.emit('canvas:redo');
        }
    }

    /**
     * 加入到復原堆疊
     */
    addToUndoStack() {
        this.undoStack.push(Utils.deepClone(this.strokes));
        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    /**
     * 匯出為圖片
     */
    exportAsImage(format = 'png', quality = 0.92) {
        return this.canvas.toDataURL(`image/${format}`, quality);
    }

    /**
     * 匯出繪圖資料
     */
    exportData() {
        return {
            strokes: this.strokes,
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            timestamp: Utils.time.now()
        };
    }

    /**
     * 匯入繪圖資料
     */
    importData(data) {
        if (data.strokes) {
            this.strokes = data.strokes;
            this.redraw();
            Utils.events.emit('canvas:import', data);
        }
    }

    /**
     * 更新游標樣式
     */
    updateCursor() {
        const cursors = {
            pen: 'crosshair',
            eraser: 'grab',
            pan: 'move'
        };
        
        this.canvas.style.cursor = cursors[this.currentTool] || 'default';
    }

    /**
     * 更新游標資訊
     */
    updateCursorInfo(coords) {
        Utils.events.emit('cursor:move', {
            x: Math.round(coords.x),
            y: Math.round(coords.y),
            zoom: this.zoom.toFixed(2)
        });
    }

    /**
     * 設定 UI 控制項
     */
    setupUI() {
        // 工具按鈕
        const toolButtons = Utils.dom.$$('.drawing-tool');
        toolButtons.forEach(button => {
            Utils.dom.on(button, 'click', () => {
                const tool = button.dataset.tool;
                if (tool) {
                    this.setTool(tool);
                    
                    // 更新按鈕狀態
                    toolButtons.forEach(btn => Utils.dom.removeClass(btn, 'active'));
                    Utils.dom.addClass(button, 'active');
                }
            });
        });
        
        // 顏色選擇器
        const colorPicker = Utils.dom.$('#color-picker');
        if (colorPicker) {
            Utils.dom.on(colorPicker, 'change', (e) => {
                this.setColor(e.target.value);
            });
        }
        
        // 筆畫大小滑桿
        const sizeSlider = Utils.dom.$('#size-slider');
        if (sizeSlider) {
            Utils.dom.on(sizeSlider, 'input', (e) => {
                this.setSize(parseInt(e.target.value));
            });
        }
        
        // 不透明度滑桿
        const opacitySlider = Utils.dom.$('#opacity-slider');
        if (opacitySlider) {
            Utils.dom.on(opacitySlider, 'input', (e) => {
                this.setOpacity(parseFloat(e.target.value));
            });
        }
        
        // 功能按鈕
        const clearBtn = Utils.dom.$('#clear-canvas');
        if (clearBtn) {
            Utils.dom.on(clearBtn, 'click', () => {
                if (confirm('確定要清除畫布嗎？')) {
                    this.clear();
                }
            });
        }
        
        const undoBtn = Utils.dom.$('#undo');
        if (undoBtn) {
            Utils.dom.on(undoBtn, 'click', () => this.undo());
        }
        
        const redoBtn = Utils.dom.$('#redo');
        if (redoBtn) {
            Utils.dom.on(redoBtn, 'click', () => this.redo());
        }
    }

    /**
     * 銷毀模組
     */
    destroy() {
        // 移除事件監聽器
        this.canvas.removeEventListener('mousedown', this.handleStart);
        this.canvas.removeEventListener('mousemove', this.handleMove);
        this.canvas.removeEventListener('mouseup', this.handleEnd);
        // ... 其他事件監聽器
        
        // 清理資料
        this.strokes = [];
        this.undoStack = [];
        this.redoStack = [];
        
        Utils.log.info('Drawing module destroyed');
    }
}

// 匯出到全域
window.DrawingModule = DrawingModule;