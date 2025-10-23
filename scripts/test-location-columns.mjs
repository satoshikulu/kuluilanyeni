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

console.log('🔍 Harita kolonları kontrol ediliyor...\n')

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
    console.log('   - address:', typeof firstListing.address, '(', firstListing.address || 'NULL', ')')
    console.log('   - latitude:', typeof firstListing.latitude, '(', firstListing.latitude || 'NULL', ')')
    console.log('   - longitude:', typeof firstListing.longitude, '(', firstListing.longitude || 'NULL', ')')
    console.log('   - location_type:', typeof firstListing.location_type, '(', firstListing.location_type || 'NULL', ')')
    
    if (firstListing.latitude === undefined) {
      console.log('\n⚠️  Konum kolonları bulunamadı!')
      console.log('📋 Lütfen scripts/add-location-columns.sql dosyasını')
      console.log('   Supabase Dashboard > SQL Editor\'da çalıştırın.')
    } else if (firstListing.latitude === null) {
      console.log('\n⚠️  Konum kolonları mevcut ama veri yok!')
      console.log('📋 Yeni ilan ekleyerek veya mevcut ilanları güncelleyerek test edin.')
    } else {
      console.log('\n✅ Konum kolonları mevcut ve veri var!')
    }
  } else {
    console.log('⚠️  Henüz ilan yok')
  }
}

// Test 2: Konum verisi olan ilanları sorgula
console.log('\n📋 Test 2: Konum verisi olan ilanlar sorgulanıyor...')
const { data: withLocation, error: locationError } = await supabase
  .from('listings')
  .select('id, title, address, latitude, longitude, status')
  .not('latitude', 'is', null)
  .not('longitude', 'is', null)
  .limit(10)

if (locationError) {
  console.error('❌ Konum sorgu hatası:', locationError.message)
  console.log('\n⚠️  Migration henüz uygulanmamış olabilir.')
} else {
  console.log(`✅ Sorgu başarılı: ${withLocation.length} konum verili ilan bulundu`)
  if (withLocation.length > 0) {
    console.log('\n📊 Konum verili ilanlar:')
    withLocation.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.title}`)
      console.log(`      Adres: ${item.address || 'Yok'}`)
      console.log(`      Koordinat: ${item.latitude}, ${item.longitude}`)
      console.log(`      Durum: ${item.status}`)
      console.log('')
    })
  } else {
    console.log('   (Henüz konum verisi olan ilan yok)')
    console.log('   💡 Yeni ilan ekleyerek test edebilirsiniz: http://localhost:5173/ilan-ver')
  }
}

// Test 3: Tüm ilanların konum durumu
console.log('\n📋 Test 3: Tüm ilanların konum durumu...')
const { data: allListings, error: allError } = await supabase
  .from('listings')
  .select('id, latitude, longitude')

if (!allError && allListings) {
  const withLoc = allListings.filter(l => l.latitude && l.longitude).length
  const withoutLoc = allListings.length - withLoc
  
  console.log(`✅ Toplam ${allListings.length} ilan:`)
  console.log(`   - Konum verisi olan: ${withLoc} ilan`)
  console.log(`   - Konum verisi olmayan: ${withoutLoc} ilan`)
  
  if (withoutLoc > 0) {
    console.log('\n💡 Konum verisi olmayan ilanlar için:')
    console.log('   1. Admin panelden düzenle')
    console.log('   2. Veya toplu güncelleme scripti çalıştır')
  }
}

console.log('\n✅ Test tamamlandı!')
console.log('\n📝 Özet:')
console.log('   - Kolonlar mevcut mu? ' + (listings?.[0]?.latitude !== undefined ? '✅ Evet' : '❌ Hayır'))
console.log('   - Konum verisi var mı? ' + (withLocation && withLocation.length > 0 ? '✅ Evet' : '❌ Hayır'))
console.log('   - Harita çalışır mı? ' + (withLocation && withLocation.length > 0 ? '✅ Evet' : '⚠️ Test gerekli'))
