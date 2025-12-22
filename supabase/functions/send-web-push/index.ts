// Web Push Protocol Edge Function - No Firebase/OneSignal dependency
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

console.info('🔔 Web Push Protocol server - VAPID based notifications')

// Phone normalize helper - keep consistent with frontend logic
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

// VAPID JWT creation
async function createVAPIDJWT(vapidPrivateKey: string, vapidSubject: string, audience: string): Promise<string> {
  // Import private key
  const privateKeyDer = Uint8Array.from(atob(vapidPrivateKey), c => c.charCodeAt(0))
  
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyDer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    false,
    ['sign']
  )

  // JWT Header
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  }

  // JWT Payload
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    aud: audience,
    exp: now + (12 * 60 * 60), // 12 hours
    sub: vapidSubject
  }

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  // Create signature
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256'
    },
    privateKey,
    data
  )

  // Encode signature
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

// Send Web Push Notification
async function sendWebPushNotification(
  subscription: any,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  
  const endpoint = subscription.endpoint
  const p256dh = subscription.keys.p256dh
  const auth = subscription.keys.auth

  // Extract audience from endpoint
  const url = new URL(endpoint)
  const audience = `${url.protocol}//${url.host}`

  // Create VAPID JWT
  const vapidJWT = await createVAPIDJWT(vapidPrivateKey, vapidSubject, audience)

  // Prepare headers
  const headers = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    'Authorization': `vapid t=${vapidJWT}, k=${vapidPublicKey}`,
    'TTL': '86400' // 24 hours
  }

  // For now, send unencrypted payload (browsers will handle encryption)
  // In production, you might want to implement Web Push encryption
  const body = new TextEncoder().encode(payload)

  console.log('🚀 Sending Web Push to:', endpoint)
  console.log('🔑 VAPID JWT created for audience:', audience)

  // Send push notification
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body
  })

  return response
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // VAPID credentials
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:satoshinakamototokyo42@gmail.com'

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'VAPID credentials not configured' 
      }), { status: 500, headers: corsHeaders })
    }

    // Parse request
    const { phone, title, body, data, url } = await req.json()

    if (!phone || !title || !body) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: phone, title, body' 
      }), { status: 400, headers: corsHeaders })
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone)
    console.log('🔍 Incoming phone:', phone, '➡ normalized:', normalizedPhone)

    // Get push subscription from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    console.log('🔍 Querying push subscription for phone:', normalizedPhone)
    
    const subscriptionResponse = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?phone=eq.${normalizedPhone}&select=subscription`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    const subscriptions = await subscriptionResponse.json()
    console.log('🔍 Push subscriptions query result:', subscriptions)
    
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: `No push subscription found for phone: ${phone}`,
        details: 'User must enable push notifications first'
      }), { status: 404, headers: corsHeaders })
    }

    const subscriptionData = JSON.parse(subscriptions[0].subscription)
    console.log('✅ Push subscription found:', subscriptionData.endpoint.substring(0, 50) + '...')

    // Prepare push payload
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

    console.log('📱 Sending push notification:', { title, body, url })

    // Send Web Push notification
    const pushResponse = await sendWebPushNotification(
      subscriptionData,
      pushPayload,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY,
      VAPID_SUBJECT
    )

    if (pushResponse.ok) {
      console.log('✅ Web Push sent successfully')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Push notification sent successfully',
        status: pushResponse.status
      }), { status: 200, headers: corsHeaders })
    } else {
      const errorText = await pushResponse.text()
      console.error('❌ Web Push failed:', pushResponse.status, errorText)
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Web Push delivery failed',
        details: errorText,
        status: pushResponse.status
      }), { status: 500, headers: corsHeaders })
    }

  } catch (error) {
    console.error('❌ Web Push error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error'
    }), { status: 500, headers: corsHeaders })
  }
})