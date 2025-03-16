/**
 * HandsOn API Server
 * Main entry point for the backend application
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
require('./config/supabase'); // Import Supabase for initialization

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const protectedRoutes = require('./routes/protected');
const eventRoutes = require('./routes/eventRoutes');
const helpRequestRoutes = require('./routes/helpRequestRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Simple CORS setup that works for both local and production
const allowedOrigins = [
  'https://hands-on-client.vercel.app',  // Your production site
  'http://localhost:5173'                // Local development
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'HandsOn API is running' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api', protectedRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/help-requests', helpRequestRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start the server if not being imported (for local development)
if (process.env.NODE_ENV !== 'production' || !module.parent) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel serverless deployment
module.exports = app;