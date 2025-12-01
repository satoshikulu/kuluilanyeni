import { Outlet, Link, NavLink } from 'react-router-dom'
import { getCurrentUser, logoutUser, isAdmin } from './lib/simpleAuth'
import { LogOut, User } from 'lucide-react'
import { toTitleCase } from './lib/textUtils'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import PushNotificationPrompt from './components/PushNotificationPrompt'
import { useEffect } from 'react'
import { initOneSignal } from './lib/oneSignal'

function App() {
  const currentUser = getCurrentUser()
  const userIsAdmin = isAdmin()
  const isAdminSession = sessionStorage.getItem('isAdmin') === 'true'
  
  // Kullanıcı adını title case yap
  const displayName = currentUser?.full_name ? toTitleCase(currentUser.full_name) : ''

  // OneSignal'i başlat
  useEffect(() => {
    initOneSignal()
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg tracking-tight">
            Kulu İlan <span className="text-gray-500">·</span> <span className="text-gray-600">Kulu Emlak Pazarı</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/ilanlar"
              className={({ isActive }) => [
                'inline-flex items-center rounded-xl px-4 py-2 font-medium shadow-sm transition-colors',
                'bg-blue-600 text-white hover:bg-orange-500',
                isActive ? 'ring-2 ring-orange-300' : 'ring-1 ring-black/10'
              ].join(' ')}
            >
              İlanlara Bak
            </NavLink>
            
            {currentUser && !isAdminSession && (
              <NavLink
                to="/ilanlarim"
                className={({ isActive }) => [
                  'inline-flex items-center rounded-xl px-4 py-2 font-medium shadow-sm transition-colors',
                  'bg-green-600 text-white hover:bg-green-700',
                  isActive ? 'ring-2 ring-green-300' : 'ring-1 ring-black/10'
                ].join(' ')}
              >
                📋 İlanlarım
              </NavLink>
            )}
            
            {isAdminSession ? (
              <>
                <NavLink
                  to="/admin"
                  className={({ isActive }) => [
                    'inline-flex items-center rounded-xl px-4 py-2 font-medium transition-colors',
                    'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md',
                    isActive ? 'ring-2 ring-purple-300' : 'ring-1 ring-black/10'
                  ].join(' ')}
                >
                  👑 Admin Panel
                </NavLink>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                  <span className="text-xl">👑</span>
                  <span className="text-purple-900 font-bold">Admin Yönetici</span>
                </div>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('isAdmin')
                    window.location.href = '/'
                  }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış
                </button>
              </>
            ) : currentUser ? (
              <>
                {userIsAdmin && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => [
                      'inline-flex items-center rounded-xl px-4 py-2 font-medium transition-colors',
                      'bg-purple-600 text-white hover:bg-purple-700',
                      isActive ? 'ring-2 ring-purple-300' : 'ring-1 ring-black/10'
                    ].join(' ')}
                  >
                    Admin
                  </NavLink>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700 font-medium">{displayName}</span>
                </div>
                <button
                  onClick={logoutUser}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/giris"
                  className={({ isActive }) => [
                    'inline-flex items-center rounded-xl px-4 py-2 font-medium transition-colors',
                    'bg-white text-gray-900 shadow-sm hover:bg-orange-50 hover:text-orange-700',
                    isActive ? 'ring-2 ring-orange-300' : 'ring-1 ring-black/10'
                  ].join(' ')}
                >
                  Giriş Yap
                </NavLink>
                <NavLink
                  to="/uye-ol"
                  className={({ isActive }) => [
                    'inline-flex items-center rounded-xl px-4 py-2 font-medium transition-colors',
                    'border-2 border-gray-300 text-gray-800 hover:border-orange-400 hover:bg-orange-500/10 hover:text-orange-700',
                    isActive ? 'ring-2 ring-orange-300' : 'ring-0'
                  ].join(' ')}
                >
                  Üye Ol
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t text-sm text-gray-500">
        <div className="mx-auto max-w-6xl px-4 py-6">
          © {new Date().getFullYear()} Kulu İlan · Kulu Emlak Pazarı -
          {" "}
          <span
            className="text-xs text-gray-500 inline-block transition-all duration-200 [text-shadow:0_1px_1px_rgba(0,0,0,0.15)] hover:[text-shadow:0_2px_4px_rgba(0,0,0,0.28)] hover:text-gray-600"
            title="Y.A & S.Ç"
          >
            Y.A <span className="mx-1">&</span> S.Ç
          </span>
        </div>
      </footer>
      <PWAInstallPrompt />
      <PushNotificationPrompt />
    </div>
  )
}

export default App
