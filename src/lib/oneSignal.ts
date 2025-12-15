// OneSignal V16 Helper Functions - Subscribe Sonrası Tag Set Sistemi

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred: any[];
  }
}

// Mevcut kullanıcı bilgilerini saklamak için
let currentUserData: { id: string; phone?: string; email?: string } | null = null;
let subscriptionListenerSetup = false;

/**
 * OneSignal'in yüklenip yüklenmediğini kontrol et
 */
export function isOneSignalReady(): boolean {
  return typeof window !== 'undefined' && !!window.OneSignal;
}

/**
 * Login başarılı olduğunda - SADECE external_id bağla
 * Tag'leri set ETME, subscribe sonrası yapılacak
 */
export async function linkUserToOneSignal(user: { id: string; phone?: string; email?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    if (!user?.id) {
      console.warn("❌ User ID bulunamadı");
      resolve(false);
      return;
    }

    // Kullanıcı bilgilerini sakla (subscribe sonrası kullanmak için)
    currentUserData = user;
    console.log("💾 Kullanıcı bilgileri saklandı:", { id: user.id, phone: user.phone });

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        console.log("🔗 OneSignal external_id bağlanıyor:", user.id);
        
        // SADECE external_id bağla - tag'leri set etme
        await OneSignal.login(user.id);
        
        console.log("✅ OneSignal external_id bağlandı:", user.id);
        console.log("ℹ️ Tag'ler subscribe sonrası set edilecek");
        
        resolve(true);
      } catch (error) {
        console.error("❌ OneSignal external_id hatası:", error);
        resolve(false);
      }
    });
  });
}

/**
 * Subscribe sonrası tag'leri otomatik set et
 * OneSignal.User.PushSubscription.addEventListener("change") kullanır
 */
export function setupSubscriptionListener(): void {
  // Listener sadece bir kez kurulsun
  if (subscriptionListenerSetup) {
    console.log("ℹ️ Subscription listener zaten kurulmuş");
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    try {
      console.log("🔔 OneSignal subscription listener kuruluyor...");
      
      // Subscribe değişikliklerini dinle
      OneSignal.User.PushSubscription.addEventListener("change", async (event: any) => {
        console.log("🔔 Push subscription değişti:", event);
        
        // Subscribe oldu mu kontrol et
        if (event.current && event.current.optedIn === true) {
          console.log("✅ Kullanıcı subscribe oldu, tag'ler set ediliyor...");
          
          if (currentUserData) {
            try {
              // Kısa bir gecikme ekle (OneSignal'in hazır olması için)
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // User ID tag'i ekle
              await OneSignal.User.addTag("user_id", currentUserData.id);
              console.log("✅ user_id tag eklendi:", currentUserData.id);
              
              // Phone tag'i ekle
              if (currentUserData.phone) {
                await OneSignal.User.addTag("phone", currentUserData.phone);
                console.log("✅ phone tag eklendi:", currentUserData.phone);
              }
              
              // Email tag'i ekle (eğer varsa)
              if (currentUserData.email) {
                await OneSignal.User.addTag("email", currentUserData.email);
                console.log("✅ email tag eklendi:", currentUserData.email);
              }
              
              console.log("🎉 Tüm tag'ler başarıyla set edildi!");
            } catch (tagError) {
              console.error("❌ Tag set hatası:", tagError);
            }
          } else {
            console.warn("⚠️ currentUserData bulunamadı, tag'ler set edilemedi");
          }
        } else if (event.current && event.current.optedIn === false) {
          console.log("❌ Kullanıcı unsubscribe oldu");
        }
      });
      
      subscriptionListenerSetup = true;
      console.log("✅ OneSignal subscription listener kuruldu");
    } catch (error) {
      console.error("❌ Subscription listener kurulum hatası:", error);
    }
  });
}

/**
 * Logout - OneSignal bağlantısını tamamen temizle
 */
export async function logoutFromOneSignal(): Promise<boolean> {
  return new Promise((resolve) => {
    console.log("🚪 OneSignal logout başlıyor...");
    
    // Kullanıcı bilgilerini temizle
    currentUserData = null;
    
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        // Tag'leri temizle (önce)
        try {
          await OneSignal.User.removeTag("user_id");
          await OneSignal.User.removeTag("phone");
          await OneSignal.User.removeTag("email");
          console.log("✅ OneSignal tag'leri temizlendi");
        } catch (tagError) {
          console.warn("⚠️ Tag temizleme hatası:", tagError);
        }
        
        // OneSignal logout (external_id bağlantısını kopar)
        await OneSignal.logout();
        
        console.log("✅ OneSignal logout tamamlandı");
        resolve(true);
      } catch (error) {
        console.error("❌ OneSignal logout hatası:", error);
        resolve(false);
      }
    });
  });
}

/**
 * Push permission durumunu kontrol et
 */
export async function checkPushPermission(): Promise<'granted' | 'denied' | 'default'> {
  try {
    if (!isOneSignalReady()) {
      return 'default';
    }

    const permission = await window.OneSignal.Notifications.permission;
    return permission ? 'granted' : 'default';
  } catch (error) {
    console.error("❌ Push permission check failed:", error);
    return 'default';
  }
}

/**
 * OneSignal init - Subscription listener'ı kur
 */
export function initOneSignal(): void {
  console.log("🔔 OneSignal init başlıyor...");
  
  // Subscription listener'ı kur
  setupSubscriptionListener();
  
  console.log("✅ OneSignal init tamamlandı");
}

/**
 * Login sonrası OneSignal'i başlat (LoginPage'den çağrılacak)
 */
export async function initializeOneSignal(): Promise<void> {
  console.log("🚀 OneSignal initialization başlıyor...");
  
  // Subscription listener'ı kur
  setupSubscriptionListener();
  
  console.log("✅ OneSignal initialization tamamlandı");
}