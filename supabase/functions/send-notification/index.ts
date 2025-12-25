// Web Push Notification Edge Function using Web Push API
// Note: These imports are for Supabase Edge Functions runtime (Deno) and will show errors in local IDE
// They will work correctly when deployed to Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as webpush from "jsr:@negrel/webpush@0.5.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

console.info(' Web Push Notification Server - Standard Web Push API')

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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const appServer = await getAppServer()

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
      const subscriber = appServer.subscribe(subscription)
      await subscriber.pushTextMessage(payload, {})
      console.log(' Web Push sent successfully')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
      }), { status: 200, headers: corsHeaders })
    } catch (error) {
      console.error(' Web Push delivery error:', error)
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to deliver notification',
        details: (error as any)?.message || String(error)
      }), { status: 500, headers: corsHeaders })
    }

  } catch (error: unknown) {
    console.error(' Web Push error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), { status: 500, headers: corsHeaders })
  }
})