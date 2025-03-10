/**
 * Authentication Middleware
 * Verifies the JWT token and adds the user to the request object
 */

const supabase = require('../config/supabase');

/**
 * Authentication middleware to protect routes
 * Verifies JWT token from Authorization header
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Add user to request object
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = authMiddleware; 