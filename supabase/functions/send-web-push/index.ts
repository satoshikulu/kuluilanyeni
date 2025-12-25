// Web Push Protocol Edge Function - Modern Implementation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, apikey, x-client-info',
  'Access-Control-Max-Age': '86400',
}

console.info('🔔 Web Push Protocol server - Modern implementation')

// Phone normalize helper
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

// Base64URL encode
function base64urlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate VAPID JWT for Web Push
async function generateVAPIDJWT(audience: string, subject: string, publicKey: string, privateKey: string) {
  try {
    console.log('🔑 Generating VAPID JWT...');
    
    const header = {
      typ: 'JWT',
      alg: 'ES256'
    };

    const payload = {
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60), // 12 hours
      sub: subject
    };

    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    
    // For now, use a simple signature (this is a limitation without proper crypto)
    const encodedSignature = base64urlEncode('signature');
    
    const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
    
    console.log('✅ VAPID JWT generated');
    
    return {
      'Authorization': `vapid t=${jwt}, k=${publicKey}`
    };
    
  } catch (error) {
    console.error('❌ VAPID JWT generation failed:', error);
    return {
      'Authorization': `vapid t=dummy.jwt.token, k=${publicKey}`
    };
  }
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
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('🔍 Raw request body:', bodyText);
      requestBody = JSON.parse(bodyText);
      console.log('🔍 Parsed request body:', requestBody);
    } catch (error) {
      console.error('❌ JSON parse error:', error);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON body',
        details: error.message
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

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

    // Get VAPID credentials
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:satoshinakamotokyo42@gmail.com'

    console.log('🔍 VAPID credentials check:', {
      publicKeyExists: !!VAPID_PUBLIC_KEY,
      privateKeyExists: !!VAPID_PRIVATE_KEY,
      publicKeyLength: VAPID_PUBLIC_KEY?.length
    })

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
    console.log('� FoFund subscriptions:', subscriptions.length)
    
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

    console.log('📱 Preparing Web Push notification...')

    // Extract audience from endpoint
    const endpointUrl = new URL(subscriptionData.endpoint)
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`
    
    console.log('🔍 Audience:', audience)

    // Generate headers - Try without VAPID first
    let headers = {
      'Content-Type': 'application/json', // FCM için JSON
      'TTL': '86400'
    };

    console.log('⚠️ Sending without VAPID auth (test mode)');

    // VAPID'i şimdilik devre dışı bırak
    /*
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      const vapidHeaders = await generateVAPIDJWT(audience, VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      headers = { ...headers, ...vapidHeaders };
      console.log('✅ VAPID headers added');
    } else {
      console.log('⚠️ No VAPID keys, sending without auth');
    }
    */

    // Send notification
    try {
      console.log('📱 Sending push notification to:', subscriptionData.endpoint.substring(0, 50) + '...');
      console.log('📱 Headers:', JSON.stringify(headers, null, 2));
      console.log('📱 Payload length:', pushPayload.length);
      console.log('📱 Payload preview:', pushPayload.substring(0, 100) + '...');
      
      const pushResponse = await fetch(subscriptionData.endpoint, {
        method: 'POST',
        headers,
        body: pushPayload
      });

      console.log('📱 Push response:', {
        status: pushResponse.status,
        statusText: pushResponse.statusText,
        headers: Object.fromEntries(pushResponse.headers.entries())
      });

      // Get response body for debugging
      const responseText = await pushResponse.text();
      console.log('📱 Response body:', responseText);

      if (pushResponse.ok || pushResponse.status === 204) {
        console.log('✅ Push notification sent successfully');
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Push notification sent successfully',
          status: pushResponse.status
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        console.error('❌ Push delivery failed:', {
          status: pushResponse.status,
          statusText: pushResponse.statusText,
          body: responseText
        });
        
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Push delivery failed',
          details: responseText,
          status: pushResponse.status,
          statusText: pushResponse.statusText
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } catch (pushError: any) {
      console.error('❌ Push delivery error:', pushError)
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Push delivery failed',
        details: pushError.message
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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