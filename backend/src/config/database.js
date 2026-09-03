// Database configuration - Supabase client
const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('⚠ Supabase credentials not configured. Using in-memory data mode.');
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✓ Supabase client initialized');
    return supabaseClient;
  } catch (err) {
    console.error('✗ Failed to initialize Supabase:', err.message);
    return null;
  }
}

// In-memory data store (fallback when Supabase is not configured)
const memoryStore = require('./memoryStore');

function isUsingMemoryStore() {
  return getSupabase() === null;
}

module.exports = {
  getSupabase,
  isUsingMemoryStore,
  memoryStore
};
