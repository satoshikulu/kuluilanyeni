// Test Edge Function directly to debug the HTML response issue
// Using built-in fetch (Node.js 18+)

const SUPABASE_URL = 'https://tjoivjohhjoedtwzuopr.supabase.co';

console.log('🔍 Testing Edge Function directly...');

// Test 1: Missing Authorization Header
console.log('\n📡 Test 1: Missing Authorization Header');
try {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-admin-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Test',
      body: 'Test message'
    })
  });
  
  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  
  const responseText = await response.text();
  console.log('Response text (first 500 chars):', responseText.substring(0, 500));
  
  // Try to parse as JSON
  try {
    const data = JSON.parse(responseText);
    console.log('✅ JSON Response:', data);
  } catch (jsonError) {
    console.log('❌ Non-JSON Response - this is the problem!');
    console.log('Response starts with:', responseText.substring(0, 100));
  }
} catch (error) {
  console.error('❌ Fetch error:', error.message);
}

// Test 2: Invalid JWT
console.log('\n📡 Test 2: Invalid JWT Token');
try {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-admin-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token-123'
    },
    body: JSON.stringify({
      title: 'Test',
      body: 'Test message'
    })
  });
  
  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  
  const responseText = await response.text();
  console.log('Response text (first 500 chars):', responseText.substring(0, 500));
  
  // Try to parse as JSON
  try {
    const data = JSON.parse(responseText);
    console.log('✅ JSON Response:', data);
  } catch (jsonError) {
    console.log('❌ Non-JSON Response - this is the problem!');
    console.log('Response starts with:', responseText.substring(0, 100));
  }
} catch (error) {
  console.error('❌ Fetch error:', error.message);
}