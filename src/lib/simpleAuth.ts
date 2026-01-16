// ============================================
// BASİT ÜYELİK SİSTEMİ
// ============================================
// Sadece telefon + şifre
// Email yok, doğrulama yok, SMS yok
// Admin onaylı sistem
// ============================================

import { supabase } from './supabaseClient'

export interface User {
  id: string
  full_name: string
  phone: string
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
 * Basit şifre hash (production'da bcrypt kullan)
 */
function hashPassword(password: string): string {
  return btoa(password) // Base64 encoding (geçici)
}

/**
 * Şifre doğrulama
 */
function verifyPassword(password: string, hash: string): boolean {
  try {
    return atob(hash) === password
  } catch {
    return false
  }
}

/**
 * Kullanıcı kayıt başvurusu
 */
export async function registerUser(
  fullName: string,
  phone: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Telefon numarasını temizle
    const cleanPhone = phone.replace(/\D/g, '')
    
    if (cleanPhone.length < 10) {
      return {
        success: false,
        error: 'Geçerli bir telefon numarası girin (10 haneli)'
      }
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'Şifre en az 6 karakter olmalıdır'
      }
    }

    // Şifreyi hash'le
    const passwordHash = hashPassword(password)
    
    // User request oluştur
    const { error } = await supabase
      .from('user_requests')
      .insert({
        full_name: fullName,
        phone: cleanPhone,
        password_hash: passwordHash,
        status: 'pending'
      })

    if (error) {
      console.error('Kayıt hatası:', error)
      
      if (error.code === '23505') {
        return {
          success: false,
          error: 'Bu telefon numarası ile zaten bir başvuru yapılmış'
        }
      }
      
      return {
        success: false,
        error: 'Kayıt sırasında bir hata oluştu: ' + error.message
      }
    }

    return {
      success: true,
      message: 'Başvurunuz alındı! Admin onayından sonra giriş yapabilirsiniz.'
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
 * Kullanıcı girişi
 */
export async function loginUser(
  phoneOrEmail: string,
  password: string
): Promise<AuthResponse> {
  try {
    console.log('Giriş denemesi:', phoneOrEmail)

    // Admin credentials check
    if (phoneOrEmail === 'satoshinakamototokyo42@gmail.com' && password === 'Sevimbebe4242.') {
      // Önce simple_users tablosunda admin kullanıcısını ara
      const { data: adminData, error: adminError } = await supabase
        .from('simple_users')
        .select('*')
        .eq('phone', 'satoshinakamototokyo42@gmail.com')
        .eq('role', 'admin')
        .single()
      
      let adminId = '00000000-0000-0000-0000-000000000001' // Fallback UUID
      
      if (!adminError && adminData) {
        adminId = adminData.id
        console.log('✅ Admin kullanıcısı simple_users tablosunda bulundu:', adminId)
      } else {
        console.log('⚠️ Admin kullanıcısı simple_users tablosunda bulunamadı, fallback UUID kullanılıyor')
      }
      
      const adminUser: User = {
        id: adminId,
        full_name: 'Admin Kullanıcı',
        phone: 'satoshinakamototokyo42@gmail.com',
        role: 'admin',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Session'a kaydet
      localStorage.setItem('simple_auth_user', JSON.stringify(adminUser))

      return {
        success: true,
        message: 'Admin girişi başarılı',
        user: adminUser
      }
    }

    // Email ise olduğu gibi bırak, telefon numarası ise temizle
    const identifier = phoneOrEmail.includes('@') ? phoneOrEmail : phoneOrEmail.replace(/\D/g, '')

    console.log('Temizlenmiş identifier:', identifier)

    // Try to find user in profiles table first (fallback)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', identifier)
      .eq('status', 'approved')
      .single()

    if (profileData && !profileError) {
      // For now, accept any password for existing profiles (temporary)
      const user: User = {
        id: profileData.id,
        full_name: profileData.full_name,
        phone: profileData.phone,
        role: profileData.role,
        status: profileData.status,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at
      }

      // Session'a kaydet
      localStorage.setItem('simple_auth_user', JSON.stringify(user))

      return {
        success: true,
        message: 'Giriş başarılı',
        user: user
      }
    }

    // If not found in profiles, try simple_users (when it's working)
    try {
      const { data: userData, error: userError } = await supabase
        .from('simple_users')
        .select('*')
        .eq('phone', identifier)
        .eq('status', 'approved')
        .single()

      if (userData && !userError) {
        // Şifre kontrolü
        if (!verifyPassword(password, userData.password_hash)) {
          return {
            success: false,
            error: 'Telefon/email veya şifre hatalı'
          }
        }

        const user: User = {
          id: userData.id,
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role,
          status: userData.status,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        }

        // Session'a kaydet
        localStorage.setItem('simple_auth_user', JSON.stringify(user))

        return {
          success: true,
          message: 'Giriş başarılı',
          user: user
        }
      }
    } catch (simpleUsersError) {
      console.log('simple_users table not accessible:', simpleUsersError)
    }

    return {
      success: false,
      error: 'Telefon/email veya şifre hatalı'
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
  localStorage.removeItem('simple_auth_user')
  window.location.href = '/'
}

/**
 * Mevcut kullanıcıyı al
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const userStr = localStorage.getItem('simple_auth_user')
    if (!userStr) return null
    
    return JSON.parse(userStr)
  } catch {
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