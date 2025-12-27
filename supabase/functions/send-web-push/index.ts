// Web Push Protocol Edge Function - Working Implementation with VAPID
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as webpush from "jsr:@negrel/webpush@0.5.0"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, apikey, x-client-info',
  'Access-Control-Max-Age': '86400',
}

console.info('🔔 Web Push Protocol server - VAPID implementation')

let appServerPromise: Promise<webpush.ApplicationServer> | null = null

function getAppServer(): Promise<webpush.ApplicationServer> {
  if (appServerPromise) return appServerPromise

  const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
  const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:satoshinakamototokyo42@gmail.com'

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID not configured')
  }

  console.log('🔑 VAPID key debug:', {
    publicKeyPreview: VAPID_PUBLIC_KEY.substring(0, 10) + '...',
    publicKeyLength: VAPID_PUBLIC_KEY.length,
    privateKeyPreview: VAPID_PRIVATE_KEY.substring(0, 10) + '...',
    privateKeyLength: VAPID_PRIVATE_KEY.length
  })

  const vapidKeys = {
    publicKey: VAPID_PUBLIC_KEY,
    privateKey: VAPID_PRIVATE_KEY,
  }

  try {
    appServerPromise = webpush.ApplicationServer.new({
      contactInformation: VAPID_SUBJECT,
      vapidKeys,
    })

    console.log('✅ ApplicationServer created')
  } catch (err) {
    console.error('❌ Failed creating ApplicationServer:', err)
    throw err
  }

  return appServerPromise!
}

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

    // Get Supabase credentials (prefer service role key if available)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')
    
    console.log('🔐 Supabase key usage:', { usingServiceRole: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') })

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
      // Use local web-push implementation directly to avoid cross-function auth issues
      const appServer = await getAppServer()

      const subscriber = appServer.subscribe(subscriptionData)
      await subscriber.pushTextMessage(pushPayload, {})

      console.log('✅ Push notification sent successfully via local webpush')

      return new Response(JSON.stringify({ success: true, message: 'Push notification sent successfully' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (pushError: any) {
      console.error('❌ Push delivery error:', pushError)
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Push delivery failed',
        details: (pushError as any)?.message || String(pushError)
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