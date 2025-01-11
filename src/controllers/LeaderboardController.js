class LeaderboardController {
  constructor(app) {
    this.leaderboardService = app.get('leaderboardService');
    this.wsService = app.get('wsService');
  }

  // 更新玩家分数
  async updateScore(req, res) {
    try {
      const { gameId, playerId, score, nickname } = req.body;
      console.log('开始更新分数:', { gameId, playerId, score, nickname });
      
      // 更新分数
      const result = await this.leaderboardService.updateScore(gameId, playerId, score, nickname);

      // 广播更新
      await this.wsService.broadcastLeaderboardUpdate(gameId);
      res.json({
        success: true,
        message: '分数更新成功',
        data: {
          rank: result.rank,
        }
      });
    } catch (error) {
      console.error('更新分数错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      });
    }
  }

  // 获取排行榜
  async getLeaderboard(req, res) {
    try {
      const { gameId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100); // 限制最大条数为100

      console.log('获取排行榜:', { gameId, page, limit });

      const result = await this.leaderboardService.getLeaderboard(gameId, page, limit);

      console.log('获取排行榜成功:', { 
        total: result.pagination.total,
        page: result.pagination.page,
        count: result.leaderboard.length 
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('获取排行榜错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      });
    }
  }
}

module.exports = LeaderboardController; 