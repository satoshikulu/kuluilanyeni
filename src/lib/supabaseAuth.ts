// ============================================
// SUPABASE AUTH - YENİ AUTH SİSTEMİ
// ============================================
// Custom auth yerine Supabase Auth kullanımı
// Admin sistemiyle tam uyumluluk
// ============================================

import { supabase } from './supabaseClient'
import { syncUserToOneSignal, clearOneSignalUserData } from './oneSignalUserSync'

export interface User {
  id: string
  email?: string
  full_name: string
  phone?: string
  role: 'user' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  error?: string
  user?: User
}

/**
 * Kullanıcı kaydı (Supabase Auth ile)
 */
export async function registerUser(
  fullName: string,
  phone: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Email formatında telefon numarası kullan (geçici çözüm)
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

    // 2. Profile bilgilerini güncelle (trigger otomatik oluşturur ama güncelleme yapalım)
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
 * Kullanıcı girişi (Supabase Auth ile)
 */
export async function loginUser(
  phoneOrEmail: string,
  password: string
): Promise<AuthResponse> {
  try {
    let email = phoneOrEmail
    
    // Eğer telefon numarası girilmişse email formatına çevir
    if (!/[@.]/.test(phoneOrEmail)) {
      const phone = phoneOrEmail.replace(/\D/g, '')
      email = `${phone}@kuluilani.local`
    }

    // 1. Supabase Auth ile giriş
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (authError) {
      console.error('Auth giriş hatası:', authError)
      return {
        success: false,
        error: 'Email/telefon veya şifre hatalı'
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Giriş başarısız'
      }
    }

    // 2. Profile bilgilerini al
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profileData) {
      console.error('Profile alma hatası:', profileError)
      return {
        success: false,
        error: 'Kullanıcı profili bulunamadı'
      }
    }

    // 3. Kullanıcı durumu kontrolü
    if (profileData.status === 'rejected') {
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Hesabınız reddedilmiş. Lütfen yönetici ile iletişime geçin.'
      }
    }

    if (profileData.status === 'pending' && profileData.role !== 'admin') {
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Hesabınız henüz onaylanmamış. Admin onayını bekleyin.'
      }
    }

    const user: User = {
      id: authData.user.id,
      email: authData.user.email,
      full_name: profileData.full_name,
      phone: profileData.phone,
      role: profileData.role,
      status: profileData.status,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at
    }

    // 4. OneSignal senkronizasyonu
    setTimeout(() => {
      syncUserToOneSignal()
    }, 1500)

    return {
      success: true,
      message: 'Giriş başarılı',
      user: user
    }
  } catch (error: any) {
    console.error('Giriş hatası:', error)
    return {
      success: false,
      error: error?.message || 'Giriş sırasında bir hata oluştu'
    }
  }
}

/**
 * Çıkış yap
 */
export async function logoutUser(): Promise<void> {
  try {
    // OneSignal temizliği
    await clearOneSignalUserData()
    
    // Supabase Auth çıkış
    await supabase.auth.signOut()
    
    // Sayfayı yenile
    window.location.href = '/'
  } catch (error) {
    console.error('Çıkış hatası:', error)
    // Hata olsa bile sayfayı yenile
    window.location.href = '/'
  }
}

/**
 * Mevcut kullanıcıyı al
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // 1. Supabase session kontrolü
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return null
    }

    // 2. Profile bilgilerini al
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profileData) {
      console.error('Profile alma hatası:', profileError)
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email,
      full_name: profileData.full_name,
      phone: profileData.phone,
      role: profileData.role,
      status: profileData.status,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at
    }
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
 * Şifre sıfırlama
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Şifre sıfırlama hatası'
    }
  }
}

/**
 * Şifre güncelleme
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Şifre başarıyla güncellendi'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Şifre güncelleme hatası'
    }
  }
}

/**
 * Profil güncelleme
 */
export async function updateProfile(updates: Partial<User>): Promise<AuthResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return {
        success: false,
        error: 'Oturum bulunamadı'
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Profil başarıyla güncellendi'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Profil güncelleme hatası'
    }
  }
}

// ============================================
// BACKWARD COMPATIBILITY
// ============================================
// Eski simpleAuth.ts fonksiyonları için alias'lar

// Eski fonksiyon adları için export
export {
  registerUser as register,
  loginUser as login,
  logoutUser as logout,
  getCurrentUser as getUser,
  isAuthenticated as checkAuth,
  isAdmin as checkAdmin
}