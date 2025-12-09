import dotenv from 'dotenv'

// .env dosyasını yükle
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Supabase Edge Function Testi\n')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ .env dosyasında Supabase bilgileri eksik!')
  process.exit(1)
}

async function testEdgeFunction() {
  try {
    const functionUrl = `${SUPABASE_URL}/functions/v1/send-notification`
    
    console.log('📡 Edge Function URL:', functionUrl)
    console.log('🔑 Auth Key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'YOK')
    console.log('')

    // Test payload
    const testPayload = {
      userId: 'test-user-123',
      phone: '5551234567',
      type: 'user_approved',
      userName: 'Test Kullanıcı'
    }

    console.log('📤 Test bildirimi gönderiliyor...')
    console.log('Payload:', JSON.stringify(testPayload, null, 2))
    console.log('')

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(testPayload)
    })

    console.log('📥 Response Status:', response.status, response.statusText)
    
    const result = await response.json()
    console.log('📥 Response Body:', JSON.stringify(result, null, 2))
    console.log('')

    if (response.ok) {
      console.log('✅ Edge Function çalışıyor!')
      console.log('🎉 Test başarılı!\n')
    } else {
      console.log('⚠️ Edge Function yanıt verdi ama hata döndü')
      console.log('   Bu normal olabilir - OneSignal credentials veya test kullanıcısı olmayabilir\n')
    }

  } catch (error) {
    console.error('\n❌ Test sırasında hata:', error.message)
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Not: Edge Function deploy edilmemiş olabilir.')
      console.log('   Supabase Dashboard > Edge Functions bölümünden kontrol edin.\n')
    }
    
    process.exit(1)
  }
}

testEdgeFunction()
