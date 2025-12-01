import OneSignal from 'react-onesignal'

// OneSignal App ID - Bu değeri OneSignal dashboard'dan alacaksınız
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || 'YOUR_ONESIGNAL_APP_ID'

let isInitialized = false

/**
 * OneSignal'i başlat
 */
export async function initOneSignal() {
  if (isInitialized) return
  
  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true, // Development için
      notifyButton: {
        enable: false, // Kendi UI'ımızı kullanacağız
      },
    })
    
    isInitialized = true
    console.log('✅ OneSignal initialized')
  } catch (error) {
    console.error('❌ OneSignal initialization failed:', error)
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
    
    // External User ID olarak telefon numarasını kullan
    await OneSignal.setExternalUserId(phone)
    
    // Kullanıcı bilgilerini tag olarak ekle
    await OneSignal.sendTags({
      user_id: userId,
      phone: phone,
      subscribed_at: new Date().toISOString()
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
    
    // Slidedown prompt göster
    await OneSignal.showSlidedownPrompt()
    
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
    
    const permission = await OneSignal.getNotificationPermission()
    return permission as 'granted' | 'denied' | 'default'
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
    
    const playerId = await OneSignal.getUserId()
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
    
    await OneSignal.setSubscription(false)
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
