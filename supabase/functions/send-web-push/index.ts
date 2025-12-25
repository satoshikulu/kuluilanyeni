// Web Push Protocol Edge Function - Minimal CORS Version
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as webpush from "jsr:@negrel/webpush@0.5.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.info('🔔 Web Push server starting...')

let appServerPromise: Promise<webpush.ApplicationServer> | null = null

function getAppServer(): Promise<webpush.ApplicationServer> {
  if (appServerPromise) return appServerPromise

  const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
  const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:satoshinakamotokyo42@gmail.com'

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID not configured')
  }

  const vapidKeys = {
    publicKey: VAPID_PUBLIC_KEY,
    privateKey: VAPID_PRIVATE_KEY,
  }

  appServerPromise = webpush.ApplicationServer.new({
    contactInformation: VAPID_SUBJECT,
    vapidKeys,
  })

  return appServerPromise!
}

// Phone normalize helper
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

serve(async (req: Request) => {
  // CORS headers - Her response'da kullanılacak
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
    'Content-Type': 'application/json',
  }

  console.log(`🔍 ${req.method} request from ${req.headers.get('origin')}`)

  // OPTIONS request - CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled')
    return new Response(null, { status: 200, headers })
  }

  try {
    // Admin auth (prevent public abuse)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing authorization header'
      }), { status: 401, headers })
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token || token === authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authorization header format'
      }), { status: 401, headers })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Supabase env not configured'
      }), { status: 500, headers })
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid or expired session'
      }), { status: 401, headers })
    }

    const userRole = user.user_metadata?.role
    if (userRole !== 'admin') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied - admin role required'
      }), { status: 403, headers })
    }

    // Prepare application server (Deno-native Web Push)
    const appServer = await getAppServer()
    console.log('✅ Web Push ApplicationServer ready')

    // Parse body
    const body = await req.json()
    const { phone, title, body: message, data, url } = body

    if (!phone || !title || !message) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing fields' 
      }), { status: 400, headers })
    }

    const normalizedPhone = normalizePhone(phone)
    console.log('📱 Processing:', normalizedPhone)

    // Get subscription from Supabase (service role bypasses RLS)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)
    const { data: rows, error: subError } = await supabaseService
      .from('push_subscriptions')
      .select('subscription')
      .eq('phone', normalizedPhone)
      .limit(1)

    if (subError) {
      console.error('❌ Subscription query error:', subError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Database query failed'
      }), { status: 500, headers })
    }

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No subscription found' 
      }), { status: 404, headers })
    }

    const rawSubscription = (rows[0] as any).subscription
    const subscription = typeof rawSubscription === 'string'
      ? JSON.parse(rawSubscription)
      : rawSubscription
    console.log('✅ Subscription found')

    // Send push
    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icon-192x192.png',
      url: url || '/',
      data: data || {},
      timestamp: Date.now(),
    })

    const subscriber = appServer.subscribe(subscription)
    await subscriber.pushTextMessage(payload, {})
    console.log('✅ Push sent')

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Sent successfully' 
    }), { status: 200, headers })

  } catch (error: unknown) {
    console.error('❌ Error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }), { status: 500, headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    }})
  }
})