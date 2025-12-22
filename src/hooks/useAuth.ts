// ============================================
// SUPABASE AUTH HOOK
// ============================================
// Modern React hook for Supabase auth
// ============================================

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { UserProfile, getUserProfile } from '../lib/adminSecurity'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false
  })

  useEffect(() => {
    // İlk auth durumunu al
    const getInitialAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const profile = await getUserProfile()
          setAuthState({
            user,
            profile,
            loading: false,
            isAdmin: profile?.role === 'admin'
          })
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            isAdmin: false
          })
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          isAdmin: false
        })
      }
    }

    getInitialAuth()

    // Auth değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event)
        
        if (session?.user) {
          const profile = await getUserProfile()
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            isAdmin: profile?.role === 'admin'
          })
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            isAdmin: false
          })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return authState
}

// Admin guard hook
export function useAdminGuard(redirectPath: string = '/') {
  const { isAdmin, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAdmin) {
      console.warn('⚠️ Admin guard: Yetkisiz erişim!')
      window.location.href = redirectPath
    }
  }, [isAdmin, loading, redirectPath])

  return { isAdmin, loading }
}