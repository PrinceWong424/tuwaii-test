const express = require('express');
const router = express.Router();
const LeaderboardController = require('../controllers/LeaderboardController');

function createRouter(app) {
    const leaderboardController = new LeaderboardController(app);

    // 更新玩家分数
    router.post('/scores/update', leaderboardController.updateScore.bind(leaderboardController));
    // 获取排行榜
    router.get('/leaderboard/:gameId', leaderboardController.getLeaderboard.bind(leaderboardController));

    return router;
}

module.exports = createRouter; 