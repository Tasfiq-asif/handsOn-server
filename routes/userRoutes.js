/**
 * User Routes
 * Defines all endpoints related to user accounts and profiles
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/google-login', userController.googleLogin);
router.post('/logout', userController.logout);

// Protected routes (require authentication)
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.get('/volunteer-history', protect, userController.getVolunteerHistory);

module.exports = router; 