/**
 * Help Request Model
 * Handles all database operations related to community help requests
 */

const supabase = require('../config/supabase');
const userModel = require('./userModel');

const helpRequestModel = {
  /**
   * Create a new help request
   * @param {Object} helpRequestData - The help request data
   * @param {string} userId - The creator's user ID
   * @returns {Object} - The created help request
   */
  async createHelpRequest(helpRequestData, userId) {
    try {
      console.log('Creating help request for user:', userId);
      console.log('Help request data:', JSON.stringify(helpRequestData));
      
      // Format the help request data to match the database schema
      const newHelpRequest = {
        creator_id: userId,
        title: helpRequestData.title,
        description: helpRequestData.description,
        location: helpRequestData.location || null,
        category: helpRequestData.category || null,
        urgency: helpRequestData.urgency || 'medium',
        status: helpRequestData.status || 'open',
        created_at: new Date()
      };
      
      console.log('Formatted help request data for database:', JSON.stringify(newHelpRequest));
      
      // Insert the help request into the database
      const { data, error } = await supabase
        .from('help_requests')
        .insert(newHelpRequest)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Help request created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('Error creating help request:', error);
      throw error;
    }
  },

  /**
   * Get all help requests with optional filtering
   * @param {Object} filters - Optional filters for the help requests
   * @returns {Array} - The help requests
   */
  async getHelpRequests(filters = {}) {
    try {
      console.log('Getting help requests with filters:', JSON.stringify(filters));
      
      // Start building the query
      let query = supabase
        .from('help_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filters if they exist
      if (filters.urgency) {
        query = query.eq('urgency', filters.urgency);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      // If we have help requests, fetch the creator profiles
      if (data && data.length > 0) {
        // Get unique creator IDs
        const creatorIds = [...new Set(data.map(request => request.creator_id))];
        
        // Fetch profiles for these creators
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', creatorIds);
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          // Continue without profiles rather than failing completely
        } else if (profilesData) {
          // Create a map of user_id to profile data
          const profilesMap = profilesData.reduce((map, profile) => {
            map[profile.user_id] = profile;
            return map;
          }, {});
          
          // Add creator profile to each help request
          data.forEach(request => {
            request.creator = profilesMap[request.creator_id] || null;
          });
        }
      }
      
      console.log(`Retrieved ${data.length} help requests`);
      return data;
    } catch (error) {
      console.error('Error getting help requests:', error);
      throw error;
    }
  },

  /**
   * Get a specific help request by ID
   * @param {string} id - The help request ID
   * @returns {Object} - The help request
   */
  async getHelpRequest(id) {
    try {
      console.log('Getting help request with ID:', id);
      
      // Get the help request
      const { data, error } = await supabase
        .from('help_requests')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      // If we have a help request, fetch the creator profile
      if (data && data.creator_id) {
        // Fetch profile for the creator
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .eq('user_id', data.creator_id)
          .single();
        
        if (profileError) {
          console.error('Error fetching creator profile:', profileError);
          // Continue without profile rather than failing completely
        } else if (profileData) {
          // Add creator profile to the help request
          data.creator = profileData;
        }
      }
      
      console.log('Help request retrieved successfully');
      return data;
    } catch (error) {
      console.error(`Error getting help request with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update an existing help request
   * @param {string} id - The help request ID
   * @param {Object} helpRequestData - The updated help request data
   * @param {string} userId - The user ID making the update
   * @returns {Object} - The updated help request
   */
  async updateHelpRequest(id, helpRequestData, userId) {
    try {
      console.log(`Updating help request ${id} for user ${userId}`);
      console.log('Update data:', JSON.stringify(helpRequestData));
      
      // First, check if the user is the creator of the help request
      const { data: helpRequest, error: getError } = await supabase
        .from('help_requests')
        .select('creator_id')
        .eq('id', id)
        .single();
      
      if (getError) {
        console.error('Supabase query error:', getError);
        throw getError;
      }
      
      if (!helpRequest) {
        throw new Error('Help request not found');
      }
      
      if (helpRequest.creator_id !== userId) {
        throw new Error('Unauthorized: You can only update your own help requests');
      }
      
      // Format the update data
      const updateData = {
        title: helpRequestData.title,
        description: helpRequestData.description,
        location: helpRequestData.location,
        category: helpRequestData.category,
        urgency: helpRequestData.urgency,
        updated_at: new Date()
      };
      
      // If status is provided, update it
      if (helpRequestData.status) {
        updateData.status = helpRequestData.status;
      }
      
      // Update the help request
      const { data, error } = await supabase
        .from('help_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Help request updated successfully');
      return data;
    } catch (error) {
      console.error(`Error updating help request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a help request
   * @param {string} id - The help request ID
   * @param {string} userId - The user ID making the deletion
   * @returns {boolean} - Success status
   */
  async deleteHelpRequest(id, userId) {
    try {
      console.log(`Deleting help request ${id} for user ${userId}`);
      
      // First, check if the user is the creator of the help request
      const { data: helpRequest, error: getError } = await supabase
        .from('help_requests')
        .select('creator_id')
        .eq('id', id)
        .single();
      
      if (getError) {
        console.error('Supabase query error:', getError);
        throw getError;
      }
      
      if (!helpRequest) {
        throw new Error('Help request not found');
      }
      
      if (helpRequest.creator_id !== userId) {
        throw new Error('Unauthorized: You can only delete your own help requests');
      }
      
      // Delete the help request
      const { error } = await supabase
        .from('help_requests')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Help request deleted successfully');
      return true;
    } catch (error) {
      console.error(`Error deleting help request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Offer help for a help request
   * @param {string} helpRequestId - The help request ID
   * @param {string} userId - The user ID offering help
   * @returns {Object} - The created helper record
   */
  async offerHelp(helpRequestId, userId) {
    try {
      console.log(`User ${userId} offering help for request ${helpRequestId}`);
      
      // Check if the user has already offered help
      const { data: existingOffer, error: checkError } = await supabase
        .from('help_request_helpers')
        .select('id')
        .eq('help_request_id', helpRequestId)
        .eq('user_id', userId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected
        console.error('Supabase query error:', checkError);
        throw checkError;
      }
      
      if (existingOffer) {
        console.log('User has already offered help for this request');
        return existingOffer;
      }
      
      // Create a new helper record
      const newHelper = {
        help_request_id: helpRequestId,
        user_id: userId,
        created_at: new Date()
      };
      
      const { data, error } = await supabase
        .from('help_request_helpers')
        .insert(newHelper)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      // Update the help request status to 'in_progress' if it's currently 'open'
      const { data: helpRequest, error: getError } = await supabase
        .from('help_requests')
        .select('status')
        .eq('id', helpRequestId)
        .single();
      
      if (!getError && helpRequest.status === 'open') {
        await supabase
          .from('help_requests')
          .update({ status: 'in_progress' })
          .eq('id', helpRequestId);
      }
      
      console.log('Help offer created successfully');
      return data;
    } catch (error) {
      console.error(`Error offering help for request ${helpRequestId}:`, error);
      throw error;
    }
  },

  /**
   * Get all helpers for a help request
   * @param {string} helpRequestId - The help request ID
   * @returns {Array} - The helpers
   */
  async getHelpers(helpRequestId) {
    try {
      console.log(`Getting helpers for help request ${helpRequestId}`);
      
      const { data, error } = await supabase
        .from('help_request_helpers')
        .select('*')
        .eq('help_request_id', helpRequestId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      // If we have helpers, fetch their profiles
      if (data && data.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(data.map(helper => helper.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          // Continue without profiles rather than failing completely
        } else if (profilesData) {
          // Create a map of user_id to profile data
          const profilesMap = profilesData.reduce((map, profile) => {
            map[profile.user_id] = profile;
            return map;
          }, {});
          
          // Add profile to each helper
          data.forEach(helper => {
            helper.profile = profilesMap[helper.user_id] || null;
          });
        }
      }
      
      console.log(`Retrieved ${data.length} helpers`);
      return data;
    } catch (error) {
      console.error(`Error getting helpers for request ${helpRequestId}:`, error);
      throw error;
    }
  },

  /**
   * Add a comment to a help request
   * @param {string} helpRequestId - The help request ID
   * @param {string} userId - The user ID adding the comment
   * @param {string} content - The comment content
   * @param {Object} userData - Optional user data for profile creation
   * @returns {Object} - The created comment
   */
  async addComment(helpRequestId, userId, content, userData = {}) {
    try {
      console.log(`User ${userId} adding comment to help request ${helpRequestId}`);
      console.log(`Comment content: ${content}`);
      
      // Ensure the user has a profile
      const profile = await userModel.ensureUserProfile(userId, userData);
      console.log(`Using profile for comment: ${profile.username || 'No username'}`);
      
      // Try direct insert first
      const { data, error } = await supabase
        .from('help_request_comments')
        .insert({
          help_request_id: helpRequestId,
          user_id: userId,
          content,
          created_at: new Date()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error);
        
        // If there's an RLS error, try using the SQL function
        if (error.code === '42501') {
          console.log('Attempting to insert with SQL function...');
          
          // Use the SQL function to bypass RLS
          const { data: fnData, error: fnError } = await supabase
            .rpc('insert_help_request_comment', {
              p_help_request_id: helpRequestId,
              p_user_id: userId,
              p_content: content
            });
          
          if (fnError) {
            console.error('SQL function call also failed:', fnError);
            throw fnError;
          }
          
          console.log('Comment added successfully via SQL function:', fnData);
          
          // Add the profile data to the comment
          if (fnData && fnData.length > 0) {
            fnData[0].profile = profile;
          }
          
          return fnData[0]; // The function returns a set, so we take the first row
        }
        
        throw error;
      }
      
      console.log('Comment added successfully:', data?.id);
      
      // Add the profile data to the comment
      if (data) {
        data.profile = profile;
      }
      
      return data;
    } catch (error) {
      console.error(`Error adding comment to help request ${helpRequestId}:`, error);
      throw error;
    }
  },

  /**
   * Get all comments for a help request
   * @param {string} helpRequestId - The help request ID
   * @returns {Array} - The comments
   */
  async getComments(helpRequestId) {
    try {
      console.log(`Getting comments for help request ${helpRequestId}`);
      
      const { data, error } = await supabase
        .from('help_request_comments')
        .select('*')
        .eq('help_request_id', helpRequestId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      // If we have comments, fetch the user profiles
      if (data && data.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(data.map(comment => comment.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          // Continue without profiles rather than failing completely
        } else if (profilesData) {
          // Create a map of user_id to profile data
          const profilesMap = profilesData.reduce((map, profile) => {
            map[profile.user_id] = profile;
            return map;
          }, {});
          
          // Add profile to each comment
          data.forEach(comment => {
            comment.profile = profilesMap[comment.user_id] || null;
          });
        }
      }
      
      console.log(`Retrieved ${data.length} comments`);
      return data;
    } catch (error) {
      console.error(`Error getting comments for help request ${helpRequestId}:`, error);
      throw error;
    }
  }
};

module.exports = helpRequestModel; 