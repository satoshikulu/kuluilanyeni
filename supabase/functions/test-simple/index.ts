import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
}

console.log('🔥 Simple test function started')

serve(async (req) => {
  console.log('📡 Request received:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('✅ Test function working')
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Test function is working!",
      timestamp: new Date().toISOString()
    }), { 
      status: 200, 
      headers: corsHeaders 
    })
  } catch (error) {
    console.error('❌ Error:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Test error',
      success: false
    }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})