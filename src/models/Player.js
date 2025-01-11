const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    unique: true
  },
  gameId: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  currentScore: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建复合索引
playerSchema.index({ gameId: 1, playerId: 1 });

module.exports = mongoose.model('Player', playerSchema); 