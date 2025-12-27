// WonderPush utility functions
declare global {
  interface Window {
    WonderPush?: any;
  }
}

export interface WonderPushUser {
  userId?: string;
  phone?: string;
  name?: string;
  properties?: Record<string, any>;
}

export interface NotificationPayload {
  title: string;
  message: string;
  deepLink?: string;
  data?: Record<string, any>;
}

class WonderPushService {
  private isInitialized = false;
  private webKey = '01jdfpm569k5kug2';
  private applicationId = '01jdfpm569k5kug2';
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    try {
      console.log('🔄 WonderPush initialization starting...');
      
      // WonderPush SDK'yı yükle
      await this.loadWonderPushSDK();
      
      // WonderPush'ı initialize et
      if (window.WonderPush && typeof window.WonderPush.init === 'function') {
        window.WonderPush.init({
          webKey: this.webKey,
          applicationId: this.applicationId
        });
        
        this.isInitialized = true;
        console.log('✅ WonderPush initialized successfully');
      } else {
        throw new Error('WonderPush global object not found after loading');
      }
    } catch (error) {
      console.error('❌ WonderPush initialization failed:', error);
      this.initPromise = null; // Reset promise to allow retry
      throw error;
    }
  }

  private async loadWonderPushSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Eğer zaten yüklenmişse
      if (window.WonderPush && typeof window.WonderPush.init === 'function') {
        console.log('✅ WonderPush already loaded');
        resolve();
        return;
      }

      console.log('📦 Loading WonderPush SDK...');

      // WonderPush SDK'yı CDN'den yükle
      const script = document.createElement('script');
      script.src = 'https://cdn.by.wonderpush.com/sdk/1.1/wonderpush-loader.min.js';
      script.async = true;
      
      let resolved = false;
      
      script.onload = () => {
        console.log('📦 WonderPush script loaded');
        
        // SDK yüklendikten sonra global objeyi kontrol et
        const checkInterval = setInterval(() => {
          if (window.WonderPush && typeof window.WonderPush.init === 'function') {
            clearInterval(checkInterval);
            if (!resolved) {
              resolved = true;
              console.log('✅ WonderPush global object found');
              resolve();
            }
          }
        }, 100);
        
        // 10 saniye timeout
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!resolved) {
            resolved = true;
            reject(new Error('WonderPush global object not found within timeout'));
          }
        }, 10000);
      };
      
      script.onerror = () => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Failed to load WonderPush SDK'));
        }
      };
      
      document.head.appendChild(script);
    });
  }

  async subscribeUser(user: WonderPushUser): Promise<boolean> {
    try {
      await this.init();
      
      if (!window.WonderPush) {
        throw new Error('WonderPush not available');
      }

      console.log('🔔 Subscribing user to WonderPush...');

      // Kullanıcı bilgilerini ayarla
      if (user.userId) {
        window.WonderPush.setUserId(user.userId);
      }

      // Kullanıcı özelliklerini ayarla
      const properties: Record<string, any> = {};
      if (user.phone) properties.phone = user.phone;
      if (user.name) properties.name = user.name;
      if (user.properties) Object.assign(properties, user.properties);

      if (Object.keys(properties).length > 0) {
        window.WonderPush.setProperties(properties);
      }

      // Push bildirim izni iste
      const permission = await window.WonderPush.subscribeToNotifications();
      
      console.log('🔔 WonderPush subscription result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ WonderPush subscription error:', error);
      return false;
    }
  }

  async unsubscribeUser(): Promise<void> {
    try {
      await this.init();
      
      if (window.WonderPush) {
        window.WonderPush.unsubscribeFromNotifications();
        console.log('🔕 WonderPush unsubscribed');
      }
    } catch (error) {
      console.error('❌ WonderPush unsubscribe error:', error);
    }
  }

  async trackEvent(eventName: string, data?: Record<string, any>): Promise<void> {
    try {
      await this.init();
      
      if (window.WonderPush) {
        window.WonderPush.trackEvent(eventName, data);
        console.log('📊 WonderPush event tracked:', eventName, data);
      }
    } catch (error) {
      console.error('❌ WonderPush track event error:', error);
    }
  }

  async addTag(tag: string): Promise<void> {
    try {
      await this.init();
      
      if (window.WonderPush) {
        window.WonderPush.addTag(tag);
        console.log('🏷️ WonderPush tag added:', tag);
      }
    } catch (error) {
      console.error('❌ WonderPush add tag error:', error);
    }
  }

  async removeTag(tag: string): Promise<void> {
    try {
      await this.init();
      
      if (window.WonderPush) {
        window.WonderPush.removeTag(tag);
        console.log('🏷️ WonderPush tag removed:', tag);
      }
    } catch (error) {
      console.error('❌ WonderPush remove tag error:', error);
    }
  }

  isSubscribed(): boolean {
    return window.WonderPush?.isSubscribedToNotifications() || false;
  }

  getInstallationId(): string | null {
    return window.WonderPush?.getInstallationId() || null;
  }

  getUserId(): string | null {
    return window.WonderPush?.getUserId() || null;
  }

  isReady(): boolean {
    return this.isInitialized && window.WonderPush && typeof window.WonderPush.init === 'function';
  }

  getStatus(): string {
    if (this.isInitialized) return 'Initialized';
    if (window.WonderPush) return 'Loaded but not initialized';
    return 'Not loaded';
  }
}

// Singleton instance
export const wonderPush = new WonderPushService();

// Helper functions
export const initWonderPush = () => wonderPush.init();
export const subscribeToNotifications = (user: WonderPushUser) => wonderPush.subscribeUser(user);
export const unsubscribeFromNotifications = () => wonderPush.unsubscribeUser();
export const trackEvent = (eventName: string, data?: Record<string, any>) => wonderPush.trackEvent(eventName, data);
export const addUserTag = (tag: string) => wonderPush.addTag(tag);
export const removeUserTag = (tag: string) => wonderPush.removeTag(tag);