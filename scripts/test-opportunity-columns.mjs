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

console.log('🔍 Fırsat ilan kolonları kontrol ediliyor...\n')

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
    console.log('   - is_opportunity:', typeof firstListing.is_opportunity, '(', firstListing.is_opportunity, ')')
    console.log('   - opportunity_order:', typeof firstListing.opportunity_order, '(', firstListing.opportunity_order, ')')
    console.log('   - original_price_tl:', typeof firstListing.original_price_tl, '(', firstListing.original_price_tl, ')')
    console.log('   - discount_percentage:', typeof firstListing.discount_percentage, '(', firstListing.discount_percentage, ')')
    
    if (firstListing.is_opportunity === undefined) {
      console.log('\n⚠️  is_opportunity kolonu bulunamadı!')
      console.log('📋 Lütfen OPPORTUNITY_LISTINGS_MIGRATION.sql dosyasını')
      console.log('   Supabase Dashboard > SQL Editor\'da çalıştırın.')
    } else {
      console.log('\n✅ Fırsat ilan kolonları mevcut!')
    }
  } else {
    console.log('⚠️  Henüz ilan yok')
  }
}

// Test 2: Fırsat ilanları sorgula
console.log('\n📋 Test 2: Fırsat ilanları sorgulanıyor...')
const { data: opportunities, error: opportunitiesError } = await supabase
  .from('listings')
  .select('id, title, is_opportunity, opportunity_order, original_price_tl, price_tl, discount_percentage, status')
  .eq('is_opportunity', true)
  .eq('status', 'approved')
  .order('opportunity_order', { ascending: true })
  .limit(10)

if (opportunitiesError) {
  console.error('❌ Fırsat ilanları sorgu hatası:', opportunitiesError.message)
  console.log('\n⚠️  Migration henüz uygulanmamış olabilir.')
} else {
  console.log(`✅ Sorgu başarılı: ${opportunities.length} fırsat ilan bulundu`)
  if (opportunities.length > 0) {
    console.log('\n📊 Fırsat ilanları:')
    opportunities.forEach((item, i) => {
      const discount = item.discount_percentage || (item.original_price_tl && item.price_tl 
        ? Math.round(((item.original_price_tl - item.price_tl) / item.original_price_tl) * 100)
        : 0)
      console.log(`   ${i + 1}. ${item.title}`)
      console.log(`      Sıra: ${item.opportunity_order}`)
      if (item.original_price_tl) {
        console.log(`      Eski Fiyat: ${item.original_price_tl.toLocaleString('tr-TR')} TL`)
        console.log(`      Yeni Fiyat: ${item.price_tl?.toLocaleString('tr-TR')} TL`)
        console.log(`      İndirim: %${discount}`)
      }
      console.log('')
    })
  } else {
    console.log('   (Henüz fırsat olarak işaretlenmiş ilan yok)')
  }
}

console.log('✅ Test tamamlandı!')
