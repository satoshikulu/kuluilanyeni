// OneSignal V16 Helper Functions - Modern API

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred: any[];
  }
}

/**
 * OneSignal'in yüklenip yüklenmediğini kontrol et
 */
export function isOneSignalReady(): boolean {
  return typeof window !== 'undefined' && !!window.OneSignal;
}

/**
 * Login sonrası OneSignal External ID bağla ve push notification etkinleştir
 * Bu fonksiyon SADECE başarılı login sonrası çağrılmalı
 */
export async function enablePushAfterLogin(user: { id: string; phone?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        console.log("🔔 Login sonrası OneSignal External ID bağlanıyor:", user.id);
        
        // 1. OneSignal External ID'yi kullanıcı ID'si ile bağla
        await OneSignal.login(user.id);
        console.log("✅ OneSignal External ID bağlandı:", user.id);
        
        // 2. Notification permission iste
        const permission = await OneSignal.Notifications.requestPermission();
        console.log("🔔 Permission sonucu:", permission);
        
        if (permission === "granted") {
          // 3. Push subscription etkinleştir
          await OneSignal.User.Push.subscribe();
          console.log("✅ Push subscription başarılı");
          
          // 4. Kullanıcı tag'lerini ekle
          if (user.phone) {
            await OneSignal.User.addTag("phone", user.phone);
            console.log("✅ Phone tag eklendi:", user.phone);
          }
          
          await OneSignal.User.addTag("user_id", user.id);
          console.log("✅ User ID tag eklendi:", user.id);
          
          resolve(true);
        } else {
          console.warn("❌ Notification permission reddedildi");
          resolve(false);
        }
      } catch (error) {
        console.error("❌ Push enable error:", error);
        resolve(false);
      }
    });
  });
}

/**
 * Kullanıcı logout olduğunda OneSignal'dan çıkış yap
 */
export async function logoutFromOneSignal(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isOneSignalReady()) {
      console.warn('OneSignal is not ready');
      resolve(false);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        // User tag'lerini temizle
        await OneSignal.User.removeTag("user_id");
        await OneSignal.User.removeTag("phone");
        
        // OneSignal'dan logout
        await OneSignal.logout();
        
        console.log('✅ OneSignal logout başarılı');
        resolve(true);
      } catch (error) {
        console.error('❌ OneSignal logout failed:', error);
        resolve(false);
      }
    });
  });
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
 * OneSignal kullanıcı ID'sini al
 */
export async function getOneSignalUserId(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!isOneSignalReady()) {
      resolve(null);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        const userId = await OneSignal.User.onesignalId;
        resolve(userId || null);
      } catch (error) {
        console.error('OneSignal User ID alınamadı:', error);
        resolve(null);
      }
    });
  });
}