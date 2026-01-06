// ============================================
// ADMIN GİRİŞ SAYFASI
// ============================================
// Supabase Auth ile email/şifre girişi
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'

function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  // Quicksand font yükleme - sadece bir kez
  useEffect(() => {
    // Eğer font zaten yüklenmişse tekrar yükleme
    if (document.querySelector('link[href*="Quicksand"]')) {
      return
    }

    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap'
    link.rel = 'stylesheet'
    link.id = 'quicksand-font-admin-login'
    document.head.appendChild(link)

    // CSS class ekle
    const style = document.createElement('style')
    style.id = 'admin-login-quicksand-style'
    style.textContent = `
      .admin-login-quicksand {
        font-family: 'Quicksand', sans-serif !important;
      }
      .admin-login-quicksand * {
        font-family: inherit !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      // Cleanup: font linkini ve style'ı kaldır
      const existingLink = document.getElementById('quicksand-font-admin-login')
      const existingStyle = document.getElementById('admin-login-quicksand-style')
      
      if (existingLink && document.head.contains(existingLink)) {
        document.head.removeChild(existingLink)
      }
      if (existingStyle && document.head.contains(existingStyle)) {
        document.head.removeChild(existingStyle)
      }
    }
  }, [])

  // Zaten giriş yapmışsa kontrol et
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Admin kontrolü yap - profiles tablosundan
          const { data: userRecord } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .single()
          
          if (userRecord?.role === 'admin') {
            // Admin zaten giriş yapmış, uyarı göster
            setCurrentUser({
              ...user,
              full_name: userRecord.full_name,
              role: userRecord.role
            })
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setCheckingSession(false)
      }
    }
    
    checkAuth()
  }, [navigate])

  const handleSupabaseLogout = async () => {
    try {
      await supabase.auth.signOut()
      setCurrentUser(null)
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Supabase Auth ile giriş yap
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) {
        setError('Email veya şifre hatalı')
        return
      }

      if (!data.user) {
        setError('Giriş başarısız')
        return
      }

      // 2. Admin kontrolü yap - profiles tablosundan
      const { data: userRecord, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (userError || !userRecord) {
        setError('Kullanıcı kaydı bulunamadı')
        await supabase.auth.signOut()
        return
      }

      if (userRecord.role !== 'admin') {
        setError('Bu sayfaya erişim yetkiniz yok')
        await supabase.auth.signOut()
        return
      }

      // 3. SessionStorage'a admin flag'ini kaydet
      sessionStorage.setItem('isAdmin', 'true')
      
      // 4. Admin paneline yönlendir
      console.log('✅ Admin girişi başarılı')
      navigate('/admin')

    } catch (error) {
      console.error('❌ Admin login error:', error)
      setError('Giriş sırasında bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 admin-login-quicksand">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-sm w-full mx-4">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Oturum kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  // Admin oturumu varsa uyarı göster
  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 admin-login-quicksand">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👑</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Admin Oturumu Aktif
            </h2>
            <p className="text-gray-600 mb-2">
              <strong>{currentUser.full_name || currentUser.email || 'Admin'}</strong> olarak giriş yapmış durumdasınız.
            </p>
            <p className="text-gray-500 text-sm">
              Farklı bir admin hesabıyla giriş yapmak için önce mevcut oturumunuzu kapatın.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSupabaseLogout}
              className="w-full rounded-lg bg-red-600 text-white py-3 font-medium hover:bg-red-700 transition-colors"
            >
              Oturumu Kapat
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition-colors"
            >
              Admin Paneline Git
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
    <div className="min-h-screen bg-gray-50 admin-login-quicksand">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://plus.unsplash.com/premium_photo-1661908377130-772731de98f6?q=80&w=1112&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xs">
          {/* Logo/Brand */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Admin Login</h1>
            <p className="text-white/80 text-sm">Kulu İlan Yönetim Sistemi</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Yönetici Girişi</h2>
              <p className="text-gray-600 text-sm">Admin hesabınızla giriş yapın</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Adresi
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="admin@kuluilani.com"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  'Admin Paneline Giriş Yap'
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-200">
              <p className="text-center text-xs text-gray-500 leading-relaxed">
                Admin hesabınızın <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-600 text-xs">profiles.role = "admin"</code> olarak tanımlanmış olması gerekir
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 space-y-1">
            <a
              href="/"
              className="inline-block text-white/80 hover:text-white text-sm transition-colors"
            >
              ← Ana sayfaya dön
            </a>
            <p className="text-white/60 text-xs">
              © 2025 Kulu İlan. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage