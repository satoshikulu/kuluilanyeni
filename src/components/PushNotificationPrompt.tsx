import { useEffect, useState } from 'react'
import { getCurrentUser } from '../lib/simpleAuth'
import { subscribeUserToPush, checkPushPermission, isOneSignalReady } from '../lib/oneSignal'

declare global {
  interface Window {
    OneSignal?: any
  }
}

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

    // Tarayıcı bildirim desteğini kontrol et
    if (!('Notification' in window)) {
      console.log('Bu tarayıcı bildirimleri desteklemiyor')
      return
    }

    // Bildirim iznini kontrol et
    let currentPermission: 'granted' | 'denied' | 'default' = 'default'
    
    const isProduction = window.location.hostname === 'kuluilanyeni.netlify.app'
    
    if (isProduction && isOneSignalReady()) {
      // Production'da OneSignal kullan
      currentPermission = await checkPushPermission()
    } else {
      // Localhost ve development'ta native API kullan
      currentPermission = Notification.permission as 'granted' | 'denied' | 'default'
    }
    
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
    if (!user) {
      console.error('No user found')
      return
    }

    console.log('🔔 Starting notification permission request...')
    setLoading(true)
    
    try {
      const isProduction = window.location.hostname === 'kuluilanyeni.netlify.app'
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      
      console.log('Environment:', isProduction ? 'Production' : isLocalhost ? 'Localhost' : 'Development')
      
      if (isProduction && isOneSignalReady()) {
        // Production'da OneSignal kullan
        console.log('Using OneSignal...')
        const success = await subscribeUserToPush(user.id)
        
        if (success) {
          // Permission'ı güncelle
          const newPermission = await checkPushPermission()
          setPermission(newPermission)
          
          if (newPermission === 'granted') {
            setShowPrompt(false)
            alert('✅ Bildirimler açıldı! İlanınız onaylandığında haber vereceğiz.')
          }
        } else {
          throw new Error('OneSignal subscription failed')
        }
      } else {
        // Development'ta native browser notification API kullan
        console.log('Using native Notification API...')
        
        // Timeout ekle - 10 saniye içinde cevap gelmezse hata ver
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Permission request timeout')), 10000)
        })
        
        const permissionPromise = Notification.requestPermission()
        
        const result = await Promise.race([permissionPromise, timeoutPromise]) as NotificationPermission
        
        console.log('Permission result:', result)
        
        if (result === 'granted') {
          setPermission('granted')
          setShowPrompt(false)
          
          // Test bildirimi göster
          try {
            new Notification('✅ Bildirimler Açıldı!', {
              body: 'İlanınız onaylandığında haber vereceğiz.',
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png'
            })
          } catch (notifError) {
            console.warn('Could not show test notification:', notifError)
          }
          
          console.log('✅ Bildirimler açıldı (Development mode)')
          alert('✅ Bildirimler açıldı!')
        } else if (result === 'denied') {
          setPermission('denied')
          setShowPrompt(false)
          alert('❌ Bildirim izni reddedildi. Tarayıcı ayarlarından izin verebilirsiniz.')
        } else {
          // default - kullanıcı kapatmış
          setShowPrompt(false)
          console.log('User dismissed the permission dialog')
        }
      }
    } catch (error) {
      console.error('❌ Push notification enable error:', error)
      alert('❌ Bildirimler açılamadı. Lütfen tarayıcı ayarlarınızı kontrol edin.')
      setShowPrompt(false)
    } finally {
      setLoading(false)
      console.log('🔔 Notification permission request completed')
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
