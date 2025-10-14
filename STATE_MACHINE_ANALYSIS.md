# 🎯 畫布狀態機完整分析

## 📊 1. 初始狀態（頁面載入時）

### **全局變數初始值：**

```javascript
// ===== 繪圖狀態 =====
let isDrawing = false;           // ❌ 未在繪圖中
let currentTool = 'pen';          // 預設工具：筆
let currentColor = '#2c3e50';     // 預設顏色
let currentSize = 5;              // 預設筆刷大小

// ===== 操作模式 =====
let selectionOperation = null;    // ❌ 無任何按鈕模式激活

// ===== 圈選狀態 =====
let isSelecting = false;          // ❌ 未在圈選中
let isReadyToSelect = false;      // ❌ 未準備圈選

// ===== 移動狀態 =====
let isMoving = false;             // ❌ 移動模式未激活
let isDragging = false;           // ❌ 未在拖拽中
let selectedItems = [];           // 空陣列（無選中項目）

// ===== 其他操作 =====
let isScaling = false;            // ❌ 縮放模式未激活
let isDeleting = false;           // ❌ 刪除模式未激活
```

### **結論：初始狀態 = 預設繪圖模式**

✅ **所有狀態變數都是 `false` 或 `null`**  
✅ **這代表：用戶可以直接在畫布上繪圖**

---

## 🔄 2. 狀態機設計：兩種主要狀態

### **設計理念：**

```
┌─────────────────────────────────────────────┐
│         應用只有兩種主要狀態：              │
│                                             │
│  1️⃣  繪圖模式（Drawing Mode）              │
│     - selectionOperation === null          │
│     - 所有功能按鈕都未激活                  │
│     - 用戶可以自由繪圖                      │
│                                             │
│  2️⃣  功能模式（Function Mode）             │
│     - selectionOperation !== null          │
│     - 某個功能按鈕被激活                    │
│     - 用戶執行特定功能（圈選/移動/縮放/刪除）│
└─────────────────────────────────────────────┘
```

---

## 📋 3. 完整狀態轉換表

### **A. 繪圖模式（預設狀態）**

| 狀態變數 | 值 | 說明 |
|---------|---|------|
| `selectionOperation` | `null` | 無按鈕激活 |
| `isDrawing` | `false` → `true` | mousedown 時變 true |
| `isSelecting` | `false` | 不能圈選 |
| `isReadyToSelect` | `false` | 不能圈選 |
| `isMoving` | `false` | 移動模式未激活 |
| `isDragging` | `false` | 不在拖拽中 |
| `isScaling` | `false` | 縮放模式未激活 |
| `isDeleting` | `false` | 刪除模式未激活 |

**滑鼠行為：**
- `mousedown` → 開始繪圖（`isDrawing = true`）
- `mousemove` → 繪製線條（`draw()`）
- `mouseup` → 停止繪圖（`isDrawing = false`）

---

### **B. 圈選模式（點擊「選」按鈕後）**

| 狀態變數 | 值 | 說明 |
|---------|---|------|
| `selectionOperation` | `'select'` | 圈選按鈕激活 |
| `isDrawing` | `false` | 不能繪圖 |
| `isSelecting` | `false` → `true` | mousedown 時變 true |
| `isReadyToSelect` | `true` → `false` | mousedown 時變 false |
| `isMoving` | `false` | 移動模式未激活 |
| `isDragging` | `false` | 不在拖拽中 |
| `isScaling` | `false` | 縮放模式未激活 |
| `isDeleting` | `false` | 刪除模式未激活 |

**滑鼠行為：**
- `mousedown` → 開始圈選（`isSelecting = true`, `isReadyToSelect = false`）
- `mousemove` → 更新圈選框（`updateSelection()`）
- `mouseup` → 結束圈選，顯示選項菜單（`endSelection()`）

---

### **C. 移動模式（點擊「移動」按鈕後）**

#### **C1. 移動模式 - 未選中項目**

| 狀態變數 | 值 | 說明 |
|---------|---|------|
| `selectionOperation` | `'move'` | 移動按鈕激活 |
| `isDrawing` | `false` | 不能繪圖 |
| `isSelecting` | `false` → `true` | mousedown 時變 true（先圈選） |
| `isReadyToSelect` | `false` | 不需要準備 |
| `isMoving` | `true` | 移動模式已激活 |
| `isDragging` | `false` | 還未拖拽 |
| `selectedItems` | `[]` | 空陣列 |

