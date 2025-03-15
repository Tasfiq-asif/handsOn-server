/**
 * Help Request Controller
 * Handles HTTP requests related to community help requests
 */

const helpRequestModel = require('../models/helpRequestModel');

const helpRequestController = {
  /**
   * Get all help requests with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHelpRequests(req, res) {
    try {
      // Extract filter parameters from query string
      const { urgency, category, status } = req.query;
      
      // Build filters object
      const filters = {};
      if (urgency) filters.urgency = urgency;
      if (category) filters.category = category;
      if (status) filters.status = status;
      
      // Get help requests from the model
      const helpRequests = await helpRequestModel.getHelpRequests(filters);
      
      res.status(200).json({
        success: true,
        helpRequests
      });
    } catch (error) {
      console.error('Error in getHelpRequests controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve help requests',
        error: error.message
      });
    }
  },

  /**
   * Get a specific help request by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHelpRequest(req, res) {
    try {
      const { id } = req.params;
      
      // Get the help request from the model
      const helpRequest = await helpRequestModel.getHelpRequest(id);
      
      if (!helpRequest) {
        return res.status(404).json({
          success: false,
          message: 'Help request not found'
        });
      }
      
      res.status(200).json({
        success: true,
        helpRequest
      });
    } catch (error) {
      console.error('Error in getHelpRequest controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve help request',
        error: error.message
      });
    }
  },

  /**
   * Create a new help request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createHelpRequest(req, res) {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.id;
      
      // Extract help request data from request body
      const helpRequestData = req.body;
      
      // Validate required fields
      if (!helpRequestData.title || !helpRequestData.description) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required'
        });
      }
      
      // Create the help request using the model
      const helpRequest = await helpRequestModel.createHelpRequest(helpRequestData, userId);
      
      res.status(201).json({
        success: true,
        message: 'Help request created successfully',
        helpRequest
      });
    } catch (error) {
      console.error('Error in createHelpRequest controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create help request',
        error: error.message
      });
    }
  },

  /**
   * Update an existing help request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateHelpRequest(req, res) {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.id;
      
      // Extract help request ID from URL parameters
      const { id } = req.params;
      
      // Extract help request data from request body
      const helpRequestData = req.body;
      
      // Validate required fields
      if (!helpRequestData.title || !helpRequestData.description) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required'
        });
      }
      
      // Update the help request using the model
      const helpRequest = await helpRequestModel.updateHelpRequest(id, helpRequestData, userId);
      
      res.status(200).json({
        success: true,
        message: 'Help request updated successfully',
        data: helpRequest
      });
    } catch (error) {
      console.error('Error in updateHelpRequest controller:', error);
      
      // Handle specific errors
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update help request',
        error: error.message
      });
    }
  },

  /**
   * Delete a help request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteHelpRequest(req, res) {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.id;
      
      // Extract help request ID from URL parameters
      const { id } = req.params;
      
      // Delete the help request using the model
      await helpRequestModel.deleteHelpRequest(id, userId);
      
      res.status(200).json({
        success: true,
        message: 'Help request deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteHelpRequest controller:', error);
      
      // Handle specific errors
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete help request',
        error: error.message
      });
    }
  },

  /**
   * Offer help for a help request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async offerHelp(req, res) {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.id;
      
      // Extract help request ID from URL parameters
      const { id } = req.params;
      
      // Offer help using the model
      const helper = await helpRequestModel.offerHelp(id, userId);
      
      res.status(200).json({
        success: true,
        message: 'Help offered successfully',
        helper
      });
    } catch (error) {
      console.error('Error in offerHelp controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to offer help',
        error: error.message
      });
    }
  },

  /**
   * Get all helpers for a help request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHelpers(req, res) {
    try {
      // Extract help request ID from URL parameters
      const { id } = req.params;
      
      // Get helpers using the model
      const helpers = await helpRequestModel.getHelpers(id);
      
      res.status(200).json({
        success: true,
        helpers
      });
    } catch (error) {
      console.error('Error in getHelpers controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve helpers',
        error: error.message
      });
    }
  },

  /**
   * Add a comment to a help request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addComment(req, res) {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.id;
      
      // Extract help request ID from URL parameters
      const { id } = req.params;
      
      // Extract comment content from request body
      const { content } = req.body;
      
      // Validate required fields
      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Comment content is required'
        });
      }
      
      console.log('User data for comment:', {
        id: req.user.id,
        email: req.user.email,
        metadata: req.user.user_metadata
      });
      
      // Add comment using the model
      const comment = await helpRequestModel.addComment(id, userId, content, req.user);
      
      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        comment
      });
    } catch (error) {
      console.error('Error in addComment controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment',
        error: error.message
      });
    }
  },

  /**
   * Get all comments for a help request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getComments(req, res) {
    try {
      // Extract help request ID from URL parameters
      const { id } = req.params;
      
      // Get comments using the model
      const comments = await helpRequestModel.getComments(id);
      
      // Log the comments to see if profiles are attached
      console.log(`Retrieved ${comments.length} comments with profiles:`, 
        comments.map(c => ({
          id: c.id,
          user_id: c.user_id,
          has_profile: !!c.profile,
          username: c.profile?.username || 'No username'
        }))
      );
      
      res.status(200).json({
        success: true,
        comments
      });
    } catch (error) {
      console.error('Error in getComments controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve comments',
        error: error.message
      });
    }
  }
};

module.exports = helpRequestController; 