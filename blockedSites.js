const express = require('express');
const BlockedSite = require('../models/BlockedSite');

const router = express.Router();

// Get blocked sites (without auth for now)
router.get('/', async (req, res) => {
  try {
    const blockedSites = await BlockedSite.find();
    res.json(blockedSites);
  } catch (error) {
    console.error('Get blocked sites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add blocked site (without auth for now)
router.post('/', async (req, res) => {
  try {
    const { domain, category, blockDuration } = req.body;

    const blockedSite = new BlockedSite({
      domain,
      category,
      blockDuration
    });

    await blockedSite.save();
    res.status(201).json(blockedSite);
  } catch (error) {
    console.error('Block site error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete blocked site (without auth for now)
router.delete('/:id', async (req, res) => {
  try {
    await BlockedSite.findByIdAndDelete(req.params.id);
    res.json({ message: 'Site unblocked successfully' });
  } catch (error) {
    console.error('Unblock site error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;