import { Outlet, Link, NavLink } from 'react-router-dom'
import { getCurrentUser, logoutUser, isAdmin } from './lib/simpleAuth'
import { LogOut, User } from 'lucide-react'
import { toTitleCase } from './lib/textUtils'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { setupOneSignalUserSync } from './lib/oneSignalUserSync'
import { useEffect } from 'react'


function App() {
  const currentUser = getCurrentUser()
  const userIsAdmin = isAdmin()
  const isAdminSession = sessionStorage.getItem('isAdmin') === 'true'
  
  // Kullanıcı adını title case yap
  const displayName = currentUser?.full_name ? toTitleCase(currentUser.full_name) : ''

  // OneSignal user sync kurulumu
  useEffect(() => {
    setupOneSignalUserSync()
  }, [])



  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg tracking-tight">
            Kulu İlan <span className="text-gray-500">·</span> <span className="text-gray-600">Kulu Emlak Pazarı</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {/* Enhanced PWA Install Button */}
            <button
              onClick={() => {
                if ((window as any).installPWA) {
                  (window as any).installPWA();
                } else {
                  // Fallback for browsers that don't support beforeinstallprompt
                  alert('Bu tarayıcıda PWA yüklemesi desteklenmiyor. Chrome, Edge veya Firefox kullanın.');
                }
              }}
              className="relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 overflow-hidden group bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/50 hover:border-blue-300/60 shadow-sm hover:shadow-md transform hover:scale-105 animate-download-cycle"
              title="Uygulamayı Telefonuna İndir - PWA olarak yükle"
            >
              {/* Download Icon - Smaller */}
              <div className="relative z-10 flex items-center justify-center w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded shadow-sm group-hover:shadow-md transition-all duration-300">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              
              {/* Compact Text */}
              <span className="relative z-10 text-sm font-medium text-blue-700 group-hover:text-blue-800 transition-colors duration-300">
                Telefona İndir
              </span>
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

    </div>
  )
}

export default App
