// Proper Web Push VAPID Keys Generator using web-push library
import webpush from 'web-push';

function generateWebPushVAPIDKeys() {
  console.log('🔑 Generating Web Push VAPID Keys...');
  
  // Generate VAPID keys using web-push library
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('');
  console.log('✅ VAPID Keys Generated Successfully!');
  console.log('');
  console.log('PUBLIC KEY (for frontend):');
  console.log(vapidKeys.publicKey);
  console.log('');
  console.log('PRIVATE KEY (for backend/edge functions):');
  console.log(vapidKeys.privateKey);
  console.log('');
  console.log('📝 Add these to your environment variables:');
  console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log('');
  console.log('📧 VAPID Subject (your email or website):');
  console.log('mailto:satoshinakamototokyo42@gmail.com');
  console.log('');
  console.log('🔧 Commands to update:');
  console.log('');
  console.log('# Local .env');
  console.log(`echo "VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}" >> .env`);
  console.log('');
  console.log('# Supabase secrets');
  console.log(`supabase secrets set VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
  console.log('');
  console.log('# Netlify env');
  console.log(`netlify env:set VITE_VAPID_PUBLIC_KEY "${vapidKeys.publicKey}" --force`);
  
  return vapidKeys;
}

generateWebPushVAPIDKeys();