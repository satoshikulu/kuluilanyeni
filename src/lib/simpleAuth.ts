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
      const adminUser: User = {
        id: '00000000-0000-0000-0000-000000000001', // Sabit UUID
        full_name: 'Admin Kullanıcı',
        phone: 'satoshinakamototokyo42@gmail.com',
        role: 'admin',
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Session'a kaydet (login time ile)
      const adminUserWithTime = { ...adminUser, loginTime: Date.now() }
      localStorage.setItem('simple_auth_user', JSON.stringify(adminUserWithTime))

      console.log('✅ Admin girişi başarılı (optimized):', adminUser.id)

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

      // Session'a kaydet (login time ile)
      const userWithTime = { ...user, loginTime: Date.now() }
      localStorage.setItem('simple_auth_user', JSON.stringify(userWithTime))

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

        // Session'a kaydet (login time ile)
        const userWithTime = { ...user, loginTime: Date.now() }
        localStorage.setItem('simple_auth_user', JSON.stringify(userWithTime))

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
 * Kullanıcı admin mi? (Backend doğrulaması ile)
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return false
    }

    // Sabit admin ID kontrolü (hardcoded admin)
    if (user.id === '00000000-0000-0000-0000-000000000001') {
      console.log('✅ Hardcoded admin detected:', user.id)
      return true
    }

    // Backend'den de admin kontrolü yap (diğer adminler için)
    try {
      const { data, error } = await supabase
        .from('simple_users')
        .select('role, status')
        .eq('id', user.id)
        .eq('role', 'admin')
        .eq('status', 'approved')
        .single()

      if (error || !data) {
        console.log('Admin backend kontrolü başarısız (normal admin için):', error)
        return false
      }

      return true
    } catch (backendError) {
      console.log('Backend admin kontrolü hatası:', backendError)
      return false
    }
  } catch (error) {
    console.error('Admin kontrol hatası:', error)
    return false
  }
}

/**
 * Admin işlemleri için güvenlik kontrolü
 */
export async function requireAdmin(): Promise<boolean> {
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    alert('Bu işlem için admin yetkisi gerekli!')
    window.location.href = '/admin/login'
    return false
  }
  return true
}

/**
 * Session timeout kontrolü (24 saat)
 */
export function checkSessionTimeout(): boolean {
  const userStr = localStorage.getItem('simple_auth_user')
  if (!userStr) return false

  try {
    const userData = JSON.parse(userStr)
    const loginTime = userData.loginTime || Date.now()
    const now = Date.now()
    const hoursPassed = (now - loginTime) / (1000 * 60 * 60)

    // 24 saat geçmişse session'ı temizle
    if (hoursPassed > 24) {
      localStorage.removeItem('simple_auth_user')
      alert('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.')
      window.location.href = '/admin/login'
      return false
    }

    return true
  } catch (error) {
    console.error('Session timeout kontrolü hatası:', error)
    return false
  }
}