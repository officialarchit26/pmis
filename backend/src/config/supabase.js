// Supabase client configuration
// Credentials are loaded from environment variables for security

const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.warn(
      '⚠ Supabase credentials not found. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env'
    );
    return null;
  }

  supabaseClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

async function testConnection() {
  const client = getSupabaseClient();
  if (!client) {
    return { connected: false, reason: 'Credentials not configured' };
  }

  try {
    // Simple query to test connection
    const { data, error } = await client
      .from('departments')
      .select('id')
      .limit(1);

    if (error) {
      return { connected: false, reason: error.message };
    }

    return { connected: true };
  } catch (err) {
    return { connected: false, reason: err.message };
  }
}

module.exports = {
  getSupabaseClient,
  testConnection,
};
