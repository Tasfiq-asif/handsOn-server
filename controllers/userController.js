/**
 * User Controller
 * Handles all user-related operations including registration, login, and profile management
 */

const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const userController = {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      const { email, password, fullName } = req.body;
      
      if (!email || !password || !fullName) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }
      
      // Simplest possible signup approach
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      console.log('User registered successfully:', data.user?.id);
      
      // Create profile in database
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            user_id: data.user.id,
            full_name: fullName,
            username: email.split('@')[0],
            created_at: new Date()
          }
        ]);
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
        
        // Automatically sign in the user after registration
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          console.error('Error signing in after registration:', signInError);
        }
      }
      
      // Set token in cookie if session exists (may not exist if email confirmation required)
      if (data.session) {
        res.cookie('token', data.session.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          domain: '.vercel.app',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }
      
      res.status(201).json({
        success: true,
        user: data.user,
        // Don't include token in response body since it's in cookie
      });
      
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  
  /**
   * Login a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      console.log('Login attempt:', email);
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
      }
      
      // Use Supabase Admin to sign in user and get token
      console.log('Authenticating with Supabase...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }
      
      console.log('Authentication successful, user:', data.user.id);
      console.log('Setting cookie with token (first 10 chars):', data.session.access_token.substring(0, 10) + '...');
      
      // Set token in an HTTP-only cookie with the WORKING configuration
      res.cookie('token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      console.log('Auth cookie should be set now');
      
      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }
      
      res.status(200).json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          ...profile
        }
      });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  },
  
  /**
   * Google OAuth login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async googleLogin(req, res) {
    try {
      console.log('Google login attempt');
      
      // For post-OAuth redirection, we'll receive a session from the client
      const { session } = req.body;
      
      if (!session || !session.access_token) {
        return res.status(400).json({ message: 'No valid session provided' });
      }
      
      console.log('Received Google auth session, token:', session.access_token.substring(0, 10) + '...');
      
      // Set token in cookie with WORKING configuration
      res.cookie('token', session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Using the working config
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      console.log('Google auth cookie should be set now');
      
      // Check if user has a profile, create if not
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        console.log('Creating profile for Google user:', session.user.id);
        const { error: createProfileError } = await supabase.from('profiles').insert([
          {
            user_id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            username: session.user.email.split('@')[0],
            created_at: new Date()
          }
        ]);
        
        if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
        }
      }
      
      res.status(200).json({
        success: true,
        user: session.user
      });
    } catch (error) {
      console.error('Google login error:', error);
      res.status(401).json({ message: error.message });
    }
  },
  
  /**
   * Get user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProfile(req, res) {
    try {
      // User ID is available from auth middleware
      const userId = req.user.id;
      
      console.log("Getting profile for user ID:", userId);
      console.log("User object from request:", req.user);
      
      // Get user profile from our database
      const profile = await userModel.getUserProfile(userId);
      
      if (!profile) {
        // If profile doesn't exist yet, return basic user data
        console.log("No profile found, returning basic user data");
        return res.status(200).json({
          user: {
            id: req.user.id,
            user_id: req.user.id, // Add user_id property
            email: req.user.email,
            full_name: req.user.user_metadata?.full_name || '',
            username: req.user.user_metadata?.username || '',
            profile_complete: false
          }
        });
      }
      
      console.log("Profile found:", profile);
      
      // Ensure profile has user_id property
      const userProfile = {
        ...profile,
        user_id: profile.user_id || userId, // Ensure user_id is set
        profile_complete: true
      };
      
      // console.log("Returning user profile:", userProfile);
      
      res.status(200).json({ 
        user: userProfile
      });
      
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error while fetching profile' });
    }
  },
  
  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { fullName, username, bio, skills, causes } = req.body;
      
      // Update profile in our database
      const updatedProfile = await userModel.updateUserProfile(userId, {
        fullName,
        username,
        bio,
        skills,
        causes
      });
      
      // Also update user metadata in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          username: username
        }
      });
      
      if (error) {
        console.error('Error updating Supabase user metadata:', error);
      }
      
      res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedProfile
      });
      
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error while updating profile' });
    }
  },
  
  /**
   * Get user volunteer history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getVolunteerHistory(req, res) {
    try {
      const userId = req.user.id;
      
      // Get volunteer history from our database
      const history = await userModel.getVolunteerHistory(userId);
      
      res.status(200).json({
        history
      });
      
    } catch (error) {
      console.error('Get volunteer history error:', error);
      res.status(500).json({ message: 'Server error while fetching volunteer history' });
    }
  },
  
  /**
   * Logout a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      // Clear the cookie
      res.clearCookie('token');
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = userController; 