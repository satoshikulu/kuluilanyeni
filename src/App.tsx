import { Outlet, Link, NavLink } from 'react-router-dom'
import { getCurrentUser, logoutUser, isAdmin } from './lib/simpleAuth'
import { LogOut, User } from 'lucide-react'
import { toTitleCase } from './lib/textUtils'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import PushNotificationPrompt from './components/PushNotificationPrompt'

function App() {
  const currentUser = getCurrentUser()
  const userIsAdmin = isAdmin()
  const isAdminSession = sessionStorage.getItem('isAdmin') === 'true'
  
  // Kullanıcı adını title case yap
  const displayName = currentUser?.full_name ? toTitleCase(currentUser.full_name) : ''

  // OneSignal initialization is handled in index.html

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
                'inline-flex items-center rounded-2xl px-5 py-2.5 font-medium transition-all duration-300',
                'bg-gradient-to-r from-blue-100/80 to-indigo-100/80 backdrop-blur-md',
                'text-blue-700 hover:from-blue-200/90 hover:to-indigo-200/90 hover:text-blue-800',
                'border border-blue-200/50 hover:border-blue-300/60',
                'shadow-lg hover:shadow-xl hover:shadow-blue-200/25',
                'hover:scale-105 transform',
                isActive ? 'ring-2 ring-blue-300/50 shadow-blue-200/30' : ''
              ].join(' ')}
            >
              <span className="mr-2">🏠</span>
              İlanlara Bak
            </NavLink>
            
            {/* PWA Install Button */}
            <button
              onClick={() => (window as any).installPWA?.()}
              className="inline-flex items-center rounded-2xl px-5 py-2.5 font-medium transition-all duration-300 bg-gradient-to-r from-purple-100/80 to-pink-100/80 backdrop-blur-md text-purple-700 hover:from-purple-200/90 hover:to-pink-200/90 hover:text-purple-800 border border-purple-200/50 hover:border-purple-300/60 shadow-lg hover:shadow-xl hover:shadow-purple-200/25 hover:scale-105 transform"
              title="Uygulamayı Yükle"
            >
              <span className="mr-2">📱</span>
              Yükle
            </button>
            
            {currentUser && !isAdminSession && (
              <NavLink
                to="/ilanlarim"
                className={({ isActive }) => [
                  'inline-flex items-center rounded-2xl px-5 py-2.5 font-medium transition-all duration-300',
                  'bg-gradient-to-r from-emerald-100/80 to-teal-100/80 backdrop-blur-md',
                  'text-emerald-700 hover:from-emerald-200/90 hover:to-teal-200/90 hover:text-emerald-800',
                  'border border-emerald-200/50 hover:border-emerald-300/60',
                  'shadow-lg hover:shadow-xl hover:shadow-emerald-200/25',
                  'hover:scale-105 transform',
                  isActive ? 'ring-2 ring-emerald-300/50 shadow-emerald-200/30' : ''
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
                    'inline-flex items-center rounded-2xl px-5 py-2.5 font-medium transition-all duration-300',
                    'bg-gradient-to-r from-indigo-100/80 to-purple-100/80 backdrop-blur-md',
                    'text-indigo-700 hover:from-indigo-200/90 hover:to-purple-200/90 hover:text-indigo-800',
                    'border border-indigo-200/50 hover:border-indigo-300/60',
                    'shadow-lg hover:shadow-xl hover:shadow-indigo-200/25',
                    'hover:scale-105 transform',
                    isActive ? 'ring-2 ring-indigo-300/50 shadow-indigo-200/30' : ''
                  ].join(' ')}
                >
                  👑 Admin Panel
                </NavLink>
                <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-100/80 to-purple-100/80 backdrop-blur-md rounded-2xl border border-indigo-200/50 shadow-lg">
                  <span className="text-xl">👑</span>
                  <span className="text-indigo-800 font-bold">Admin Yönetici</span>
                </div>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('isAdmin')
                    window.location.href = '/'
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 font-medium transition-all duration-300 bg-gradient-to-r from-red-100/80 to-rose-100/80 backdrop-blur-md text-red-700 hover:from-red-200/90 hover:to-rose-200/90 hover:text-red-800 border border-red-200/50 hover:border-red-300/60 shadow-lg hover:shadow-xl hover:shadow-red-200/25 hover:scale-105 transform"
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
                      'inline-flex items-center rounded-2xl px-5 py-2.5 font-medium transition-all duration-300',
                      'bg-gradient-to-r from-violet-100/80 to-purple-100/80 backdrop-blur-md',
                      'text-violet-700 hover:from-violet-200/90 hover:to-purple-200/90 hover:text-violet-800',
                      'border border-violet-200/50 hover:border-violet-300/60',
                      'shadow-lg hover:shadow-xl hover:shadow-violet-200/25',
                      'hover:scale-105 transform',
                      isActive ? 'ring-2 ring-violet-300/50 shadow-violet-200/30' : ''
                    ].join(' ')}
                  >
                    <span className="mr-2">👑</span>
                    Admin
                  </NavLink>
                )}
                <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-100/80 to-gray-100/80 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-lg">
                  <User className="w-4 h-4 text-slate-600" />
                  <span className="text-slate-700 font-medium">{displayName}</span>
                </div>
                <button
                  onClick={() => logoutUser()}
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 font-medium transition-all duration-300 bg-gradient-to-r from-red-100/80 to-rose-100/80 backdrop-blur-md text-red-700 hover:from-red-200/90 hover:to-rose-200/90 hover:text-red-800 border border-red-200/50 hover:border-red-300/60 shadow-lg hover:shadow-xl hover:shadow-red-200/25 hover:scale-105 transform"
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
                    'inline-flex items-center rounded-2xl px-5 py-2.5 font-medium transition-all duration-300',
                    'bg-gradient-to-r from-orange-100/80 to-amber-100/80 backdrop-blur-md',
                    'text-orange-700 hover:from-orange-200/90 hover:to-amber-200/90 hover:text-orange-800',
                    'border border-orange-200/50 hover:border-orange-300/60',
                    'shadow-lg hover:shadow-xl hover:shadow-orange-200/25',
                    'hover:scale-105 transform',
                    isActive ? 'ring-2 ring-orange-300/50 shadow-orange-200/30' : ''
                  ].join(' ')}
                >
                  <span className="mr-2">🔑</span>
                  Giriş Yap
                </NavLink>
                <NavLink
                  to="/uye-ol"
                  className={({ isActive }) => [
                    'inline-flex items-center rounded-2xl px-5 py-2.5 font-medium transition-all duration-300',
                    'bg-gradient-to-r from-rose-100/80 to-pink-100/80 backdrop-blur-md',
                    'text-rose-700 hover:from-rose-200/90 hover:to-pink-200/90 hover:text-rose-800',
                    'border border-rose-200/50 hover:border-rose-300/60',
                    'shadow-lg hover:shadow-xl hover:shadow-rose-200/25',
                    'hover:scale-105 transform',
                    isActive ? 'ring-2 ring-rose-300/50 shadow-rose-200/30' : ''
                  ].join(' ')}
                >
                  <span className="mr-2">✨</span>
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
