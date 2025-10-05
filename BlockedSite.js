const mongoose = require('mongoose');

const blockedSiteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  domain: { type: String, required: true },
  category: { type: String, enum: ['social', 'entertainment', 'shopping', 'other'] },
  blockDuration: { type: String, default: 'always' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BlockedSite', blockedSiteSchema);