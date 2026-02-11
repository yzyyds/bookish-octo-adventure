// DeepSeek API配置
const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

// 从localStorage获取API密钥
function getApiKey() {
    return localStorage.getItem('deepseek_api_key');
}

// 保存API密钥到localStorage
function saveApiKey(key) {
    localStorage.setItem('deepseek_api_key', key);
}

// 清除API密钥
function clearApiKey() {
    localStorage.removeItem('deepseek_api_key');
    document.getElementById('apiKey').value = '';
    showSystemMessage('API密钥已清除，请重新输入。');
}

// 显示系统消息
function showSystemMessage(text) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.innerHTML = `
        <div class="avatar"><i class="fas fa-info-circle"></i></div>
        <div class="content">${text}</div>
    `;
    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
}

// 显示消息
function showMessage(content, isUser = false) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    const avatarIcon = isUser ? 'fas fa-user' : 'fas fa-robot';
    const messageContent = formatMessage(content);
    
    messageDiv.innerHTML = `
        <div class="avatar"><i class="${avatarIcon}"></i></div>
        <div class="content">${messageContent}</div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
}

// 格式化消息内容（支持Markdown简单语法）
function formatMessage(content) {
    // 处理代码块
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || ''}">${escapeHtml(code)}</code></pre>`;
    });
    
    // 处理行内代码
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 处理换行
    content = content.replace(/\n/g, '<br>');
    
    // 处理粗体
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return content;
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 滚动到底部
function scrollToBottom() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 显示打字机效果
function showTypingIndicator() {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = 'typing-indicator';
    messageDiv.innerHTML = `
        <div class="avatar"><i class="fas fa-robot"></i></div>
        <div class="content">
            正在思考...
            <span class="typing"></span>
            <span class="typing"></span>
            <span class="typing"></span>
        </div>
    `;
    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
}

// 隐藏打字机效果
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// 发送消息到DeepSeek API
async function sendMessageToDeepSeek(message) {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        showSystemMessage('请先输入并保存API密钥！');
        return null;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: 'user',
                        content: message
                    }
                ],
                stream: false,
                max_tokens: 2048
            })
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error('API调用错误:', error);
        showSystemMessage(`错误: ${error.message}`);
        return null;
    }
}

// 处理发送消息
async function handleSendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 显示用户消息
    showMessage(message, true);
    
    // 清空输入框
    input.value = '';
    adjustTextareaHeight();
    
    // 显示打字机效果
    showTypingIndicator();
    
    // 发送到API
    const response = await sendMessageToDeepSeek(message);
    
    // 隐藏打字机效果
    hideTypingIndicator();
    
    // 显示AI回复
    if (response) {
        showMessage(response, false);
    }
}

// 调整文本区域高度
function adjustTextareaHeight() {
    const textarea = document.getElementById('messageInput');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// 清空聊天记录
function clearChat() {
    if (confirm('确定要清空所有聊天记录吗？')) {
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = '';
        showSystemMessage('聊天记录已清空，请开始新的对话吧！');
    }
}

// 开始新对话
function startNewChat() {
    const messagesDiv = document.getElementById('messages');
    // 保留第一条系统消息
    const systemMessage = messagesDiv.querySelector('.system');
    messagesDiv.innerHTML = '';
    if (systemMessage) {
        messagesDiv.appendChild(systemMessage);
    } else {
        showSystemMessage('开始新的对话！');
    }
}

// 初始化
function init() {
    // 加载保存的API密钥
    const savedKey = getApiKey();
    if (savedKey) {
        document.getElementById('apiKey').value = savedKey;
    }
    
    // 事件监听器
    document.getElementById('sendButton').addEventListener('click', handleSendMessage);
    document.getElementById('saveKey').addEventListener('click', () => {
        const key = document.getElementById('apiKey').value.trim();
        if (key) {
            saveApiKey(key);
            showSystemMessage('API密钥已保存！');
        } else {
            showSystemMessage('请输入有效的API密钥。');
        }
    });
    
    document.getElementById('clearKey').addEventListener('click', clearApiKey);
    document.getElementById('clearChat').addEventListener('click', clearChat);
    document.getElementById('newChat').addEventListener('click', startNewChat);
    
    // 输入框事件
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('input', adjustTextareaHeight);
    
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // 调整初始高度
    adjustTextareaHeight();
    
    // 显示欢迎消息
    if (!savedKey) {
        showSystemMessage('欢迎使用DeepSeek AI助手！请先输入你的API密钥。你可以在DeepSeek官网申请API密钥。');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);