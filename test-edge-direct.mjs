// Edge function'ı direkt test et
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testEdgeFunction() {
  try {
    console.log('🧪 Edge function test başlıyor...');
    console.log('📍 URL:', `${SUPABASE_URL}/functions/v1/send-fcm-notification`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-fcm-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        phone: '5453526056',
        title: '🧪 Test Bildirimi',
        body: 'Bu bir test bildirimidir.',
        data: { type: 'test' }
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('📄 Raw Response:', text);
    
    try {
      const result = JSON.parse(text);
      console.log('✅ Parsed Response:', JSON.stringify(result, null, 2));
    } catch (e) {
      console.error('❌ JSON parse hatası');
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

testEdgeFunction();
