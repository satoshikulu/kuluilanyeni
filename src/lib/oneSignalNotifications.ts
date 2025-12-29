// OneSignal REST API ile bildirim gönderme

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '2c4e9ae5-6554-448c-8016-5d5a1894755a';
const ONESIGNAL_AUTH_KEY = import.meta.env.VITE_ONESIGNAL_AUTH_KEY || 'os_v2_app_frhjvzlfkrcizaawlvnbrfdvlicd2tdk3vpunt46wftlkso24yevrm2he7euenxjvqncdthm2nrywgwc4awij6s7f3bkpiinbhqookq';

export interface NotificationData {
  title: string;
  message: string;
  deepLink?: string;
  targetType: 'all' | 'user' | 'phone' | 'tag';
  targetValue?: string;
  icon?: string;
  image?: string;
  data?: Record<string, any>;
}

// Tüm kullanıcılara bildirim gönder
export async function sendNotificationToAll(notification: NotificationData): Promise<boolean> {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_AUTH_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { tr: notification.title },
        contents: { tr: notification.message },
        url: notification.deepLink || window.location.origin,
        chrome_web_icon: notification.icon || '/icon-192x192.png',
        chrome_web_image: notification.image,
        data: notification.data || {}
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('OneSignal bildirim gönderildi:', result);
      return true;
    } else {
      console.error('OneSignal bildirim hatası:', result);
      return false;
    }
  } catch (error) {
    console.error('OneSignal API hatası:', error);
    return false;
  }
}

// Belirli kullanıcıya bildirim gönder (telefon numarasına göre)
export async function sendNotificationToUser(phone: string, notification: NotificationData): Promise<boolean> {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_AUTH_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [
          { field: 'tag', key: 'phone', relation: '=', value: phone }
        ],
        headings: { tr: notification.title },
        contents: { tr: notification.message },
        url: notification.deepLink || window.location.origin,
        chrome_web_icon: notification.icon || '/icon-192x192.png',
        chrome_web_image: notification.image,
        data: notification.data || {}
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('OneSignal kullanıcı bildirimi gönderildi:', result);
      return true;
    } else {
      console.error('OneSignal kullanıcı bildirimi hatası:', result);
      return false;
    }
  } catch (error) {
    console.error('OneSignal API hatası:', error);
    return false;
  }
}

// Tag'e göre bildirim gönder
export async function sendNotificationToTag(tagKey: string, tagValue: string, notification: NotificationData): Promise<boolean> {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_AUTH_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [
          { field: 'tag', key: tagKey, relation: '=', value: tagValue }
        ],
        headings: { tr: notification.title },
        contents: { tr: notification.message },
        url: notification.deepLink || window.location.origin,
        chrome_web_icon: notification.icon || '/icon-192x192.png',
        chrome_web_image: notification.image,
        data: notification.data || {}
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('OneSignal tag bildirimi gönderildi:', result);
      return true;
    } else {
      console.error('OneSignal tag bildirimi hatası:', result);
      return false;
    }
  } catch (error) {
    console.error('OneSignal API hatası:', error);
    return false;
  }
}

// Bildirim şablonları
export const NotificationTemplates = {
  // Üyelik onayı bildirimi
  membershipApproved: (userName: string): NotificationData => ({
    title: '🎉 Üyeliğiniz Onaylandı!',
    message: `Tebrikler ${userName}! Üyeliğiniz onaylanmıştır. Artık ilan verebilirsiniz.`,
    deepLink: '/ilanlarim',
    targetType: 'user',
    icon: '/icon-192x192.png',
    data: { type: 'membership_approved' }
  }),

  // Favori ilan fiyat değişikliği
  favoriteListingPriceChanged: (listingTitle: string, oldPrice: number, newPrice: number, listingId: string): NotificationData => ({
    title: '💰 Favori İlanınızın Fiyatı Değişti!',
    message: `${listingTitle} - Fiyat: ${oldPrice.toLocaleString('tr-TR')}₺ → ${newPrice.toLocaleString('tr-TR')}₺`,
    deepLink: `/ilan/${listingId}`,
    targetType: 'tag',
    icon: '/icon-192x192.png',
    data: { 
      type: 'favorite_price_changed',
      listing_id: listingId,
      old_price: oldPrice,
      new_price: newPrice
    }
  }),

  // Fırsat ilanı bildirimi
  opportunityListing: (listingTitle: string, price: number, neighborhood: string, listingId: string): NotificationData => ({
    title: '🔥 Yeni Fırsat İlanı!',
    message: `${listingTitle} - ${price.toLocaleString('tr-TR')}₺ - ${neighborhood}`,
    deepLink: `/ilan/${listingId}`,
    targetType: 'all',
    icon: '/icon-192x192.png',
    data: { 
      type: 'opportunity_listing',
      listing_id: listingId
    }
  }),

  // Öne çıkan ilan bildirimi
  featuredListing: (listingTitle: string, price: number, neighborhood: string, listingId: string): NotificationData => ({
    title: '⭐ Öne Çıkan İlan!',
    message: `${listingTitle} - ${price.toLocaleString('tr-TR')}₺ - ${neighborhood}`,
    deepLink: `/ilan/${listingId}`,
    targetType: 'all',
    icon: '/icon-192x192.png',
    data: { 
      type: 'featured_listing',
      listing_id: listingId
    }
  }),

  // İlan onaylandı bildirimi
  listingApproved: (listingTitle: string, listingId: string): NotificationData => ({
    title: '✅ İlanınız Onaylandı!',
    message: `"${listingTitle}" ilanınız onaylanmış ve yayınlanmıştır.`,
    deepLink: `/ilan/${listingId}`,
    targetType: 'user',
    icon: '/icon-192x192.png',
    data: { 
      type: 'listing_approved',
      listing_id: listingId
    }
  })
};

// Kolay kullanım fonksiyonları
export async function sendMembershipApprovedNotification(phone: string, userName: string): Promise<boolean> {
  const notification = NotificationTemplates.membershipApproved(userName);
  return await sendNotificationToUser(phone, notification);
}

export async function sendFavoriteListingPriceChangedNotification(
  userPhones: string[], 
  listingTitle: string, 
  oldPrice: number, 
  newPrice: number, 
  listingId: string
): Promise<boolean> {
  const notification = NotificationTemplates.favoriteListingPriceChanged(listingTitle, oldPrice, newPrice, listingId);
  
  // Her kullanıcıya ayrı ayrı gönder
  const results = await Promise.all(
    userPhones.map(phone => sendNotificationToUser(phone, notification))
  );
  
  return results.every(result => result);
}

export async function sendOpportunityListingNotification(
  listingTitle: string, 
  price: number, 
  neighborhood: string, 
  listingId: string
): Promise<boolean> {
  const notification = NotificationTemplates.opportunityListing(listingTitle, price, neighborhood, listingId);
  return await sendNotificationToAll(notification);
}

export async function sendFeaturedListingNotification(
  listingTitle: string, 
  price: number, 
  neighborhood: string, 
  listingId: string
): Promise<boolean> {
  const notification = NotificationTemplates.featuredListing(listingTitle, price, neighborhood, listingId);
  return await sendNotificationToAll(notification);
}

export async function sendListingApprovedNotification(
  phone: string, 
  listingTitle: string, 
  listingId: string
): Promise<boolean> {
  const notification = NotificationTemplates.listingApproved(listingTitle, listingId);
  return await sendNotificationToUser(phone, notification);
}