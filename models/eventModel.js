/**
 * Event Model
 * Handles all database operations related to events and community help posts
 */

const supabase = require('../config/supabase');

const eventModel = {
  /**
   * Create a new event
   * @param {Object} eventData - The event data
   * @param {string} userId - The creator's user ID
   * @returns {Object} - The created event
   */
  async createEvent(eventData, userId) {
    try {
      const newEvent = {
        creator_id: userId,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        category: eventData.category,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
        is_ongoing: eventData.isOngoing || false, // Differentiates community help posts
        capacity: eventData.capacity || null,
        created_at: new Date()
      };
      
      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },
  
  /**
   * Get all events with optional filters
   * @param {Object} filters - Optional filters (category, location, date)
   * @returns {Array} - List of events
   */
  async getEvents(filters = {}) {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          creator:creator_id(id, email, profiles:profiles(full_name, username)),
          participants:event_participants(
            user_id,
            status,
            users:user_id(
              id,
              email,
              profiles:profiles(full_name, username)
            )
          )
        `)
        .order('start_date', { ascending: true });
      
      // Apply filters if provided
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      
      if (filters.isOngoing !== undefined) {
        query = query.eq('is_ongoing', filters.isOngoing);
      }
      
      // Filter by date range if provided
      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  },
  
  /**
   * Get a single event by ID
   * @param {string} eventId - The event ID
   * @returns {Object} - The event details
   */
  async getEventById(eventId) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator:creator_id(id, email, profiles:profiles(full_name, username)),
          participants:event_participants(
            id,
            user_id,
            status,
            created_at,
            users:user_id(
              id,
              email,
              profiles:profiles(full_name, username)
            )
          )
        `)
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  },
  
  /**
   * Update an event
   * @param {string} eventId - The event ID
   * @param {Object} updates - The fields to update
   * @param {string} userId - The user ID (for authorization)
   * @returns {Object} - The updated event
   */
  async updateEvent(eventId, updates, userId) {
    try {
      // First check if user is the creator
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('creator_id')
        .eq('id', eventId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (event.creator_id !== userId) {
        throw new Error('You are not authorized to update this event');
      }
      
      // Prepare update object
      const updateData = {
        ...updates,
        updated_at: new Date()
      };
      
      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },
  
  /**
   * Delete an event
   * @param {string} eventId - The event ID
   * @param {string} userId - The user ID (for authorization)
   * @returns {boolean} - Success status
   */
  async deleteEvent(eventId, userId) {
    try {
      // First check if user is the creator
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('creator_id')
        .eq('id', eventId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (event.creator_id !== userId) {
        throw new Error('You are not authorized to delete this event');
      }
      
      // Delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },
  
  /**
   * Register a user for an event
   * @param {string} eventId - The event ID
   * @param {string} userId - The user ID
   * @returns {Object} - The registration details
   */
  async registerForEvent(eventId, userId) {
    try {
      // Check if already registered
      const { data: existing, error: checkError } = await supabase
        .from('event_participants')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      // If already registered, return the existing registration
      if (existing) {
        if (existing.status === 'canceled') {
          // If previously canceled, reactivate the registration
          const { data, error } = await supabase
            .from('event_participants')
            .update({ status: 'registered', updated_at: new Date() })
            .eq('id', existing.id)
            .select()
            .single();
          
          if (error) throw error;
          return { data, isNewRegistration: false };
        }
        return { data: existing, isNewRegistration: false };
      }
      
      // Create new registration
      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: 'registered',
          created_at: new Date()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, isNewRegistration: true };
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },
  
  /**
   * Cancel event registration
   * @param {string} eventId - The event ID
   * @param {string} userId - The user ID
   * @returns {Object} - The updated registration
   */
  async cancelRegistration(eventId, userId) {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .update({ 
          status: 'canceled',
          updated_at: new Date()
        })
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error canceling registration:', error);
      throw error;
    }
  },
  
  /**
   * Get user's registered events
   * @param {string} userId - The user ID
   * @param {string} status - Optional status filter
   * @returns {Array} - List of events
   */
  async getUserEvents(userId, status) {
    try {
      let query = supabase
        .from('event_participants')
        .select(`
          id,
          status,
          created_at,
          event:event_id(*)
        `)
        .eq('user_id', userId);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user events:', error);
      throw error;
    }
  }
};

module.exports = eventModel; 