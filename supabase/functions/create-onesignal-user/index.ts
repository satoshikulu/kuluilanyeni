import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, full_name, phone } = await req.json()

    if (!user_id || !full_name) {
      return new Response(
        JSON.stringify({ error: 'user_id and full_name are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // OneSignal REST API Key - Environment'dan al
    const oneSignalRestApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')

    if (!oneSignalRestApiKey || !oneSignalAppId) {
      // Hata durumunu kaydet
      await supabase.rpc('update_onesignal_sync_status', {
        p_user_id: user_id,
        p_status: 'failed',
        p_error: 'OneSignal credentials not configured'
      })

      return new Response(
        JSON.stringify({ error: 'OneSignal credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // İsim ve soyismi ayır
    const nameParts = full_name.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // OneSignal Create User API'sine istek gönder (OneSignal'ın önerdiği format)
    const oneSignalResponse = await fetch('https://api.onesignal.com/users', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${oneSignalRestApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity: {
          external_id: user_id
        },
        properties: {
          tags: {
            first_name: firstName,
            last_name: lastName,
            phone_number: phone ? `+90${phone.replace(/\D/g, '')}` : '',
            source: 'supabase_auto_sync',
            created_at: new Date().toISOString()
          }
        }
      })
    })

    const oneSignalData = await oneSignalResponse.json()

    if (!oneSignalResponse.ok) {
      console.error('OneSignal API Error:', oneSignalData)
      
      // Hata durumunu kaydet
      await supabase.rpc('update_onesignal_sync_status', {
        p_user_id: user_id,
        p_status: 'failed',
        p_error: `OneSignal API Error: ${JSON.stringify(oneSignalData)}`
      })

      return new Response(
        JSON.stringify({ 
          error: 'Failed to create OneSignal user',
          details: oneSignalData 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('OneSignal user created successfully:', oneSignalData)

    // Başarı durumunu kaydet
    await supabase.rpc('update_onesignal_sync_status', {
      p_user_id: user_id,
      p_status: 'success',
      p_onesignal_user_id: oneSignalData.identity?.onesignal_id || null
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        onesignal_user: oneSignalData,
        message: 'User created in OneSignal successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating OneSignal user:', error)
    
    // Hata durumunu kaydet (user_id varsa)
    try {
      const { user_id } = await req.json()
      if (user_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        await supabase.rpc('update_onesignal_sync_status', {
          p_user_id: user_id,
          p_status: 'failed',
          p_error: error.message
        })
      }
    } catch (e) {
      console.error('Failed to log error to database:', e)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})