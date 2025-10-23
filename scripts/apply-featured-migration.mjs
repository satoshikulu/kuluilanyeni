import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// .env dosyasından değerleri oku
const envPath = join(__dirname, '..', '.env')
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials bulunamadı!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 Öne çıkan ilanlar migration başlatılıyor...\n')

// Migration SQL'i oku
const migrationPath = join(__dirname, '..', 'FEATURED_LISTINGS_MIGRATION.sql')
const migrationSQL = readFileSync(migrationPath, 'utf-8')

// SQL'i satırlara böl ve yorum satırlarını temizle
const sqlStatements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'))

console.log(`📝 ${sqlStatements.length} SQL komutu bulundu\n`)

// Her SQL komutunu sırayla çalıştır
for (let i = 0; i < sqlStatements.length; i++) {
  const sql = sqlStatements[i]
  if (!sql) continue
  
  console.log(`⏳ Komut ${i + 1}/${sqlStatements.length} çalıştırılıyor...`)
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      // RPC fonksiyonu yoksa direkt SQL çalıştırmayı dene
      console.log('⚠️  RPC bulunamadı, direkt SQL deneniyor...')
      // Not: Supabase JS client direkt SQL çalıştırmayı desteklemiyor
      // Bu yüzden kullanıcıya manuel olarak yapmasını söyleyelim
      throw new Error('Supabase JS client ile direkt SQL çalıştırılamıyor')
    }
    
    console.log('✅ Başarılı\n')
  } catch (err) {
    console.error('❌ Hata:', err.message)
    console.log('\n⚠️  Migration otomatik uygulanamadı.')
    console.log('📋 Lütfen FEATURED_LISTINGS_MIGRATION.sql dosyasını')
    console.log('   Supabase Dashboard > SQL Editor\'da manuel olarak çalıştırın.\n')
    process.exit(1)
  }
}

console.log('✅ Migration tamamlandı!')
console.log('\n📊 Kontrol ediliyor...\n')

// Kontrol: Yeni kolonların eklendiğini doğrula
const { data, error } = await supabase
  .from('listings')
  .select('id, is_featured, featured_order')
  .limit(1)

if (error) {
  console.error('❌ Kontrol hatası:', error.message)
  console.log('\n⚠️  Lütfen veritabanını manuel olarak kontrol edin.')
} else {
  console.log('✅ Yeni kolonlar başarıyla eklendi!')
  console.log('✅ is_featured:', typeof data[0]?.is_featured)
  console.log('✅ featured_order:', typeof data[0]?.featured_order)
}

console.log('\n🎉 Hazır! Artık admin panelinden ilanları öne çıkarabilirsiniz.')
