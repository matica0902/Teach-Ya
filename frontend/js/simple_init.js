// UI CoreWork - 簡化啟動腳本
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing UI CoreWork...');
    
// UI CoreWork - 簡化啟動腳本
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing UI CoreWork...');
    
    try {
        // 移除載入文字
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.style.display = 'none';
        }
        
        // 顯示主要內容
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.display = 'block';
            mainContainer.style.opacity = '1';
        }
        
        // 初始化繪圖畫布
        const canvas = document.querySelector('#drawing-canvas');
        if (canvas) {
            console.log('Found canvas, initializing drawing...');
            
            // 設定畫布大小
            const container = canvas.parentElement;
            canvas.width = container.clientWidth || 800;
            canvas.height = container.clientHeight || 600;
            
            const ctx = canvas.getContext('2d');
            
            // 繪圖狀態
            let drawing = false;
            let lastX = 0;
            let lastY = 0;
            let currentTool = 'pen';
            let currentColor = '#2c3e50';
            let currentSize = 3;
            
            function draw(e) {
                if (!drawing) return;
                
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.lineWidth = currentSize;
                ctx.strokeStyle = currentColor;
                
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();
                
                [lastX, lastY] = [x, y];
            }
            
            function startDrawing(e) {
                drawing = true;
                const rect = canvas.getBoundingClientRect();
                [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
            }
            
            function stopDrawing() {
                drawing = false;
            }
            
            // 滑鼠事件
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);
            
            // 觸控事件（移動端支援）
            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                canvas.dispatchEvent(mouseEvent);
            });
            
            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                canvas.dispatchEvent(mouseEvent);
            });
            
            canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                const mouseEvent = new MouseEvent('mouseup', {});
                canvas.dispatchEvent(mouseEvent);
            });
            
            // 工具按鈕事件
            const toolButtons = document.querySelectorAll('.tool-btn');
            toolButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    toolButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentTool = btn.dataset.tool;
                    console.log('Selected tool:', currentTool);
                });
            });
            
            // 顏色選擇
            const colorPicker = document.querySelector('#color-picker');
            if (colorPicker) {
                colorPicker.addEventListener('change', (e) => {
                    currentColor = e.target.value;
                });
            }
            
            const colorSwatches = document.querySelectorAll('.color-swatch');
            colorSwatches.forEach(swatch => {
                swatch.addEventListener('click', () => {
                    currentColor = swatch.dataset.color;
                    if (colorPicker) colorPicker.value = currentColor;
                });
            });
            
            // 筆刷大小
            const brushSize = document.querySelector('#brush-size');
            const sizeDisplay = document.querySelector('.size-display');
            if (brushSize && sizeDisplay) {
                brushSize.addEventListener('input', (e) => {
                    currentSize = parseInt(e.target.value);
                    sizeDisplay.textContent = currentSize + 'px';
                });
            }
            
            // 清除畫布
            const clearButton = document.querySelector('#clear-canvas');
            if (clearButton) {
                clearButton.addEventListener('click', () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    console.log('Canvas cleared');
                });
            }
            
            // 儲存繪圖
            const saveButton = document.querySelector('#save-drawing');
            if (saveButton) {
                saveButton.addEventListener('click', () => {
                    const dataURL = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = 'ui-corework-drawing.png';
                    link.href = dataURL;
                    link.click();
                    console.log('Drawing saved');
                });
            }
            
            console.log('Drawing canvas initialized successfully');
        }
        
        // 初始化聊天區域
        const chatInput = document.querySelector('#chat-input');
        const chatMessages = document.querySelector('#chat-messages');
        const sendButton = document.querySelector('#send-message');
        
        function sendMessage() {
            const message = chatInput.value.trim();
            if (!message) return;
            
            const messageElement = document.createElement('div');
            messageElement.className = 'message user-message';
            messageElement.innerHTML = `
                <div class="message-content">
                    <strong>您:</strong> ${message}
                </div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            `;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            chatInput.value = '';
            
            // 模擬 AI 回應
            setTimeout(() => {
                const responses = [
                    '我看到您的訊息了！繪圖功能已經可以使用，請嘗試在左側畫布上繪圖。',
                    '太棒了！您可以使用不同的工具和顏色來創作。',
                    '如果需要清除畫布，可以點擊「清除」按鈕。',
                    '您的創意很棒！繼續畫吧！',
                    '可以試試調整筆刷大小，創造不同的線條效果。'
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                
                const aiMessage = document.createElement('div');
                aiMessage.className = 'message ai-message';
                aiMessage.innerHTML = `
                    <div class="message-content">
                        <strong>AI:</strong> ${randomResponse}
                    </div>
                    <div class="message-time">${new Date().toLocaleTimeString()}</div>
                `;
                chatMessages.appendChild(aiMessage);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 1000 + Math.random() * 2000);
        }
        
        if (chatInput && sendButton) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    sendMessage();
                }
            });
            
            sendButton.addEventListener('click', sendMessage);
            
            console.log('Chat functionality initialized');
        }
        
        // 範例卡片事件
        const exampleCards = document.querySelectorAll('.example-card');
        exampleCards.forEach(card => {
            card.addEventListener('click', () => {
                const example = card.dataset.example;
                console.log('Selected example:', example);
                
                // 在聊天中顯示選擇的範例
                if (chatMessages) {
                    const aiMessage = document.createElement('div');
                    aiMessage.className = 'message ai-message';
                    aiMessage.innerHTML = `
                        <div class="message-content">
                            <strong>AI:</strong> 您選擇了「${card.querySelector('h4').textContent}」範例！這是一個很好的設計參考。您可以嘗試在畫布上畫出類似的設計。
                        </div>
                        <div class="message-time">${new Date().toLocaleTimeString()}</div>
                    `;
                    chatMessages.appendChild(aiMessage);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            });
        });
        
        console.log('UI CoreWork initialization completed successfully');
        
    } catch (error) {
        console.error('Initialization error:', error);
        
        // 顯示錯誤訊息
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; max-width: 600px; margin: 0 auto; margin-top: 100px;">
                <h2 style="color: #e74c3c; margin-bottom: 20px;">🚨 初始化錯誤</h2>
                <p style="color: #666; margin-bottom: 30px;">應用程式初始化時發生錯誤，請重新載入頁面。</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                    <strong>錯誤詳情:</strong><br>
                    <code style="color: #e74c3c;">${error.message}</code>
                </div>
                <button onclick="location.reload()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                    🔄 重新載入
                </button>
            </div>
        `;
    }
});
});