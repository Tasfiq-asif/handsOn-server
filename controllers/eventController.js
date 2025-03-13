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
      
      console.log('Creating event with data:', JSON.stringify(eventData));
      console.log('Creator ID:', userId);
      
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
      
      try {
        const event = await eventModel.createEvent(eventData, userId);
        
        res.status(201).json({
          success: true,
          event
        });
      } catch (dbError) {
        console.error('Database error when creating event:', dbError);
        return res.status(500).json({ 
          message: 'Database error when creating event', 
          error: dbError.message,
          details: dbError.details || 'No additional details'
        });
      }
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ 
        message: 'Server error while creating event',
        error: error.message
      });
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
      const updates = req.body;
      const userId = req.user.id;
      
      console.log('Update event request received:');
      console.log('Event ID:', id);
      console.log('Event ID type:', typeof id);
      console.log('Event ID length:', id.length);
      console.log('User ID from request:', userId);
      console.log('User ID type:', typeof userId);
      console.log('Update payload:', JSON.stringify(updates));
      console.log('User object:', JSON.stringify(req.user));
      
      // Ensure data types are correct
      const sanitizedUpdates = {
        ...updates
      };
      
      // Convert capacity to number if present
      if (sanitizedUpdates.capacity !== undefined && sanitizedUpdates.capacity !== null) {
        sanitizedUpdates.capacity = Number(sanitizedUpdates.capacity);
      }
      
      // Ensure boolean fields are actually booleans
      if (sanitizedUpdates.is_ongoing !== undefined) {
        sanitizedUpdates.is_ongoing = Boolean(sanitizedUpdates.is_ongoing);
      }
      
      // Format dates if present
      if (sanitizedUpdates.start_date) {
        sanitizedUpdates.start_date = new Date(sanitizedUpdates.start_date).toISOString();
      }
      
      if (sanitizedUpdates.end_date) {
        sanitizedUpdates.end_date = new Date(sanitizedUpdates.end_date).toISOString();
      }
      
      console.log('Sanitized updates:', JSON.stringify(sanitizedUpdates));
      
      const updatedEvent = await eventModel.updateEvent(id, sanitizedUpdates, userId);
      
      console.log('Event updated successfully, returning response');
      res.status(200).json({
        success: true,
        data: updatedEvent
      });
    } catch (error) {
      console.error('Error in updateEvent controller:', error.message);
      
      if (error.message === 'You are not authorized to update this event') {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to update this event'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
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