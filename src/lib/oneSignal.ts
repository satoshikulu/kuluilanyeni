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
 * NOT: OneSignal SDK index.html'de yükleniyor, burada sadece hazır olmasını bekliyoruz
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
  
  console.log('🔔 OneSignal waiting for SDK to load...')

  try {
    // OneSignal SDK'nın yüklenmesini bekle (index.html'de yükleniyor)
    // SDK'yı TEKRAR yükleme - bu "SDK already initialized" hatasına neden olur!
    
    // OneSignal'in hazır olmasını bekle
    let attempts = 0
    const maxAttempts = 50 // 5 saniye (50 * 100ms)
    
    while (!window.OneSignal && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }

    if (!window.OneSignal) {
      throw new Error('OneSignal SDK failed to load')
    }

    console.log('✅ OneSignal SDK ready')
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
