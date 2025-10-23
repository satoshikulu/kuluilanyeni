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

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 Test için öne çıkan ilan oluşturuluyor...\n')

// Önce onaylı bir ilan var mı kontrol et
const { data: approvedListings, error: fetchError } = await supabase
  .from('listings')
  .select('*')
  .eq('status', 'approved')
  .limit(3)

if (fetchError) {
  console.error('❌ Hata:', fetchError.message)
  process.exit(1)
}

if (!approvedListings || approvedListings.length === 0) {
  console.log('⚠️  Onaylı ilan bulunamadı. Önce test ilanı oluşturuluyor...\n')
  
  // Test ilanı oluştur
  const testListings = [
    {
      title: 'Merkez Konumda 3+1 Satılık Daire',
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
      description: 'Merkezi konumda, asansörlü binada, güneş alan daire.',
      is_featured: true,
      featured_order: 1,
      images: ['https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop']
    },
    {
      title: 'Lüks 2+1 Kiralık Daire',
      owner_name: 'Test Kullanıcı 2',
      owner_phone: '5559876543',
      neighborhood: 'Yeni Mahallesi',
      property_type: 'Daire',
      rooms: '2+1',
      area_m2: 95,
      price_tl: 15000,
      is_for: 'kiralik',
      status: 'approved',
      approved_at: new Date().toISOString(),
      description: 'Yeni binada, eşyalı, ailelere uygun.',
      is_featured: true,
      featured_order: 2,
      images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop']
    },
    {
      title: 'Bahçeli 4+1 Müstakil Ev',
      owner_name: 'Test Kullanıcı 3',
      owner_phone: '5551112233',
      neighborhood: 'Atatürk Mahallesi',
      property_type: 'Müstakil',
      rooms: '4+1',
      area_m2: 180,
      price_tl: 4200000,
      is_for: 'satilik',
      status: 'approved',
      approved_at: new Date().toISOString(),
      description: 'Geniş bahçeli, müstakil ev. Ailelere uygun.',
      is_featured: true,
      featured_order: 3,
      images: ['https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1200&auto=format&fit=crop']
    }
  ]
  
  const { data: created, error: createError } = await supabase
    .from('listings')
    .insert(testListings)
    .select()
  
  if (createError) {
    console.error('❌ İlan oluşturma hatası:', createError.message)
    process.exit(1)
  }
  
  console.log(`✅ ${created.length} test ilanı oluşturuldu ve öne çıkarıldı!\n`)
} else {
  console.log(`📋 ${approvedListings.length} onaylı ilan bulundu\n`)
  
  // İlk 3 ilanı öne çıkar
  for (let i = 0; i < Math.min(3, approvedListings.length); i++) {
    const listing = approvedListings[i]
    const { error: updateError } = await supabase
      .from('listings')
      .update({ 
        is_featured: true, 
        featured_order: i + 1 
      })
      .eq('id', listing.id)
    
    if (updateError) {
      console.error(`❌ İlan ${i + 1} güncellenemedi:`, updateError.message)
    } else {
      console.log(`✅ İlan ${i + 1} öne çıkarıldı: ${listing.title}`)
    }
  }
}

// Sonucu kontrol et
console.log('\n📊 Öne çıkan ilanlar kontrol ediliyor...\n')
const { data: featured, error: featuredError } = await supabase
  .from('listings')
  .select('id, title, is_featured, featured_order, status')
  .eq('is_featured', true)
  .eq('status', 'approved')
  .order('featured_order', { ascending: true })

if (featuredError) {
  console.error('❌ Hata:', featuredError.message)
} else {
  console.log(`✅ Toplam ${featured.length} öne çıkan ilan:\n`)
  featured.forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.title}`)
    console.log(`      Sıra: ${item.featured_order}`)
    console.log('')
  })
}

console.log('🎉 Hazır! Şimdi http://localhost:5173 adresini tarayıcıda açın.')
console.log('   Ana sayfada "Öne çıkan ilanlar" bölümünde ilanları göreceksiniz.')
