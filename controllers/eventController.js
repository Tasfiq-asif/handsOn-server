/**
 * Event Controller
 * Handles all event-related operations including creation, retrieval, and participant management
 */

const eventModel = require('../models/eventModel');

const eventController = {
  /**
   * Create a new event
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createEvent(req, res) {
    try {
      const userId = req.user.id;
      const eventData = req.body;
      
      // Validate required fields
      if (!eventData.title || !eventData.description) {
        return res.status(400).json({ message: 'Please provide a title and description' });
      }
      
      // Community help posts are ongoing without specific dates
      if (eventData.isOngoing) {
        // For community help posts, start date can be now, end date can be null
        eventData.startDate = eventData.startDate || new Date();
      } else {
        // Regular events need both start and end dates
        if (!eventData.startDate) {
          return res.status(400).json({ message: 'Please provide a start date' });
        }
      }
      
      const event = await eventModel.createEvent(eventData, userId);
      
      res.status(201).json({
        success: true,
        event
      });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ message: error.message });
    }
  },
  
  /**
   * Get all events with optional filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEvents(req, res) {
    try {
      // Extract filter parameters from query
      const filters = {
        category: req.query.category,
        location: req.query.location,
        startDate: req.query.startDate,
        isOngoing: req.query.type === 'help' ? true : 
                  req.query.type === 'event' ? false : undefined
      };
      
      const events = await eventModel.getEvents(filters);
      
      res.status(200).json({
        success: true,
        count: events.length,
        events
      });
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({ message: error.message });
    }
  },
  
  /**
   * Get a single event by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEvent(req, res) {
    try {
      const { id } = req.params;
      
      const event = await eventModel.getEventById(id);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.status(200).json({
        success: true,
        event
      });
    } catch (error) {
      console.error('Get event error:', error);
      res.status(500).json({ message: error.message });
    }
  },
  
  /**
   * Update an event
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;
      
      const event = await eventModel.updateEvent(id, updates, userId);
      
      res.status(200).json({
        success: true,
        event
      });
    } catch (error) {
      // Handle authorization error separately
      if (error.message.includes('not authorized')) {
        return res.status(403).json({ message: error.message });
      }
      
      console.error('Update event error:', error);
      res.status(500).json({ message: error.message });
    }
  },
  
  /**
   * Delete an event
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await eventModel.deleteEvent(id, userId);
      
      res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      // Handle authorization error separately
      if (error.message.includes('not authorized')) {
        return res.status(403).json({ message: error.message });
      }
      
      console.error('Delete event error:', error);
      res.status(500).json({ message: error.message });
    }
  },
  
  /**
   * Register a user for an event
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async registerForEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const { data, isNewRegistration } = await eventModel.registerForEvent(id, userId);
      
      res.status(isNewRegistration ? 201 : 200).json({
        success: true,
        message: isNewRegistration ? 'Successfully registered for event' : 'Already registered for this event',
        registration: data
      });
    } catch (error) {
      console.error('Event registration error:', error);
      res.status(500).json({ message: error.message });
    }
  },
  
  /**
   * Cancel event registration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cancelRegistration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const registration = await eventModel.cancelRegistration(id, userId);
      
      res.status(200).json({
        success: true,
        message: 'Registration canceled successfully',
        registration
      });
    } catch (error) {
      console.error('Cancel registration error:', error);
      res.status(500).json({ message: error.message });
    }
  },
  
  /**
   * Get user's registered events
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserEvents(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;
      
      const events = await eventModel.getUserEvents(userId, status);
      
      res.status(200).json({
        success: true,
        count: events.length,
        events
      });
    } catch (error) {
      console.error('Get user events error:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = eventController; 