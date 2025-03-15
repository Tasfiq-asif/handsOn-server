const { Client } = require('pg');
require('dotenv').config();

// Connect to the default 'postgres' database first
const pgClient = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to the default postgres database
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5434'),
});

async function createDatabase() {
  try {
    console.log("Connecting to default 'postgres' database...");
    await pgClient.connect();
    
    // Check if the database already exists
    const checkResult = await pgClient.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [process.env.DB_NAME]);
    
    if (checkResult.rows.length > 0) {
      console.log(`Database '${process.env.DB_NAME}' already exists.`);
    } else {
      // Create the database
      console.log(`Creating database '${process.env.DB_NAME}'...`);
      await pgClient.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
      console.log(`✅ Database '${process.env.DB_NAME}' created successfully!`);
    }
    
    console.log('Database setup complete.');
  } catch (error) {
    console.error('❌ Failed to create database');
    console.error(error);
  } finally {
    await pgClient.end();
  }
}

createDatabase(); 