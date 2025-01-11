const WebSocketService = require('../services/WebSocketService');
const LeaderboardService = require('../services/LeaderboardService');

class WebSocketController {
  async handleConnection(socket) {
    console.log('新客户端连接:', socket.id);
  }

  // 处理认证
  async handleAuthentication(socket, data) {
    try {
      const { gameId, playerId } = data;
      await socket.join(`game:${gameId}`);

      // 获取并发送当前排名
      const rank = await LeaderboardService.getPlayerRank(gameId, playerId);
      socket.emit('rank_update', { rank });

      return true;
    } catch (error) {
      console.error('认证错误:', error);
      socket.emit('error', { message: error.message });
      return false;
    }
  }

  // 处理断开连接
  async handleDisconnection(socket) {
    try {
      // 清理连接信息
      const connection = WebSocketService.connections.get(socket.id);
      if (connection) {
        const { gameId } = connection;
        await socket.leave(`game:${gameId}`);
        WebSocketService.connections.delete(socket.id);
      }
    } catch (error) {
      console.error('断开连接处理错误:', error);
    }
  }

  // 处理重连
  async handleReconnection(socket, data) {
    try {
      const { gameId, playerId, lastUpdateTime } = data;
      // 重新认证
      const authenticated = await this.handleAuthentication(socket, { gameId, playerId });
      if (!authenticated) {
        return;
      }

      // 获取并发送当前排名
      const rank = await LeaderboardService.getPlayerRank(gameId, playerId);
      socket.emit('rank_update', { rank });

    } catch (error) {
      console.error('重连处理错误:', error);
      socket.emit('error', { message: '重连失败' });
    }
  }
}

module.exports = new WebSocketController(); 