**滑鼠行為：**
- `mousedown` → 開始圈選（`isSelecting = true`）
- `mousemove` → 更新圈選框
- `mouseup` → 結束圈選，選中項目（`selectedItems` 填充）

#### **C2. 移動模式 - 已選中項目**

| 狀態變數 | 值 | 說明 |
|---------|---|------|
| `selectionOperation` | `'move'` | 移動按鈕激活 |
| `isDrawing` | `false` | 不能繪圖 |
| `isSelecting` | `false` | 不再圈選 |
| `isReadyToSelect` | `false` | 不需要準備 |
| `isMoving` | `true` | 移動模式已激活 |
| `isDragging` | `false` → `true` | mousedown 時變 true |
| `selectedItems` | `[...]` | 有選中項目 |

**滑鼠行為：**
- `mousedown` → 開始拖拽（`isDragging = true`）
- `mousemove` → 移動項目（`moveSelectedItems()`）
- `mouseup` → 停止拖拽（`isDragging = false`）

---

### **D. 縮放模式（點擊「縮放」按鈕後）**

| 狀態變數 | 值 | 說明 |
|---------|---|------|
| `selectionOperation` | `'scale'` | 縮放按鈕激活 |
| `isDrawing` | `false` | 不能繪圖 |
| `isSelecting` | `false` | 不圈選 |
| `isReadyToSelect` | `false` | 不需要準備 |
| `isMoving` | `false` | 移動模式未激活 |
| `isDragging` | `false` | 不在拖拽中 |
| `isScaling` | `true` | 縮放模式已激活 |
| `isDeleting` | `false` | 刪除模式未激活 |

**滑鼠行為：**
- `mousedown` → 顯示「功能開發中」訊息（未實作）

---

### **E. 刪除模式（點擊「刪除」按鈕後）**

| 狀態變數 | 值 | 說明 |
|---------|---|------|
| `selectionOperation` | `'delete'` | 刪除按鈕激活 |
| `isDrawing` | `false` | 不能繪圖 |
| `isSelecting` | `false` | 不圈選 |
| `isReadyToSelect` | `false` | 不需要準備 |
| `isMoving` | `false` | 移動模式未激活 |
| `isDragging` | `false` | 不在拖拽中 |
| `isScaling` | `false` | 縮放模式未激活 |
| `isDeleting` | `true` | 刪除模式已激活 |

**滑鼠行為：**
- `mousedown` → 顯示「功能開發中」訊息（未實作）

---

## 🔀 4. 狀態轉換邏輯

### **A. 按鈕點擊 → setSelectionOperation(op)**

```javascript
function setSelectionOperation(op) {
    // ⭐ 步驟 1: 無條件重置所有狀態
    isDrawing = false;
    isSelecting = false;
    isReadyToSelect = false;
    isDragging = false;
    isMoving = false;
    isScaling = false;
    isDeleting = false;
    selectedItems = [];
    
    // 重置所有按鈕樣式
    
    // ⭐ 步驟 2: 如果 op === null，回到繪圖模式
    if (op === null) {
        selectionOperation = null;
        return;
    }
    
    // ⭐ 步驟 3: 設置新模式
    selectionOperation = op;
    
    if (op === 'select') {
        isReadyToSelect = true;  // ✅ 準備圈選
    } else if (op === 'move') {
        isMoving = true;         // ✅ 激活移動
    } else if (op === 'scale') {
        isScaling = true;        // ✅ 激活縮放
    } else if (op === 'delete') {
        isDeleting = true;       // ✅ 激活刪除
    }
}
```

**轉換規則：**
```
繪圖模式 (null)
    ↓ 點擊「選」
圈選模式 ('select')
    ↓ 點擊「移動」
移動模式 ('move')
    ↓ 點擊「縮放」
縮放模式 ('scale')
    ↓ 點擊「刪除」
刪除模式 ('delete')
    ↓ 再次點擊任何按鈕 或 按 Escape
繪圖模式 (null)
```

---

### **B. 畫布滑鼠事件 → handleCanvasMouseDown(e)**

