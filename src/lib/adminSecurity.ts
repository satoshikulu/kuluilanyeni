// ============================================
// ADMIN GÜVENLİK SİSTEMİ (EMAIL/SUPABASE AUTH)
// ============================================
// Supabase Auth ile email/şifre admin kontrolü
// ============================================

import { supabase } from './supabaseClient'

export interface UserProfile {
  id: string
  full_name: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 * @returns Promise<boolean> - Admin ise true
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    // 1. Kullanıcı giriş yapmış mı?
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.warn('❌ Auth error or no user:', authError?.message)
      return false
    }

    // 2. Kullanıcının profilini al
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.warn('❌ Profile error or no profile:', profileError?.message)
      return false
    }

    // 3. Role kontrolü
    const isAdmin = profile.role === 'admin'
    console.log(`🔍 User role check: ${profile.role} → Admin: ${isAdmin}`)
    
    return isAdmin

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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.warn('❌ Profile fetch error:', profileError?.message)
      return null
    }

    return profile as UserProfile

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
    const isAdmin = await isUserAdmin()
    
    if (!isAdmin) {
      console.warn('⚠️ Yetkisiz admin erişimi tespit edildi!')
      
      // 2. Kullanıcıyı çıkar
      const { error: signOutError } = await supabase.auth.signOut()
      
      if (signOutError) {
        console.error('❌ Sign out error:', signOutError.message)
      } else {
        console.log('✅ Kullanıcı güvenlik nedeniyle çıkarıldı')
      }
      
      // 3. Admin login sayfasına yönlendir
      window.location.href = redirectPath
      return
    }

    console.log('✅ Admin erişimi onaylandı')

  } catch (error) {
    console.error('❌ Admin access control error:', error)
    
    // Hata durumunda güvenlik için çıkar
    await supabase.auth.signOut()
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
        await supabase.auth.signOut()
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