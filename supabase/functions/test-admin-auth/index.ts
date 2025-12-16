import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminSecret = req.headers.get('x-admin-secret')
    const expectedSecret = Deno.env.get('ADMIN_SECRET')
    
    console.log('🔐 Test Admin Auth:', {
      received: adminSecret,
      expected: expectedSecret,
      match: adminSecret === expectedSecret,
      env_vars: Object.keys(Deno.env.toObject()).filter(k => k.includes('ADMIN'))
    })
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Admin auth test successful',
      debug: {
        received_secret: adminSecret ? `${adminSecret.substring(0, 5)}...` : 'null',
        expected_secret: expectedSecret ? `${expectedSecret.substring(0, 5)}...` : 'null',
        match: adminSecret === expectedSecret,
        all_env_keys: Object.keys(Deno.env.toObject())
      }
    }), { 
      status: 200, 
      headers: corsHeaders 
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})