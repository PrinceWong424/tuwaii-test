# 游戏排行榜系统设计文档

## 系统架构

### 技术栈选择
- Node.js + Express
- Redis：排行榜数据存储
- MongoDB：持久化存储
- Socket.io：WebSocket实时通信

### 核心组件设计

#### 1. 数据存储层
- **Redis 存储设计**
  - 使用 Sorted Set 存储排行榜数据
  - Key 格式：`leaderboard:{gameId}`
  - Member：用户ID
  - Score：玩家分数
  
- **MongoDB 存储设计**
  - Player 集合：存储玩家基本信息
  - Score 集合：存储历史分数记录
  - 索引设计：
    - Player: { gameId: 1, playerId: 1 }
    - Score: { gameId: 1, playerId: 1, timestamp: -1 }
