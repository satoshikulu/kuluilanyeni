// WonderPush notification helper functions
import { supabase } from './supabaseClient';

export interface WonderPushNotificationRequest {
  title: string;
  message: string;
  deepLink?: string;
  targetType: 'user' | 'segment' | 'all';
  targetValue?: string;
  data?: Record<string, any>;
}

export async function sendWonderPushNotification(request: WonderPushNotificationRequest): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-wonderpush-notification', {
      body: request
    });

    if (error) {
      console.error('❌ WonderPush notification error:', error);
      return false;
    }

    if (!data?.success) {
      console.error('❌ WonderPush notification failed:', data?.error);
      return false;
    }

    console.log('✅ WonderPush notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ WonderPush notification exception:', error);
    return false;
  }
}

// Predefined notification templates
export const NotificationTemplates = {
  userApproved: (userName: string, phone: string) => ({
    title: '🎉 Üyeliğiniz Onaylandı!',
    message: `Merhaba ${userName}, Kulu İlan'a hoş geldiniz! Artık ilan verebilir ve favorilerinizi kaydedebilirsiniz.`,
    deepLink: '/ilanlarim',
    data: { type: 'user_approved', phone }
  }),

  listingApproved: (title: string, price: number) => ({
    title: '✅ İlanınız Yayında!',
    message: `"${title}" ilanınız onaylandı ve yayına alındı. Fiyat: ${price.toLocaleString('tr-TR')} TL`,
    deepLink: '/ilanlarim',
    data: { type: 'listing_approved', title, price }
  }),

  opportunityListing: (title: string, price: number, neighborhood: string) => ({
    title: '🔥 Yeni Fırsat İlanı!',
    message: `${neighborhood} - ${title} - ${price.toLocaleString('tr-TR')} TL. Kaçırmayın!`,
    deepLink: '/firsatlar',
    data: { type: 'opportunity', title, price, neighborhood }
  }),

  featuredListing: (title: string, price: number, neighborhood: string) => ({
    title: '⭐ Öne Çıkan İlan!',
    message: `${neighborhood} - ${title} - ${price.toLocaleString('tr-TR')} TL. Hemen inceleyin!`,
    deepLink: '/ilanlar',
    data: { type: 'featured', title, price, neighborhood }
  }),

  customAnnouncement: (title: string, message: string, deepLink?: string) => ({
    title,
    message,
    deepLink: deepLink || '/',
    data: { type: 'announcement' }
  })
};

// Helper functions for common notification scenarios
export async function notifyUserApproved(userName: string, phone: string, userId?: string): Promise<boolean> {
  const notification = NotificationTemplates.userApproved(userName, phone);
  
  return await sendWonderPushNotification({
    ...notification,
    targetType: userId ? 'user' : 'all', // If we have userId, target specific user
    targetValue: userId,
  });
}

export async function notifyListingApproved(title: string, price: number, ownerPhone: string): Promise<boolean> {
  const notification = NotificationTemplates.listingApproved(title, price);
  
  // For now, we'll broadcast to all users since we don't have user mapping by phone
  // In the future, we can implement phone-to-userId mapping
  return await sendWonderPushNotification({
    ...notification,
    targetType: 'all', // TODO: Target specific user when we have phone-to-userId mapping
    data: { ...notification.data, ownerPhone }
  });
}

export async function notifyOpportunityListing(title: string, price: number, neighborhood: string): Promise<boolean> {
  const notification = NotificationTemplates.opportunityListing(title, price, neighborhood);
  
  return await sendWonderPushNotification({
    ...notification,
    targetType: 'all', // Broadcast to all users
  });
}

export async function notifyFeaturedListing(title: string, price: number, neighborhood: string): Promise<boolean> {
  const notification = NotificationTemplates.featuredListing(title, price, neighborhood);
  
  return await sendWonderPushNotification({
    ...notification,
    targetType: 'all', // Broadcast to all users
  });
}

export async function sendCustomAnnouncement(title: string, message: string, deepLink?: string): Promise<boolean> {
  const notification = NotificationTemplates.customAnnouncement(title, message, deepLink);
  
  return await sendWonderPushNotification({
    ...notification,
    targetType: 'all', // Broadcast to all users
  });
}