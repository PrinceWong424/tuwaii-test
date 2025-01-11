const socketIO = require('socket.io');
const config = require('../config/config');

class WebSocketService {
  constructor(leaderboardService) {
    this.io = null;
    this.connections = new Map();
    this.connectionCount = 0;
    this.MAX_CONNECTIONS = 10000;
    this.leaderboardService = leaderboardService;
  }

  init(server, config) {
    this.MAX_CONNECTIONS = config.websocket.maxConnections || 10000;
    
    this.io = socketIO(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      ...config.websocket
    });

    this.setupEventHandlers();
    console.log('WebSocket 服务初始化完成');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('新客户端连接:', socket.id);

      socket.on('error', (error) => {
        console.error('Socket 错误:', error);
        this.handleSocketError(socket, error);
      });

      // 超时处理
      const connectionTimeout = setTimeout(() => {
        if (!this.connections.has(socket.id)) {
          console.log('连接超时，关闭 socket:', socket.id);
          socket.disconnect(true);
        }
      }, config.websocket.connectTimeout);

      // 订阅
      socket.on('subscribe_leaderboard', async (data) => {
        try {
          const { gameId, playerId} = data;
          console.log(`客户端 ${socket.id} 订阅游戏 ${gameId} 的排行榜`);        
          // 加入房间
          await socket.join(`game:${gameId}`);
          this.connections.set(socket.id, { gameId, playerId });
          
          // 发送初始排行榜数据
          const topPlayers = await this.leaderboardService.getLeaderboard(gameId, 1, 20);
          socket.emit('leaderboard_update', { topPlayers: topPlayers.leaderboard });
        } catch (error) {
          console.error('订阅排行榜错误:', error);
          this.handleSocketError(socket, error);
        }
      });

      // 取消订阅
      socket.on('unsubscribe_leaderboard', async (data) => {
        try {
          const { gameId, playerId } = data;
          if (gameId) {
            await socket.leave(`game:${gameId}`);
            this.connections.delete(socket.id);
          }
        } catch (error) {
          console.error('取消订阅错误:', error);
          this.handleSocketError(socket, error);
        }
      });

      // 处理断开连接
      socket.on('disconnect', () => {
        clearTimeout(connectionTimeout);
        this.connectionCount--;
        const connection = this.connections.get(socket.id);
        if (connection) {
          this.connections.delete(socket.id);
        }
      });
    });
  }

  handleSocketError(socket, error) {
    console.error('Socket 错误:', error);
    socket.emit('error', { 
      message: error.message || '发生未知错误',
      code: error.code || 500,
      timestamp: Date.now()
    });
    
    if (error.fatal) {
      socket.disconnect(true);
    }
  }

  // 广播排行榜
  async broadcastLeaderboardUpdate(gameId) {
    try {
      console.log(`广播排行榜更新:${gameId}`);
      const result = await this.leaderboardService.getLeaderboard(gameId, 1, 20);
      console.log('广播数据:', result.leaderboard);
      this.io.to(`game:${gameId}`).emit('leaderboard_update', { 
        topPlayers: result.leaderboard,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('广播排行榜更新错误:', error);
    }
  }
}

module.exports = WebSocketService; 