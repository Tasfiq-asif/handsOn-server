const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const userModel = require('../models/userModel');

// Get current user
router.get('/user', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await userModel.getUserProfile(userId);
    
    if (!profile) {
      return res.status(200).json({
        user: {
          id: req.user.id,
          email: req.user.email,
          profile_complete: false
        }
      });
    }
    
    res.status(200).json({ 
      user: {
        ...profile,
        profile_complete: true
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 