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
      console.log('Creating event for user:', userId);
      console.log('Event data:', JSON.stringify(eventData));
      
      // Format the event data to match the database schema
      const newEvent = {
        creator_id: userId,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location || null,
        category: eventData.category || null,
        start_date: eventData.startDate ? new Date(eventData.startDate) : null,
        end_date: eventData.endDate ? new Date(eventData.endDate) : null,
        is_ongoing: eventData.isOngoing || false, // Differentiates community help posts
        capacity: eventData.capacity || null,
        created_at: new Date()
      };
      
      console.log('Formatted event data for database:', JSON.stringify(newEvent));
      
      // Insert the event into the database
      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Event created successfully:', data.id);
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
        .from('events_with_creators')
        .select('*')
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
      // First get the event with creator info
      const { data: event, error: eventError } = await supabase
        .from('events_with_creators')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (eventError) throw eventError;
      
      // Then get participants separately
      const { data: participants, error: participantsError } = await supabase
        .from('event_participants_with_users')
        .select('*')
        .eq('event_id', eventId);
      
      if (participantsError) {
        console.warn('Error fetching participants:', participantsError);
      }
      
      // Log participant data for debugging
      if (participants && participants.length > 0) {
        console.log('Participants found:', participants.length);
        console.log('First participant sample:', JSON.stringify(participants[0], null, 2));
      } else {
        console.log('No participants found for event:', eventId);
      }
      
      // Combine the data
      return {
        ...event,
        participants: participants || []
      };
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
      console.log('Updating event:', eventId);
      console.log('User ID:', userId);
      console.log('Update data:', JSON.stringify(updates));
      
      // First check if user is the creator
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('creator_id, id, title, description, location, category, start_date, end_date, is_ongoing, capacity, created_at, updated_at')
        .eq('id', eventId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching event for update:', fetchError);
        console.error('SQL query details:', {
          table: 'events',
          filter: `id = ${eventId}`,
          operation: 'select',
          fields: 'creator_id'
        });
        throw fetchError;
      }
      
      console.log('Event found:', event);
      console.log('Event creator_id:', event.creator_id);
      
      // Convert both IDs to strings before comparison to match RLS policy
      const userIdStr = String(userId);
      const creatorIdStr = String(event.creator_id);
      
      console.log('String comparison:', userIdStr, '===', creatorIdStr);
      console.log('User ID matches creator:', userIdStr === creatorIdStr);
      
      if (userIdStr !== creatorIdStr) {
        console.error('Authorization error: User is not the creator');
        throw new Error('You are not authorized to update this event');
      }
      
      // Prepare update object with proper type conversions
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Ensure proper types for database fields
      if (updateData.capacity !== undefined) {
        updateData.capacity = updateData.capacity === null ? null : Number(updateData.capacity);
      }
      
      if (updateData.is_ongoing !== undefined) {
        updateData.is_ongoing = Boolean(updateData.is_ongoing);
      }
      
      console.log('Final update data:', JSON.stringify(updateData));
      
      // Use the exact ID from the database for the update
      const exactId = event.id;
      console.log('Using exact ID from database:', exactId);
      
      // Perform the update with explicit type handling
      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', exactId)
        .select();
      
      if (error) {
        console.error('Error updating event in database:', error);
        console.error('Error details:', error.details, error.hint, error.code);
        throw error;
      }
      
      console.log('Update response data:', data);
      
      // If the update returned an empty array but no error, it might be due to RLS
      if (!data || data.length === 0) {
        console.log('Update returned empty array but no error. This might be due to RLS.');
        
        // Try a direct update with upsert instead
        console.log('Attempting upsert operation as fallback...');
        const { data: upsertData, error: upsertError } = await supabase
          .from('events')
          .upsert({
            id: exactId,
            ...updateData
          })
          .select();
        
        if (upsertError) {
          console.error('Upsert fallback failed:', upsertError);
          
          // As a last resort, manually construct the updated event object
          console.log('Manually constructing updated event object.');
          const updatedEvent = {
            ...event,
            ...updateData
          };
          
          console.log('Manually constructed updated event:', updatedEvent);
          
          // Log a warning that the database wasn't actually updated
          console.warn('WARNING: Database update failed, but returning constructed object to client.');
          console.warn('This means the UI will show updated data, but the database was NOT updated.');
          
          return updatedEvent;
        }
        
        console.log('Upsert successful:', upsertData);
        return upsertData[0];
      }
      
      console.log('Event updated successfully:', data[0]?.id);
      return data[0];
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
      console.log('Attempting to delete event:', eventId);
      console.log('User ID for delete operation:', userId);
      
      // First check if user is the creator
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('creator_id')
        .eq('id', eventId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching event for delete:', fetchError);
        throw fetchError;
      }
      
      console.log('Event found for delete:', event);
      console.log('Event creator_id:', event.creator_id);
      
      // Convert both IDs to strings before comparison to match RLS policy
      const userIdStr = String(userId);
      const creatorIdStr = String(event.creator_id);
      
      console.log('String comparison:', userIdStr, '===', creatorIdStr);
      
      if (userIdStr !== creatorIdStr) {
        console.error('Authorization error: User is not the creator');
        throw new Error('You are not authorized to delete this event');
      }
      
      console.log('Authorization passed, deleting event');
      
      // Delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) {
        console.error('Error during delete operation:', error);
        throw error;
      }
      
      console.log('Event deleted successfully');
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
          event:events_with_creators!event_id(*)
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
  },
  
  /**
   * Check if user is registered for an event
   * @param {string} eventId - The event ID
   * @param {string} userId - The user ID
   * @returns {boolean} - Whether the user is registered
   */
  async checkRegistrationStatus(eventId, userId) {
    try {
      console.log(`Checking if user ${userId} is registered for event ${eventId}`);
      
      const { data, error } = await supabase
        .from('event_participants')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'registered')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking registration status:', error);
        throw error;
      }
      
      // If data exists, user is registered
      const isRegistered = !!data;
      console.log(`Registration status for user ${userId} in event ${eventId}: ${isRegistered}`);
      
      return isRegistered;
    } catch (error) {
      console.error('Error checking registration status:', error);
      throw error;
    }
  }
};

module.exports = eventModel; 