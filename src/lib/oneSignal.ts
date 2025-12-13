// OneSignal V16 Helper Functions - Modern API

// OneSignal V16 Types - sadece gerekli olanlar
declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred: any[];
  }
}

// Supabase User type import
interface User {
  id: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

/**
 * OneSignal'in yüklenip yüklenmediğini kontrol et
 */
export function isOneSignalReady(): boolean {
  return typeof window !== 'undefined' && !!window.OneSignal;
}

/**
 * OneSignal init (external_id destekli)
 * Bu fonksiyon uygulama başlangıcında çağrılmalı
 */
export async function initOneSignal(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!("OneSignal" in window)) {
      console.warn("OneSignal SDK yüklenmemiş");
      resolve(false);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.init({
          appId: "eb4688c6-138a-499a-b1da-bb3bee7369af",
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          autoRegister: false,
          autoPrompt: false,
          autoResubscribe: false,
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true, // Development için
          promptOptions: {
            slidedown: { 
              enabled: true,
              autoPrompt: false,
              acceptButton: "İzin Ver",
              cancelButton: "Şimdi Değil",
              actionMessage: "Yeni ilanlar ve güncellemeler hakkında bildirim almak ister misiniz?"
            }
          }
        });

        console.log("✅ OneSignal initialized (external_id destekli)");
        resolve(true);
      } catch (error) {
        console.error("❌ OneSignal init hatası:", error);
        resolve(false);
      }
    });
  });
}

/**
 * Login sonrası external_id bağlama (EN KRİTİK KISIM)
 * Supabase user.id = OneSignal external_id
 */
export async function linkUserToOneSignal(user: User): Promise<boolean> {
  return new Promise((resolve) => {
    if (!user?.id) {
      console.warn("User ID bulunamadı");
      resolve(false);
      return;
    }

    if (!isOneSignalReady()) {
      console.warn("OneSignal is not ready");
      resolve(false);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        console.log("🔗 OneSignal external_id bağlanıyor:", user.id);
        
        // 🔥 EN KRİTİK: OneSignal.login(external_id) → external_id = user.id
        await OneSignal.login(user.id);
        
        console.log("✅ OneSignal external_id bağlandı:", user.id);
        resolve(true);
      } catch (error) {
        console.error("❌ OneSignal external_id hatası:", error);
        resolve(false);
      }
    });
  });
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
 * Logout → OneSignal bağlantısını kopar (ÇOK ÖNEMLİ)
 * Aynı tarayıcıda başka kullanıcı login olursa push'lar karışmaz
 */
export async function unlinkOneSignalUser(): Promise<boolean> {
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
        await OneSignal.User.removeTag("email");
        
        // 🚪 OneSignal logout - external_id bağlantısını kopar
        await OneSignal.logout();
        
        console.log('🚪 OneSignal logout - external_id bağlantısı koparıldı');
        resolve(true);
      } catch (error) {
        console.error('❌ OneSignal logout hatası:', error);
        resolve(false);
      }
    });
  });
}

/**
 * Kullanıcı logout olduğunda OneSignal'dan çıkış yap (DEPRECATED)
 * unlinkOneSignalUser() kullanın
 */
export async function logoutFromOneSignal(): Promise<boolean> {
  console.warn("logoutFromOneSignal() deprecated, unlinkOneSignalUser() kullanın");
  return unlinkOneSignalUser();
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

/**
 * OneSignal kullanıcı telefon ve email bilgilerini ekle
 * Telefon numarası E.164 formatında olmalı (+905xxxxxxxxx)
 */
export async function setOneSignalUserData({
  phone,
  email,
}: {
  phone?: string;
  email?: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isOneSignalReady()) {
      console.warn('OneSignal is not ready');
      resolve(false);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        console.log("📱 OneSignal kullanıcı bilgileri ekleniyor...");

        // Email ekle
        if (email && email.includes('@')) {
          try {
            await OneSignal.User.addEmail(email);
            console.log("✅ Email eklendi:", email);
          } catch (emailError) {
            console.error("❌ Email ekleme hatası:", emailError);
          }
        }

        // Telefon ekle (E.164 formatında)
        if (phone) {
          try {
            // Telefon numarasını E.164 formatına çevir
            let formattedPhone = phone;
            
            // Türkiye telefon numarası formatlaması
            if (phone.startsWith('5') && phone.length === 10) {
              // 5xxxxxxxxx -> +905xxxxxxxxx
              formattedPhone = '+90' + phone;
            } else if (phone.startsWith('05') && phone.length === 11) {
              // 05xxxxxxxxx -> +905xxxxxxxxx
              formattedPhone = '+9' + phone;
            } else if (phone.startsWith('905') && phone.length === 12) {
              // 905xxxxxxxxx -> +905xxxxxxxxx
              formattedPhone = '+' + phone;
            } else if (!phone.startsWith('+90')) {
              // Diğer durumlar için +90 ekle
              formattedPhone = '+90' + phone.replace(/^0+/, '');
            }

            console.log("📱 Telefon formatlanıyor:", phone, "->", formattedPhone);
            
            await OneSignal.User.addSms(formattedPhone);
            console.log("✅ SMS/Phone eklendi:", formattedPhone);
          } catch (phoneError) {
            console.error("❌ Telefon ekleme hatası:", phoneError);
          }
        }

        console.log("✅ OneSignal kullanıcı bilgileri başarıyla eklendi");
        resolve(true);
      } catch (error) {
        console.error("❌ OneSignal kullanıcı bilgileri ekleme hatası:", error);
        resolve(false);
      }
    });
  });
}

// showPushSubscriptionPrompt fonksiyonu kaldırıldı
// Artık PushEnableButton içinde user click event ile slidedown açılıyor

/**
 * OneSignal push permission durumunu kontrol et
 */
export async function checkOneSignalPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isOneSignalReady()) {
      resolve(false);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        const permission = await OneSignal.Notifications.permission;
        resolve(!!permission);
      } catch (error) {
        console.error("OneSignal permission check error:", error);
        resolve(false);
      }
    });
  });
}