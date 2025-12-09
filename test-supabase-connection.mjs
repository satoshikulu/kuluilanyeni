import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// .env dosyasını yükle
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Supabase Bağlantı Testi\n')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'YOK')
console.log('')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ .env dosyasında VITE_SUPABASE_URL veya VITE_SUPABASE_ANON_KEY eksik!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('📡 Supabase bağlantısı test ediliyor...\n')

    // 1. Veritabanı bağlantısı testi
    console.log('1️⃣ Veritabanı tabloları kontrol ediliyor...')
    const { data: tables, error: tablesError } = await supabase
      .from('listings')
      .select('id')
      .limit(1)

    if (tablesError) {
      console.error('❌ Listings tablosu hatası:', tablesError.message)
    } else {
      console.log('✅ Listings tablosu erişilebilir')
    }

    // 2. Users tablosu kontrolü
    console.log('\n2️⃣ Users tablosu kontrol ediliyor...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (usersError) {
      console.error('❌ Users tablosu hatası:', usersError.message)
    } else {
      console.log('✅ Users tablosu erişilebilir')
    }

    // 3. Storage bucket kontrolü
    console.log('\n3️⃣ Storage bucket kontrol ediliyor...')
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()

    if (bucketsError) {
      console.error('❌ Storage hatası:', bucketsError.message)
    } else {
      console.log('✅ Storage erişilebilir')
      console.log('   Buckets:', buckets.map(b => b.name).join(', '))
    }

    // 4. Auth durumu kontrolü
    console.log('\n4️⃣ Auth sistemi kontrol ediliyor...')
    const { data: authData, error: authError } = await supabase.auth.getSession()

    if (authError) {
      console.error('❌ Auth hatası:', authError.message)
    } else {
      console.log('✅ Auth sistemi çalışıyor')
      console.log('   Session:', authData.session ? 'Aktif' : 'Yok (normal)')
    }

    // 5. İstatistikler
    console.log('\n5️⃣ Veritabanı istatistikleri...')
    
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
    
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    console.log('   Toplam ilan sayısı:', listingsCount ?? 'Bilinmiyor')
    console.log('   Toplam kullanıcı sayısı:', usersCount ?? 'Bilinmiyor')

    console.log('\n✅ Tüm testler tamamlandı!')
    console.log('🎉 Supabase bağlantısı çalışıyor!\n')

  } catch (error) {
    console.error('\n❌ Test sırasında hata:', error.message)
    process.exit(1)
  }
}

testConnection()
