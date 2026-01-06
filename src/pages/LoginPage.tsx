import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { loginUser } from '../lib/hybridAuth'
import { supabase } from '../lib/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'

function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [migrationAvailable, setMigrationAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminSessionWarning, setAdminSessionWarning] = useState(false)
  const [adminSessionUser, setAdminSessionUser] = useState<any>(null)

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
    // Normal kullanıcı login sayfasında OneSignal entegrasyonu gerekmiyor
    // Giriş başarılı olduktan sonra onSubmit içinde yapılacak
  }, [])

  async function checkCurrentSession() {
    try {
      // Admin session kontrolü - uyarı için
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Admin mi kontrol et
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', session.user.id)
          .single()
        
        if (profileData?.role === 'admin') {
          setAdminSessionWarning(true)
          setAdminSessionUser({
            ...session.user,
            full_name: profileData.full_name
          })
        }
      }
    } catch (error) {
      console.error('Session check error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleClearAdminSession() {
    try {
      await supabase.auth.signOut()
      sessionStorage.removeItem('isAdmin')
      setAdminSessionWarning(false)
      setAdminSessionUser(null)
      console.log('🧹 Admin session temizlendi')
    } catch (error) {
      console.error('Admin session temizleme hatası:', error)
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
        console.log("✅ Hibrit login başarılı");
        
        // Migration durumuna göre mesaj göster
        if (result.migration_completed) {
          setMessage(result.message || 'Giriş başarılı! Hesabınız güvenli sisteme taşındı.')
        } else if (result.migration_failed) {
          setMessage('Giriş başarılı!')
        } else if (result.migration_available) {
          setMigrationAvailable(true)
          setError('') // Hata mesajını temizle
          setMessage(result.message || 'Giriş başarılı! Güvenli sisteme geçmek ister misiniz?')
        }
        
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

  // Normal kullanıcı login sayfasında Supabase session uyarısı gösterme
  // if (currentUser && window.location.pathname === '/admin/login') { ... } kaldırıldı

  // Admin session uyarısı
  if (adminSessionWarning && adminSessionUser) {
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
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Admin Oturumu Tespit Edildi
                </h2>
                <p className="text-gray-600 mb-2">
                  <strong>{adminSessionUser.full_name || adminSessionUser.email || 'Admin'}</strong> olarak admin girişi yapmış durumdasınız.
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Normal kullanıcı girişi yapmak için admin oturumunu kapatmanızı öneririz. Bu, karışıklığı önler.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleClearAdminSession}
                  className="w-full rounded-lg bg-red-600 text-white py-3 font-medium hover:bg-red-700 transition-colors"
                >
                  Admin Oturumunu Kapat ve Devam Et
                </button>
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition-colors"
                >
                  Admin Paneline Git
                </button>
              </div>
            </div>
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
        <div className="w-full max-w-xs">
          {/* Logo/Brand */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Kulu İlan</h1>
            <p className="text-white/80 text-sm">Emlak Pazarınız</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Giriş Yap</h2>
              <p className="text-gray-600 text-sm">Hesabınıza erişim sağlayın</p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon Numarası
                </label>
                <input 
                  type="tel"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="5xx xxx xx xx" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
                  {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                  {message}
                  {migrationAvailable && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-2">
                        Hesabınızı daha güvenli yeni sisteme taşıyabilirsiniz.
                      </p>
                      <button 
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                        onClick={() => {
                          // Migration modal App.tsx'te gösterilecek
                          window.location.reload()
                        }}
                      >
                        Güvenli Sisteme Geç
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <button 
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-200">
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
          <div className="text-center mt-6">
            <p className="text-white/60 text-xs">
              © 2025 Kulu İlan. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage


