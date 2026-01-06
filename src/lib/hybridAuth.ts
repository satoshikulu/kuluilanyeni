// ============================================
// HİBRİT AUTH SİSTEMİ
// ============================================
// Eski kullanıcılar: Custom Auth (simpleAuth.ts)
// Yeni kullanıcılar: Supabase Auth (supabaseAuth.ts)
// Zamanla tüm kullanıcıları Supabase Auth'a geçir
// ============================================

import { supabase } from './supabaseClient'
import { syncUserToOneSignal, clearOneSignalUserData } from './oneSignalUserSync'
import { saveUser, getUser, removeUser } from './persistentStorage'

// Basit şifre hash (production'da daha güvenli bir yöntem kullanın)
function simpleHash(password: string): string {
  return password // Şimdilik plain text
}

export interface User {
  id: string
  full_name: string
  phone?: string
  email?: string
  role: 'user' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  auth_type: 'custom' | 'supabase' // Hangi auth sistemi kullanıyor
  created_at?: string
  updated_at?: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  error?: string
  user?: User
  migration_available?: boolean // Kullanıcı Supabase Auth'a geçebilir mi?
}

/**
 * Kullanıcı kaydı - Sadece Supabase Auth kullan
 */
export async function registerUser(
  fullName: string,
  phone: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Email formatında telefon numarası kullan
    const email = `${phone.replace(/\D/g, '')}@kuluilani.local`
    
    // 1. Supabase Auth ile kayıt
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          phone: phone
        }
      }
    })

    if (authError) {
      console.error('Auth kayıt hatası:', authError)
      return {
        success: false,
        error: authError.message === 'User already registered' 
          ? 'Bu telefon numarası zaten kayıtlı' 
          : 'Kayıt sırasında bir hata oluştu'
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Kullanıcı oluşturulamadı'
      }
    }

    // 2. Profile bilgilerini güncelle
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile güncelleme hatası:', profileError)
    }

    return {
      success: true,
      message: 'Kayıt başarılı! Admin onayından sonra giriş yapabilirsiniz.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        phone: phone,
        role: 'user',
        status: 'pending',
        auth_type: 'supabase',
        created_at: authData.user.created_at,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error: any) {
    console.error('Kayıt hatası:', error)
    return {
      success: false,
      error: error?.message || 'Kayıt sırasında bir hata oluştu'
    }
  }
}

/**
 * Hibrit kullanıcı girişi
 * 1. Önce Supabase Auth dener
 * 2. Başarısız olursa Custom Auth dener
 */
export async function loginUser(
  phoneOrEmail: string,
  password: string
): Promise<AuthResponse> {
  console.log('🔄 Hibrit giriş başlatılıyor:', phoneOrEmail)

  // ADIM 1: Supabase Auth ile dene
  const supabaseResult = await trySupabaseAuth(phoneOrEmail, password)
  if (supabaseResult.success) {
    console.log('✅ Supabase Auth ile giriş başarılı')
    return supabaseResult
  }

  console.log('⚠️ Supabase Auth başarısız, Custom Auth deneniyor...')

  // ADIM 2: Custom Auth ile dene
  const customResult = await tryCustomAuth(phoneOrEmail, password)
  if (customResult.success) {
    console.log('✅ Custom Auth ile giriş başarılı')
    // Migration seçeneği sun
    customResult.migration_available = true
    customResult.message = 'Giriş başarılı! Daha güvenli sisteme geçmek ister misiniz?'
    return customResult
  }

  console.log('❌ Her iki auth sistemi de başarısız')
  return {
    success: false,
    error: 'Telefon/email veya şifre hatalı'
  }
}

/**
 * Supabase Auth ile giriş denemesi
 */
async function trySupabaseAuth(phoneOrEmail: string, password: string): Promise<AuthResponse> {
  try {
    let email = phoneOrEmail
    
    // Telefon numarası ise email formatına çevir
    if (!/[@.]/.test(phoneOrEmail)) {
      const phone = phoneOrEmail.replace(/\D/g, '')
      email = `${phone}@kuluilani.local`
    }

    // Supabase Auth ile giriş
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Supabase Auth başarısız' }
    }

    // Profile bilgilerini al
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profileData) {
      return { success: false, error: 'Profile bulunamadı' }
    }

    // Kullanıcı durumu kontrolü
    if (profileData.status === 'rejected') {
      await supabase.auth.signOut()
      return { success: false, error: 'Hesabınız reddedilmiş' }
    }

    if (profileData.status === 'pending' && profileData.role !== 'admin') {
      await supabase.auth.signOut()
      return { success: false, error: 'Hesabınız henüz onaylanmamış' }
    }

    const user: User = {
      id: authData.user.id,
      email: authData.user.email,
      full_name: profileData.full_name,
      phone: profileData.phone,
      role: profileData.role,
      status: profileData.status,
      auth_type: 'supabase',
      created_at: profileData.created_at,
      updated_at: profileData.updated_at
    }

    // OneSignal senkronizasyonu
    setTimeout(() => syncUserToOneSignal(), 1500)

    return { success: true, message: 'Supabase Auth ile giriş başarılı', user }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Supabase Auth hatası' }
  }
}

