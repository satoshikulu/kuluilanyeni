import { supabase } from './supabaseClient'
import { removeUser } from './persistentStorage'
import { normalizePhone } from './phoneValidation'

interface MigrationResult {
  success: boolean
  error?: string
  user?: any
}

/**
 * Custom auth kullanıcısını Supabase Auth'a migrate et
 */
export async function migrateToSupabaseAuth(customUser: any): Promise<MigrationResult> {
  try {
    console.log('🔄 Migration başlatılıyor:', customUser.full_name)

    // 1. Telefon numarasını normalize et
    const normalizedPhone = normalizePhone(customUser.phone)
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Geçersiz telefon numarası'
      }
    }

    // 2. Email adresi oluştur (telefon@kuluilani.com formatında)
    const email = `${normalizedPhone}@kuluilani.com`

    // 3. Geçici şifre oluştur (kullanıcı daha sonra değiştirebilir)
    const tempPassword = generateTempPassword()

    // 4. Supabase Auth'ta kullanıcı oluştur
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: tempPassword,
      options: {
        data: {
          full_name: customUser.full_name,
          phone: customUser.phone,
          migrated_from_custom: true,
          migration_date: new Date().toISOString()
        }
      }
    })

    if (authError) {
      console.error('Supabase Auth kayıt hatası:', authError)
      return {
        success: false,
        error: `Kayıt hatası: ${authError.message}`
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Kullanıcı oluşturulamadı'
      }
    }

    // 5. Profile kaydı oluştur/güncelle
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: customUser.full_name,
        phone: customUser.phone,
        role: 'user',
        status: 'approved', // Custom'dan gelenler otomatik onaylı
        created_at: customUser.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        migrated_from_custom: true,
        migration_date: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile kayıt hatası:', profileError)
      // Auth kaydını temizle
      await supabase.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        error: `Profile hatası: ${profileError.message}`
      }
    }

    // 6. Custom auth kaydını sil
    try {
      await removeUser()
      console.log('✅ Custom auth kaydı silindi')
    } catch (error) {
      console.warn('⚠️ Custom auth silme hatası:', error)
      // Bu hata migration'ı durdurmaz
    }

    // 7. Otomatik giriş yap
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: tempPassword
    })

    if (signInError) {
      console.warn('⚠️ Otomatik giriş hatası:', signInError)
      // Bu hata migration'ı durdurmaz
    }

    console.log('✅ Migration başarılı:', customUser.full_name)
    
    return {
      success: true,
      user: {
        id: authData.user.id,
        email: email,
        full_name: customUser.full_name,
        phone: customUser.phone,
        role: 'user',
        status: 'approved',
        auth_type: 'supabase',
        temp_password: tempPassword // Kullanıcıya göstermek için
      }
    }

  } catch (error: any) {
    console.error('❌ Migration hatası:', error)
    return {
      success: false,
      error: error.message || 'Beklenmeyen hata'
    }
  }
}

/**
 * Geçici şifre oluştur
 */
function generateTempPassword(): string {
  // Güvenli ama hatırlanabilir geçici şifre
  const adjectives = ['Hızlı', 'Güçlü', 'Akıllı', 'Cesur', 'Neşeli']
  const nouns = ['Aslan', 'Kartal', 'Dağ', 'Deniz', 'Yıldız']
  const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  
  return `${adjective}${noun}${numbers}`
}

/**
 * Migration durumunu kontrol et
 */
export async function checkMigrationStatus(phone: string): Promise<boolean> {
  try {
    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return false

    const { data, error } = await supabase
      .from('profiles')
      .select('migrated_from_custom')
      .eq('phone', phone)
      .single()

    if (error) return false
    
    return data?.migrated_from_custom === true
  } catch (error) {
    return false
  }
}

/**
 * Tüm custom kullanıcıları listele (admin için)
 */
export async function getCustomUsersCount(): Promise<number> {
  try {
    // Bu fonksiyon custom auth storage'ından kullanıcı sayısını alır
    // Şimdilik basit bir implementasyon
    return 0 // Gerçek implementasyon gerekirse eklenebilir
  } catch (error) {
    return 0
  }
}