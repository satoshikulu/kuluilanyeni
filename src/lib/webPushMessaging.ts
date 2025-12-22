// Web Push Protocol Implementation - No Firebase/OneSignal dependency
import { supabase } from './supabaseClient';

// Phone normalize function - consistent with existing logic
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

// VAPID Public Key - Add to your .env
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Service Worker Registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if ('serviceWorker' in navigator) {
      console.log('🔧 Registering Web Push Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/web-push-sw.js');
      console.log('✅ Service Worker registered:', registration);
      
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
    
    // Convert VAPID key to Uint8Array
    const vapidKeyUint8Array = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    
    // Subscribe to push manager
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

// Convert VAPID key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
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