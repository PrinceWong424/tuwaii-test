# 游戏排行榜系统设计文档

## 系统架构

### 技术栈选择
- Node.js + Express
- Redis：排行榜数据存储
- MongoDB：持久化存储
- Socket.io：WebSocket实时通信

### 数据存储
- **Redis**
  - 使用 Sorted Set 存储排行榜数据
  - 原因 IO性能好
  - Key 格式：`leaderboard:{gameId}`
  - Member：用户ID
  - Score：玩家分数
  
- **MongoDB**
  - 原因 基于BSON
  - Player 集合：存储玩家基本信息
  - Score 集合：存储历史分数记录
  - 索引设计：
    - Player: { gameId: 1, playerId: 1 }
    - Score: { gameId: 1, playerId: 1, timestamp: -1 }

### 测试方案(TODO)
- 通过脚本进行压力测试
- 验证得分写入和排名更新
- 测试WebSocket连接稳定性


### Tradeoff(TODOs)
- 得分写入方式细化
- 得分记录可以作为冷数据存放在ES中便于查询
- batch写入，队列写入
- 推送方式可以优化为批量定时推送
- 推送确认
- etc. 