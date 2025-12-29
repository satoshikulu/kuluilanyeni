import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OneSignalNotificationRequest {
  title: string;
  message: string;
  targetType: 'all' | 'user' | 'segment';
  targetValue?: string; // user ID or segment name
  url?: string; // deep link
  imageUrl?: string;
  data?: Record<string, any>;
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

    const { 
      title, 
      message, 
      targetType, 
      targetValue, 
      url, 
      imageUrl, 
      data 
    }: OneSignalNotificationRequest = await req.json()

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'Title and message are required' }),
        { 
          status: 400, 
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

    // Prepare OneSignal notification data
    const notificationData: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
    }

    // Add URL if provided
    if (url) {
      notificationData.url = url
    }

    // Add image if provided
    if (imageUrl) {
      notificationData.big_picture = imageUrl
      notificationData.large_icon = imageUrl
    }

    // Add custom data
    if (data) {
      notificationData.data = data
    }

    // Set target audience
    switch (targetType) {
      case 'all':
        notificationData.included_segments = ['All']
        break
      case 'user':
        if (!targetValue) {
          return new Response(
            JSON.stringify({ error: 'targetValue is required for user targeting' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        notificationData.include_external_user_ids = [targetValue]
        break
      case 'segment':
        if (!targetValue) {
          return new Response(
            JSON.stringify({ error: 'targetValue is required for segment targeting' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        notificationData.included_segments = [targetValue]
        break
      default:
        notificationData.included_segments = ['All']
    }

    // Send notification via OneSignal API
    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationData),
    })

    const oneSignalResult = await oneSignalResponse.json()

    if (!oneSignalResponse.ok) {
      console.error('OneSignal API error:', oneSignalResult)
      
      // Log failed notification
      await supabaseClient
        .from('notification_logs')
        .insert({
          type: 'notification',
          title,
          message,
          target_type: targetType,
          target_value: targetValue,
          success: false,
          error_message: JSON.stringify(oneSignalResult),
          created_at: new Date().toISOString()
        })

      return new Response(
        JSON.stringify({ 
          error: 'Failed to send OneSignal notification',
          details: oneSignalResult 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log successful notification
    await supabaseClient
      .from('notification_logs')
      .insert({
        type: 'notification',
        title,
        message,
        target_type: targetType,
        target_value: targetValue,
        success: true,
        onesignal_notification_id: oneSignalResult.id,
        recipients: oneSignalResult.recipients || 0,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationId: oneSignalResult.id,
        recipients: oneSignalResult.recipients || 0,
        message: 'Notification sent successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-onesignal-notification function:', error)
    
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