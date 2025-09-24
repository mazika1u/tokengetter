const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS設定
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || '*',
    credentials: true
}));

app.use(express.json());

// ルート確認
app.get('/', (req, res) => {
    res.json({ 
        status: 'Server is running', 
        message: 'Discord Proxy Server',
        endpoints: ['POST /api/login', 'GET /api/status']
    });
});

// ステータス確認
app.get('/api/status', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// DiscordログインAPI
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt for:', email);
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'メールアドレスとパスワードが必要です' 
            });
        }

        // DiscordログインAPIを呼び出し
        const discordResponse = await axios.post('https://discord.com/api/v9/auth/login', {
            login: email,
            password: password,
            undelete: false,
            login_source: null,
            gift_code_sku_id: null
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                'Origin': 'https://discord.com',
                'Referer': 'https://discord.com/login'
            },
            timeout: 10000
        });

        if (discordResponse.data.token) {
            console.log('Login successful for:', email);
            
            // 成功レスポンス
            res.json({ 
                success: true, 
                token: discordResponse.data.token,
                message: 'ログイン成功'
            });
            
        } else {
            console.log('Login failed - no token for:', email);
            res.json({ 
                success: false, 
                error: 'トークンが取得できませんでした' 
            });
        }
        
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        
        let errorMessage = 'ログインに失敗しました';
        
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            if (status === 400) {
                errorMessage = data.message || 'リクエストが無効です';
            } else if (status === 401) {
                errorMessage = 'メールアドレスまたはパスワードが間違っています';
            } else if (status === 403) {
                errorMessage = 'アカウントがロックされています';
            } else if (status === 429) {
                errorMessage = 'レート制限です。しばらく待ってから再試行してください';
            } else {
                errorMessage = `サーバーエラー: ${status}`;
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = '接続がタイムアウトしました';
        }
        
        res.status(error.response?.status || 500).json({
            success: false,
            error: errorMessage
        });
    }
});

// エラーハンドリング
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        success: false, 
        error: '内部サーバーエラー' 
    });
});

// 404ハンドリング
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'エンドポイントが見つかりません' 
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Discord Proxy Server running on port ${PORT}`);
    console.log(`📍 Endpoint: http://localhost:${PORT}`);
    console.log(`🌐 Allowed origins: ${process.env.ALLOWED_ORIGINS || 'All'}`);
});
