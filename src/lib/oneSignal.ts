// OneSignal V16 Helper Functions

declare global {
  interface Window {
    OneSignal?: any;
  }
}

/**
 * OneSignal'in yüklenip yüklenmediğini kontrol et
 */
export function isOneSignalReady(): boolean {
  return typeof window !== 'undefined' && !!window.OneSignal;
}

/**
 * Kullanıcı için push notification subscribe işlemi
 */
export async function subscribeUserToPush(userId: string): Promise<boolean> {
  try {
    if (!isOneSignalReady()) {
      console.warn('OneSignal is not ready');
      return false;
    }

    // Push notification izni iste
    await window.OneSignal.User.Push.subscribe();
    
    // Kullanıcı ID'sini tag olarak ekle
    await window.OneSignal.User.addTag("user_id", userId);
    
    console.log('✅ OneSignal subscription successful for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ OneSignal subscription failed:', error);
    return false;
  }
}

/**
 * Kullanıcı logout olduğunda OneSignal tag'lerini temizle
 */
export async function unsubscribeUserFromPush(): Promise<boolean> {
  try {
    if (!isOneSignalReady()) {
      console.warn('OneSignal is not ready');
      return false;
    }

    // User ID tag'ini kaldır
    await window.OneSignal.User.removeTag("user_id");
    
    console.log('✅ OneSignal user tag removed');
    return true;
  } catch (error) {
    console.error('❌ OneSignal tag removal failed:', error);
    return false;
  }
}

/**
 * Push notification permission durumunu kontrol et
 */
export async function checkPushPermission(): Promise<'granted' | 'denied' | 'default'> {
  try {
    if (!isOneSignalReady()) {
      return 'default';
    }

    const permission = await window.OneSignal.Notifications.permission;
    return permission ? 'granted' : 'default';
  } catch (error) {
    console.error('Push permission check failed:', error);
    return 'default';
  }
}
