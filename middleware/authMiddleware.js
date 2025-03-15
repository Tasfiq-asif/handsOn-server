const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check Authorization header first (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Using token from Authorization header');
    } 
    // Then check cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('Using token from cookies');
    }

    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({ message: 'Not authorized, no token' });
    }



    try {
      // Verify the token with Supabase
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ 
          message: 'Not authorized, token failed @events',
          error: error.message
        });
      }

      if (!data || !data.user) {
        console.error('No user data found in token');
        return res.status(401).json({ message: 'Not authorized, invalid user data' });
      }

      // Set user in request
      req.user = data.user;
      console.log(`Authenticated user: ${data.user.email || data.user.id}`);
      next();
    } catch (verifyError) {
      console.error('Token verification exception:', verifyError);
      return res.status(401).json({ 
        message: 'Token verification failed',
        error: verifyError.message 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = { protect }; 