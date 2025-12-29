import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get all active users who haven't been subscribed to OneSignal yet
    const { data: users, error: usersError } = await supabaseClient
      .from('users_min')
      .select('*')
      .eq('status', 'approved')
      .is('onesignal_player_id', null)

    if (usersError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users', details: usersError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users to subscribe',
          processed: 0 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results = {
      total: users.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process users in batches to avoid overwhelming OneSignal API
    const batchSize = 10
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      // Process batch with delay
      const batchPromises = batch.map(async (user, index) => {
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, index * 100))
        
        try {
          // Prepare OneSignal user data
          const oneSignalData = {
            app_id: ONESIGNAL_APP_ID,
            external_user_id: user.id,
            tags: {
              user_id: user.id,
              user_status: user.status || 'approved',
              full_name: user.full_name || '',
              phone: user.phone || '',
              created_at: user.created_at || new Date().toISOString()
            }
          }

          // Add email if available
          if (user.email) {
            oneSignalData.email = user.email
          }

          // Create user in OneSignal
          const oneSignalResponse = await fetch('https://onesignal.com/api/v1/players', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(oneSignalData),
          })

          const oneSignalResult = await oneSignalResponse.json()

          if (oneSignalResponse.ok && oneSignalResult.id) {
            // Update user record with OneSignal player ID
            await supabaseClient
              .from('users_min')
              .update({ 
                onesignal_player_id: oneSignalResult.id,
                notification_subscribed: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id)

            results.successful++
            
            // Log successful subscription
            await supabaseClient
              .from('notification_logs')
              .insert({
                user_id: user.id,
                type: 'bulk_subscription',
                title: 'Bulk OneSignal Subscription',
                message: `User ${user.full_name} bulk subscribed to OneSignal`,
                success: true,
                onesignal_player_id: oneSignalResult.id,
                created_at: new Date().toISOString()
              })

          } else {
            results.failed++
            results.errors.push(`User ${user.id}: ${JSON.stringify(oneSignalResult)}`)
            
            // Log failed subscription
            await supabaseClient
              .from('notification_logs')
              .insert({
                user_id: user.id,
                type: 'bulk_subscription',
                title: 'Bulk OneSignal Subscription Failed',
                message: `Failed to subscribe user ${user.full_name}`,
                success: false,
                error_message: JSON.stringify(oneSignalResult),
                created_at: new Date().toISOString()
              })
          }

        } catch (error) {
          results.failed++
          results.errors.push(`User ${user.id}: ${error.message}`)
          console.error(`Error processing user ${user.id}:`, error)
        }
      })

      await Promise.all(batchPromises)
      
      // Add delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Bulk subscription completed',
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in bulk-onesignal-subscribe function:', error)
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