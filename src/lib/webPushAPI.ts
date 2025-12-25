// Web Push API Integration - Browser Native Implementation
import { normalizePhone } from './webPushMessaging';

// Send notification via Browser Native Push API (no Edge Function)
async function sendBrowserPushNotification(
  phone: string,
  title: string,
  body: string,
  data?: any,
  url?: string
): Promise<boolean> {
  try {
    console.log('📱 Sending Browser Native Push notification:', { phone, title, body });

    // Service Worker üzerinden notification göster
    const registration = await navigator.serviceWorker.ready;
    
    if (!registration) {
      console.error('❌ Service Worker not ready');
      return false;
    }

    await registration.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: 'kulu-ilan-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Aç',
          icon: '/icon-96x96.png'
        },
        {
          action: 'close',
          title: 'Kapat'
        }
      ],
      data: {
        url: url || '/',
        phone,
        ...data,
        timestamp: Date.now()
      }
    });

    console.log('✅ Browser Native Push notification sent successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Browser Native Push notification error:', error);
    return false;
  }
}

// Send listing approved notification
export async function sendListingApprovedNotification(
  ownerPhone: string,
  listingTitle: string,
  listingId: string
): Promise<boolean> {
  return await sendBrowserPushNotification(
    ownerPhone,
    '🎉 İlanınız Onaylandı!',
    `"${listingTitle}" ilanınız onaylandı ve yayınlandı.`,
    { 
      type: 'listing_approved',
      listingId,
      action: 'view_listing'
    },
    `/listing/${listingId}`
  );
}

// Send listing rejected notification
export async function sendListingRejectedNotification(
  ownerPhone: string,
  listingTitle: string,
  reason?: string
): Promise<boolean> {
  const body = reason 
    ? `"${listingTitle}" ilanınız reddedildi. Sebep: ${reason}`
    : `"${listingTitle}" ilanınız reddedildi.`;
    
  return await sendBrowserPushNotification(
    ownerPhone,
    '❌ İlan Reddedildi',
    body,
    { 
      type: 'listing_rejected',
      reason,
      action: 'view_profile'
    },
    '/profile'
  );
}

// Send user approved notification
export async function sendUserApprovedNotification(
  userPhone: string,
  userName: string
): Promise<boolean> {
  return await sendBrowserPushNotification(
    userPhone,
    '✅ Hesabınız Onaylandı!',
    `Merhaba ${userName}, hesabınız onaylandı. Artık ilan verebilirsiniz.`,
    { 
      type: 'user_approved',
      action: 'create_listing'
    },
    '/create-listing'
  );
}

// Send user rejected notification
export async function sendUserRejectedNotification(
  userPhone: string,
  userName: string,
  reason?: string
): Promise<boolean> {
  const body = reason 
    ? `Merhaba ${userName}, hesabınız reddedildi. Sebep: ${reason}`
    : `Merhaba ${userName}, hesabınız reddedildi.`;
    
  return await sendBrowserPushNotification(
    userPhone,
    '❌ Hesap Reddedildi',
    body,
    { 
      type: 'user_rejected',
      reason,
      action: 'contact_support'
    },
    '/contact'
  );
}

// Send custom notification
export async function sendCustomNotification(
  phone: string,
  title: string,
  body: string,
  url?: string,
  data?: any
): Promise<boolean> {
  return await sendBrowserPushNotification(
    phone,
    title,
    body,
    { 
      type: 'custom',
      ...data
    },
    url
  );
}

// Send bulk notifications (for admin broadcasts)
export async function sendBulkNotifications(
  phones: string[],
  title: string,
  body: string,
  url?: string,
  data?: any
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  console.log(`📢 Sending bulk notifications to ${phones.length} users`);
  
  // Send notifications in parallel (but limit concurrency)
  const batchSize = 10;
  for (let i = 0; i < phones.length; i += batchSize) {
    const batch = phones.slice(i, i + batchSize);
    
    const promises = batch.map(async (phone) => {
      const result = await sendBrowserPushNotification(phone, title, body, data, url);
      return result ? 'success' : 'failed';
    });
    
    const results = await Promise.all(promises);
    success += results.filter(r => r === 'success').length;
    failed += results.filter(r => r === 'failed').length;
    
    // Small delay between batches to avoid overwhelming the browser
    if (i + batchSize < phones.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`📢 Bulk notifications completed: ${success} success, ${failed} failed`);
  return { success, failed };
}

// Test Web Push notification
export async function testWebPushNotification(phone: string): Promise<boolean> {
  return await sendBrowserPushNotification(
    phone,
    '🧪 Test Bildirimi',
    'Bu bir test bildirimidir. Browser Native Push çalışıyor!',
    { 
      type: 'test',
      timestamp: Date.now()
    },
    '/'
  );
}