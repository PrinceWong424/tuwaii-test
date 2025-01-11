const Player = require('../models/Player');
const Score = require('../models/Score');
const redis = require('redis');

class LeaderboardService {
  constructor() {
    this.redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        connectTimeout: 20000,
        keepAlive: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            return new Error('Redis 重连失败');
          }
          return Math.min(retries * 200, 5000);
        }
      },
      password: process.env.REDIS_PASSWORD,
      database: 0,
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis 错误:', err);
    });

    this.connect();
  }

  async connect() {
    try {
      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }
    } catch (error) {
      console.error('Redis 连接失败:', error);
      throw error;
    }
  }

  async updateScore(gameId, playerId, score, nickname = '') {
    try {
      if (!this.redisClient.isOpen) {
        await this.connect();
      }
      const leaderboardKey = `leaderboard:${gameId}`;
      
      const multi = this.redisClient.multi();
      multi.zAdd(leaderboardKey, [{
        score: Number(score),
        value: playerId
      }]);
      await multi.exec();

      // 获取新排名
      const newRank = await this.redisClient.zRank(leaderboardKey, playerId, { REV: true });

      await Player.findOneAndUpdate(
        { playerId, gameId },
        { 
          $set: { 
            currentScore: score,
            lastUpdated: new Date(),
            nickname: nickname || playerId
          }
        },
        { 
          upsert: true,
          lean: true,
          new: true
        }
      );

      await Score.create({
        playerId,
        gameId,
        score,
        timestamp: new Date()
      });

      return {
        rank: newRank + 1,
      };
    } catch (error) {
      console.error('更新分数错误:', error);
      throw new Error(`更新分数失败 gameId:${gameId}, playerId:${playerId}, score:${score} - ${error.message}`);
    }
  }

  async getLeaderboard(gameId, page = 1, limit = 50) {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      const leaderboardKey = `leaderboard:${gameId}`;

      const leaderboardData = await this.redisClient.zRangeWithScores(
        leaderboardKey,
        start,
        end,
        { REV: true }
      );

      // 获取总玩家数
      const total = await this.redisClient.zCard(leaderboardKey);
      const leaderboard = leaderboardData.map((item, index) => ({
        rank: start + index + 1,
        playerId: item.value,
        score: Number(item.score)
      }));

      // 获取玩家详细信息
      const playerIds = leaderboard.map(item => item.playerId);
      const players = await Player.find({
        gameId,
        playerId: { $in: playerIds }
      }).lean();

      leaderboard.forEach(item => {
        const player = players.find(p => p.playerId === item.playerId) || {};
        item.nickname = player.nickname || item.playerId;
      });

      return {
        leaderboard,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取排行榜错误:', error);
      throw error;
    }
  }
}

module.exports = LeaderboardService; 