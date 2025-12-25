// Web Push Protocol Implementation - No Firebase/OneSignal dependency
import { supabase } from './supabaseClient';

// Phone normalize function - consistent with existing logic
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

// VAPID Public Key - Add to your .env
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Debug VAPID key loading
console.log('🔑 VAPID Key Debug:', {
  keyExists: !!VAPID_PUBLIC_KEY,
  keyLength: VAPID_PUBLIC_KEY?.length,
  keyPreview: VAPID_PUBLIC_KEY?.substring(0, 20) + '...'
});

// Service Worker Registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if ('serviceWorker' in navigator) {
      console.log('🔧 Registering Web Push Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/web-push-sw.js', {
        scope: '/'
      });
      console.log('✅ Service Worker registered:', registration);
      
      // Wait for service worker to be ready and active
      if (registration.installing) {
        console.log('⏳ Service Worker installing...');
        await new Promise((resolve) => {
          registration.installing!.addEventListener('statechange', function() {
            if (this.state === 'activated') {
              console.log('✅ Service Worker activated');
              resolve(void 0);
            }
          });
        });
      } else if (registration.waiting) {
        console.log('⏳ Service Worker waiting...');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        await new Promise((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('✅ Service Worker controller changed');
            resolve(void 0);
          });
        });
      }
      
      // Ensure service worker is ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker is ready and active');
      
      return registration;
    } else {
      console.warn('❌ Service Worker not supported');
      return null;
    }
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

// Request Notification Permission
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    console.log('🔐 Requesting notification permission...');
    
    if (!('Notification' in window)) {
      console.warn('❌ Notifications not supported');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    console.log('🔐 Notification permission result:', permission);
    
    return permission === 'granted';
  } catch (error) {
    console.error('❌ Notification permission error:', error);
    return false;
  }
}

// Subscribe to Push Notifications
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    console.log('🔔 Subscribing to push notifications...');
    
    if (!VAPID_PUBLIC_KEY) {
      console.error('❌ VAPID_PUBLIC_KEY not configured');
      return null;
    }
    
    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('❌ Service Worker registration failed');
      return null;
    }
    
    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.error('❌ Notification permission denied');
      return null;
    }
    
    // Check for existing subscription and unsubscribe if different VAPID key
    try {
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('🔍 Found existing push subscription, checking VAPID key...');
        
        // Always unsubscribe from old subscription to ensure clean state
        const unsubscribed = await existingSubscription.unsubscribe();
        console.log('🗑️ Old subscription unsubscribed:', unsubscribed);
        
        // Small delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.warn('⚠️ Error checking/removing existing subscription:', error);
    }
    
    // Convert VAPID key to Uint8Array
    console.log('🔑 Converting VAPID key:', {
      originalKey: VAPID_PUBLIC_KEY,
      keyLength: VAPID_PUBLIC_KEY.length
    });
    
    const vapidKeyUint8Array = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    console.log('🔑 VAPID key converted to Uint8Array:', {
      arrayLength: vapidKeyUint8Array.length,
      firstBytes: Array.from(vapidKeyUint8Array.slice(0, 10))
    });
    
    // Subscribe to push manager with new VAPID key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKeyUint8Array
    });
    
    console.log('✅ Push subscription created:', subscription);
    return subscription;
    
  } catch (error) {
    console.error('❌ Push subscription failed:', error);
    return null;
  }
}

// Convert VAPID key from base64url to Uint8Array (for web-push generated keys)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Web-push library generates keys in base64 format (not base64url)
  // Handle both base64 and base64url formats
  let base64 = base64String;
  
  // If it looks like base64url, convert to base64
  if (base64String.includes('-') || base64String.includes('_')) {
    base64 = base64String
      .replace(/-/g, '+')
      .replace(/_/g, '/');
  }
  
  // Add padding if needed
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  base64 = base64 + padding;

  try {
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    console.log('🔑 VAPID key conversion successful:', {
      inputLength: base64String.length,
      outputLength: outputArray.length,
      expectedLength: 65, // Standard VAPID key length
      isValidLength: outputArray.length === 65
    });
    
    if (outputArray.length !== 65) {
      throw new Error(`Invalid VAPID key length: ${outputArray.length}, expected 65`);
    }
    
    return outputArray;
  } catch (error) {
    console.error('❌ VAPID key conversion failed:', error);
    throw new Error('Invalid VAPID key format: ' + error.message);
  }
}

