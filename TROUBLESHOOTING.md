# 🔧 故障排除指南

## 問題：畫筆無法繪圖 & 圈選功能按鈕未出現

### 🔍 問題診斷

#### 1. 開啟瀏覽器開發者工具
**操作步驟**：
1. 在瀏覽器中開啟 `http://localhost:8000/`
2. 按 `F12` 或 `Cmd+Option+I` (Mac) 開啟開發者工具
3. 切換到 **Console** 標籤
4. 查看是否有以下訊息：

**預期看到的訊息**：
```
UI CoreWork initializing...
Loading element: <div>
Main content element: <div>
Loading hidden
Main content shown
Starting app initialization...
Canvas resized: XXX x XXX
✅ 應用初始化完成！畫畫和圈選功能就緒
```

#### 2. 檢查Canvas初始化
在Console中執行：
```javascript
// 檢查canvas元素
console.log('Canvas:', document.getElementById('drawing-canvas'));

// 檢查canvas尺寸
const canvas = document.getElementById('drawing-canvas');
console.log('Canvas size:', canvas.width, 'x', canvas.height);

// 檢查全局變量
console.log('ctx:', typeof ctx);
console.log('isDrawing:', typeof isDrawing);
console.log('currentTool:', currentTool);
```

**預期結果**：
- Canvas: `<canvas id="drawing-canvas"...>`
- Canvas size: `大於0的數字 x 大於0的數字`
- ctx: `object`
- isDrawing: `boolean`
- currentTool: `pen`

---

## 🐛 常見問題與解決方案

### 問題1: Canvas尺寸為 0 x 0

**症狀**：
- 畫布無法繪圖
- 點擊畫布沒有反應

**原因**：
- CSS高度未正確設置
- 父容器尺寸為0

**解決方案**：
```javascript
// 在Console中強制設置Canvas尺寸
const canvas = document.getElementById('drawing-canvas');
const container = canvas.parentElement;
canvas.width = 800;  // 或 container.clientWidth
canvas.height = 500; // 或 container.clientHeight
console.log('Canvas手動調整為:', canvas.width, 'x', canvas.height);

// 重新初始化上下文
if (typeof ctx !== 'undefined') {
    ctx = canvas.getContext('2d');
}
```

### 問題2: 事件監聽器未綁定

**症狀**：
- 滑鼠點擊無反應
- 無法繪圖

**檢查方法**：
```javascript
// 檢查事件監聽器
const canvas = document.getElementById('drawing-canvas');
console.log('Canvas listeners:', getEventListeners(canvas));
```

**解決方案**：
```javascript
// 手動綁定事件（臨時修復）
const canvas = document.getElementById('drawing-canvas');
canvas.addEventListener('mousedown', handleCanvasMouseDown);
canvas.addEventListener('mousemove', handleCanvasMouseMove);
canvas.addEventListener('mouseup', handleCanvasMouseUp);
console.log('事件監聽器已手動綁定');
```

### 問題3: 初始化函數未執行

**症狀**：
- Console沒有 "Starting app initialization..." 訊息
- 全局變量未定義

**檢查方法**：
```javascript
// 檢查初始化狀態
console.log('initializeApp存在:', typeof initializeApp);
console.log('main-content顯示:', document.getElementById('main-content').style.display);
```

**解決方案**：
```javascript
// 手動執行初始化
if (typeof initializeApp === 'function') {
    initializeApp();
    console.log('初始化已手動觸發');
} else {
    console.error('initializeApp函數不存在！');
}
```

### 問題4: 圈選功能未出現

**症狀**：
- 按住Shift+拖動沒有藍色虛線框
- 無浮動選項菜單

**檢查方法**：
```javascript
// 測試圈選功能
console.log('startSelection存在:', typeof startSelection);
console.log('isSelecting:', isSelecting);
console.log('showSelectionOptions存在:', typeof showSelectionOptions);
```

**手動測試圈選**：
```javascript
// 模擬圈選操作
const canvas = document.getElementById('drawing-canvas');
const selection = {
    x: 50,
    y: 50,
    width: 200,
    height: 100
};
const imageBase64 = canvas.toDataURL('image/png');

// 顯示選項菜單
if (typeof showSelectionOptions === 'function') {
    showSelectionOptions(selection, imageBase64);
    console.log('選項菜單已手動觸發');
}
```

---

## 🔄 完整重置步驟

如果上述方法都無效，執行完整重置：

### 步驟1: 清除瀏覽器緩存
1. 按 `Cmd+Shift+R` (Mac) 或 `Ctrl+Shift+R` (Windows) 硬性重新載入
2. 或清除瀏覽器緩存後重新載入

