import { supabase } from './supabaseClient'
import { subscribeUserToPush, unsubscribeUserFromPush } from './oneSignal'

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
        p_phone: phone,
        p_password: simpleHash(password)
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
      // Kullanıcıyı localStorage'a kaydet
      localStorage.setItem('user', JSON.stringify(result.user))
      
      // OneSignal push notification subscribe işlemi
      try {
        await subscribeUserToPush(result.user.id);
      } catch (error) {
        console.warn('OneSignal subscription failed during login:', error);
      }
      
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
  // OneSignal tag'lerini temizle
  try {
    await unsubscribeUserFromPush();
  } catch (error) {
    console.warn('OneSignal unsubscribe failed during logout:', error);
  }
  
  localStorage.removeItem('user')
  window.location.href = '/'
}

/**
 * Mevcut kullanıcıyı al
 */
export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    
    const user = JSON.parse(userStr)
    return user
  } catch {
    return null
  }
}

/**
 * Kullanıcı giriş yapmış mı?
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

/**
 * Kullanıcı admin mi?
 */
export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Admin: Kullanıcı onayla
 */
export async function approveUser(userId: string): Promise<AuthResponse> {
  const currentUser = getCurrentUser()
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
  const currentUser = getCurrentUser()
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
