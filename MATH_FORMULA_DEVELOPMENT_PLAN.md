# 🔬 數學公式功能開發計畫

## 📋 項目概述

在 DrawUp UI CoreWork 系統中添加圈選區域並轉換為標準數學公式的功能。

**開發版本**: v2.0-math-formula  
**基於版本**: v1.0 (Git commit: 4baefdc)  
**開發日期**: 2025年10月8日  
**預計完成**: 階段性開發，先完成數學公式，後續再開發心智圖功能  

## 🎯 功能目標

### 核心功能
1. **圈選工具**: 在畫布上拖拽選擇矩形區域
2. **數學識別**: 使用 Gemini 2.5 Flash 識別選中區域的數學內容
3. **公式渲染**: 使用 KaTeX 將識別結果渲染為標準數學公式
4. **區域替換**: 將渲染結果精確替換回原始位置
5. **操作模式**: 支援繪圖模式和圈選模式的切換

### 使用情境
- **情境1**: 圈選後轉數學函數 - 將手寫或圖片中的數學內容轉為標準公式
- **情境2**: 手寫數學公式識別 - OCR識別手寫公式並標準化
- **情境3**: 圈選區域編輯 - 基本的縮放、移動、旋轉等編輯功能

## 🏗 技術架構

### 前端技術棧
- **Canvas API**: 現有繪圖功能 + 新增圈選工具
- **KaTeX**: 數學公式渲染庫 (CDN引入)
- **html2canvas**: HTML轉圖片工具 (用於將公式插回Canvas)
- **Vanilla JavaScript**: 保持現有架構，不引入框架

### 後端整合
- **Gemini 2.5 Flash**: 重用現有AI分析API，添加數學公式專用提示詞
- **FastAPI**: 現有後端架構，添加數學公式處理端點
- **圖片處理**: PIL用於處理選中區域的圖片數據

### 架構設計
```
┌─────────────────────────────────────┐
│         UI 控制層                    │  ← 模式切換按鈕
├─────────────────────────────────────┤
│      公式渲染層 (DOM)                │  ← KaTeX渲染結果
├─────────────────────────────────────┤
│      圈選工具層 (Canvas)             │  ← 矩形選擇工具
├─────────────────────────────────────┤
│       繪圖層 (Canvas)                │  ← 現有繪圖功能
├─────────────────────────────────────┤
│      背景層 (Canvas)                 │  ← 上傳的圖片
└─────────────────────────────────────┘
```

## 📝 開發階段

### 階段1: 分析現有架構 ✅ (已完成Git保存)
- [x] 檢查 ultra_simple.html 的Canvas實現
- [x] 了解現有繪圖功能架構
- [x] 創建穩定版本備份 (commit: 4baefdc)

### 階段2: 基礎設施準備 ✅ (已完成)
- [x] 添加 KaTeX CDN 依賴 ✅ (已存在於 ultra_simple.html)
- [x] 添加 html2canvas CDN 依賴 ✅ (已存在於 ultra_simple.html)
- [x] 分析現有Canvas事件處理機制 ✅ (已實作圈選功能)
- [x] 設計模式切換系統 ✅ (繪圖模式 ↔ 圈選模式)

### 階段3: 圈選工具開發 ✅ (已完成)
- [x] 實現矩形選擇工具 ✅
  - 滑鼠拖拽選擇區域
  - 視覺回饋 (虛線矩形)
  - 選擇完成事件
- [x] 添加圈選模式切換 ✅
  - UI按鈕: "🖌️ 繪圖模式" | "🔲 圈選模式"
  - 事件處理隔離
  - 視覺指示當前模式

### 階段4: 後端API擴展 ✅ (已完成)
- [x] 添加數學公式分析端點 ✅
  - 路由: `POST /api/analyze-math` ✅
  - 專用數學公式提示詞 ✅
  - LaTeX格式輸出 ✅
- [x] 優化圖片區域處理 ✅
  - 接收選中區域座標 ✅
  - 提取局部圖片數據 ✅
  - 白色背景處理提高識別準確度 ✅

### 階段5: 公式渲染系統 ✅ (已完成)
- [x] KaTeX集成 ✅
  - LaTeX字符串渲染
  - 錯誤處理機制
  - 樣式自定義
- [x] HTML轉Canvas ✅
  - html2canvas使用
  - 透明背景處理
  - 尺寸適配

