const express = require('express');
const Activity = require('../models/Activity');

const router = express.Router();

// Log activity (without auth for now)
router.post('/', async (req, res) => {
  try {
    const { website, domain, startTime, endTime, duration, category } = req.body;
    
    const activity = new Activity({
      website,
      domain,
      startTime,
      endTime,
      duration,
      category
    });

    await activity.save();
    res.status(201).json(activity);
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activities (without auth for now)
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ startTime: -1 });
    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get productivity report (without auth for now)
router.get('/report', async (req, res) => {
  try {
    const report = await Activity.aggregate([
      {
        $group: {
          _id: '$category',
          totalTime: { $sum: '$duration' },
          sessions: { $sum: 1 }
        }
      }
    ]);

    res.json(report);
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;