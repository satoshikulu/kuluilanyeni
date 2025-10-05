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
  console.log('🔍 Supabase Bağlantı Testi Başlatılıyor...\n')

  const cwd = process.cwd()
  const envFromFile = parseEnvFile(resolve(cwd, '.env'))

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || envFromFile.SUPABASE_URL || envFromFile.VITE_SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || envFromFile.SUPABASE_ANON_KEY || envFromFile.VITE_SUPABASE_ANON_KEY

  if (!url || !anon) {
    console.error('❌ Hata: Supabase URL/ANON key bulunamadı')
    process.exit(1)
  }

  console.log('✅ Ortam değişkenleri bulundu')
  console.log('📍 URL:', url)
  console.log('🔑 ANON Key:', anon.substring(0, 20) + '...\n')

  const supabase = createClient(url, anon)

  // Test 1: users_min tablosu
  console.log('📋 Test 1: users_min tablosu kontrol ediliyor...')
  try {
    const { data, error, count } = await supabase
      .from('users_min')
      .select('*', { count: 'exact', head: false })
      .limit(5)
    
    if (error) throw error
    console.log(`✅ users_min tablosu bulundu (${count} kayıt)`)
    if (data && data.length > 0) {
      console.log('   Örnek kayıt:', data[0])
    }
  } catch (e) {
    console.error('❌ users_min hatası:', e.message)
  }

  // Test 2: listings tablosu
  console.log('\n📋 Test 2: listings tablosu kontrol ediliyor...')
  try {
    const { data, error, count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: false })
      .limit(5)
    
    if (error) throw error
    console.log(`✅ listings tablosu bulundu (${count} kayıt)`)
    if (data && data.length > 0) {
      console.log('   Örnek kayıt:', {
        id: data[0].id,
        title: data[0].title,
        status: data[0].status,
        is_for: data[0].is_for
      })
    }
  } catch (e) {
    console.error('❌ listings hatası:', e.message)
  }

  // Test 3: favorites tablosu
  console.log('\n📋 Test 3: favorites tablosu kontrol ediliyor...')
  try {
    const { error, count } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    console.log(`✅ favorites tablosu bulundu (${count} kayıt)`)
  } catch (e) {
    console.error('❌ favorites hatası:', e.message)
  }

  // Test 4: Storage bucket
  console.log('\n📋 Test 4: Storage bucket kontrol ediliyor...')
  try {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) throw error
    
    const bucket = data.find(b => b.id === 'listings.images')
    if (bucket) {
      console.log('✅ listings.images bucket bulundu')
      console.log('   Public:', bucket.public)
    } else {
      console.log('⚠️  listings.images bucket bulunamadı')
    }
  } catch (e) {
    console.error('❌ Storage hatası:', e.message)
  }

  // Test 5: Status değerleri
  console.log('\n📋 Test 5: İlan status dağılımı...')
  try {
    const statuses = ['pending', 'approved', 'rejected']
    for (const status of statuses) {
      const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', status)
      
      if (error) throw error
      console.log(`   ${status}: ${count} ilan`)
    }
  } catch (e) {
    console.error('❌ Status kontrol hatası:', e.message)
  }

  // Test 6: İlan türleri
  console.log('\n📋 Test 6: İlan türü dağılımı...')
  try {
    const types = ['satilik', 'kiralik']
    for (const type of types) {
      const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('is_for', type)
      
      if (error) throw error
      console.log(`   ${type}: ${count} ilan`)
    }
  } catch (e) {
    console.error('❌ İlan türü kontrol hatası:', e.message)
  }

  console.log('\n✅ Test tamamlandı!')
}

main().catch((e) => {
  console.error('\n❌ Beklenmeyen hata:', e?.message || e)
  process.exit(3)
})
