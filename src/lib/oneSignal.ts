// OneSignal V16 Helper Functions

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred: any[];
    enablePush?: () => Promise<void>;
  }
}

// OneSignal sadece init edilir, otomatik subscribe yapılmaz
export async function initializeOneSignal() {
  console.log("OneSignal initialized - no auto subscribe");
}

/**
 * OneSignal'in yüklenip yüklenmediğini kontrol et
 */
export function isOneSignalReady(): boolean {
  return typeof window !== 'undefined' && !!window.OneSignal;
}

// Bu fonksiyon kaldırıldı - sadece login sonrası subscribe yapılacak

/**
 * Kullanıcı logout olduğunda OneSignal tag'lerini temizle
 */
export async function unsubscribeUserFromPush(): Promise<boolean> {
  try {
    if (!isOneSignalReady()) {
      console.warn('OneSignal is not ready');
      return false;
    }

    // User ID ve phone tag'lerini kaldır
    await window.OneSignal.User.removeTag("user_id");
    await window.OneSignal.User.removeTag("phone");
    
    console.log('✅ OneSignal user tags removed (user_id, phone)');
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

// Bu fonksiyon kaldırıldı - sadece LoginPage.tsx'te subscribe yapılacak
