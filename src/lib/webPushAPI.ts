// Web Push API Integration - Replace Firebase API calls
import { supabase } from './supabaseClient';
import { normalizePhone } from './webPushMessaging';

// Send notification via Web Push Edge Function
async function sendWebPushNotification(
  phone: string,
  title: string,
  body: string,
  data?: any,
  url?: string
): Promise<boolean> {
  try {
    const normalizedPhone = normalizePhone(phone);
    
    console.log('📱 Sending Web Push notification:', {
      originalPhone: phone,
      normalizedPhone,
      title,
      body,
      url
    });

    const { data: result, error } = await supabase.functions.invoke('send-web-push', {
      body: {
        phone: normalizedPhone,
        title,
        body,
        data,
        url
      }
    });

    if (error) {
      console.error('❌ Web Push notification error:', error);
      return false;
    }

    if (result?.success) {
      console.log('✅ Web Push notification sent successfully');
      return true;
    } else {
      console.error('❌ Web Push notification failed:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Web Push notification exception:', error);
    return false;
  }
}

// Send listing approved notification
export async function sendListingApprovedNotification(
  ownerPhone: string,
  listingTitle: string,
  listingId: string
): Promise<boolean> {
  return await sendWebPushNotification(
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
    
  return await sendWebPushNotification(
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
  return await sendWebPushNotification(
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
    
  return await sendWebPushNotification(
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
  return await sendWebPushNotification(
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
      const result = await sendWebPushNotification(phone, title, body, data, url);
      return result ? 'success' : 'failed';
    });
    
    const results = await Promise.all(promises);
    success += results.filter(r => r === 'success').length;
    failed += results.filter(r => r === 'failed').length;
    
    // Small delay between batches to avoid overwhelming the server
    if (i + batchSize < phones.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`📢 Bulk notifications completed: ${success} success, ${failed} failed`);
  return { success, failed };
}

// Test Web Push notification
export async function testWebPushNotification(phone: string): Promise<boolean> {
  return await sendWebPushNotification(
    phone,
    '🧪 Test Bildirimi',
    'Bu bir test bildirimidir. Web Push Protocol çalışıyor!',
    { 
      type: 'test',
      timestamp: Date.now()
    },
    '/'
  );
}