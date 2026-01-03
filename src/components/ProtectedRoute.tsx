import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireAuth?: boolean
}

interface UserProfile {
  id: string
  role: 'user' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
}

function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireAuth = false 
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string>('')
  const location = useLocation()

  useEffect(() => {
    checkAccess()
  }, [requireAdmin, requireAuth])

  async function checkAccess() {
    try {
      setLoading(true)
      setError('')

      // 1. Supabase session kontrolü
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      // 2. Authentication gerekli mi?
      if (requireAuth && !session?.user) {
        setLoading(false)
        return // Navigate to login will happen in render
      }

      // 3. User varsa profile bilgilerini al
      if (session?.user) {
        setUser(session.user)

        // Profile bilgilerini al
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, status')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          setError('Kullanıcı profili bulunamadı')
          // Admin gerekiyorsa session'ı temizle
          if (requireAdmin) {
            await supabase.auth.signOut()
          }
          setLoading(false)
          return
        }

        setProfile(profileData)

        // 4. Admin kontrolü
        if (requireAdmin) {
          if (profileData.role !== 'admin') {
            setError('Bu sayfaya erişim yetkiniz yok. Admin hesabı gerekli.')
            // Non-admin user session'ını temizle
            await supabase.auth.signOut()
            setLoading(false)
            return
          }
        }

        // 5. User status kontrolü
        if (profileData.status !== 'approved' && profileData.role !== 'admin') {
          setError('Hesabınız henüz onaylanmamış')
          setLoading(false)
          return
        }
      }

      setLoading(false)
    } catch (error: any) {
      console.error('Access check error:', error)
      setError('Erişim kontrolü başarısız')
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Erişim kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ana Sayfaya Dön
            </button>
            {requireAdmin && (
              <button
                onClick={() => window.location.href = '/admin/login'}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Admin Girişi
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Redirect logic
  if (requireAuth && !user) {
    return <Navigate to="/giris" state={{ from: location }} replace />
  }

  if (requireAdmin && (!profile || profile.role !== 'admin')) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Access granted
  return <>{children}</>
}

export default ProtectedRoute