// Firebase Cloud Messaging API Helper
// Supabase Edge Function üzerinden FCM bildirimleri gönderir

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// FCM Edge Function URL
const FCM_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-fcm-notification`;

// İlan onaylandı bildirimi gönder - Güvenli fetch
export async function sendListingApprovedNotification(
  phone: string,
  listingTitle: string,
  listingId: string
): Promise<boolean> {
  try {
    console.log('📱 İlan onay bildirimi gönderiliyor:', { phone, listingTitle, listingId });

    const response = await fetch(FCM_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        phone: phone,
        title: '🎉 İlanınız Onaylandı!',
        body: `"${listingTitle}" ilanınız yayınlandı ve artık görülebilir.`,
        data: {
          type: 'listing_approved',
          listing_id: listingId,
          action_url: `/ilan/${listingId}`
        }
      })
    });

    // Güvenli JSON parse
    const text = await response.text();
    let result;
    
    try {
      result = JSON.parse(text);
      console.log('✅ Edge Function response:', result);
    } catch (parseError) {
      console.error('❌ JSON parse failed. Raw response:', text);
      console.error('Parse error:', parseError);
      return false;
    }
    
    if (result.success) {
      console.log('✅ Listing approved notification sent successfully');
      return true;
    } else {
      console.error('❌ Listing approved notification failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Listing approved notification error:', error);
    return false;
  }
}

// İlan reddedildi bildirimi gönder - Güvenli fetch
export async function sendListingRejectedNotification(
  phone: string,
  listingTitle: string
): Promise<boolean> {
  try {
    console.log('📱 İlan red bildirimi gönderiliyor:', { phone, listingTitle });

    const response = await fetch(FCM_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        phone: phone,
        title: '❌ İlan Reddedildi',
        body: `"${listingTitle}" ilanınız onaylanmadı. Lütfen bilgileri kontrol edip tekrar deneyin.`,
        data: {
          type: 'listing_rejected',
          action_url: '/ilanlarim'
        }
      })
    });

    // Güvenli JSON parse
    const text = await response.text();
    let result;
    
    try {
      result = JSON.parse(text);
      console.log('✅ Edge Function response:', result);
    } catch (parseError) {
      console.error('❌ JSON parse failed. Raw response:', text);
      console.error('Parse error:', parseError);
      return false;
    }
    
    if (result.success) {
      console.log('✅ Listing rejected notification sent successfully');
      return true;
    } else {
      console.error('❌ Listing rejected notification failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Listing rejected notification error:', error);
    return false;
  }
}

// Kullanıcı onaylandı bildirimi gönder - Güvenli fetch
export async function sendUserApprovedNotification(
  phone: string,
  userName: string
): Promise<boolean> {
  try {
    console.log('📱 Kullanıcı onay bildirimi gönderiliyor:', { phone, userName });

    const response = await fetch(FCM_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        phone: phone,
        title: '🎉 Hesabınız Onaylandı!',
        body: `Merhaba ${userName}, hesabınız onaylandı. Artık ilan verebilirsiniz.`,
        data: {
          type: 'user_approved',
          action_url: '/satmak'
        }
      })
    });

    // Güvenli JSON parse
    const text = await response.text();
    let result;
    
    try {
      result = JSON.parse(text);
      console.log('✅ Edge Function response:', result);
    } catch (parseError) {
      console.error('❌ JSON parse failed. Raw response:', text);
      console.error('Parse error:', parseError);
      return false;
    }
    
    if (result.success) {
      console.log('✅ User approved notification sent successfully');
      return true;
    } else {
      console.error('❌ User approved notification failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ User approved notification error:', error);
    return false;
  }
}

// Kullanıcı reddedildi bildirimi gönder - Güvenli fetch
export async function sendUserRejectedNotification(
  phone: string,
  userName: string
): Promise<boolean> {
  try {
    console.log('📱 Kullanıcı red bildirimi gönderiliyor:', { phone, userName });

    const response = await fetch(FCM_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        phone: phone,
        title: '❌ Hesap Onaylanmadı',
        body: `Merhaba ${userName}, hesabınız onaylanmadı. Lütfen bilgilerinizi kontrol edin.`,
        data: {
          type: 'user_rejected',
          action_url: '/giris'
        }
      })
    });

    // Güvenli JSON parse
    const text = await response.text();
    let result;
    
    try {
      result = JSON.parse(text);
      console.log('✅ Edge Function response:', result);
    } catch (parseError) {
      console.error('❌ JSON parse failed. Raw response:', text);
      console.error('Parse error:', parseError);
      return false;
    }
    
    if (result.success) {
      console.log('✅ User rejected notification sent successfully');
      return true;
    } else {
      console.error('❌ User rejected notification failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ User rejected notification error:', error);
    return false;
  }
}