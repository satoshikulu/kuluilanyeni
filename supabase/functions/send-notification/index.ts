// Web Push Notification Edge Function using Web Push API
// Note: These imports are for Supabase Edge Functions runtime (Deno) and will show errors in local IDE
// They will work correctly when deployed to Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import webpush from "https://esm.sh/web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

console.info('🔔 Web Push Notification Server - Standard Web Push API')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // VAPID keys from environment variables
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
    const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL')

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'VAPID keys not configured' 
      }), { status: 500, headers: corsHeaders })
    }

    // Set VAPID details
    webpush.setVapidDetails(
      `mailto:${VAPID_EMAIL}`,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )
    
    // Parse request
    const { subscription, title, body, data } = await req.json()

    if (!subscription || !title || !body) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: subscription, title, body' 
      }), { status: 400, headers: corsHeaders })
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      data: data || {}
    })

    // Send notification
    try {
      const result = await webpush.sendNotification(subscription, payload)
      console.log('✅ Web Push sent successfully')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        result: result
      }), { status: 200, headers: corsHeaders })
    } catch (error) {
      console.error('❌ Web Push delivery error:', error)
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to deliver notification',
        details: error.message
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