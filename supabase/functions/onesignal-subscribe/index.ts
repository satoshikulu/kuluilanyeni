import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OneSignalSubscribeRequest {
  userId: string;
  playerId?: string; // OneSignal player ID
  email?: string;
  phone?: string;
  tags?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { userId, playerId, email, phone, tags }: OneSignalSubscribeRequest = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user details from Supabase
    const { data: user, error: userError } = await supabaseClient
      .from('users_min')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // OneSignal API configuration
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OneSignal configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare OneSignal user data
    const oneSignalData: any = {
      app_id: ONESIGNAL_APP_ID,
      external_user_id: userId,
    }

    // Add player ID if provided
    if (playerId) {
      oneSignalData.player_id = playerId
    }

    // Add email if available
    if (email || user.email) {
      oneSignalData.email = email || user.email
    }

    // Add phone if available
    if (phone || user.phone) {
      oneSignalData.sms_number = phone || user.phone
    }

    // Add tags
    const userTags: Record<string, string> = {
      user_id: userId,
      user_status: user.status || 'active',
      full_name: user.full_name || '',
      ...tags
    }

    oneSignalData.tags = userTags

    // Create/update user in OneSignal
    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(oneSignalData),
    })

    const oneSignalResult = await oneSignalResponse.json()

    if (!oneSignalResponse.ok) {
      console.error('OneSignal API error:', oneSignalResult)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to subscribe to OneSignal',
          details: oneSignalResult 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update user record with OneSignal player ID
    if (oneSignalResult.id) {
      await supabaseClient
        .from('users_min')
        .update({ 
          onesignal_player_id: oneSignalResult.id,
          notification_subscribed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    }

    // Log the subscription
    await supabaseClient
      .from('notification_logs')
      .insert({
        user_id: userId,
        type: 'subscription',
        title: 'OneSignal Subscription',
        message: `User ${user.full_name} subscribed to OneSignal`,
        success: true,
        onesignal_player_id: oneSignalResult.id,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        playerId: oneSignalResult.id,
        message: 'Successfully subscribed to OneSignal'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in onesignal-subscribe function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})