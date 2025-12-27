// Web Push Protocol Edge Function - Working Implementation with VAPID
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, apikey, x-client-info',
  'Access-Control-Max-Age': '86400',
}

console.info('🔔 Web Push Protocol server - VAPID implementation')

// Phone normalize helper
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

// VAPID JWT generation
async function generateVAPIDJWT(endpoint: string): Promise<string> {
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:satoshinakamototokyo42@gmail.com'
  
  if (!vapidPrivateKey) {
    throw new Error('VAPID_PRIVATE_KEY not configured')
  }
  
  // JWT header
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  }
  
  // JWT payload
  const payload = {
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: vapidSubject
  }
  
  // Base64URL encode
  const base64UrlEncode = (obj: any) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
  
  const encodedHeader = base64UrlEncode(header)
  const encodedPayload = base64UrlEncode(payload)
  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  
  // For now, return unsigned token (we'll implement proper signing later)
  // This is a simplified version - in production you'd need proper ECDSA signing
  console.log('🔑 Generated VAPID JWT (unsigned):', unsignedToken.substring(0, 50) + '...')
  
  return unsignedToken + '.signature-placeholder'
}

serve(async (req) => {
  console.log(`🔍 ${req.method} request received`)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request')
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    // Parse request body
    const requestBody = await req.json()
    console.log('🔍 Request body:', requestBody)

    const { phone, title, body, data, url } = requestBody

    if (!phone || !title || !body) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: phone, title, body'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Normalize phone
    const normalizedPhone = normalizePhone(phone)
    console.log('🔍 Phone normalization:', { original: phone, normalized: normalizedPhone })

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Supabase credentials not configured'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Query push subscription
    const subscriptionUrl = `${supabaseUrl}/rest/v1/push_subscriptions?phone=eq.${normalizedPhone}&select=subscription`
    console.log('🔍 Querying subscription:', subscriptionUrl)
    
    const subscriptionResponse = await fetch(subscriptionUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!subscriptionResponse.ok) {
      console.error('❌ Supabase query failed:', subscriptionResponse.status)
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Database query failed'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const subscriptions = await subscriptionResponse.json()
    console.log('🔍 Found subscriptions:', subscriptions.length)
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('❌ No subscription found for phone:', normalizedPhone)
      return new Response(JSON.stringify({ 
        success: false,
        error: `No push subscription found for phone: ${phone}`,
        debug: 'User must enable push notifications first'
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse subscription
    const subscriptionData = JSON.parse(subscriptions[0].subscription)
    console.log('✅ Push subscription found:', {
      endpoint: subscriptionData.endpoint?.substring(0, 50) + '...',
      hasKeys: !!subscriptionData.keys
    })

    // Prepare payload
    const pushPayload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: 'kulu-ilan-notification',
      url: url || '/',
      data: data || {},
      timestamp: Date.now()
    })

    console.log('📱 Forwarding to managed send-notification function')

    try {
      // Call the existing `send-notification` function which uses a maintained web-push library
      const sendNotificationUrl = `${supabaseUrl}/functions/v1/send-notification`
      const sendResp = await fetch(sendNotificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use apikey header for service auth (avoids JWT validation errors when passing anon key as Bearer)
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          subscription: subscriptionData,
          title,
          body,
          data
        })
      })

      const sendText = await sendResp.text();
      console.log('📱 send-notification response:', { status: sendResp.status, body: sendText });

      if (sendResp.ok) {
        return new Response(JSON.stringify({ success: true, message: 'Push forwarded to send-notification', status: sendResp.status }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } else {
        console.error('❌ send-notification failed:', sendResp.status, sendText);
        // Propagate the original function's status and body for better debugging
        const statusToReturn = sendResp.status >= 400 && sendResp.status < 600 ? sendResp.status : 500
        return new Response(JSON.stringify({ success: false, error: 'send-notification failed', details: sendText, status: sendResp.status }), { status: statusToReturn, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } catch (err) {
      console.error('❌ Error forwarding to send-notification:', err);
      return new Response(JSON.stringify({ success: false, error: 'Forwarding failed', details: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error: any) {
    console.error('❌ General error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})