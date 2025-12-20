// PRODUCTION Firebase Cloud Messaging Edge Function - REAL FCM
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

console.info('🔥 PRODUCTION Firebase FCM server - REAL PUSH NOTIFICATIONS')

// Phone normalize helper - keep consistent with frontend logic
function normalizePhone(phone: string): string {
  // Remove all non-digits and keep last 10 digits (e.g. 0545..., +90..., spaces)
  return phone.replace(/\D/g, '').slice(-10)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Firebase Admin credentials
    const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')
    const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')
    const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')

    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Firebase Admin credentials not configured' 
      }), { status: 500, headers: corsHeaders })
    }

    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    
    // Parse request
    const { phone, title, body, data } = await req.json()

    if (!phone || !title || !body) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: phone, title, body' 
      }), { status: 400, headers: corsHeaders })
    }

    // Normalize phone number before querying Supabase
    const normalizedPhone = normalizePhone(phone)
    console.log('🔍 Incoming phone:', phone, '➡ normalized:', normalizedPhone)

    // Get FCM token from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    console.log('🔍 Querying FCM token for phone:', normalizedPhone);
    
    const tokenResponse = await fetch(`${supabaseUrl}/rest/v1/fcm_tokens?phone=eq.${normalizedPhone}&select=token`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    const tokens = await tokenResponse.json()
    console.log('🔍 FCM tokens query result:', tokens);
    
    if (!tokens || tokens.length === 0) {
      // Detaylı hata mesajı için tüm token'ları sorgula
      console.log('🔍 No token found, querying all tokens...');
      const allTokensResponse = await fetch(`${supabaseUrl}/rest/v1/fcm_tokens?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const allTokens = await allTokensResponse.json();
      console.log('🔍 All FCM tokens:', allTokens);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: `No FCM token found for phone: ${phone}`,
        details: 'User must login and grant notification permission first',
        allTokens: allTokens // Debug için tüm token'ları döndür
      }), { status: 404, headers: corsHeaders })
    }

    const fcmToken = tokens[0].token
    console.log('✅ FCM token found:', fcmToken.substring(0, 15) + '...')

    // Create JWT for Google OAuth2
    const now = Math.floor(Date.now() / 1000)
    const jwtPayload = {
      iss: FIREBASE_CLIENT_EMAIL,
      sub: FIREBASE_CLIENT_EMAIL,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging'
    }

    // Simple JWT creation (for Deno compatibility) - SKIP OAuth2, use Legacy API directly
    // OAuth2 JWT signing is complex in Deno, so we'll use Legacy API with server key
    
    // Get OAuth2 access token - SKIP for now, use Legacy API
    let accessToken = null
    
    // Skip OAuth2 attempt, go directly to Legacy API
    console.log('🔄 Using Firebase Legacy API directly');

    // Prepare FCM message
    const fcmMessage = {
      message: {
        token: fcmToken,
        notification: {
          title: title,
          body: body
        },
        data: data || {},
        webpush: {
          notification: {
            title: title,
            body: body,
            icon: '/icon-192x192.png',
            badge: '/icon-96x96.png',
            tag: 'kulu-ilan-notification',
            requireInteraction: true
          }
        }
      }
    }

    let fcmResponse
    let result

    // Try Firebase HTTP v1 API first
    if (accessToken) {
      console.log('🚀 Using Firebase HTTP v1 API')
      fcmResponse = await fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(fcmMessage)
      })
      
      result = await fcmResponse.json()
      
      if (fcmResponse.ok) {
        console.log('✅ FCM v1 API success:', result.name)
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Notification sent successfully',
          result: result,
          messageId: result.name
        }), { status: 200, headers: corsHeaders })
      }
    }

    // Fallback to Legacy API
    console.log('🔄 Trying Firebase Legacy API')
    
    const legacyMessage = {
      to: fcmToken,
      notification: {
        title: title,
        body: body,
        icon: '/icon-192x192.png'
      },
      data: data || {}
    }

    // Use server key for Legacy API (if available)
    const serverKey = Deno.env.get('FIREBASE_SERVER_KEY')
    
    console.log('🔑 Server key available:', !!serverKey);
    console.log('🔑 Server key length:', serverKey ? serverKey.length : 0);
    
    if (serverKey) {
      fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${serverKey}`
        },
        body: JSON.stringify(legacyMessage)
      })
      
      result = await fcmResponse.json()
      
      if (fcmResponse.ok && result.success > 0) {
        console.log('✅ FCM Legacy API success:', result.results[0].message_id)
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Notification sent successfully',
          result: result,
          messageId: result.results[0].message_id
        }), { status: 200, headers: corsHeaders })
      }
    } else {
      console.error('❌ FIREBASE_SERVER_KEY not found in environment');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'FIREBASE_SERVER_KEY not configured',
        details: 'Legacy FCM API requires server key'
      }), { status: 500, headers: corsHeaders })
    }

    // If all APIs fail
    console.error('❌ All FCM APIs failed')
    return new Response(JSON.stringify({ 
      success: false,
      error: 'FCM API failed',
      details: result || 'No response from FCM'
    }), { status: 500, headers: corsHeaders })

  } catch (error) {
    console.error('❌ FCM error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error'
    }), { status: 500, headers: corsHeaders })
  }
})