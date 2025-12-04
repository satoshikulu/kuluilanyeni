// Supabase Edge Function - OneSignal Bildirim Gönderme
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  userId: string
  phone: string
  type: 'user_approved' | 'listing_approved' | 'listing_rejected'
  listingTitle?: string
  userName?: string
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Environment variables
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal credentials not configured')
    }

    // Parse request body
    const { userId, phone, type, listingTitle, userName }: NotificationRequest = await req.json()

    // Bildirim içeriğini oluştur
    let heading = ''
    let content = ''
    let url = 'https://kuluilanyeni.netlify.app'

    switch (type) {
      case 'user_approved':
        heading = '✅ Üyeliğiniz Onaylandı!'
        content = `Hoş geldiniz ${userName}! Artık ilan verebilir ve favorilerinizi kaydedebilirsiniz.`
        url = 'https://kuluilanyeni.netlify.app'
        break
      
      case 'listing_approved':
        heading = '🎉 İlanınız Onaylandı!'
        content = `"${listingTitle}" ilanınız yayına alındı ve artık herkes görebilir.`
        url = 'https://kuluilanyeni.netlify.app/ilanlarim'
        break
      
      case 'listing_rejected':
        heading = '❌ İlanınız Reddedildi'
        content = `"${listingTitle}" ilanınız yönetici tarafından reddedildi. Lütfen ilan detaylarını kontrol edin.`
        url = 'https://kuluilanyeni.netlify.app/ilanlarim'
        break
    }

    // OneSignal API'ye bildirim gönder
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [phone], // Telefon numarası external user ID olarak kullanılıyor
        headings: { en: heading },
        contents: { en: content },
        url: url,
        web_url: url,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('OneSignal API error:', result)
      throw new Error(`OneSignal API error: ${JSON.stringify(result)}`)
    }

    console.log('Notification sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        recipients: result.recipients 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending notification:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
