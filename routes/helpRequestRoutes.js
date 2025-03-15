/**
 * Help Request Routes
 * Defines API endpoints for community help requests
 */

const express = require('express');
const router = express.Router();
const helpRequestController = require('../controllers/helpRequestController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', helpRequestController.getHelpRequests);
router.get('/:id', helpRequestController.getHelpRequest);
router.get('/:id/helpers', helpRequestController.getHelpers);
router.get('/:id/comments', helpRequestController.getComments);

// Protected routes (require authentication)
router.post('/', protect, helpRequestController.createHelpRequest);
router.put('/:id', protect, helpRequestController.updateHelpRequest);
router.delete('/:id', protect, helpRequestController.deleteHelpRequest);
router.post('/:id/offer', protect, helpRequestController.offerHelp);
router.post('/:id/comments', protect, helpRequestController.addComment);

module.exports = router; 