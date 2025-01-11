require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');

const createRouter = require('./routes/api');
const WebSocketService = require('./services/WebSocketService');
const LeaderboardService = require('./services/LeaderboardService');

const leaderboardService = new LeaderboardService();
const wsService = new WebSocketService(leaderboardService);

const app = express();
const server = http.createServer(app);

// 优化系统资源配置
process.setMaxListeners(0); // 移除EventEmitter监听器数量限制
require('events').EventEmitter.defaultMaxListeners = 0;
process.env.UV_THREADPOOL_SIZE = 128; // 增加线程池大小
server.maxConnections = config.websocket.maxConnections;
server.keepAliveTimeout = 120000; // 120秒
server.headersTimeout = 125000; // 比keepAliveTimeout多5秒

// 初始化WebSocket
wsService.init(server, config);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 路由
app.use('/api', createRouter(app));
app.use((err, req, res, next) => {
    console.error('应用错误:', err);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// 数据库连接
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxPoolSize: 100,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            waitQueueTimeoutMS: 10000
        });
        console.log('MongoDB 连接成功');
    } catch (error) {
        console.error('MongoDB 连接失败:', error);
        process.exit(1);
    }
}
mongoose.connection.on('error', (err) => {
    console.error('MongoDB错误:', err);
});
mongoose.connection.on('disconnected', () => {
    console.error('尝试重连...');
    setTimeout(connectDB, 5000);
});

async function startServer() {
    try {
        await connectDB();

        const port = process.env.PORT || 3000;
        server.listen(port, () => {
            console.log(`服务器运行在端口 ${port}`);
            console.log('WebSocket 服务已启动');
        })
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 启动应用
startServer().catch(error => {
    console.error('应用启动失败:', error);
    process.exit(1);
});

app.set('leaderboardService', leaderboardService);
app.set('wsService', wsService); 