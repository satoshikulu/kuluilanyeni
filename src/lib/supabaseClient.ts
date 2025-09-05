import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const SUPABASE_READY = Boolean(
  supabaseUrl && supabaseAnonKey && /^https?:\/\//.test(supabaseUrl)
)

if (!SUPABASE_READY) {
  // Yardımcı konsol çıktısı: .env okunmadığında veya URL hatalıysa
  // VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini kontrol edin
  console.error('[Supabase] Ortam değişkenleri eksik veya hatalı. .env dosyanızı kontrol edin.')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')


