const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client - this will be imported in other files
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Use service role key for server-side operations if available
// This allows bypassing RLS policies for admin operations
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test connection on startup
async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    console.log('🔑 Using service role key:', !!supabaseServiceKey);
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
  }
}

testConnection();

module.exports = supabase;