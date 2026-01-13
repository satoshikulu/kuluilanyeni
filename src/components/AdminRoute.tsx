import { useEffect, useState } from 'react'
import { getCurrentUser, isAdmin } from '../lib/simpleAuth'

interface AdminRouteProps {
  children: React.ReactNode
}

function AdminRoute({ children }: AdminRouteProps) {
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      setLoading(true)
      setError('')

      const user = await getCurrentUser()
      const adminCheck = await isAdmin()

      if (user && adminCheck) {
        setIsAuthorized(true)
      } else {
        setError('Admin yetkisi gerekli')
        // Admin login sayfasına yönlendir
        window.location.href = '/admin/login'
      }
    } catch (error) {
      console.error('Admin kontrol hatası:', error)
      setError('Yetki kontrolü başarısız')
      window.location.href = '/admin/login'
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Admin erişimi kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  // Error state - show error page instead of redirect
  if (error || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Erişimi Reddedildi</h2>
          <p className="text-gray-600 mb-6">{error || 'Yetkisiz erişim'}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/admin/login'}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Admin Girişi Yap
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Admin access granted
  return <>{children}</>
}

export default AdminRoute