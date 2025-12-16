// Firebase Cloud Messaging Helper Functions
import { messaging, getToken, onMessage } from './firebase';
import { supabase } from './supabaseClient';

// VAPID Key - Environment variable'dan al
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// FCM token'ı al
export async function getFCMToken(): Promise<string | null> {
  try {
    // Service worker'ı kaydet
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    // Token al
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (token) {
      console.log('✅ FCM Token alındı:', token);
      return token;
    } else {
      console.log('❌ FCM Token alınamadı - izin verilmedi');
      return null;
    }
  } catch (error) {
    console.error('❌ FCM Token hatası:', error);
    return null;
  }
}

// Push notification izni iste
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      console.log('❌ Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('❌ Notification permission error:', error);
    return false;
  }
}

// Foreground mesajları dinle
export function listenForMessages(callback: (payload: any) => void) {
  onMessage(messaging, (payload) => {
    console.log('📱 Foreground message received:', payload);
    callback(payload);
  });
}

// Kullanıcıyı FCM'e kaydet
export async function subscribeUserToFCM(userId: string, phone: string): Promise<boolean> {
  try {
    // İzin iste
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return false;
    }
    
    // Token al
    const token = await getFCMToken();
    if (!token) {
      return false;
    }
    
    // Token'ı Supabase'e kaydet
    await saveFCMTokenToDatabase(userId, phone, token);
    
    console.log('🔗 User subscribed to FCM:', { userId, phone, token });
    
    return true;
  } catch (error) {
    console.error('❌ FCM subscription error:', error);
    return false;
  }
}

// FCM Token'ı Supabase'e kaydet - UPSERT kullan
async function saveFCMTokenToDatabase(userId: string, phone: string, token: string): Promise<void> {
  try {
    console.log('💾 FCM token kaydediliyor:', {
      userId: userId,
      phone: phone,
      tokenPreview: token.substring(0, 20) + '...'
    });

    // UPSERT by user_id - one token per user
    const { error } = await supabase
      .from('fcm_tokens')
      .upsert({
        user_id: userId,
        phone: phone,
        token: token,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id' // One token per user
      });

    if (error) {
      console.error('❌ FCM token upsert error:', error);
      throw error;
    } else {
      console.log('✅ FCM token başarıyla kaydedildi/güncellendi');
    }
  } catch (error) {
    console.error('❌ FCM token kayıt hatası:', error);
    throw error;
  }
}

// FCM Token'ı veritabanından sil (logout sırasında)
export async function removeFCMTokenFromDatabase(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('fcm_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ FCM token delete error:', error);
    } else {
      console.log('✅ FCM token removed from database');
    }
  } catch (error) {
    console.error('❌ Database delete operation error:', error);
  }
}