/**
 * Custom Auth ile giriş denemesi (eski kullanıcılar için)
 */
async function tryCustomAuth(phone: string, password: string): Promise<AuthResponse> {
  try {
    // Custom auth RPC fonksiyonu
    const { data, error } = await supabase
      .rpc('login_user', {
        p_password: simpleHash(password),
        p_phone_or_email: phone
      })

    if (error) {
      return { success: false, error: 'Custom Auth RPC hatası' }
    }

    const result = data as any
    
    if (result.success && result.user) {
      // Kullanıcıyı kalıcı storage'a kaydet (iOS PWA uyumlu)
      await saveUser({
        ...result.user,
        auth_type: 'custom'
      })
      
      // OneSignal senkronizasyonu
      setTimeout(() => syncUserToOneSignal(), 1500)
      
      return {
        success: true,
        message: 'Custom Auth ile giriş başarılı',
        user: {
          ...result.user,
          auth_type: 'custom'
        }
      }
    }

    return { success: false, error: result.error || 'Custom Auth başarısız' }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Custom Auth hatası' }
  }
}

/**
 * Çıkış yap (hibrit)
 */
export async function logoutUser(): Promise<void> {
  try {
    // OneSignal temizliği
    await clearOneSignalUserData()
    
    // Supabase Auth çıkış (hata olsa bile devam et)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('Supabase Auth çıkış hatası:', error)
    }
    
    // Custom auth temizliği
    await removeUser()
    
    // SessionStorage temizliği
    sessionStorage.removeItem('isAdmin')
    
    // Sayfayı yenile
    window.location.href = '/'
  } catch (error) {
    console.error('Çıkış hatası:', error)
    window.location.href = '/'
  }
}

/**
 * Mevcut kullanıcıyı al (hibrit)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // 1. Önce Supabase Auth kontrol et
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      // Supabase Auth kullanıcısı var
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        return {
          id: session.user.id,
          email: session.user.email,
          full_name: profileData.full_name,
          phone: profileData.phone,
          role: profileData.role,
          status: profileData.status,
          auth_type: 'supabase',
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        }
      }
    }

    // 2. Custom auth kontrol et
    const customUser = await getUser()
    if (customUser) {
      return {
        ...customUser,
        auth_type: 'custom'
      }
    }

    return null
  } catch (error) {
    console.error('getCurrentUser hatası:', error)
    return null
  }
}

/**
 * Kullanıcı giriş yapmış mı?
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null && user.status === 'approved'
}

/**
 * Kullanıcı admin mi?
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null && user.role === 'admin'
}

/**
 * Kullanıcıyı Supabase Auth'a migrate et
 */
export async function migrateToSupabaseAuth(
  currentUser: User,
  newPassword: string
): Promise<AuthResponse> {
  try {
    if (currentUser.auth_type === 'supabase') {
      return { success: false, error: 'Kullanıcı zaten Supabase Auth kullanıyor' }
    }

    // Email formatında telefon numarası
    const email = `${(currentUser.phone || '').replace(/\D/g, '')}@kuluilani.local`
    
    // Supabase Auth'a kayıt
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: newPassword,
      options: {
        data: {
          full_name: currentUser.full_name,
          phone: currentUser.phone
        }
      }
    })

    if (authError || !authData.user) {
      return { success: false, error: 'Migration başarısız: ' + authError?.message }
    }

    // Profile güncelle
    await supabase
      .from('profiles')
      .update({
        full_name: currentUser.full_name,
        phone: currentUser.phone,
        status: currentUser.status,
        role: currentUser.role,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)

    // Eski custom auth verilerini temizle
    await removeUser()

    return {
      success: true,
      message: 'Başarıyla Supabase Auth\'a geçildi!',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: currentUser.full_name,
        phone: currentUser.phone,
        role: currentUser.role,
        status: currentUser.status,
        auth_type: 'supabase',
        created_at: authData.user.created_at,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Migration hatası'
    }
  }
}

// ============================================
// BACKWARD COMPATIBILITY
// ============================================
export {
  registerUser as register,
  loginUser as login,
  logoutUser as logout,
  getCurrentUser as getUser,
  isAuthenticated as checkAuth,
  isAdmin as checkAdmin
}