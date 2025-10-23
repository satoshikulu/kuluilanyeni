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

console.log('🚀 Konum verisi olan test ilanı oluşturuluyor...\n')

// Kulu'nun farklı mahallelerinde test ilanları
const testListings = [
  {
    title: 'Harita Testi - Cumhuriyet Mahallesi 3+1 Daire',
    owner_name: 'Test Kullanıcı 1',
    owner_phone: '5551234567',
    neighborhood: 'Cumhuriyet Mahallesi',
    property_type: 'Daire',
    rooms: '3+1',
    area_m2: 125,
    price_tl: 2750000,
    is_for: 'satilik',
    status: 'approved',
    approved_at: new Date().toISOString(),
    description: 'Harita özelliği test ilanı. Cumhuriyet Mahallesi\'nde merkezi konumda daire.',
    address: 'Cumhuriyet Mahallesi, Kulu, Konya',
    latitude: 39.0919,
    longitude: 33.0794,
    location_type: 'address',
    images: ['https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop']
  },
  {
    title: 'Harita Testi - Atatürk Mahallesi Müstakil Ev',
    owner_name: 'Test Kullanıcı 2',
    owner_phone: '5559876543',
    neighborhood: 'Atatürk Mahallesi',
    property_type: 'Müstakil',
    rooms: '4+1',
    area_m2: 180,
    price_tl: 4200000,
    is_for: 'satilik',
    status: 'approved',
    approved_at: new Date().toISOString(),
    description: 'Harita özelliği test ilanı. Atatürk Mahallesi\'nde bahçeli müstakil ev.',
    address: 'Atatürk Mahallesi, Kulu, Konya',
    latitude: 39.0950,
    longitude: 33.0820,
    location_type: 'address',
    images: ['https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1200&auto=format&fit=crop']
  },
  {
    title: 'Harita Testi - Yeni Mahalle 2+1 Kiralık',
    owner_name: 'Test Kullanıcı 3',
    owner_phone: '5551112233',
    neighborhood: 'Yeni Mahallesi',
    property_type: 'Daire',
    rooms: '2+1',
    area_m2: 95,
    price_tl: 15000,
    is_for: 'kiralik',
    status: 'approved',
    approved_at: new Date().toISOString(),
    description: 'Harita özelliği test ilanı. Yeni Mahalle\'de kiralık daire.',
    address: 'Yeni Mahallesi, Kulu, Konya',
    latitude: 39.0890,
    longitude: 33.0760,
    location_type: 'address',
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop']
  }
]

console.log(`📝 ${testListings.length} test ilanı oluşturuluyor...\n`)

const { data: created, error: createError } = await supabase
  .from('listings')
  .insert(testListings)
  .select()

if (createError) {
  console.error('❌ İlan oluşturma hatası:', createError.message)
  process.exit(1)
}

console.log(`✅ ${created.length} test ilanı başarıyla oluşturuldu!\n`)

// Oluşturulan ilanları göster
console.log('📊 Oluşturulan ilanlar:\n')
created.forEach((listing, i) => {
  console.log(`${i + 1}. ${listing.title}`)
  console.log(`   Mahalle: ${listing.neighborhood}`)
  console.log(`   Adres: ${listing.address}`)
  console.log(`   Koordinat: ${listing.latitude}, ${listing.longitude}`)
  console.log(`   Durum: ${listing.status}`)
  console.log(`   ID: ${listing.id}`)
  console.log('')
})

// Konum verisi olan ilanları kontrol et
console.log('📋 Konum verisi olan ilanlar kontrol ediliyor...\n')
const { data: withLocation, error: locationError } = await supabase
  .from('listings')
  .select('id, title, address, latitude, longitude, status')
  .not('latitude', 'is', null)
  .not('longitude', 'is', null)

if (locationError) {
  console.error('❌ Hata:', locationError.message)
} else {
  console.log(`✅ Toplam ${withLocation.length} konum verili ilan var\n`)
}

console.log('🎉 Test ilanları hazır!')
console.log('\n📍 Test Adımları:')
console.log('1. Tarayıcıda http://localhost:5173/ilanlar adresine git')
console.log('2. Yukarıdaki test ilanlarından birine tıkla')
console.log('3. İlan detay sayfasında "Konum" bölümünü kontrol et')
console.log('4. ✅ Harita görünüyor olmalı!')
console.log('\n💡 İlan ID\'leri:')
created.forEach((listing, i) => {
  console.log(`   ${i + 1}. http://localhost:5173/ilan/${listing.id}`)
})
