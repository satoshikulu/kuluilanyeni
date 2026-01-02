import { supabase } from './supabaseClient'
import { syncUserToOneSignal, clearOneSignalUserData } from './oneSignalUserSync'
import { saveUser, getUser, removeUser } from './persistentStorage'

// Basit şifre hash (production'da daha güvenli bir yöntem kullanın)
function simpleHash(password: string): string {
  // Şimdilik plain text, isterseniz crypto-js ekleyebiliriz
  return password
}

export interface User {
  id: string
  full_name: string
  phone: string
  role: 'user' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  email?: string // Optional email field for admin users and future email functionality
}

export interface AuthResponse {
  success: boolean
  message?: string
  error?: string
  user?: User
}

/**
 * Kullanıcı kaydı
 */
export async function registerUser(
  fullName: string,
  phone: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase
      .rpc('register_user', {
        p_full_name: fullName,
        p_phone: phone,
        p_password: simpleHash(password)
      })

    if (error) {
      console.error('Kayıt hatası:', error)
      return {
        success: false,
        error: 'Kayıt sırasında bir hata oluştu'
      }
    }

    const result = data as any
    return {
      success: result.success || false,
      message: result.message,
      error: result.error
    }
  } catch (error) {
    console.error('Kayıt hatası:', error)
    return {
      success: false,
      error: 'Kayıt sırasında bir hata oluştu'
    }
  }
}

/**
 * Kullanıcı girişi
 */
export async function loginUser(
  phone: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase
      .rpc('login_user', {
        p_password: simpleHash(password),
        p_phone_or_email: phone
      })

    if (error) {
      console.error('Giriş hatası:', error)
      return {
        success: false,
        error: 'Giriş sırasında bir hata oluştu'
      }
    }

    const result = data as any
    
    if (result.success && result.user) {
      // Kullanıcıyı kalıcı storage'a kaydet (iOS PWA uyumlu)
      await saveUser(result.user)
      
      // OneSignal'a kullanıcı bilgilerini senkronize et
      setTimeout(() => {
        syncUserToOneSignal()
      }, 1500) // OneSignal'ın hazır olması için bekle
      
      return {
        success: true,
        message: result.message,
        user: result.user
      }
    }

    return {
      success: false,
      error: result.error || 'Giriş başarısız'
    }
  } catch (error) {
    console.error('Giriş hatası:', error)
    return {
      success: false,
      error: 'Giriş sırasında bir hata oluştu'
    }
  }
}

/**
 * Çıkış yap
 */
export async function logoutUser(): Promise<void> {
  // OneSignal kullanıcı bilgilerini temizle
  const currentUser = await getCurrentUser();
  if (currentUser) {
    try {
      await clearOneSignalUserData()
      console.log('✅ OneSignal kullanıcı bilgileri temizlendi');
    } catch (error) {
      console.warn('⚠️ OneSignal temizliği başarısız:', error);
    }
  }
  
  // Kalıcı storage'dan kullanıcıyı sil
  await removeUser()
  window.location.href = '/'
}

/**
 * Mevcut kullanıcıyı al
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await getUser()
  } catch {
    return null
  }
}

/**
 * Kullanıcı giriş yapmış mı?
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Kullanıcı admin mi?
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Admin: Kullanıcı onayla
 */
export async function approveUser(userId: string): Promise<AuthResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'admin') {
    return {
      success: false,
      error: 'Yetkiniz yok'
    }
  }

  try {
    const { data, error } = await supabase
      .rpc('approve_user', {
        p_user_id: userId,
        p_admin_id: currentUser.id
      })

    if (error) {
      console.error('Onaylama hatası:', error)
      return {
        success: false,
        error: 'Onaylama sırasında bir hata oluştu'
      }
    }

    const result = data as any
    return {
      success: result.success || false,
      message: result.message,
      error: result.error
    }
  } catch (error) {
    console.error('Onaylama hatası:', error)
    return {
      success: false,
      error: 'Onaylama sırasında bir hata oluştu'
    }
  }
}

/**
 * Admin: Kullanıcı reddet
 */
export async function rejectUser(userId: string): Promise<AuthResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'admin') {
    return {
      success: false,
      error: 'Yetkiniz yok'
    }
  }

  try {
    const { data, error } = await supabase
      .rpc('reject_user', {
        p_user_id: userId,
        p_admin_id: currentUser.id
      })

    if (error) {
      console.error('Reddetme hatası:', error)
      return {
        success: false,
        error: 'Reddetme sırasında bir hata oluştu'
      }
    }

    const result = data as any
    return {
      success: result.success || false,
      message: result.message,
      error: result.error
    }
  } catch (error) {
    console.error('Reddetme hatası:', error)
    return {
      success: false,
      error: 'Reddetme sırasında bir hata oluştu'
    }
  }
}
