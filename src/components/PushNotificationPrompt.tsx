import { useEffect, useState } from 'react'
import { getCurrentUser } from '../lib/simpleAuth'
import { requestNotificationPermission, getNotificationPermission, subscribeUser } from '../lib/oneSignal'

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkPermissionAndShow()
  }, [])

  async function checkPermissionAndShow() {
    const user = getCurrentUser()
    if (!user) return

    // Bildirim iznini kontrol et
    const currentPermission = await getNotificationPermission()
    setPermission(currentPermission)

    // Eğer izin verilmediyse ve daha önce reddedilmediyse göster
    if (currentPermission === 'default') {
      // Kullanıcı daha önce dismiss ettiyse 7 gün boyunca gösterme
      const dismissed = localStorage.getItem('push-notification-dismissed')
      if (dismissed) {
        const dismissedTime = parseInt(dismissed)
        const sevenDays = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - dismissedTime < sevenDays) {
          return
        }
      }

      // 3 saniye sonra göster
      setTimeout(() => setShowPrompt(true), 3000)
    }
  }

  async function handleEnable() {
    const user = getCurrentUser()
    if (!user) return

    setLoading(true)
    try {
      // Bildirim izni iste
      const success = await requestNotificationPermission()
      
      if (success) {
        // Kullanıcıyı OneSignal'e kaydet
        await subscribeUser(user.id, user.phone)
        
        // Permission'ı güncelle
        const newPermission = await getNotificationPermission()
        setPermission(newPermission)
        
        if (newPermission === 'granted') {
          setShowPrompt(false)
          // Başarı mesajı göster
          alert('✅ Bildirimler açıldı! İlanınız onaylandığında haber vereceğiz.')
        }
      }
    } catch (error) {
      console.error('Push notification enable error:', error)
      alert('❌ Bildirimler açılamadı. Lütfen tarayıcı ayarlarınızı kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  function handleDismiss() {
    setShowPrompt(false)
    // 7 gün boyunca gösterme
    localStorage.setItem('push-notification-dismissed', Date.now().toString())
  }

  if (!showPrompt || permission !== 'default') return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
            <span className="text-3xl">🔔</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Bildirimleri Aç</h3>
            <p className="text-sm text-green-100 mb-3">
              İlanınız ve üyeliğiniz onaylandığında hemen haberdar olun!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="flex-1 bg-white text-green-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Açılıyor...' : 'Bildirimleri Aç'}
              </button>
              <button
                onClick={handleDismiss}
                disabled={loading}
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Daha Sonra
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            disabled={loading}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
