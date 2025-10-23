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

console.log('🔍 Veritabanı kontrol ediliyor...\n')

// Test 1: Listings tablosunu sorgula
console.log('📋 Test 1: Listings tablosu sorgulanıyor...')
const { data: listings, error: listingsError } = await supabase
  .from('listings')
  .select('*')
  .limit(1)

if (listingsError) {
  console.error('❌ Listings sorgu hatası:', listingsError.message)
} else {
  console.log('✅ Listings tablosu erişilebilir')
  if (listings && listings.length > 0) {
    const firstListing = listings[0]
    console.log('\n📊 İlk ilan kolonları:')
    console.log('   - id:', typeof firstListing.id)
    console.log('   - title:', typeof firstListing.title)
    console.log('   - status:', typeof firstListing.status)
    console.log('   - is_featured:', typeof firstListing.is_featured, '(', firstListing.is_featured, ')')
    console.log('   - featured_order:', typeof firstListing.featured_order, '(', firstListing.featured_order, ')')
    console.log('   - featured_until:', typeof firstListing.featured_until, '(', firstListing.featured_until, ')')
    
    if (firstListing.is_featured === undefined) {
      console.log('\n⚠️  is_featured kolonu bulunamadı!')
      console.log('📋 Lütfen FEATURED_LISTINGS_MIGRATION.sql dosyasını')
      console.log('   Supabase Dashboard > SQL Editor\'da çalıştırın.')
    } else {
      console.log('\n✅ Öne çıkan ilan kolonları mevcut!')
    }
  } else {
    console.log('⚠️  Henüz ilan yok')
  }
}

// Test 2: Öne çıkan ilanları sorgula
console.log('\n📋 Test 2: Öne çıkan ilanlar sorgulanıyor...')
const { data: featured, error: featuredError } = await supabase
  .from('listings')
  .select('id, title, is_featured, featured_order, status')
  .eq('is_featured', true)
  .eq('status', 'approved')
  .order('featured_order', { ascending: true })
  .limit(6)

if (featuredError) {
  console.error('❌ Öne çıkan ilanlar sorgu hatası:', featuredError.message)
  console.log('\n⚠️  Migration henüz uygulanmamış olabilir.')
} else {
  console.log(`✅ Sorgu başarılı: ${featured.length} öne çıkan ilan bulundu`)
  if (featured.length > 0) {
    console.log('\n📊 Öne çıkan ilanlar:')
    featured.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.title} (sıra: ${item.featured_order})`)
    })
  } else {
    console.log('   (Henüz öne çıkarılmış ilan yok)')
  }
}

console.log('\n✅ Test tamamlandı!')
