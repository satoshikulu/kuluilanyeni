// ============================================
// ADMIN GÜVENLİK SİSTEMİ (SIMPLE AUTH)
// ============================================
// simpleAuth sistemini kullanır
// ============================================

import { getCurrentUser, isAdmin, logoutUser } from './simpleAuth'

export interface UserProfile {
  id: string
  full_name: string
  role: 'user' | 'admin'
  phone: string
  status: string
}

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 * @returns Promise<boolean> - Admin ise true
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    const adminCheck = await isAdmin()
    console.log(`🔍 User admin check: ${adminCheck}`)
    return adminCheck
  } catch (error) {
    console.error('❌ Admin check error:', error)
    return false
  }
}

/**
 * Kullanıcının profilini getirir
 * @returns Promise<UserProfile | null>
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return null
    }

    return {
      id: user.id,
      full_name: user.full_name,
      role: user.role || 'user',
      phone: user.phone,
      status: user.status
    } as UserProfile

  } catch (error) {
    console.error('❌ Profile fetch error:', error)
    return null
  }
}

/**
 * Admin sayfası güvenlik kontrolü
 * Admin değilse kullanıcıyı admin login sayfasına yönlendirir
 * @param redirectPath - Yönlendirilecek sayfa (default: '/admin/login')
 */
export async function enforceAdminAccess(redirectPath: string = '/admin/login'): Promise<void> {
  try {
    console.log('🔐 Admin access control başlatılıyor...')

    // 1. Admin kontrolü
    const isAdminUser = await isUserAdmin()
    
    if (!isAdminUser) {
      console.warn('⚠️ Yetkisiz admin erişimi tespit edildi!')
      
      // 2. Kullanıcıyı çıkar
      await logoutUser()
      
      console.log('✅ Kullanıcı güvenlik nedeniyle çıkarıldı')
      
      // 3. Admin login sayfasına yönlendir
      window.location.href = redirectPath
      return
    }

    console.log('✅ Admin erişimi onaylandı')

  } catch (error) {
    console.error('❌ Admin access control error:', error)
    
    // Hata durumunda güvenlik için çıkar
    await logoutUser()
    window.location.href = redirectPath
  }
}

/**
 * Real-time admin kontrolü
 * Kullanıcının rolü değişirse otomatik çıkar
 * @param onRoleChange - Role değiştiğinde çalışacak callback
 */
export function setupAdminRoleWatcher(onRoleChange?: (role: string | null) => void): () => void {
  let intervalId: NodeJS.Timeout

  const checkRole = async () => {
    try {
      const profile = await getUserProfile()
      const currentRole = profile?.role || null
      
      // Role değişti mi?
      if (onRoleChange) {
        onRoleChange(currentRole)
      }
      
      // Admin değilse çıkar
      if (currentRole !== 'admin') {
        console.warn('⚠️ Admin rolü kaldırıldı, kullanıcı çıkarılıyor...')
        await logoutUser()
        window.location.href = '/admin/login'
      }
      
    } catch (error) {
      console.error('❌ Role watcher error:', error)
    }
  }

  // Her 30 saniyede bir kontrol et
  intervalId = setInterval(checkRole, 30000)
  
  // İlk kontrolü hemen yap
  checkRole()

  // Cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  }
}