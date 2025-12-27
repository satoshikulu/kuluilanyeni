// WonderPush Notification Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

console.info('🚀 WonderPush Notification Server')

interface WonderPushNotificationRequest {
  // Notification content
  title: string;
  message: string;
  deepLink?: string;
  
  // Targeting
  targetType: 'user' | 'segment' | 'all';
  targetValue?: string; // userId for 'user', segment name for 'segment'
  
  // Optional data
  data?: Record<string, any>;
}

interface WonderPushPayload {
  alert: {
    title: string;
    text: string;
  };
  targetAudience?: {
    userId?: string;
    segment?: string;
  };
  push?: {
    payload?: Record<string, any>;
  };
}

async function sendWonderPushNotification(payload: WonderPushPayload): Promise<any> {
  const WONDERPUSH_ACCESS_TOKEN = Deno.env.get('WONDERPUSH_ACCESS_TOKEN');
  const WONDERPUSH_APP_ID = Deno.env.get('WONDERPUSH_APP_ID');

  if (!WONDERPUSH_ACCESS_TOKEN || !WONDERPUSH_APP_ID) {
    throw new Error('WonderPush credentials not configured');
  }

  const url = `https://management-api.wonderpush.com/v1/applications/${WONDERPUSH_APP_ID}/notifications`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WONDERPUSH_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WonderPush API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: WonderPushNotificationRequest = await req.json();

    // Validate required fields
    if (!requestData.title || !requestData.message || !requestData.targetType) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields: title, message, targetType' 
      }), { status: 400, headers: corsHeaders });
    }

    // Build WonderPush payload
    const wonderPushPayload: WonderPushPayload = {
      alert: {
        title: requestData.title,
        text: requestData.message,
      },
    };

    // Set targeting
    if (requestData.targetType === 'user' && requestData.targetValue) {
      wonderPushPayload.targetAudience = {
        userId: requestData.targetValue,
      };
    } else if (requestData.targetType === 'segment' && requestData.targetValue) {
      wonderPushPayload.targetAudience = {
        segment: requestData.targetValue,
      };
    }
    // For 'all' targetType, no targetAudience is needed (broadcasts to all)

    // Add custom data if provided
    if (requestData.data || requestData.deepLink) {
      wonderPushPayload.push = {
        payload: {
          ...requestData.data,
          ...(requestData.deepLink && { deepLink: requestData.deepLink }),
        },
      };
    }

    // Send notification via WonderPush API
    const result = await sendWonderPushNotification(wonderPushPayload);

    console.log('✅ WonderPush notification sent successfully:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'WonderPush notification sent successfully',
      wonderPushResponse: result,
    }), { status: 200, headers: corsHeaders });

  } catch (error: unknown) {
    console.error('❌ WonderPush notification error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), { status: 500, headers: corsHeaders });
  }
});