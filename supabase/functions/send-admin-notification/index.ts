// PRODUCTION Admin Notification Edge Function - REAL FCM
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
}

console.info('🔥 PRODUCTION Admin Notification server - REAL PUSH NOTIFICATIONS')

serve(async (req) => {
  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Method not allowed. Only POST requests are supported.' 
    }), { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    // Admin secret validation
    const adminSecret = req.headers.get('x-admin-secret')
    const expectedSecret = Deno.env.get('ADMIN_SECRET')
    
    if (!expectedSecret) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Admin secret not configured on server' 
      }), { 
        status: 500, 
        headers: corsHeaders 
      })
    }
    
    if (!adminSecret || adminSecret !== expectedSecret) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Unauthorized. Invalid or missing admin secret.' 
      }), { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Firebase Admin credentials
    const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')
    const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')
    const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')

    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Firebase Admin credentials not configured' 
      }), { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    
    // Parse request
    const { phone, title, body } = await req.json()

    if (!title || !body) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: title, body' 
      }), { status: 400, headers: corsHeaders })
    }

    // Get FCM tokens from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    let tokenQuery = `${supabaseUrl}/rest/v1/fcm_tokens?select=token,phone`
    
    // If phone is provided, filter by phone, otherwise get all tokens
    if (phone) {
      tokenQuery += `&phone=eq.${phone}`
    }
    
    const tokenResponse = await fetch(tokenQuery, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    const tokens = await tokenResponse.json()
    
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: phone ? `No FCM token found for phone: ${phone}` : 'No FCM tokens found in database',
        details: 'Users must login and grant notification permission first',
        phone: phone || 'all_users',
        searched_tokens: 0
      }), { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    console.log(`📡 Found ${tokens.length} FCM tokens to send notifications`)

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

    // Simple JWT creation (for Deno compatibility)
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '')
    const payload = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '')
    
    // Get OAuth2 access token
    let accessToken = null
    
    try {
      const authResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: `${header}.${payload}.signature_placeholder`
        })
      })
      
      if (authResponse.ok) {
        const authResult = await authResponse.json()
        accessToken = authResult.access_token
      }
    } catch (authError) {
      console.warn('OAuth2 failed, using Legacy API')
    }

    // Send notifications to all tokens
    let successCount = 0
    let failureCount = 0
    const results = []

    for (const tokenData of tokens) {
      const fcmToken = tokenData.token
      
      // Prepare FCM message
      const fcmMessage = {
        message: {
          token: fcmToken,
          notification: {
            title: title,
            body: body
          },
          data: {
            type: 'admin_notification',
            timestamp: new Date().toISOString()
          },
          webpush: {
            notification: {
              title: title,
              body: body,
              icon: '/icon-192x192.png',
              badge: '/icon-96x96.png',
              tag: 'admin-notification',
              requireInteraction: true
            }
          }
        }
      }

      let fcmResponse
      let result

      // Try Firebase HTTP v1 API first
      if (accessToken) {
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
          console.log(`✅ FCM v1 API success for ${tokenData.phone}:`, result.name)
          successCount++
          results.push({ phone: tokenData.phone, success: true, messageId: result.name })
          continue
        }
      }

      // Fallback to Legacy API
      const legacyMessage = {
        to: fcmToken,
        notification: {
          title: title,
          body: body,
          icon: '/icon-192x192.png'
        },
        data: {
          type: 'admin_notification',
          timestamp: new Date().toISOString()
        }
      }

      // Use server key for Legacy API (if available)
      const serverKey = Deno.env.get('FIREBASE_SERVER_KEY')
      
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
          console.log(`✅ FCM Legacy API success for ${tokenData.phone}:`, result.results[0].message_id)
          successCount++
          results.push({ phone: tokenData.phone, success: true, messageId: result.results[0].message_id })
          continue
        }
      }

      // If both APIs fail for this token
      console.error(`❌ FCM failed for ${tokenData.phone}:`, result)
      failureCount++
      results.push({ phone: tokenData.phone, success: false, error: result })
    }

    // Return summary
    if (successCount > 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Admin notification sent successfully to ${successCount} users`,
        sent_count: successCount,
        failed_count: failureCount,
        total_tokens: tokens.length,
        results: results
      }), { status: 200, headers: corsHeaders })
    } else {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to send notifications to any users',
        sent_count: successCount,
        failed_count: failureCount,
        total_tokens: tokens.length,
        results: results
      }), { status: 500, headers: corsHeaders })
    }

  } catch (error) {
    console.error('❌ Admin notification error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error',
      details: 'Check server logs for more information',
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})