/**
 * User Model
 * Handles all database operations related to users
 */

const supabase = require('../config/supabase');

const userModel = {
  /**
   * Get a user profile by ID
   * @param {string} userId - The user's ID
   * @returns {Object|null} - The user profile or null if not found
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // If the error is because the profile wasn't found, return null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },
  
  /**
   * Create or update a user profile
   * @param {string} userId - The user's ID
   * @param {Object} profileData - The profile data to save
   * @returns {Object} - The updated profile
   */
  async updateUserProfile(userId, profileData) {
    try {
      // Check if profile exists
      const existingProfile = await this.getUserProfile(userId);
      
      // Prepare profile data
      const profile = {
        user_id: userId,
        full_name: profileData.fullName || '',
        username: profileData.username || '',
        bio: profileData.bio || '',
        skills: profileData.skills || [],
        causes: profileData.causes || [],
        updated_at: new Date()
      };
      
      let result;
      
      // If profile exists, update it
      if (existingProfile) {
        const { data, error } = await supabase
          .from('profiles')
          .update(profile)
          .eq('user_id', userId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } 
      // If profile doesn't exist, create it
      else {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            ...profile,
            created_at: new Date()
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      return result;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
  
  /**
   * Get volunteer history for a user
   * @param {string} userId - The user's ID
   * @returns {Array} - Array of volunteer activities
   */
  async getVolunteerHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('volunteer_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting volunteer history:', error);
      throw error;
    }
  },
  
  /**
   * Ensure a user has a profile, creating one if it doesn't exist
   * @param {string} userId - The user's ID
   * @param {Object} userData - Optional user data to use for profile creation
   * @returns {Object} - The user profile
   */
  async ensureUserProfile(userId, userData = {}) {
    try {
      // Check if profile exists
      const existingProfile = await this.getUserProfile(userId);
      
      if (existingProfile) {
        return existingProfile;
      }
      
      // Profile doesn't exist, create one
      console.log(`Creating profile for user: ${userId}`);
      
      // Get user metadata if available
      let userMetadata = {};
      if (userData.user_metadata) {
        userMetadata = userData.user_metadata;
      }
      
      // Prepare profile data
      const profile = {
        user_id: userId,
        full_name: userData.fullName || userData.full_name || userMetadata.full_name || userMetadata.name || '',
        username: userData.username || userMetadata.username || (userData.email ? userData.email.split('@')[0] : `user_${userId.substring(0, 8)}`),
        created_at: new Date()
      };
      
      console.log('Creating new profile with data:', profile);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
      
      console.log('Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  }
};

module.exports = userModel;