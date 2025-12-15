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
            {/* PWA Install Button - Enhanced Download Theme */}
            <button
              onClick={() => (window as any).installPWA?.()}
              className="relative inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all duration-300 overflow-hidden group"
              title="Uygulamayı Telefonuna İndir ve Yükle"
            >
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/90 via-teal-100/90 to-cyan-100/90 backdrop-blur-md border border-emerald-200/50 rounded-xl group-hover:from-emerald-200/95 group-hover:via-teal-200/95 group-hover:to-cyan-200/95 group-hover:border-emerald-300/60 transition-all duration-300"></div>
              
              {/* Download Progress Bar Effect */}
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-b-xl w-0 group-hover:w-full transition-all duration-700 ease-out"></div>
              
              {/* Content */}
              <div className="relative z-10 flex items-center gap-2 text-emerald-700 group-hover:text-emerald-800 transition-colors duration-300">
                {/* Enhanced Download Icon with Animation */}
                <div className="relative w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                  {/* Phone Icon */}
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 4h10v12H7V4z"/>
                  </svg>
                  {/* Download Arrow Animation */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-2.5 h-2.5 text-white animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 9.586V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Text with Enhanced Typography */}
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-tight">📱 Telefona İndir</span>
                  <span className="text-xs opacity-75 font-medium">Hızlı Erişim</span>
                </div>
              </div>
              
              {/* Enhanced Glow Effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-emerald-400/25 via-teal-400/25 to-cyan-400/25 blur-xl transition-opacity duration-300"></div>
              
              {/* Shimmer Effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
              </div>
            </button>
            
            {currentUser && !isAdminSession && (
              <NavLink
                to="/ilanlarim"
                className={({ isActive }) => [
                  'inline-flex items-center rounded-xl px-4 py-2 font-medium transition-all duration-300',
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
                    'inline-flex items-center rounded-xl px-4 py-2 font-medium transition-all duration-300',
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
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100/80 to-purple-100/80 backdrop-blur-md rounded-xl border border-indigo-200/50 shadow-lg">
                  <span className="text-xl">👑</span>
                  <span className="text-indigo-800 font-bold">Admin Yönetici</span>
                </div>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('isAdmin')
                    window.location.href = '/'
                  }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all duration-300 bg-gradient-to-r from-red-100/80 to-rose-100/80 backdrop-blur-md text-red-700 hover:from-red-200/90 hover:to-rose-200/90 hover:text-red-800 border border-red-200/50 hover:border-red-300/60 shadow-lg hover:shadow-xl hover:shadow-red-200/25 hover:scale-105 transform"
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
                      'inline-flex items-center rounded-xl px-4 py-2 font-medium transition-all duration-300',
                      'bg-gradient-to-r from-violet-100/80 to-purple-100/80 backdrop-blur-md',
                      'text-violet-700 hover:from-violet-200/90 hover:to-purple-200/90 hover:text-violet-800',
                      'border border-violet-200/50 hover:border-violet-300/60',
                      'shadow-lg hover:shadow-xl hover:shadow-violet-200/25',
                      'hover:scale-105 transform',
                      isActive ? 'ring-2 ring-violet-300/50 shadow-violet-200/30' : ''
                    ].join(' ')}
                  >
                    Admin
                  </NavLink>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100/80 to-gray-100/80 backdrop-blur-md rounded-xl border border-slate-200/50 shadow-lg">
                  <User className="w-4 h-4 text-slate-600" />
                  <span className="text-slate-700 font-medium">{displayName}</span>
                </div>
                <button
                  onClick={() => logoutUser()}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all duration-300 bg-gradient-to-r from-red-100/80 to-rose-100/80 backdrop-blur-md text-red-700 hover:from-red-200/90 hover:to-rose-200/90 hover:text-red-800 border border-red-200/50 hover:border-red-300/60 shadow-lg hover:shadow-xl hover:shadow-red-200/25 hover:scale-105 transform"
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
                    'inline-flex items-center rounded-xl px-4 py-2 font-medium transition-all duration-300',
                    'bg-gradient-to-r from-orange-100/80 to-amber-100/80 backdrop-blur-md',
                    'text-orange-700 hover:from-orange-200/90 hover:to-amber-200/90 hover:text-orange-800',
                    'border border-orange-200/50 hover:border-orange-300/60',
                    'shadow-lg hover:shadow-xl hover:shadow-orange-200/25',
                    'hover:scale-105 transform',
                    isActive ? 'ring-2 ring-orange-300/50 shadow-orange-200/30' : ''
                  ].join(' ')}
                >
                  Giriş Yap
                </NavLink>
                <NavLink
                  to="/uye-ol"
                  className={({ isActive }) => [
                    'inline-flex items-center rounded-xl px-4 py-2 font-medium transition-all duration-300',
                    'bg-gradient-to-r from-rose-100/80 to-pink-100/80 backdrop-blur-md',
                    'text-rose-700 hover:from-rose-200/90 hover:to-pink-200/90 hover:text-rose-800',
                    'border border-rose-200/50 hover:border-rose-300/60',
                    'shadow-lg hover:shadow-xl hover:shadow-rose-200/25',
                    'hover:scale-105 transform',
                    isActive ? 'ring-2 ring-rose-300/50 shadow-rose-200/30' : ''
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
