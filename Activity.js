const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  website: { type: String, required: true },
  domain: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number },
  category: { type: String, enum: ['productive', 'neutral', 'distracting'], default: 'neutral' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);