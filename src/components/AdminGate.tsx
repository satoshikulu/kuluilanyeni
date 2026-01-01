import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Props = { children: React.ReactNode }

function AdminGate({ children }: Props) {
  const [loading, setLoading] = useState<boolean>(true)
  const [authenticated, setAuthenticated] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false)

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
    checkAuthStatus()
  }, [])

  async function checkAuthStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Check if user has admin role from profiles table
        const { data: userRecord, error: userError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (userError || !userRecord) {
          console.log('🚫 User record not found or error:', userError?.message)
          setError('Kullanıcı kaydı bulunamadı')
          await supabase.auth.signOut()
          return
        }

        if (userRecord.role === 'admin') {
          setAuthenticated(true)
        } else {
          console.log('🚫 User is not admin:', session.user.email, 'role:', userRecord.role)
          setError('Bu hesap admin yetkisine sahip değil')
          await supabase.auth.signOut()
        }
      }
    } catch (error: any) {
      console.error('Auth check error:', error)
      setError('Oturum kontrolü başarısız')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoggingIn(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (signInError) {
        throw signInError
      }

      if (data.user) {
        // Check admin role from profiles table
        const { data: userRecord, error: userError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (userError || !userRecord) {
          console.error('User record fetch error:', userError?.message)
          setError('Kullanıcı kaydı bulunamadı')
          await supabase.auth.signOut()
          return
        }

        if (userRecord.role === 'admin') {
          setAuthenticated(true)
          setError('')
        } else {
          setError('Bu hesap admin yetkisine sahip değil')
          await supabase.auth.signOut()
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.message.includes('Invalid login credentials')) {
        setError('Geçersiz email veya şifre')
      } else {
        setError(error.message || 'Giriş başarısız')
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setAuthenticated(false)
    setEmail('')
    setPassword('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center admin-quicksand">
        <div className="flex items-center gap-3 text-gray-600">
          <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          Oturum kontrol ediliyor...
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 admin-quicksand">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://plus.unsplash.com/premium_photo-1661908377130-772731de98f6?q=80&w=1112&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            {/* Logo/Brand */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
              <p className="text-white/80">Kulu İlan Yönetim Sistemi</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Yönetici Girişi</h2>
                <p className="text-gray-600">Admin hesabınızla giriş yapın</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Adresi
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kuluilani.com"
                    disabled={isLoggingIn}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={isLoggingIn}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn || !email.trim() || !password}
                  className="w-full rounded-xl bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Giriş yapılıyor...
                    </div>
                  ) : (
                    'Admin Paneline Giriş Yap'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-xs text-gray-500 leading-relaxed">
                  Admin hesabınızın <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">profiles.role = "admin"</code> olarak tanımlanmış olması gerekir
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-white/60 text-sm">
                © 2025 Kulu İlan. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated admin user - show admin panel with logout option
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
              <div className="text-xs text-gray-500">Supabase Authentication</div>
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


