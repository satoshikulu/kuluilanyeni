import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../lib/hybridAuth'
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
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkCurrentSession()
  }, [])

  async function checkCurrentSession() {
    try {
      // Supabase session kontrolü
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setCurrentUser(session.user)
      }
    } catch (error) {
      console.error('Session check error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSupabaseLogout() {
    try {
      await supabase.auth.signOut()
      setCurrentUser(null)
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Admin logout functionality removed - using Supabase Auth only

  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Oturum kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  // Supabase kullanıcı oturumu varsa uyarı göster
  if (currentUser) {
    const isAdmin = currentUser.user_metadata?.role === 'admin'
    
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 border-2 border-green-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">{isAdmin ? '👑' : '👤'}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Zaten Giriş Yapmışsınız</h2>
            <p className="text-gray-700 mb-2">
              <strong>{currentUser.email || currentUser.phone || 'Kullanıcı'}</strong> olarak giriş yapmış durumdasınız.
            </p>
            <p className="text-gray-600 text-sm">
              Yeni hesap oluşturmak için önce mevcut oturumunuzu kapatmanız gerekiyor.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSupabaseLogout}
              className="w-full rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 font-semibold hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg transition-all"
            >
              🚪 Oturumu Kapat
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 font-semibold hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
              >
                👑 Admin Paneline Git
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full rounded-lg bg-gray-100 text-gray-700 py-3 font-semibold hover:bg-gray-200 transition-all"
            >
              🏠 Ana Sayfaya Git
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

      if (password.length < 4) {
        setError('Şifre en az 4 karakter olmalıdır.')
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
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Üye Ol</h1>
        <p className="text-gray-600 mb-6">Ad-soyad, telefon ve şifre ile hızlı kayıt.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad *</label>
            <input 
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Adınız Soyadınız" 
              value={fullName} 
              onChange={(e) => setFullName(toTitleCase(e.target.value))}
              required
            />
            <p className="mt-1 text-xs text-gray-500">Her kelimenin ilk harfi otomatik büyük yapılır</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefon Numarası *</label>
            <input 
              type="tel"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="5xx xxx xx xx" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <div className="text-xs text-gray-500 mt-1">Giriş yaparken bu telefon numarasını kullanacaksınız</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Şifre *</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="En az 4 karakter" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-xs text-orange-600 mt-1 font-medium">
              ⚠️ Şifrenizi unutmayın! Giriş yaparken kullanacaksınız.
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={submitting} 
            className="w-full rounded-lg bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Kaydediliyor...' : 'Kaydol'}
          </button>
          
          <div className="text-center text-sm text-gray-600 mt-4">
            Zaten üye misiniz?{' '}
            <a href="/giris" className="text-blue-600 hover:text-blue-700 font-medium">
              Giriş Yap
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage
