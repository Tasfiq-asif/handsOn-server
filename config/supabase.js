const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client - this will be imported in other files
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection on startup
async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ Supabase connection successful');
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
  }
}

testConnection();

module.exports = supabase;