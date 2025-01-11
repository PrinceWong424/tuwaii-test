require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/leaderboard'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  },
  websocket: {
    pingTimeout: 30000,
    pingInterval: 10000,
    transports: ['websocket'],
    maxHttpBufferSize: 1e6,
    connectTimeout: 45000,
    maxPayload: 1e6,
    maxConnections: 10000
  }
}; 