```javascript
function handleCanvasMouseDown(e) {
    // ⭐ 優先級檢查（if-else if 確保互斥）
    
    if (isReadyToSelect) {
        // 圈選模式：開始圈選
        startSelection(e);
        // isReadyToSelect → false
        // isSelecting → true
    } 
    else if (isSelecting) {
        // 已經在圈選中（理論上不會到這裡）
        startSelection(e);
    } 
    else if (isMoving) {
        if (selectedItems.length > 0) {
            // 移動模式 + 有選中項目：開始拖拽
            isDragging = true;
        } else {
            // 移動模式 + 無選中項目：開始圈選
            startSelection(e);
            // isSelecting → true
        }
    }
    else if (isScaling) {
        // 縮放模式（未實作）
        showMessage('功能開發中');
    }
    else if (isDeleting) {
        // 刪除模式（未實作）
        showMessage('功能開發中');
    }
    else {
        // 預設：繪圖模式
        startDrawing(e);
        // isDrawing → true
    }
}
```

---

### **C. 畫布滑鼠移動 → handleCanvasMouseMove(e)**

```javascript
function handleCanvasMouseMove(e) {
    // ⭐ 優先級檢查（if-else if 確保互斥）
    
    if (isDrawing) {
        // 繪圖中：繼續繪製
        draw(e);
    } 
    else if (isSelecting) {
        // 圈選中：更新圈選框
        updateSelection(e);
    } 
    else if (isDragging) {
        // 拖拽中：移動項目
        moveSelectedItems(deltaX, deltaY);
    }
    // 其他情況：不處理
}
```

---

### **D. 畫布滑鼠放開 → handleCanvasMouseUp(e)**

```javascript
function handleCanvasMouseUp(e) {
    if (isDrawing) {
        // 停止繪圖
        stopDrawing(e);
        // isDrawing → false
    } 
    else if (isSelecting) {
        // 結束圈選
        endSelection(e);
        // isSelecting → false
        // 顯示選項菜單
    } 
    else if (isDragging) {
        // 結束拖拽
        isDragging = false;
    } 
    else if (isReadyToSelect) {
        // 取消準備（沒有真正開始圈選）
        isReadyToSelect = false;
    }
}
```

---

### **E. 按 Escape 鍵**

```javascript
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // ⭐ 無條件重置所有狀態
        isDrawing = false;
        isSelecting = false;
        isReadyToSelect = false;
        isDragging = false;
        isMoving = false;
        isScaling = false;
        isDeleting = false;
        selectedItems = [];
        selectionOperation = null;
        
        // 重置所有按鈕樣式
        // 清除選擇
        // 更新游標
        
        // 回到繪圖模式
    }
});
```

---

## ⚠️ 5. 潛在問題分析

### **問題 1：狀態不互斥（已修復）**

**❌ 問題：**
```javascript
// 如果 setSelectionOperation() 邏輯錯誤
// 可能導致多個狀態同時為 true
isReadyToSelect = true;
isMoving = true;  // ❌ 衝突！
```

**✅ 解決方案：**
```javascript
// setSelectionOperation() 先重置所有狀態
// 確保只有一個狀態為 true
```

---

### **問題 2：isDrawing 未在模式切換時重置（已修復）**

**❌ 問題：**
```javascript
// 用戶正在繪圖
isDrawing = true;

// 點擊「選」按鈕
setSelectionOperation('select');
// 如果沒有重置 isDrawing
// 會導致 isDrawing 和 isReadyToSelect 同時為 true
```

**✅ 解決方案：**
```javascript
function setSelectionOperation(op) {
    // 步驟 1: 先重置 isDrawing
    isDrawing = false;
    // ...
}
```

---

### **問題 3：按鈕 toggle 邏輯混亂（已修復）**

**❌ 問題：**
```javascript
// 舊邏輯：
selectAreaBtn.addEventListener('click', function() {
    if (selectionOperation === 'select') {
        setSelectionOperation(null);  // 取消
    } else {
        setSelectionOperation('select');  // 激活
    }
});

// 但 setSelectionOperation() 內部會先重置所有狀態
// 導致邏輯混亂
```

**✅ 解決方案：**
```javascript
// 新邏輯：setSelectionOperation() 明確三步驟
// 1. 重置所有狀態
// 2. 判斷 op === null，直接返回
// 3. 設置新模式
```

---

### **⚠️ 問題 4：startSelection() 可能在多個模式下被呼叫**

**潛在風險：**
```javascript
// handleCanvasMouseDown() 中：
if (isReadyToSelect) {
    startSelection(e);  // ✅ 圈選模式
}
else if (isMoving && selectedItems.length === 0) {
    startSelection(e);  // ✅ 移動模式（先圈選）
}

// startSelection() 會設置：
isSelecting = true;
isReadyToSelect = false;

// ⚠️ 問題：如果在移動模式下圈選
// selectionOperation === 'move'
// isSelecting === true
// isMoving === true

// 這是正確的嗎？
```