### 步驟2: 檢查後端日誌
```bash
# 查看後端日誌
tail -f /tmp/backend.log

# 或直接查看運行中的輸出
ps aux | grep "python backend/main.py"
```

### 步驟3: 重啟後端服務
```bash
# 停止舊服務
kill $(cat /tmp/backend.pid 2>/dev/null) 2>/dev/null

# 清理端口
lsof -ti:8000 | xargs kill -9 2>/dev/null

# 重新啟動
cd /Users/jianjunneng/DrawUp/UI_CoreWork
source venv/bin/activate
python backend/main.py
```

### 步驟4: 驗證初始化
打開 `http://localhost:8000/` 並在Console執行：
```javascript
// 完整診斷腳本
const diagnostics = {
    canvas: document.getElementById('drawing-canvas'),
    canvasSize: {
        width: document.getElementById('drawing-canvas')?.width,
        height: document.getElementById('drawing-canvas')?.height
    },
    context: typeof ctx,
    variables: {
        isDrawing: typeof isDrawing,
        isSelecting: typeof isSelecting,
        currentTool: typeof currentTool !== 'undefined' ? currentTool : 'undefined'
    },
    functions: {
        initializeApp: typeof initializeApp,
        startDrawing: typeof startDrawing,
        startSelection: typeof startSelection,
        showSelectionOptions: typeof showSelectionOptions,
        processMathFormula: typeof processMathFormula
    }
};

console.table(diagnostics.variables);
console.table(diagnostics.functions);
console.log('Canvas元素:', diagnostics.canvas);
console.log('Canvas尺寸:', diagnostics.canvasSize);
```

**預期輸出**：
- 所有functions應該是 `function`
- 所有variables應該是 `boolean` 或 `string`
- Canvas尺寸應該大於0

---

## 🎯 快速修復腳本

在瀏覽器Console中執行此腳本進行快速修復：

```javascript
// === 快速修復腳本 ===
(function quickFix() {
    console.log('🔧 開始快速修復...');
    
    // 1. 檢查並修復Canvas
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) {
        console.error('❌ Canvas元素不存在！');
        return;
    }
    
    // 2. 確保Canvas有正確尺寸
    const container = canvas.parentElement;
    if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = container.clientWidth - 4 || 800;
        canvas.height = container.clientHeight - 4 || 500;
        console.log('✅ Canvas尺寸已修復:', canvas.width, 'x', canvas.height);
    }
    
    // 3. 重新初始化上下文
    if (typeof ctx === 'undefined' || !ctx) {
        window.ctx = canvas.getContext('2d');
        console.log('✅ Canvas上下文已重建');
    }
    
    // 4. 確保全局變量存在
    if (typeof isDrawing === 'undefined') window.isDrawing = false;
    if (typeof isSelecting === 'undefined') window.isSelecting = false;
    if (typeof currentTool === 'undefined') window.currentTool = 'pen';
    if (typeof currentColor === 'undefined') window.currentColor = '#2c3e50';
    if (typeof currentSize === 'undefined') window.currentSize = 5;
    if (typeof strokes === 'undefined') window.strokes = [];
    console.log('✅ 全局變量已初始化');
    
    // 5. 重新綁定事件（如果函數存在）
    if (typeof handleCanvasMouseDown === 'function') {
        // 移除舊監聽器（如果有）
        canvas.replaceWith(canvas.cloneNode(true));
        const newCanvas = document.getElementById('drawing-canvas');
        
        newCanvas.addEventListener('mousedown', handleCanvasMouseDown);
        newCanvas.addEventListener('mousemove', handleCanvasMouseMove);
        newCanvas.addEventListener('mouseup', handleCanvasMouseUp);
        newCanvas.addEventListener('mouseout', handleCanvasMouseOut);
        
        console.log('✅ 事件監聽器已重新綁定');
    }
    
    // 6. 測試繪圖功能
    console.log('🧪 測試繪圖功能...');
    console.log('   - 點擊畫布並拖動測試繪圖');
    console.log('   - 按住Shift+拖動測試圈選');
    
    console.log('✅ 快速修復完成！');
})();
```

---

## 📞 需要幫助？

如果問題仍未解決，請提供以下資訊：

1. **瀏覽器Console的完整輸出**
2. **執行診斷腳本的結果**
3. **瀏覽器類型和版本**
4. **後端日誌內容** (`/tmp/backend.log`)

---

**文檔版本**: v1.0  
**最後更新**: 2025年10月8日  
**適用版本**: UI CoreWork v2.0+






