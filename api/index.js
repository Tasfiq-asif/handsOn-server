/**
 * Vercel serverless handler for the HandsOn API
 * This file exports the Express app for Vercel serverless deployment
 */

// Import the Express app from the main index.js file
const app = require('../index');

// Export the Express app as a serverless function
module.exports = app; 