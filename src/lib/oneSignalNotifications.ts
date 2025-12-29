// OneSignal Notification Management via Supabase Edge Functions
import { supabase } from './supabaseClient';

export interface OneSignalNotificationPayload {
  title: string;
  message: string;
  targetType: 'all' | 'user' | 'segment';
  targetValue?: string; // user ID or segment name
  url?: string; // deep link
  imageUrl?: string;
  data?: Record<string, any>;
}

export interface OneSignalSubscriptionData {
  userId: string;
  playerId?: string; // OneSignal player ID from frontend
  email?: string;
  phone?: string;
  tags?: Record<string, string>;
}

// Send OneSignal notification via Supabase Edge Function
export async function sendOneSignalNotification(payload: OneSignalNotificationPayload): Promise<boolean> {
  try {
    console.log('Sending OneSignal notification:', payload);

    const { data, error } = await supabase.functions.invoke('send-onesignal-notification', {
      body: payload
    });

    if (error) {
      console.error('Supabase function error:', error);
      return false;
    }

    console.log('Notification sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending OneSignal notification:', error);
    return false;
  }
}

// Subscribe user to OneSignal via Supabase Edge Function
export async function subscribeUserToOneSignal(subscriptionData: OneSignalSubscriptionData): Promise<boolean> {
  try {
    console.log('Subscribing user to OneSignal:', subscriptionData);

    const { data, error } = await supabase.functions.invoke('onesignal-subscribe', {
      body: subscriptionData
    });

    if (error) {
      console.error('Supabase function error:', error);
      return false;
    }

    console.log('User subscribed successfully:', data);
    return true;
  } catch (error) {
    console.error('Error subscribing user to OneSignal:', error);
    return false;
  }
}

// Bulk subscribe all existing users to OneSignal
export async function bulkSubscribeUsersToOneSignal(): Promise<{ success: boolean; results?: any }> {
  try {
    console.log('Starting bulk subscription to OneSignal...');

    const { data, error } = await supabase.functions.invoke('bulk-onesignal-subscribe', {
      body: {}
    });

    if (error) {
      console.error('Supabase function error:', error);
      return { success: false };
    }

    console.log('Bulk subscription completed:', data);
    return { success: true, results: data.results };
  } catch (error) {
    console.error('Error in bulk subscription:', error);
    return { success: false };
  }
}

// Predefined notification templates
export const OneSignalNotificationTemplates = {
  // User registration approved
  userApproved: (userName: string, userId: string): OneSignalNotificationPayload => ({
    title: '🎉 Hoş Geldiniz!',
    message: `Merhaba ${userName}! Üyeliğiniz onaylandı. Artık ilan verebilir ve favorilerinizi takip edebilirsiniz.`,
    targetType: 'user',
    targetValue: userId,
    url: '/profile',
    data: { type: 'user_approved', userId }
  }),

  // Listing approved
  listingApproved: (listingTitle: string, listingId: string, userId: string): OneSignalNotificationPayload => ({
    title: '✅ İlanınız Yayında!',
    message: `"${listingTitle}" ilanınız onaylandı ve yayına alındı.`,
    targetType: 'user',
    targetValue: userId,
    url: `/ilan/${listingId}`,
    data: { type: 'listing_approved', listingId, userId }
  }),

  // Price drop notification (for users who favorited the listing)
  priceDrop: (listingTitle: string, oldPrice: number, newPrice: number, listingId: string): OneSignalNotificationPayload => ({
    title: '💰 Fiyat Düştü!',
    message: `Favorinizdeki "${listingTitle}" ilanının fiyatı ${oldPrice}₺'den ${newPrice}₺'ye düştü!`,
    targetType: 'segment',
    targetValue: `listing-${listingId}-favorites`,
    url: `/ilan/${listingId}`,
    data: { type: 'price_drop', listingId, oldPrice, newPrice }
  }),

  // New message notification
  newMessage: (senderName: string, messagePreview: string, userId: string): OneSignalNotificationPayload => ({
    title: '💬 Yeni Mesaj',
    message: `${senderName}: ${messagePreview}`,
    targetType: 'user',
    targetValue: userId,
    url: '/messages',
    data: { type: 'new_message', senderName }
  }),

  // Opportunity listing (to all users)
  opportunityListing: (listingTitle: string, price: number, neighborhood: string, listingId: string): OneSignalNotificationPayload => ({
    title: '🔥 Fırsat İlanı!',
    message: `${neighborhood}'da ${price}₺ - ${listingTitle}`,
    targetType: 'all',
    url: `/ilan/${listingId}`,
    data: { type: 'opportunity_listing', listingId, price, neighborhood }
  }),

  // Featured listing (to all users)
  featuredListing: (listingTitle: string, price: number, neighborhood: string, listingId: string): OneSignalNotificationPayload => ({
    title: '⭐ Öne Çıkan İlan',
    message: `${neighborhood}'da ${price}₺ - ${listingTitle}`,
    targetType: 'all',
    url: `/ilan/${listingId}`,
    data: { type: 'featured_listing', listingId, price, neighborhood }
  }),

  // General announcement (to all users)
  announcement: (title: string, message: string, url?: string): OneSignalNotificationPayload => ({
    title,
    message,
    targetType: 'all',
    url: url || '/',
    data: { type: 'announcement' }
  }),

  // Welcome notification for new users
  welcome: (userName: string, userId: string): OneSignalNotificationPayload => ({
    title: '👋 Kulu İlan\'a Hoş Geldiniz!',
    message: `Merhaba ${userName}! Kulu'nun en büyük emlak platformuna katıldınız. Hemen keşfetmeye başlayın!`,
    targetType: 'user',
    targetValue: userId,
    url: '/ilanlar',
    data: { type: 'welcome', userId }
  }),
};

// Get notification statistics
export async function getNotificationStats(days: number = 7) {
  try {
    const { data, error } = await supabase
      .from('notification_logs')
      .select('success, created_at, type, target_type')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const stats = {
      total: data.length,
      successful: data.filter(n => n.success).length,
      failed: data.filter(n => !n.success).length,
      byType: data.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byTargetType: data.reduce((acc, n) => {
        acc[n.target_type] = (acc[n.target_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return stats;
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return null;
  }
}