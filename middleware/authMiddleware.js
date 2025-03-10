const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    // Get token from cookies instead of Authorization header
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    // Set user in request
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect }; 