### 階段6: 區域替換功能 ✅ (基本完成)
- [x] 精確區域替換 ✅
  - 清除選中區域
  - 插入渲染結果
  - 座標系統轉換
- [⚠️] 預覽確認機制 (待優化)
  - 顯示處理前後對比
  - 用戶確認/取消選項
  - 撤銷功能

### 階段7: 用戶體驗優化
- [ ] 浮動工具選單
  - 圈選完成後顯示選項
  - "轉數學公式" | "取消" 選項
  - 響應式設計
- [ ] 加載狀態指示
  - AI處理進度顯示
  - 渲染過程提示
  - 錯誤處理提示

### 階段8: 測試與優化
- [ ] 功能測試
  - 各種數學公式類型測試
  - 邊界情況處理
  - 性能測試
- [ ] 用戶體驗測試
  - 操作流程順暢性
  - 視覺效果檢查
  - 錯誤恢復機制

## 🛠 實現細節

### 圈選工具實現
```javascript
class SelectionTool {
  constructor(canvas) {
    this.canvas = canvas;
    this.isSelecting = false;
    this.startPoint = null;
    this.endPoint = null;
    this.selectionRect = null;
  }
  
  enable() {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
  }
  
  disable() {
    // 移除事件監聽器
  }
}
```

### 模式管理系統
```javascript
class ModeManager {
  constructor() {
    this.currentMode = 'draw'; // 'draw' | 'select'
    this.tools = {
      draw: new DrawingTool(),
      select: new SelectionTool()
    };
  }
  
  switchMode(newMode) {
    this.tools[this.currentMode].disable();
    this.currentMode = newMode;
    this.tools[this.currentMode].enable();
    this.updateUI();
  }
}
```

### 數學公式處理流程
```javascript
class MathFormulaProcessor {
  async processSelection(selectionArea) {
    // 1. 提取選中區域圖片
    const imageData = this.extractSelectionImage(selectionArea);
    
    // 2. 發送給後端分析
    const analysis = await this.analyzeMath(imageData);
    
    // 3. 使用KaTeX渲染
    const renderedFormula = this.renderLatex(analysis.latex);
    
    // 4. 轉換為Canvas圖片
    const formulaImage = await this.htmlToImage(renderedFormula);
    
    // 5. 替換選中區域
    this.replaceCanvasArea(selectionArea, formulaImage);
  }
}
```

## 🧪 測試計畫

### 單元測試
- [ ] 圈選工具座標計算
- [ ] 模式切換邏輯
- [ ] 圖片提取功能
- [ ] LaTeX渲染結果

### 集成測試  
- [ ] 完整的圈選→分析→渲染→替換流程
- [ ] 與現有繪圖功能的相容性
- [ ] 不同圖片格式和尺寸的處理

### 用戶測試
- [ ] 各種手寫數學公式識別準確度
- [ ] 操作流程直觀性
- [ ] 性能表現 (特別是大圖片處理)

## 📈 成功指標

### 功能指標
- ✅ 圈選工具正常工作，能精確選擇區域
- ✅ Gemini識別數學公式準確率 >80%
- ✅ KaTeX渲染結果視覺效果良好
- ✅ 區域替換無位置偏移問題

### 性能指標
- ✅ 圈選響應時間 <100ms
- ✅ AI分析處理時間 <5s
- ✅ 公式渲染時間 <1s
- ✅ 總體流程完成時間 <10s

### 用戶體驗指標
- ✅ 操作步驟簡單直觀 (3步內完成)
- ✅ 錯誤處理友好
- ✅ 可以撤銷操作
- ✅ 不影響現有繪圖功能

## 🔄 下一階段計畫

完成數學公式功能後，將開始心智圖功能開發：

### 心智圖功能 (v2.1-mindmap)
- 重用圈選工具
- 集成 SimpleMindMap
- 彈窗編輯器
- 結果插入畫布選項

### 高級功能 (v2.2-advanced)
- 圈選區域的基本編輯功能 (縮放、旋轉、移動)
- 批量處理
- 歷史記錄管理
- 自定義數學公式樣式

## 📚 參考資料

- [KaTeX Documentation](https://katex.org/docs/api.html)
- [html2canvas Documentation](https://html2canvas.hertzen.com/)
- [Canvas API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

**文件版本**: v1.0  
**最後更新**: 2025年10月8日  
**下次更新**: 階段完成後更新進度和問題記錄