import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Props = { children: React.ReactNode }

function AdminGate({ children }: Props) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Quicksand font yükleme - sadece bir kez
  useEffect(() => {
    // Eğer font zaten yüklenmişse tekrar yükleme
    if (document.querySelector('link[href*="Quicksand"]')) {
      return
    }

    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap'
    link.rel = 'stylesheet'
    link.id = 'quicksand-font'
    document.head.appendChild(link)

    // CSS class ekle
    const style = document.createElement('style')
    style.id = 'admin-quicksand-style'
    style.textContent = `
      .admin-quicksand {
        font-family: 'Quicksand', sans-serif !important;
      }
      .admin-quicksand * {
        font-family: inherit !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      // Cleanup: font linkini ve style'ı kaldır
      const existingLink = document.getElementById('quicksand-font')
      const existingStyle = document.getElementById('admin-quicksand-style')
      
      if (existingLink && document.head.contains(existingLink)) {
        document.head.removeChild(existingLink)
      }
      if (existingStyle && document.head.contains(existingStyle)) {
        document.head.removeChild(existingStyle)
      }
    }
  }, [])

  useEffect(() => {
    getCurrentUser()
  }, [])

  async function getCurrentUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    } catch (error) {
      console.error('Get current user error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center admin-quicksand">
        <div className="flex items-center gap-3 text-gray-600">
          <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          Admin panel yükleniyor...
        </div>
      </div>
    )
  }

  // Admin panel UI wrapper - security is handled by AdminRoute
  return (
    <div className="admin-quicksand">
      {/* Admin Panel Header with Logout */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Admin Panel</div>
              <div className="text-xs text-gray-500">
                {user?.email || 'Admin User'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
      
      {/* Admin Panel Content */}
      {children}
    </div>
  )
}

export default AdminGate


