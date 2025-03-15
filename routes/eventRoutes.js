/**
 * Event Routes
 * Defines all endpoints related to events and event participation
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);

// Protected routes (require authentication)
router.post('/', protect, eventController.createEvent);
router.put('/:id', protect, eventController.updateEvent);
router.delete('/:id', protect, eventController.deleteEvent);

// Event registration routes
router.post('/:id/register', protect, eventController.registerForEvent);
router.post('/:id/cancel', protect, eventController.cancelRegistration);
router.get('/:id/registration-status', protect, eventController.checkRegistrationStatus);

// User events
router.get('/user/registered', protect, eventController.getUserEvents);

module.exports = router;