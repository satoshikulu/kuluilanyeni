import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { loginUser } from '../lib/simpleAuth'
import { setupPushNotificationsForUser, checkUserHasPushSubscription } from '../lib/webPushMessaging'
import { supabase } from '../lib/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'

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

  useEffect(() => {
    checkCurrentSession()
  }, [])

  // Web Push Setup - Supabase Session için
  useEffect(() => {
    const setupNotificationsForSupabaseUser = async () => {
      try {
        // Sadece Supabase session varsa çalıştır
        if (!currentUser) return;
        
        console.log('🚀 LoginPage: Supabase user için Web Push setup...');
        console.log('📱 Current permission:', Notification.permission);
        
        // Permission iste
        if (Notification.permission === 'default') {
          console.log('⚠️ Requesting notification permission...');
          const permission = await Notification.requestPermission();
          console.log('📱 Permission result:', permission);
          
          if (permission !== 'granted') {
            console.warn('⚠️ Notification permission denied');
            return;
          }
        }
        
        // Permission varsa setup yap
        if (Notification.permission === 'granted') {
          console.log('✅ Permission granted, setting up Web Push...');
          const success = await setupPushNotificationsForUser();
          console.log('🎯 Web Push setup result:', success);
          
          if (success) {
            // Kullanıcıya bildir
            setTimeout(() => {
              alert("✅ Push bildirimler aktif! Artık önemli güncellemeler hakkında bildirim alacaksınız.");
            }, 1000);
          }
        }
      } catch (error) {
        console.error('❌ Notification setup error:', error);
      }
    };
    
    // Supabase user varsa setup yap
    if (currentUser) {
      setTimeout(setupNotificationsForSupabaseUser, 1000);
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
        console.log("✅ Login başarılı, Firebase FCM entegrasyonu başlıyor...");
        
        // Web Push'a kullanıcıyı kaydet
        try {
          console.log("🔔 Web Push kurulumu başlatılıyor...");
          
          // Önce notification permission iste
          if (Notification.permission === 'default') {
            console.log("📱 Notification permission isteniyor...");
            const permission = await Notification.requestPermission();
            console.log("📱 Permission sonucu:", permission);
            
            if (permission !== 'granted') {
              console.warn("⚠️ Notification permission reddedildi");
              // Permission reddedilse bile devam et, ama kullanıcıyı bilgilendir
              alert("🔔 Bildirim izni verilmedi. Bildirimler çalışmayacak. Tarayıcı ayarlarından izin verebilirsiniz.");
            }
          }
          
          // Permission varsa subscription oluştur
          if (Notification.permission === 'granted') {
            const subscribed = await setupPushNotificationsForUser();
            console.log("🎉 Web Push entegrasyonu tamamlandı:", subscribed);
            
            // Push subscription'ının kaydedilip kaydedilmediğini kontrol edelim
            if (subscribed) {
              const hasSubscription = await checkUserHasPushSubscription(result.user.phone);
              console.log("🔍 Push subscription kontrolü:", hasSubscription ? "Subscription mevcut" : "Subscription yok");
              
              if (hasSubscription) {
                // Kullanıcıya bildir
                setTimeout(() => {
                  alert("✅ Push bildirimler aktif! Artık önemli güncellemeler hakkında bildirim alacaksınız.");
                }, 1000);
              }
            }
          } else {
            console.log("⚠️ Notification permission yok, push subscription oluşturulmadı");
          }
        } catch (pushError) {
          console.warn("⚠️ Web Push entegrasyonu başarısız:", pushError);
        }
        
        // Ana sayfaya yönlendir
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
    const typedCurrentUser = currentUser as { email?: string; phone?: string; user_metadata?: { role?: string } };
    const isAdmin = typedCurrentUser.user_metadata?.role === 'admin'
    
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 border-2 border-blue-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">{isAdmin ? '👑' : '👤'}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isAdmin ? 'Admin Oturumu Aktif' : 'Kullanıcı Oturumu Aktif'}
            </h2>
            <p className="text-gray-700 mb-2">
              <strong>{typedCurrentUser.email || typedCurrentUser.phone || 'Kullanıcı'}</strong> olarak giriş yapmış durumdasınız.
            </p>
            <p className="text-gray-600 text-sm">
              Farklı bir hesapla giriş yapmak için önce mevcut oturumunuzu kapatmanız gerekiyor.
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

  if (isAdminSession) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-8 border-2 border-yellow-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Oturumu Aktif</h2>
            <p className="text-gray-700">
              Şu anda admin olarak giriş yapmış durumdasınız. Normal kullanıcı girişi yapmak için önce admin oturumunuzu kapatmanız gerekiyor.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAdminLogout}
              className="w-full rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 font-semibold hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg transition-all"
            >
              🚪 Admin Oturumunu Kapat
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 font-semibold hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
            >
              👑 Admin Paneline Dön
            </button>
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

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Giriş Yap</h1>
        <p className="text-gray-600 mb-6">Telefon ve şifre ile hızlı giriş.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
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
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Şifre *</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Şifrenizi girin" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
          
          <div className="text-center text-sm text-gray-600 mt-4">
            Hesabın yok mu?{' '}
            <Link to="/uye-ol" className="text-blue-600 hover:text-blue-700 font-medium">
              Üye Ol
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage


