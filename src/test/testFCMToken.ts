import { supabase } from '../lib/supabaseClient';
import { normalizePhone } from '../lib/firebaseMessaging';

// Test function to check if FCM token exists for a phone number
export async function testFCMTokenExists(phone: string): Promise<void> {
  try {
    console.log('🔍 Testing FCM token for phone:', phone);
    
    // Normalize the phone number
    const normalizedPhone = normalizePhone(phone);
    console.log('📱 Normalized phone:', normalizedPhone);
    
    // Check in fcm_tokens table
    const { data: fcmData, error: fcmError } = await supabase
      .from('fcm_tokens')
      .select('*')
      .eq('phone', normalizedPhone);
    
    if (fcmError) {
      console.error('❌ Error querying fcm_tokens:', fcmError);
    } else {
      console.log('✅ FCM tokens found:', fcmData);
    }
    
    // Also check in users_min table
    const { data: userData, error: userError } = await supabase
      .from('users_min')
      .select('*')
      .eq('phone', normalizedPhone);
    
    if (userError) {
      console.error('❌ Error querying users_min:', userError);
    } else {
      console.log('👥 Users found:', userData);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined' && (window as { location: { pathname: string } }).location.pathname === '/test-fcm-token') {
  // This would be called from a test page
  testFCMTokenExists('5453526056');
}