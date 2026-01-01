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
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/80 to-slate-900/90" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Login Card */}
        <div className="relative z-10 max-w-md w-full">
          {/* Glass Card Effect */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            {/* Card Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent rounded-3xl" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-8">
                {/* Logo/Icon */}
                <div className="relative mx-auto mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <span className="text-3xl">👑</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                  Admin Paneli
                </h1>
                <p className="text-white/70 text-lg">
                  Kulu İlan Yönetim Sistemi
                </p>
                <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mt-4" />
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-3">
                      📧 Email Adresi
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        className="w-full rounded-2xl border-0 bg-white/20 backdrop-blur-sm px-4 py-4 text-white placeholder-white/50 focus:bg-white/30 focus:ring-2 focus:ring-purple-400/50 transition-all duration-300 text-lg"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@kuluilani.com"
                        disabled={isLoggingIn}
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-3">
                      🔐 Şifre
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        className="w-full rounded-2xl border-0 bg-white/20 backdrop-blur-sm px-4 py-4 text-white placeholder-white/50 focus:bg-white/30 focus:ring-2 focus:ring-purple-400/50 transition-all duration-300 text-lg"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        disabled={isLoggingIn}
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-4 animate-shake">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">⚠️</span>
                      </div>
                      <span className="text-red-100 font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoggingIn || !email.trim() || !password}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                >
                  {/* Button Background Animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isLoggingIn ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        Giriş Yapılıyor...
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        Yönetim Paneline Giriş Yap
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Footer Info */}
              <div className="mt-8 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Güvenli Bağlantı</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Admin hesabınızın <code className="bg-white/20 px-2 py-1 rounded-lg text-purple-200">profiles.role = "admin"</code> olarak tanımlanmış olması gerekir
                </p>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-purple-400/30 rounded-full blur-sm animate-bounce" />
          <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-pink-400/30 rounded-full blur-sm animate-bounce delay-1000" />
        </div>

        {/* Bottom Branding */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-white/40 text-sm font-medium">
            Kulu İlan © 2025 • Emlak Yönetim Sistemi
          </p>
        </div>
      </div>
    )
  }

  // Authenticated admin user - show admin panel with logout option
  return (
    <div>
      {/* Admin Panel Header with Logout */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">👑</span>
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
            <span>🚪</span>
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


