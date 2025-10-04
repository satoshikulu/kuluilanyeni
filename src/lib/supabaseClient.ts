import { createClient } from '@supabase/supabase-js'

// Supabase connection details
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const SUPABASE_READY = Boolean(
  supabaseUrl && supabaseAnonKey && /^https?:\/\//.test(supabaseUrl)
)

if (!SUPABASE_READY) {
  // Helper console output: Check .env file if variables are missing or URL is incorrect
  // Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values in your .env file
  console.error('[Supabase] Environment variables are missing or incorrect. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')