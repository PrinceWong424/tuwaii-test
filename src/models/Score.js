const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true
  },
  gameId: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// 创建复合索引
scoreSchema.index({ gameId: 1, playerId: 1, timestamp: -1 });

module.exports = mongoose.model('Score', scoreSchema); 