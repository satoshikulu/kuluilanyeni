import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../lib/simpleAuth'
import { supabase } from '../lib/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'
import { toTitleCase } from '../lib/textUtils'
import { subscribeToNotifications } from '../lib/oneSignal'

function RegisterPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [adminSessionWarning, setAdminSessionWarning] = useState(false)
  const [adminSessionUser, setAdminSessionUser] = useState<any>(null)

  useEffect(() => {
    checkCurrentSession()
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

  // Admin logout functionality removed - using Supabase Auth only

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

  // Normal kullanıcı register sayfasında Supabase session uyarısı gösterme
  // if (currentUser && window.location.pathname === '/admin/login') { ... } kaldırıldı

  // Admin session uyarısı
  if (adminSessionWarning && adminSessionUser) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-8 border-2 border-amber-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Oturumu Tespit Edildi</h2>
            <p className="text-gray-700 mb-2">
              <strong>{adminSessionUser.full_name || adminSessionUser.email || 'Admin'}</strong> olarak admin girişi yapmış durumdasınız.
            </p>
            <p className="text-gray-600 text-sm">
              Yeni hesap oluşturmak için admin oturumunu kapatmanızı öneririz.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleClearAdminSession}
              className="w-full rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 font-semibold hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg transition-all"
            >
              🧹 Admin Oturumunu Kapat ve Devam Et
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 font-semibold hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
            >
              👑 Admin Paneline Git
            </button>
          </div>
        </div>
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    
    try {
      if (!fullName || !phone || !password) {
        setError('Tüm alanları doldurun.')
        return
      }

      if (password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır.')
        return
      }

      const result = await registerUser(fullName, phone, password)
      
      if (result.success) {
        // Kayıt başarılı olduğunda OneSignal'a kaydet (onay bekliyor durumunda)
        try {
          await subscribeToNotifications({
            userId: phone, // Telefon numarasını user ID olarak kullan
            phone: phone,
            name: fullName,
            properties: {
              role: 'user',
              status: 'pending', // Henüz onaylanmamış
              registerDate: new Date().toISOString()
            }
          });
          console.log('OneSignal subscription başarılı (pending user)');
        } catch (notificationError) {
          console.error('OneSignal subscription hatası:', notificationError);
          // Bildirim hatası kayıt işlemini etkilemesin
        }
        
        setMessage(result.message || 'Kayıt başarılı! Admin onayından sonra giriş yapabilirsiniz.')
        setFullName('')
        setPhone('')
        setPassword('')
      } else {
        setError(result.error || 'Kayıt başarısız')
      }
    } catch (e: any) {
      setError(e?.message || 'Kayıt yapılamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  // Removed admin session check - using Supabase Auth only
  // if (isAdminSession) { ... }

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
          {/* Logo/Brand */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Kulu İlan</h1>
            <p className="text-white/80 text-sm">Emlak Pazarınız</p>
          </div>

          {/* Register Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => navigate('/')}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              title="Ana sayfaya dön"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Üye Ol</h2>
              <p className="text-gray-600 text-sm">Ad-soyad, telefon ve şifre ile hızlı kayıt</p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                <input 
                  type="text"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="Adınız Soyadınız" 
                  value={fullName} 
                  onChange={(e) => setFullName(toTitleCase(e.target.value))}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Her kelimenin ilk harfi otomatik büyük yapılır</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numarası *</label>
                <input 
                  type="tel"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="5xx xxx xx xx" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Sadece rakam girin, başında 0 olmadan</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    placeholder="En az 6 karakter" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Minimum 6 karakter gereklidir</p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span>{error}</span>
                    <button
                      onClick={() => navigate('/')}
                      className="ml-2 text-red-500 hover:text-red-700 text-xs underline"
                    >
                      Ana sayfaya dön
                    </button>
                  </div>
                </div>
              )}
          
              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                  {message}
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
                    Kaydediliyor...
                  </div>
                ) : (
                  'Kaydol'
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Zaten üye misiniz?{' '}
                <Link 
                  to="/giris" 
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Giriş Yap
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

export default RegisterPage
