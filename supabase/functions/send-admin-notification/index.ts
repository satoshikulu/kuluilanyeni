// Admin Notification Edge Function - Web Push Protocol
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as webpush from "jsr:@negrel/webpush@0.5.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
}

console.info('🔔 Admin Notification server - Web Push Protocol')

let appServerPromise: Promise<webpush.ApplicationServer> | null = null

function getAppServer(): Promise<webpush.ApplicationServer> {
  if (appServerPromise) return appServerPromise

  const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
  const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:satoshinakamototokyo42@gmail.com'

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

// Phone normalize function - Frontend ile AYNI
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

serve(async (req: Request) => {
  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Method not allowed. Only POST requests are supported.' 
    }), { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    console.log('🚀 Admin notification request started')
    
    // JWT ONLY SECURITY VALIDATION
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('❌ Missing authorization header')
      return new Response(JSON.stringify({ 
        error: "Missing authorization header"
      }), { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Extract Bearer token
    const token = authHeader.replace('Bearer ', '')
    if (!token || token === authHeader) {
      return new Response(JSON.stringify({ 
        error: "Invalid authorization header format"
      }), { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Validate Supabase session
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.log('🚫 Auth validation failed:', authError?.message)
      return new Response(JSON.stringify({ 
        error: "Invalid or expired session"
      }), { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Check admin role in user metadata
    const userRole = user.user_metadata?.role
    if (userRole !== 'admin') {
      console.log('🚫 Access denied - user is not admin:', user.email, 'role:', userRole)
      return new Response(JSON.stringify({ 
        error: "Access denied - admin role required"
      }), { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    console.log('✅ Admin access granted for user:', user.email)

    const appServer = await getAppServer()
    
    // Parse request
    const { phone, title, body, data, url } = await req.json()

    if (!title || !body) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: title, body' 
      }), { status: 400, headers: corsHeaders })
    }

    // Get push subscriptions from Supabase using authenticated client
    let query = supabase.from('push_subscriptions').select('subscription,phone,user_id')
    
    // If phone is provided, filter by normalized phone, otherwise get all subscriptions
    if (phone) {
      const normalizedPhone = normalizePhone(phone)
      console.log('🔍 Searching for normalized phone:', normalizedPhone)
      query = query.eq('phone', normalizedPhone)
    }
    
    const { data: subscriptions, error: subError } = await query
    
    if (subError) {
      console.error('❌ Database error:', subError)
      return new Response(JSON.stringify({ 
        error: 'Database query failed'
      }), { 
        status: 500, 
        headers: corsHeaders 
      })
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        error: phone ? `No push subscription found for phone: ${phone}` : 'No push subscriptions found in database'
      }), { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    console.log(`📡 Found ${subscriptions.length} push subscriptions to send notifications`)

    // Prepare notification payload
    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: 'admin-notification',
      url: url || '/',
      data: data || {},
      timestamp: Date.now()
    })

    // Send notifications to all subscriptions
    let successCount = 0
    let failureCount = 0
    const results = []

    for (const subData of subscriptions) {
      try {
        const subscription = JSON.parse(subData.subscription)
        console.log('📤 Sending notification to endpoint:', subscription.endpoint.substring(0, 50) + '...')

        const subscriber = appServer.subscribe(subscription)
        await subscriber.pushTextMessage(payload, {})
        console.log(`✅ Web Push success for ${subData.phone}`)
        successCount++
        results.push({ phone: subData.phone, success: true })
      } catch (error) {
        console.error(`❌ Web Push failed for ${subData.phone}:`, error)
        failureCount++
        results.push({ phone: subData.phone, success: false, error: (error as any)?.message || String(error) })
      }
    }

    // Return summary
    if (successCount > 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Admin notification sent successfully to ${successCount} users`,
        sent_count: successCount,
        failed_count: failureCount,
        total_subscriptions: subscriptions.length
      }), { status: 200, headers: corsHeaders })
    } else {
      return new Response(JSON.stringify({ 
        error: 'Failed to send notifications to any users',
        sent_count: successCount,
        failed_count: failureCount,
        total_subscriptions: subscriptions.length
      }), { status: 500, headers: corsHeaders })
    }

  } catch (error: unknown) {
    console.error('❌ Admin notification error:', error)
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    console.error('❌ Error stack:', stack)
    
    // Always return JSON, never HTML
    return new Response(JSON.stringify({ 
      error: message || 'Internal server error',
      type: 'catch_block_error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})