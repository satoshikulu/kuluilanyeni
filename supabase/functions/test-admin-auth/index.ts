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
    const expectedSecret = Deno.env.get('ADMIN_SECRET') || 'kulu-admin-secret-2024' // Fallback
    
    console.log('🔐 Test Admin Auth:', {
      received: adminSecret,
      expected: expectedSecret,
      match: adminSecret === expectedSecret,
      env_vars: Object.keys(Deno.env.toObject()).filter(k => k.includes('ADMIN')),
      env_admin_secret_exists: !!Deno.env.get('ADMIN_SECRET'),
      // TEMPORARY DEBUG - gerçek değerleri göster
      received_full: adminSecret,
      expected_full: expectedSecret
    })
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Admin auth test successful',
      auth_result: adminSecret === expectedSecret ? 'VALID' : 'INVALID',
      debug: {
        received_secret: adminSecret ? `${adminSecret.substring(0, 5)}...` : 'null',
        expected_secret: expectedSecret ? `${expectedSecret.substring(0, 5)}...` : 'null',
        match: adminSecret === expectedSecret,
        env_admin_secret: Deno.env.get('ADMIN_SECRET') ? 'found' : 'using_fallback',
        all_env_keys: Object.keys(Deno.env.toObject()),
        // TEMPORARY DEBUG - tam değerleri göster
        received_full: adminSecret,
        expected_full: expectedSecret
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