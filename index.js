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
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Log the CORS configuration
console.log('CORS origin:', process.env.CLIENT_URL || 'http://localhost:5173');

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173', 
    'http://localhost:5174'  // Add backup port
  ],
  credentials: true // Important for cookies
}));



// Routes
app.get('/', (req, res) => {
  res.json({ message: 'HandsOn API is running' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api/events', eventRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});