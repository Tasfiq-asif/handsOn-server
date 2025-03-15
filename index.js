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

// Log the CORS configuration
console.log('CORS origin:', process.env.CLIENT_URL || 'http://localhost:5173');

app.use(cors({
  origin: 'https://hands-on-client.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
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