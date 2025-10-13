# 🧠 心智圖功能開發計畫

## 📋 項目概述

在 DrawUp UI CoreWork 系統中添加圈選區域並創建動態心智圖的功能。基於數學公式功能的圈選工具，實現彈窗式心智圖編輯和畫布整合。

**開發版本**: v2.1-mindmap  
**前置依賴**: v2.0-math-formula (數學公式功能完成)  
**基於版本**: v1.0 (Git commit: 4baefdc)  
**開發開始**: 數學公式功能完成後  
**預計完成**: v2.1 階段性發布  

## 🎯 功能目標

### 核心功能
1. **重用圈選工具**: 基於數學公式功能的圈選系統
2. **心智圖彈窗編輯**: SimpleMindMap 在獨立窗口中編輯
3. **動態節點創建**: 圈選後創建根節點，支持動態添加子節點
4. **畫布整合選項**: 多種方式將心智圖結果整合回畫布
5. **非傳統編輯**: 支持事後修改任意節點，非一次性設定

### 使用情境
- **情境1**: 圈選空白區域 → 彈出輸入框 → 創建心智圖根節點 → 展開編輯
- **情境2**: 圈選現有內容 → 基於內容創建心智圖 → 動態擴展節點
- **情境3**: 心智圖編輯完成 → 選擇整合方式 → 插入/替換/獨立保存
- **情境4**: 點擊已插入的心智圖 → 重新開啟編輯器 → 修改後更新

## 🏗 技術架構

### 前端技術棧
- **SimpleMindMap**: 主要心智圖庫 (10.7k stars，功能完整)
- **圈選工具**: 重用數學公式功能開發的選擇系統
- **彈窗系統**: 模態對話框承載心智圖編輯器
- **SVG 轉 Canvas**: 將心智圖結果轉換為 Canvas 可用格式

### SimpleMindMap 核心API
```javascript
// 創建心智圖實例
const mindMap = new MindMap({
  el: document.getElementById('mindmap-container'),
  data: { data: { text: '根節點' }, children: [] }
});

// 動態添加節點
mindMap.execCommand('INSERT_NODE', true, [], { text: '新節點' });

// 事件監聽
mindMap.on('node_click', (node) => {
  // 節點點擊處理
});

// 導出數據
const data = mindMap.getData();
```

### 架構設計
```
現有Canvas系統
├─ 圈選工具層 (重用)
├─ 繪圖層 (現有)
└─ 背景層 (現有)

新增心智圖系統
├─ 彈窗編輯器 (SimpleMindMap)
├─ 整合處理模塊
└─ 心智圖對象管理
```

## 📝 開發階段

### 階段1: SimpleMindMap 集成準備
- [ ] 分析 SimpleMindMap API 和功能
- [ ] 設計彈窗編輯器界面
- [ ] 規劃與現有圈選工具的整合點
- [ ] 確定依賴庫版本和引入方式

### 階段2: 彈窗編輯器開發
- [ ] 創建模態對話框結構
  - 全屏/半屏編輯模式
  - 關閉、確認、取消按鈕
  - 響應式設計適配
- [ ] SimpleMindMap 容器初始化
  - 動態創建心智圖實例
  - 配置主題和布局選項
  - 設定初始數據結構

### 階段3: 圈選觸發整合
- [ ] 擴展圈選工具選單
  - 添加「創建心智圖」選項
  - 與數學公式選項並列顯示
  - 圖示和說明文字
- [ ] 圈選數據處理
  - 提取選中區域內容 (可選)
  - 創建初始節點數據
  - 傳遞給心智圖編輯器

### 階段4: 動態編輯功能
- [ ] 節點操作增強
  - 右鍵選單: 添加子節點、編輯、刪除
  - 拖拽節點重新排列
  - 節點樣式自定義
- [ ] 動態內容添加
  - 彈出輸入框機制
  - 支持多行文本輸入
  - 實時預覽節點變化
- [ ] 非傳統編輯支持
  - 隨時修改任意節點
  - 動態調整結構
  - 歷史記錄管理

### 階段5: 畫布整合方案
- [ ] 多種整合選項
  ```
  編輯完成後提供選擇:
  ├─ 插入畫布 (SVG格式，可縮放)
  ├─ 替換選中區域 (清除原內容)  
  ├─ 另存檔案 (JSON/PNG/SVG格式)
  └─ 取消操作 (不影響畫布)
  ```
- [ ] SVG 轉 Canvas 技術
  - SimpleMindMap 導出 SVG
  - 轉換為 Canvas 可用圖片
  - 保持縮放和清晰度
- [ ] 位置和尺寸控制
  - 根據選中區域調整大小
  - 支持手動調整位置
  - 保持比例縮放

### 階段6: 心智圖對象管理
- [ ] 已插入心智圖追蹤
  - 記錄心智圖在畫布中的位置
  - 保存原始數據便於重新編輯
  - 建立對象ID系統
- [ ] 重新編輯功能
  - 點擊已插入的心智圖
  - 重新開啟編輯器
  - 載入原始數據
  - 支持修改和更新

### 階段7: 高級功能
- [ ] 佈局選項
  - 水平展開 (預設)
  - 垂直展開
  - 放射狀佈局
  - 魚骨圖佈局
- [ ] 主題自定義
  - 多種預設主題
  - 顏色方案自定義
  - 字體和樣式設定
- [ ] 協作功能 (可選)
  - 心智圖數據同步
  - 多人編輯支持
  - 版本控制

### 階段8: 測試與優化
- [ ] 功能測試
  - 心智圖創建和編輯流程
  - 畫布整合各種情境
  - 重新編輯功能驗證
- [ ] 性能測試
  - 大型心智圖處理
  - SVG 轉換效率
  - 內存使用優化
- [ ] 用戶體驗測試
  - 編輯流程直觀性
  - 彈窗界面易用性
  - 與現有功能協調性

## 🛠 實現細節

### 彈窗編輯器結構
```html
<!-- 心智圖編輯器彈窗 -->
<div id="mindmap-modal" class="modal hidden">
  <div class="modal-content">
    <div class="modal-header">
      <h3>心智圖編輯器</h3>
      <button class="close-btn">×</button>
    </div>
    <div class="modal-body">
      <div id="mindmap-container"></div>
    </div>
    <div class="modal-footer">
      <button id="mindmap-cancel">取消</button>
      <button id="mindmap-confirm">完成編輯</button>
    </div>
  </div>
</div>
```

### 心智圖管理器
```javascript
class MindMapManager {
  constructor() {
    this.mindMapInstance = null;
    this.currentData = null;
    this.insertedMindMaps = []; // 已插入畫布的心智圖
  }
  
  // 開啟編輯器
  openEditor(initialData = null) {
    this.showModal();
    this.initializeMindMap(initialData);
  }
  
  // 初始化心智圖
  initializeMindMap(data) {
    const defaultData = data || {
      data: { text: '主題' },
      children: []
    };
    
    this.mindMapInstance = new MindMap({
      el: document.getElementById('mindmap-container'),
      data: defaultData,
      editable: true
    });
    
    this.setupEventListeners();
  }
  
  // 事件監聽設置
  setupEventListeners() {
    // 節點點擊添加子節點
    this.mindMapInstance.on('node_click', (node) => {
      this.showAddNodeDialog(node);
    });
  }
  
  // 顯示添加節點對話框
  showAddNodeDialog(parentNode) {
    const text = prompt('請輸入節點內容：');
    if (text) {
      this.mindMapInstance.execCommand('INSERT_CHILD_NODE', true, [], {
        text: text
      });
    }
  }
  
  // 完成編輯
  finishEditing() {
    const data = this.mindMapInstance.getData();
    this.showIntegrationOptions(data);
  }
  
  // 顯示整合選項
  showIntegrationOptions(data) {
    const options = [
      '插入到畫布', 
      '替換選中區域', 
      '另存檔案', 
      '取消'
    ];
    
    // 顯示選項選單
    this.showOptionsMenu(options, (choice) => {
      this.handleIntegrationChoice(choice, data);
    });
  }
  
  // 處理整合選擇
  handleIntegrationChoice(choice, data) {
    switch(choice) {
      case '插入到畫布':
        this.insertToCanvas(data);
        break;
      case '替換選中區域':
        this.replaceSelectedArea(data);
        break;
      case '另存檔案':
        this.exportMindMap(data);
        break;
    }
    this.closeModal();
  }
  
  // 插入到畫布
  async insertToCanvas(data) {
    // 1. 將心智圖導出為SVG
    const svg = this.mindMapInstance.getSvg();
    
    // 2. 轉換為Canvas可用圖片
    const image = await this.svgToImage(svg);
    
    // 3. 插入到畫布指定位置
    this.insertImageToCanvas(image);
    
    // 4. 記錄心智圖對象
    this.trackInsertedMindMap(data, image);
  }
}
```

