import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function parseEnvFile(envPath) {
  try {
    if (!existsSync(envPath)) return {}
    const raw = readFileSync(envPath, 'utf-8')
    const lines = raw.split(/\r?\n/)
    const out = {}
    for (const line of lines) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const key = m[1]
      let val = m[2]
      // remove surrounding quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      out[key] = val
    }
    return out
  } catch {
    return {}
  }
}

async function main() {
  // Prefer process.env, fallback to .env (VITE_ keys) for local dev
  const cwd = process.cwd()
  const envFromFile = parseEnvFile(resolve(cwd, '.env'))

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || envFromFile.SUPABASE_URL || envFromFile.VITE_SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || envFromFile.SUPABASE_ANON_KEY || envFromFile.VITE_SUPABASE_ANON_KEY

  if (!url || !anon) {
    console.error('[seed] Supabase URL/ANON anahtarı bulunamadı. Lütfen .env dosyanızda VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlı olsun veya ortam değişkeni olarak geçin.')
    process.exit(1)
  }

  const supabase = createClient(url, anon)

  const payload = {
    title: 'TEST ILAN ' + new Date().toISOString(),
    owner_name: 'Seed Script',
    owner_phone: '05550000000',
    status: 'approved',
    description: 'Seed ile eklenen test ilanı',
    is_for: 'satilik',
    price_tl: 123456,
    area_m2: 120,
    neighborhood: 'Merkez',
    property_type: 'Daire',
    rooms: '3+1',
    images: [],
  }

  const { data, error } = await supabase.from('listings').insert(payload).select('id, created_at, status, title').single()
  if (error) {
    console.error('[seed] Hata:', error.message)
    process.exit(2)
  }

  console.log('[seed] Başarılı:', data)
}

main().catch((e) => {
  console.error('[seed] Beklenmeyen hata:', e?.message || e)
  process.exit(3)
})