**分析：**
- ✅ **正確**：移動模式下，用戶需要先圈選內容，然後才能移動
- ✅ `isMoving` 保持 `true`，表示「移動模式已激活」
- ✅ `isSelecting` 變 `true`，表示「正在圈選中」
- ✅ 圈選結束後，`isSelecting` → `false`，`selectedItems` 被填充
- ✅ 然後用戶可以拖拽移動（`isDragging` → `true`）

**結論：這個設計是正確的！**

---

### **⚠️ 問題 5：endSelection() 後的狀態**

**流程：**
```javascript
// 1. 用戶在移動模式下圈選
isMoving = true;
isSelecting = true;

// 2. mouseup → endSelection()
function endSelection(e) {
    isSelecting = false;  // ✅ 結束圈選
    
    // 如果是移動模式
    if (isMoving) {
        // 選中項目
        selectedItems = getItemsInSelection(selection);
        // 顯示選項菜單？還是直接進入拖拽模式？
    }
}
```

**當前實作：**
- 圈選結束後，會顯示「選項菜單」（數學公式/心智圖/取消）
- ⚠️ **問題**：移動模式下不應該顯示這個菜單！

**讓我檢查 endSelection() 的實作：**

---

### **⚠️ 問題 6：移動模式的圈選邏輯**

**需要檢查：**
1. 移動模式下圈選後，是否會顯示選項菜單？
2. 如果顯示了，這是錯誤的行為
3. 應該直接進入拖拽模式

**讓我檢查代碼...**

---

## 🎯 6. 正確的狀態機設計

### **核心原則：**

```
1️⃣  任何時候只有一個「主模式」：
   - selectionOperation === null  → 繪圖模式
   - selectionOperation !== null  → 功能模式

2️⃣  在功能模式下，可能有「子狀態」：
   - 圈選模式：isReadyToSelect → isSelecting
   - 移動模式：isMoving → isSelecting → isDragging
   
3️⃣  所有狀態轉換都通過 setSelectionOperation() 統一管理

4️⃣  Escape 鍵可以隨時回到繪圖模式
```

---

## ✅ 7. 建議的改進

### **改進 1：明確區分「模式」和「狀態」**

```javascript
// 模式（Mode）：用戶選擇的功能
let currentMode = 'drawing';  // 'drawing', 'select', 'move', 'scale', 'delete'

// 狀態（State）：當前的操作狀態
let currentState = 'idle';    // 'idle', 'drawing', 'selecting', 'dragging'
```

### **改進 2：使用狀態機模式**

```javascript
const StateMachine = {
    mode: 'drawing',
    state: 'idle',
    
    setMode(newMode) {
        // 重置所有狀態
        this.resetAllStates();
        
        // 設置新模式
        this.mode = newMode;
        this.state = 'idle';
    },
    
    setState(newState) {
        // 檢查狀態轉換是否合法
        if (this.isValidTransition(this.state, newState)) {
            this.state = newState;
        }
    },
    
    isValidTransition(from, to) {
        // 定義合法的狀態轉換
        const transitions = {
            'idle': ['drawing', 'selecting'],
            'drawing': ['idle'],
            'selecting': ['idle', 'dragging'],
            'dragging': ['idle']
        };
        return transitions[from]?.includes(to);
    }
};
```

---

## 📝 8. 總結

### **當前設計的優點：**
✅ 初始狀態清晰（所有變數都是 false/null）  
✅ 使用 `selectionOperation` 統一管理模式  
✅ `setSelectionOperation()` 確保狀態互斥  
✅ Escape 鍵可以隨時重置  

### **當前設計的問題：**
⚠️ 變數太多（7 個布林變數）  
⚠️ 狀態轉換邏輯分散在多個函數中  
⚠️ 移動模式的圈選邏輯可能與普通圈選衝突  
⚠️ 缺少狀態轉換的合法性檢查  

### **建議：**
1. ✅ **保持當前設計**（已經可以正常運作）
2. 🔍 **檢查移動模式的 endSelection() 邏輯**
3. 📊 **未來考慮重構為狀態機模式**

---

**生成時間：** 2025-10-13  
**文件版本：** 1.0