### 圈選工具擴展
```javascript
// 擴展現有圈選工具
class ExtendedSelectionTool extends SelectionTool {
  showActionMenu() {
    const actions = [
      { 
        label: '轉數學公式', 
        icon: '∫', 
        action: 'convertToMath' 
      },
      { 
        label: '創建心智圖', 
        icon: '🧠', 
        action: 'createMindMap' 
      },
      { 
        label: '基本編輯', 
        icon: '✏️', 
        action: 'basicEdit' 
      }
    ];
    
    this.displayFloatingMenu(actions);
  }
  
  handleCreateMindMap() {
    // 提取選中區域內容 (可選)
    const selectedContent = this.extractSelectedContent();
    
    // 創建初始節點數據
    const initialData = this.createInitialMindMapData(selectedContent);
    
    // 開啟心智圖編輯器
    mindMapManager.openEditor(initialData);
  }
}
```

## 🧪 測試計畫

### 單元測試
- [ ] SimpleMindMap 初始化和配置
- [ ] 節點添加、編輯、刪除操作
- [ ] 數據導出和格式轉換
- [ ] SVG 轉 Canvas 圖片轉換

### 集成測試
- [ ] 圈選觸發心智圖編輯流程
- [ ] 編輯器與畫布的數據傳遞
- [ ] 各種整合選項的完整流程
- [ ] 重新編輯已插入心智圖功能

### 用戶體驗測試
- [ ] 彈窗編輯器易用性
- [ ] 動態節點添加流程
- [ ] 心智圖佈局和視覺效果
- [ ] 與數學公式功能的協調使用

### 性能測試
- [ ] 大型心智圖 (>100節點) 處理
- [ ] 彈窗開啟和關閉速度
- [ ] SVG 轉換內存使用
- [ ] 多個心智圖同時存在的性能

## 📈 成功指標

### 功能指標
- ✅ 圈選後能順利開啟心智圖編輯器
- ✅ 支持動態添加和編輯節點
- ✅ 提供多種畫布整合選項
- ✅ 重新編輯功能正常工作
- ✅ 與數學公式功能無衝突

### 性能指標
- ✅ 編輯器開啟時間 <2s
- ✅ 節點操作響應時間 <200ms
- ✅ SVG 轉換時間 <3s
- ✅ 支持至少50個節點的心智圖

### 用戶體驗指標
- ✅ 編輯流程直觀易懂
- ✅ 彈窗界面響應式設計良好
- ✅ 整合選項清晰明確
- ✅ 錯誤處理友好

## 🔗 與數學公式功能的關係

### 共用組件
- **圈選工具**: 完全重用，擴展選單選項
- **模式管理**: 統一的工具切換系統
- **Canvas 操作**: 重用區域處理和圖片插入邏輯

### 差異化功能
- **處理流程**: 數學公式直接替換，心智圖提供選項
- **編輯界面**: 數學公式在後端處理，心智圖在前端編輯器
- **結果格式**: 數學公式為圖片，心智圖為可縮放SVG

### 協同效果
用戶可以在同一個畫布上：
1. 上傳圖片作為背景
2. 手繪註解和公式
3. 圈選數學內容轉為標準公式
4. 圈選區域創建心智圖進行思維整理
5. 所有內容融合為完整的學習筆記

## 🔄 未來擴展計畫

### v2.2 高級功能
- [ ] 心智圖模板系統
- [ ] 批量節點操作
- [ ] 心智圖間的連接線
- [ ] 多媒體節點支持 (圖片、連結)

### v2.3 協作功能
- [ ] 實時協作編輯
- [ ] 心智圖分享功能
- [ ] 評論和標註系統
- [ ] 版本歷史管理

### v2.4 AI 增強
- [ ] AI 輔助節點生成
- [ ] 智能佈局建議
- [ ] 內容自動分類
- [ ] 思維導圖優化建議

## 📚 參考資料

- [SimpleMindMap 官方文檔](https://wanglin2.github.io/mind-map-docs/)
- [SimpleMindMap API 參考](https://wanglin2.github.io/mind-map-docs/api/)
- [SVG 轉 Canvas 技術](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas)
- [模態對話框最佳實踐](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/dialog_role)

---

**文件版本**: v1.0  
**最後更新**: 2025年10月8日  
**依賴關係**: 需要先完成數學公式功能 (v2.0-math-formula)  
**下次更新**: 數學公式功能完成後開始此階段開發