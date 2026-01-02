import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { loginUser, getCurrentUser } from '../lib/simpleAuth'
import { supabase } from '../lib/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'
import { subscribeToNotifications } from '../lib/oneSignal'

function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isAdminSession, setIsAdminSession] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ email?: string; phone?: string; user_metadata?: { role?: string } } | null>(null)
  const [loading, setLoading] = useState(true)

  // Quicksand font yükleme
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    return () => {
      // Cleanup: font linkini kaldır
      document.head.removeChild(link)
    }
  }, [])

  useEffect(() => {
    checkCurrentSession()
  }, [])

  // OneSignal bildirim entegrasyonu
  useEffect(() => {
    if (currentUser) {
      // Kullanıcı giriş yaptığında OneSignal'a kaydet
      subscribeToNotifications({
        userId: currentUser.email || currentUser.phone || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        name: (currentUser.user_metadata as any)?.full_name || 'Kullanıcı',
        properties: {
          role: currentUser.user_metadata?.role || 'user',
          loginDate: new Date().toISOString()
        }
      }).then(success => {
        if (success) {
          console.log('OneSignal subscription başarılı');
        }
      }).catch(error => {
        console.error('OneSignal subscription hatası:', error);
      });
    }
  }, [currentUser])

  async function checkCurrentSession() {
    try {
      // Admin session kontrolü
      const adminFlag = sessionStorage.getItem('isAdmin') === 'true'
      if (adminFlag) {
        setIsAdminSession(true)
        setLoading(false)
        return
      }

      // Kalıcı storage'dan kullanıcı kontrolü
      const user = await getCurrentUser()
      if (user) {
        setCurrentUser(user)
      }

      // Supabase session kontrolü (fallback)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user && !user) {
        setCurrentUser(session.user)
      }
    } catch (error) {
      console.error('Session check error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    
    try {
      if (!phone || !password) {
        setError('Telefon ve şifre gereklidir.')
        return
      }

      const result = await loginUser(phone, password)
      
      if (result.success && result.user) {
        console.log("✅ Login başarılı");
        
        // TODO: Bildirim sistemi entegrasyonu
        
        // Ana sayfaya yönlendir
        console.log("🔄 Ana sayfaya yönlendiriliyor...");
        navigate('/')
        window.location.reload() // Header'ı güncellemek için
      } else {
        setError(result.error || 'Giriş başarısız')
      }
    } catch (e) {
      setError((e as Error)?.message || 'Giriş başarısız')
    } finally {
      setSubmitting(false)
    }
  }

  function handleAdminLogout() {
    sessionStorage.removeItem('isAdmin')
    setIsAdminSession(false)
  }

  async function handleSupabaseLogout() {
    try {
      await supabase.auth.signOut()
      setCurrentUser(null)
      // Sayfayı yenile
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ fontFamily: 'Quicksand, sans-serif' }}>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-sm w-full mx-4">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Oturum kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  // Supabase kullanıcı oturumu varsa uyarı göster
  if (currentUser) {
    const typedCurrentUser = currentUser as { email?: string; phone?: string; user_metadata?: { role?: string } };
    const isAdmin = typedCurrentUser.user_metadata?.role === 'admin'
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ fontFamily: 'Quicksand, sans-serif' }}>
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isAdmin ? 'Admin Oturumu Aktif' : 'Oturum Aktif'}
            </h2>
            <p className="text-gray-600 mb-2">
              <strong>{typedCurrentUser.email || typedCurrentUser.phone || 'Kullanıcı'}</strong> olarak giriş yapmış durumdasınız.
            </p>
            <p className="text-gray-500 text-sm">
              Farklı bir hesapla giriş yapmak için önce mevcut oturumunuzu kapatın.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSupabaseLogout}
              className="w-full rounded-lg bg-red-600 text-white py-3 font-medium hover:bg-red-700 transition-colors"
            >
              Oturumu Kapat
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition-colors"
              >
                Admin Paneline Git
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full rounded-lg bg-gray-100 text-gray-700 py-3 font-medium hover:bg-gray-200 transition-colors"
            >
              Ana Sayfaya Git
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isAdminSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ fontFamily: 'Quicksand, sans-serif' }}>
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-orange-600 rounded-full"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Oturumu Aktif</h2>
            <p className="text-gray-600">
              Şu anda admin olarak giriş yapmış durumdasınız. Normal kullanıcı girişi yapmak için önce admin oturumunuzu kapatın.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAdminLogout}
              className="w-full rounded-lg bg-red-600 text-white py-3 font-medium hover:bg-red-700 transition-colors"
            >
              Admin Oturumunu Kapat
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition-colors"
            >
              Admin Paneline Dön
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full rounded-lg bg-gray-100 text-gray-700 py-3 font-medium hover:bg-gray-200 transition-colors"
            >
              Ana Sayfaya Git
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Quicksand, sans-serif' }}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://plus.unsplash.com/premium_photo-1661908377130-772731de98f6?q=80&w=1624&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Kulu İlan</h1>
            <p className="text-white/80">Emlak Pazarınız</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Giriş Yap</h2>
              <p className="text-gray-600">Hesabınıza erişim sağlayın</p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası
                </label>
                <input 
                  type="tel"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="5xx xxx xx xx" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    placeholder="Şifrenizi girin" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              
              <button 
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Hesabınız yok mu?{' '}
                <Link 
                  to="/uye-ol" 
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Üye Ol
                </Link>
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

export default LoginPage