// Save Push Subscription to Database
export async function savePushSubscriptionToDatabase(
  userId: string, 
  phone: string, 
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const normalizedPhone = normalizePhone(phone);
    
    console.log('💾 Saving push subscription to database:', {
      userId,
      phone: normalizedPhone,
      endpoint: subscription.endpoint
    });
    
    // Convert subscription to JSON
    const subscriptionJson = JSON.stringify(subscription);
    
    // Save to push_subscriptions table (we'll create this)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        phone: normalizedPhone,
        subscription: subscriptionJson,
        endpoint: subscription.endpoint,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error('❌ Push subscription save error:', error);
      return false;
    }
    
    console.log('✅ Push subscription saved successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Push subscription save failed:', error);
    return false;
  }
}

// Complete Push Setup for User
export async function setupPushNotificationsForUser(): Promise<boolean> {
  try {
    console.log('🚀 Setting up push notifications for user...');
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ No active session');
      return false;
    }
    
    // Get user phone
    let userPhone = session.user.phone || session.user.user_metadata?.phone;
    
    // Admin user special case
    if (session.user.email === 'satoshinakamototokyo42@gmail.com' && !userPhone) {
      console.log('🔧 Admin user detected, using default phone');
      userPhone = '5556874803';
    }
    
    // Try to get phone from users_min table if not in session
    if (!userPhone) {
      console.log('🔍 Getting phone from users_min table...');
      const { data: userData, error: userError } = await supabase
        .from('users_min')
        .select('phone')
        .eq('id', session.user.id)
        .single();
        
      if (!userError && userData?.phone) {
        userPhone = userData.phone;
        console.log('✅ Phone retrieved from users_min:', userPhone);
      }
    }
    
    if (!userPhone || userPhone === 'unknown') {
      console.error('❌ No phone number found for user');
      return false;
    }
    
    // Subscribe to push notifications
    const subscription = await subscribeToPushNotifications();
    if (!subscription) {
      console.error('❌ Push subscription failed');
      return false;
    }
    
    // Save subscription to database
    const saved = await savePushSubscriptionToDatabase(
      session.user.id,
      userPhone,
      subscription
    );
    
    if (!saved) {
      console.error('❌ Failed to save push subscription');
      return false;
    }
    
    console.log('✅ Push notifications setup completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Push notifications setup failed:', error);
    return false;
  }
}

// Check if user has push subscription
export async function checkUserHasPushSubscription(phone: string): Promise<boolean> {
  try {
    const normalizedPhone = normalizePhone(phone);
    console.log('🔍 Checking push subscription for phone:', normalizedPhone);
    
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('phone', normalizedPhone)
      .single();

    if (error) {
      console.error('❌ Error checking push subscription:', error);
      return false;
    }

    const hasSubscription = !!data?.subscription;
    console.log('🔍 Push subscription found:', hasSubscription);
    return hasSubscription;
  } catch (error) {
    console.error('❌ Error checking push subscription:', error);
    return false;
  }
}

// Get user's push subscription
export async function getUserPushSubscription(phone: string): Promise<PushSubscription | null> {
  try {
    const normalizedPhone = normalizePhone(phone);
    console.log('🔍 Getting push subscription for phone:', normalizedPhone);
    
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('phone', normalizedPhone)
      .single();

    if (error) {
      console.error('❌ Error getting push subscription:', error);
      return null;
    }

    if (!data?.subscription) {
      console.log('❌ No push subscription found');
      return null;
    }

    // Parse JSON subscription
    const subscription = JSON.parse(data.subscription) as PushSubscription;
    console.log('✅ Push subscription retrieved');
    return subscription;
    
  } catch (error) {
    console.error('❌ Error getting push subscription:', error);
    return null;
  }
}

// Remove push subscription (for logout)
export async function removePushSubscriptionFromDatabase(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Push subscription delete error:', error);
    } else {
      console.log('✅ Push subscription removed from database');
    }
  } catch (error) {
    console.error('❌ Database delete operation error:', error);
  }
}

// Clear all push subscriptions (for debugging/reset)
export async function clearAllPushSubscriptions(): Promise<void> {
  try {
    console.log('🧹 Clearing all push subscriptions...');
    
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        // Get existing subscription
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          console.log('🗑️ Unsubscribed from:', subscription.endpoint.substring(0, 50) + '...');
        }
        
        // Unregister service worker
        await registration.unregister();
        console.log('🗑️ Service worker unregistered');
      }
    }
    
    console.log('✅ All push subscriptions cleared');
  } catch (error) {
    console.error('❌ Error clearing push subscriptions:', error);
  }
}