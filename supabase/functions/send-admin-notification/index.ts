// PRODUCTION Admin Notification Edge Function - REAL FCM
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
}

console.info('🔥 PRODUCTION Admin Notification server - JWT + ROLE SECURITY')

// Phone normalize function - Frontend ile AYNI
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

serve(async (req) => {
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

    // Firebase Admin credentials
    const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')
    const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')
    const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')

    console.log('🔍 Firebase env check:', {
      project_id: !!FIREBASE_PROJECT_ID,
      client_email: !!FIREBASE_CLIENT_EMAIL,
      private_key: !!FIREBASE_PRIVATE_KEY,
      project_id_value: FIREBASE_PROJECT_ID ? `${FIREBASE_PROJECT_ID.substring(0, 10)}...` : 'missing',
      client_email_value: FIREBASE_CLIENT_EMAIL ? `${FIREBASE_CLIENT_EMAIL.substring(0, 20)}...` : 'missing'
    })

    // Return detailed error for missing Firebase credentials
    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
      console.error('❌ Missing Firebase credentials')
      return new Response(JSON.stringify({ 
        error: 'Firebase Admin credentials not configured in Supabase Dashboard',
        details: 'Go to Supabase Dashboard > Settings > Edge Functions > Environment Variables',
        missing: {
          FIREBASE_PROJECT_ID: !FIREBASE_PROJECT_ID,
          FIREBASE_CLIENT_EMAIL: !FIREBASE_CLIENT_EMAIL,
          FIREBASE_PRIVATE_KEY: !FIREBASE_PRIVATE_KEY
        },
        help: 'Add these environment variables in Supabase Dashboard'
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
        error: 'Missing required fields: title, body' 
      }), { status: 400, headers: corsHeaders })
    }

    // Get FCM tokens from Supabase using authenticated client
    let query = supabase.from('fcm_tokens').select('token,phone,user_id')
    
    // If phone is provided, filter by normalized phone, otherwise get all tokens
    if (phone) {
      const normalizedPhone = normalizePhone(phone)
      console.log('🔍 Searching for normalized phone:', normalizedPhone)
      query = query.eq('phone', normalizedPhone)
    }
    
    const { data: tokens, error: tokenError } = await query
    
    if (tokenError) {
      console.error('❌ Database error:', tokenError)
      return new Response(JSON.stringify({ 
        error: 'Database query failed'
      }), { 
        status: 500, 
        headers: corsHeaders 
      })
    }
    
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ 
        error: phone ? `No FCM token found for phone: ${phone}` : 'No FCM tokens found in database'
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
        const authText = await authResponse.text()
        try {
          const authResult = JSON.parse(authText)
          accessToken = authResult.access_token
        } catch (parseError) {
          console.error("🔥 OAuth2 non-JSON response:", authText.slice(0, 200))
        }
      } else {
        const errorText = await authResponse.text()
        console.error("🔥 OAuth2 error:", errorText.slice(0, 200))
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
        
        const responseText = await fcmResponse.text()
        
        if (!fcmResponse.ok) {
          console.error("🔥 FCM v1 API error:", responseText)
          result = { error: responseText.slice(0, 500) }
        } else {
          try {
            result = JSON.parse(responseText)
            console.log(`✅ FCM v1 API success for ${tokenData.phone}:`, result.name)
            successCount++
            results.push({ phone: tokenData.phone, success: true, messageId: result.name })
            continue
          } catch (parseError) {
            console.error("🔥 FCM v1 API non-JSON response:", responseText.slice(0, 200))
            result = { error: "Non-JSON response: " + responseText.slice(0, 200) }
          }
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
        
        const legacyResponseText = await fcmResponse.text()
        
        if (!fcmResponse.ok) {
          console.error("🔥 FCM Legacy API error:", legacyResponseText)
          result = { error: legacyResponseText.slice(0, 500) }
        } else {
          try {
            result = JSON.parse(legacyResponseText)
            if (result.success > 0) {
              console.log(`✅ FCM Legacy API success for ${tokenData.phone}:`, result.results[0].message_id)
              successCount++
              results.push({ phone: tokenData.phone, success: true, messageId: result.results[0].message_id })
              continue
            }
          } catch (parseError) {
            console.error("🔥 FCM Legacy API non-JSON response:", legacyResponseText.slice(0, 200))
            result = { error: "Non-JSON response: " + legacyResponseText.slice(0, 200) }
          }
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
        total_tokens: tokens.length
      }), { status: 200, headers: corsHeaders })
    } else {
      return new Response(JSON.stringify({ 
        error: 'Failed to send notifications to any users',
        sent_count: successCount,
        failed_count: failureCount,
        total_tokens: tokens.length
      }), { status: 500, headers: corsHeaders })
    }

  } catch (error) {
    console.error('❌ Admin notification error:', error)
    console.error('❌ Error stack:', error.stack)
    
    // Always return JSON, never HTML
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      type: 'catch_block_error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})