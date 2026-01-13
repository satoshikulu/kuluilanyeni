// OneSignal entegrasyon kütüphanesi

declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any[];
  }
}

export interface OneSignalUser {
  userId?: string;
  phone?: string;
  name?: string;
  email?: string;
  properties?: Record<string, any>;
}

// OneSignal'ın hazır olup olmadığını kontrol et
export function isOneSignalReady(): boolean {
  return typeof window !== 'undefined' && window.OneSignal && window.OneSignal.User;
}

// OneSignal'ı başlat
export async function initOneSignal(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // Development ortamında OneSignal'ı devre dışı bırak
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('OneSignal development ortamında devre dışı');
      resolve(false);
      return;
    }

    if (isOneSignalReady()) {
      resolve(true);
      return;
    }

    // OneSignal yüklenene kadar bekle
    const checkInterval = setInterval(() => {
      if (isOneSignalReady()) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 100);

    // 15 saniye timeout (daha uzun süre)
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(false);
    }, 15000);
  });
}

// Kullanıcıyı OneSignal'a kaydet ve bildirim izni iste
export async function subscribeToNotifications(user: OneSignalUser): Promise<boolean> {
  try {
    const ready = await initOneSignal();
    if (!ready) {
      console.error('OneSignal yüklenemedi');
      return false;
    }

    // Önce bildirim izni iste
    const permission = await window.OneSignal.Notifications.requestPermission();
    
    if (!permission) {
      console.log('Kullanıcı bildirim iznini reddetti');
      return false;
    }

    // Kullanıcı bilgilerini ayarla
    if (user.userId) {
      await window.OneSignal.User.addAlias('user_id', user.userId);
    }
    
    if (user.phone) {
      await window.OneSignal.User.addAlias('phone', user.phone);
    }

    if (user.email) {
      await window.OneSignal.User.addEmail(user.email);
    }

    // Kullanıcı özelliklerini ayarla
    if (user.properties) {
      await window.OneSignal.User.addTags(user.properties);
    }

    console.log('OneSignal subscription başarılı:', {
      permission,
      userId: user.userId,
      phone: user.phone
    });

    return true;
  } catch (error) {
    console.error('OneSignal subscription hatası:', error);
    return false;
  }
}

// Kullanıcı tag'i ekle
export async function addUserTag(key: string, value: string = 'true'): Promise<void> {
  try {
    const ready = await initOneSignal();
    if (!ready) return;

    await window.OneSignal.User.addTag(key, value);
    console.log(`OneSignal tag eklendi: ${key} = ${value}`);
  } catch (error) {
    console.error('OneSignal tag ekleme hatası:', error);
  }
}

// Kullanıcı tag'ini kaldır
export async function removeUserTag(key: string): Promise<void> {
  try {
    const ready = await initOneSignal();
    if (!ready) return;

    await window.OneSignal.User.removeTag(key);
    console.log(`OneSignal tag kaldırıldı: ${key}`);
  } catch (error) {
    console.error('OneSignal tag kaldırma hatası:', error);
  }
}

// Event tracking
export async function trackEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
  try {
    const ready = await initOneSignal();
    if (!ready) return;

    // OneSignal'da custom event tracking için tag kullanıyoruz
    const eventTag = `event_${eventName}`;
    const eventData = properties ? JSON.stringify(properties) : new Date().toISOString();
    
    await window.OneSignal.User.addTag(eventTag, eventData);
    console.log(`OneSignal event tracked: ${eventName}`, properties);
  } catch (error) {
    console.error('OneSignal event tracking hatası:', error);
  }
}

// OneSignal durumunu kontrol et
export function getOneSignalStatus() {
  if (!isOneSignalReady()) {
    return {
      ready: false,
      subscribed: false,
      userId: null,
      pushToken: null
    };
  }

  try {
    return {
      ready: true,
      subscribed: window.OneSignal.User.PushSubscription.optedIn,
      userId: window.OneSignal.User.onesignalId,
      pushToken: window.OneSignal.User.PushSubscription.token
    };
  } catch (error) {
    console.error('OneSignal durum kontrolü hatası:', error);
    return {
      ready: true,
      subscribed: false,
      userId: null,
      pushToken: null
    };
  }
}

// Bildirim izni durumunu kontrol et
export async function getNotificationPermission(): Promise<string> {
  try {
    const ready = await initOneSignal();
    if (!ready) return 'default';

    return await window.OneSignal.Notifications.permission;
  } catch (error) {
    console.error('Bildirim izni kontrolü hatası:', error);
    return 'default';
  }
}