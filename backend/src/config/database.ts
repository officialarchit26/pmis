import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Supabase URL and Service Role Key are required')
    }

    supabaseClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return supabaseClient
}

export async function connectDatabase(): Promise<void> {
  try {
    const client = getSupabaseClient()
    // Test connection by fetching session (lightweight call)
    await client.auth.getSession()
    console.log('✓ Supabase connection verified')
  } catch (error) {
    console.error('✗ Supabase connection failed:', error)
    // In development without credentials, allow server to start
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
}