import { useState } from 'react';
import { testWebPushNotification } from '../lib/webPushAPI';
import { checkUserHasPushSubscription, setupPushNotificationsForUser } from '../lib/webPushMessaging';

function TestWebPushPage() {
  const [phone, setPhone] = useState('5453526056');
  const [results, setResults] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing Web Push for phone:', phone);
      
      // Check if user has push subscription
      const hasSubscription = await checkUserHasPushSubscription(phone);
      console.log('🔍 Push subscription found:', hasSubscription);
      
      if (!hasSubscription) {
        setResults(`❌ No push subscription found for phone: ${phone}\nUser must enable push notifications first.`);
        return;
      }
      
      // Send test notification
      const success = await testWebPushNotification(phone);
      
      if (success) {
        setResults(`✅ Test notification sent successfully to ${phone}`);
      } else {
        setResults(`❌ Failed to send test notification to ${phone}`);
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
      setResults(`❌ Test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Web Push Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter phone number (e.g., 5453526056)"
          />
        </div>
        
        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Web Push Notification'}
        </button>
      </div>
      
      {results && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Results</h2>
          <pre className="bg-white p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
            {results}
          </pre>
        </div>
      )}
      
      <div className="bg-blue-50 rounded-lg p-4 mt-6">
        <h3 className="text-lg font-semibold mb-2">📝 Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Make sure the user with this phone number is logged in</li>
          <li>User must have granted notification permission</li>
          <li>User must have completed Web Push setup</li>
          <li>Check browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  );
}

export default TestWebPushPage;