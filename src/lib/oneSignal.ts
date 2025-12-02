// OneSignal App ID - Bu değeri OneSignal dashboard'dan alacaksınız
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || 'YOUR_ONESIGNAL_APP_ID'

let isInitialized = false

// OneSignal global object type
declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>
    OneSignal?: any
  }
}

/**
 * OneSignal'i başlat
 */
export async function initOneSignal() {
  if (isInitialized) {
    console.log('⚠️ OneSignal already initialized, skipping...')
    return
  }

  // Sadece production'da çalış (OneSignal Service Worker sorunları nedeniyle)
  const isProduction = window.location.hostname === 'kuluilanyeni.netlify.app'

  if (!isProduction) {
    console.log('ℹ️ OneSignal skipped: Development mode (use native Notification API)')
    isInitialized = true // Tekrar denemeyi önle
    return
  }
  
  console.log('🔔 OneSignal initializing on:', window.location.hostname)

  try {
    // OneSignal SDK'yı yükle
    if (!window.OneSignalDeferred) {
      window.OneSignalDeferred = []
    }

    // OneSignal script'i yükle
    if (!document.getElementById('onesignal-sdk')) {
      const script = document.createElement('script')
      script.id = 'onesignal-sdk'
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
      script.defer = true
      document.head.appendChild(script)
    }

    // OneSignal'i başlat
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: false,
        })
        console.log('✅ OneSignal initialized')
      } catch (error: any) {
        // AppID uyuşmazlığı hatası - eski kaydı temizle
        if (error?.message?.includes("AppID doesn't match")) {
          console.warn('⚠️ OneSignal AppID mismatch detected, clearing old data...')
          // Service Worker'ı temizle
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
              registrations.forEach((registration) => {
                if (registration.active?.scriptURL.includes('onesignal')) {
                  registration.unregister()
                }
              })
            })
          }
          // IndexedDB'yi temizle
          if ('indexedDB' in window) {
            indexedDB.deleteDatabase('ONE_SIGNAL_SDK_DB')
          }
          console.log('ℹ️ Please refresh the page to complete OneSignal setup')
        } else {
          console.error('❌ OneSignal initialization failed:', error)
        }
      }
    })

    isInitialized = true
  } catch (error) {
    console.error('❌ OneSignal initialization failed:', error)
    // Hata durumunda da initialized olarak işaretle ki tekrar denemesin
    isInitialized = true
  }
}

/**
 * Kullanıcıyı OneSignal'e kaydet ve external user ID set et
 */
export async function subscribeUser(userId: string, phone: string) {
  try {
    if (!isInitialized) {
      await initOneSignal()
    }

    if (!window.OneSignal) {
      console.error('OneSignal not loaded')
      return false
    }

    // External User ID olarak telefon numarasını kullan
    await window.OneSignal.login(phone)

    // Kullanıcı bilgilerini tag olarak ekle
    await window.OneSignal.User.addTags({
      user_id: userId,
      phone: phone,
      subscribed_at: new Date().toISOString(),
    })

    console.log('✅ User subscribed to OneSignal:', phone)
    return true
  } catch (error) {
    console.error('❌ OneSignal subscription failed:', error)
    return false
  }
}

/**
 * Push notification izni iste
 */
export async function requestNotificationPermission() {
  try {
    if (!isInitialized) {
      await initOneSignal()
    }

    if (!window.OneSignal) {
      console.error('OneSignal not loaded')
      return false
    }

    // Slidedown prompt göster
    await window.OneSignal.Slidedown.promptPush()

    return true
  } catch (error) {
    console.error('❌ Notification permission request failed:', error)
    return false
  }
}

/**
 * Kullanıcının bildirim izni durumunu kontrol et
 */
export async function getNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  try {
    if (!isInitialized) {
      await initOneSignal()
    }

    if (!window.OneSignal) {
      return 'default'
    }

    const permission = await window.OneSignal.Notifications.permission
    return permission ? 'granted' : 'default'
  } catch (error) {
    console.error('❌ Get notification permission failed:', error)
    return 'default'
  }
}

/**
 * Kullanıcının OneSignal Player ID'sini al
 */
export async function getPlayerId(): Promise<string | null> {
  try {
    if (!isInitialized) {
      await initOneSignal()
    }

    if (!window.OneSignal) {
      return null
    }

    const playerId = window.OneSignal.User.PushSubscription.id
    return playerId
  } catch (error) {
    console.error('❌ Get player ID failed:', error)
    return null
  }
}

/**
 * Kullanıcıyı unsubscribe et
 */
export async function unsubscribeUser() {
  try {
    if (!isInitialized) {
      await initOneSignal()
    }

    if (!window.OneSignal) {
      return false
    }

    await window.OneSignal.User.PushSubscription.optOut()
    console.log('✅ User unsubscribed from OneSignal')
    return true
  } catch (error) {
    console.error('❌ OneSignal unsubscribe failed:', error)
    return false
  }
}

/**
 * Test notification gönder (development için)
 */
export async function sendTestNotification() {
  try {
    const playerId = await getPlayerId()
    if (!playerId) {
      console.error('No player ID found')
      return false
    }

    console.log('Player ID:', playerId)
    console.log('Test notification için OneSignal dashboard kullanın')
    return true
  } catch (error) {
    console.error('❌ Test notification failed:', error)
    return false
  }
}
