// OneSignal V16 Helper Functions

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
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
export async function subscribeUserToPush(userId: string, phone?: string): Promise<boolean> {
  try {
    if (!isOneSignalReady()) {
      console.warn('OneSignal is not ready');
      return false;
    }

    // Push notification izni iste
    const sub = await window.OneSignal.User.Push.subscribe();
    console.log("Push izin sonucu:", sub);
    
    // Kullanıcı ID'sini tag olarak ekle
    await window.OneSignal.User.addTag("user_id", userId);
    
    // Telefon numarasını da tag olarak ekle (varsa)
    if (phone) {
      await window.OneSignal.User.addTag("phone", phone);
      console.log("OneSignal tag eklendi:", phone);
    }
    
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

/**
 * Kullanıcı giriş yaptığında OneSignal abonelik işlemi (özel fonksiyon)
 * Bu fonksiyon istediğiniz yerde manuel olarak çağrılabilir
 */
export async function onUserLogin(userPhone: string, userId?: string): Promise<boolean> {
  try {
    // OneSignal SDK hazır olana kadar bekle
    if (!window.OneSignalDeferred) {
      window.OneSignalDeferred = [];
    }
    
    return new Promise((resolve) => {
      window.OneSignalDeferred!.push(async function(OneSignal: any) {
        try {
          // 📌 1. Kullanıcıya Push izni iste
          const sub = await OneSignal.User.Push.subscribe();
          console.log("Push izin sonucu:", sub);
          
          // 📌 2. OneSignal'a kullanıcıya ait telefon numarasını kaydet
          await OneSignal.User.addTag("phone", userPhone);
          console.log("OneSignal tag eklendi:", userPhone);
          
          // 📌 3. Kullanıcı ID'si varsa onu da ekle
          if (userId) {
            await OneSignal.User.addTag("user_id", userId);
            console.log("OneSignal user_id tag eklendi:", userId);
          }
          
          resolve(true);
        } catch (error) {
          console.error("OneSignal onUserLogin failed:", error);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error("OneSignal onUserLogin setup failed:", error);
    return false;
  }
}
