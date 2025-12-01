/**
 * OneSignal REST API ile bildirim gönderme
 * Backend'den veya admin panelinden kullanılır
 */

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY

interface NotificationData {
  phone: string // External User ID olarak telefon kullanıyoruz
  title: string
  message: string
  url?: string
  data?: Record<string, any>
}

/**
 * Belirli bir kullanıcıya push notification gönder
 */
export async function sendPushNotification(notification: NotificationData): Promise<boolean> {
  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('OneSignal credentials not configured')
      return false
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [notification.phone],
        headings: { en: notification.title },
        contents: { en: notification.message },
        url: notification.url,
        data: notification.data,
        // iOS ve Android için icon
        chrome_web_icon: '/icon-192x192.jpg',
        firefox_icon: '/icon-192x192.jpg',
        // Ses ve titreşim
        android_sound: 'default',
        ios_sound: 'default',
        // Öncelik
        priority: 10,
        // TTL (Time to Live) - 1 gün
        ttl: 86400
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OneSignal API error:', error)
      return false
    }

    const result = await response.json()
    console.log('✅ Push notification sent:', result)
    return true
  } catch (error) {
    console.error('❌ Send push notification failed:', error)
    return false
  }
}

/**
 * İlan onaylandı bildirimi gönder
 */
export async function sendListingApprovedNotification(
  ownerPhone: string,
  listingTitle: string,
  listingId: string
): Promise<boolean> {
  return sendPushNotification({
    phone: ownerPhone,
    title: '🎉 İlanınız Onaylandı!',
    message: `"${listingTitle}" ilanınız yayına alındı ve artık herkes görebilir.`,
    url: `/ilan/${listingId}`,
    data: {
      type: 'listing_approved',
      listing_id: listingId
    }
  })
}

/**
 * İlan reddedildi bildirimi gönder
 */
export async function sendListingRejectedNotification(
  ownerPhone: string,
  listingTitle: string
): Promise<boolean> {
  return sendPushNotification({
    phone: ownerPhone,
    title: '❌ İlanınız Reddedildi',
    message: `"${listingTitle}" ilanınız reddedildi. Detaylar için ilanlarım sayfasını ziyaret edin.`,
    url: '/ilanlarim',
    data: {
      type: 'listing_rejected'
    }
  })
}

/**
 * Üyelik onaylandı bildirimi gönder
 */
export async function sendUserApprovedNotification(
  userPhone: string,
  userName: string
): Promise<boolean> {
  return sendPushNotification({
    phone: userPhone,
    title: '✅ Üyeliğiniz Onaylandı!',
    message: `Hoş geldiniz ${userName}! Artık ilan verebilir ve favorilerinizi kaydedebilirsiniz.`,
    url: '/',
    data: {
      type: 'user_approved'
    }
  })
}

/**
 * Üyelik reddedildi bildirimi gönder
 */
export async function sendUserRejectedNotification(
  userPhone: string,
  userName: string
): Promise<boolean> {
  return sendPushNotification({
    phone: userPhone,
    title: '❌ Üyelik Başvurunuz Reddedildi',
    message: `${userName}, üyelik başvurunuz reddedildi. Daha fazla bilgi için bizimle iletişime geçebilirsiniz.`,
    url: '/',
    data: {
      type: 'user_rejected'
    }
  })
}
