import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { normalizePhone } from '../lib/firebaseMessaging';

interface FCMToken {
  user_id: string;
  phone: string;
  token: string;
  updated_at: string;
}

interface User {
  id: string;
  full_name: string;
  phone: string;
  status: string;
}

function DebugFCMPage() {
  const [phone, setPhone] = useState('5453526056');
  const [results, setResults] = useState<{ fcmTokens?: FCMToken[]; users?: User[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fcmTokens, setFcmTokens] = useState<FCMToken[]>([]);

  useEffect(() => {
    fetchFCMTokens();
  }, []);

  const fetchFCMTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('fcm_tokens')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching FCM tokens:', error);
      } else {
        setFcmTokens(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing FCM token for phone:', phone);
      
      // Normalize the phone number
      const normalizedPhone = normalizePhone(phone);
      console.log('📱 Normalized phone:', normalizedPhone);
      
      // Check in fcm_tokens table
      const { data: fcmData, error: fcmError } = await supabase
        .from('fcm_tokens')
        .select('*')
        .eq('phone', normalizedPhone);
      
      if (fcmError) {
        console.error('❌ Error querying fcm_tokens:', fcmError);
        setResults({ error: `FCM tokens query error: ${fcmError.message}` });
      } else {
        console.log('✅ FCM tokens found:', fcmData);
        setResults({ fcmTokens: fcmData });
      }
      
      // Also check in users_min table
      const { data: userData, error: userError } = await supabase
        .from('users_min')
        .select('*')
        .eq('phone', normalizedPhone);
      
      if (userError) {
        console.error('❌ Error querying users_min:', userError);
      } else {
        console.log('👥 Users found:', userData);
        setResults(prev => ({ ...prev, users: userData }));
      }
    } catch (error: unknown) {
      console.error('❌ Test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults({ error: `Test error: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteToken = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('fcm_tokens')
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error deleting token:', error);
      } else {
        console.log('Token deleted successfully');
        fetchFCMTokens(); // Refresh the list
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">FCM Token Debug</h1>
      
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
            placeholder="Enter phone number"
          />
        </div>
        
        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 mr-2"
        >
          {loading ? 'Testing...' : 'Test FCM Token'}
        </button>
        
        <button
          onClick={fetchFCMTokens}
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md"
        >
          Refresh Tokens
        </button>
      </div>
      
      {results && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Test Results</h2>
          <pre className="bg-white p-4 rounded-md overflow-x-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Recent FCM Tokens</h2>
        {fcmTokens.length === 0 ? (
          <p>No FCM tokens found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token Preview</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fcmTokens.map((token) => (
                  <tr key={token.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{token.user_id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{token.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{token.token.substring(0, 20)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(token.updated_at).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteToken(token.user_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DebugFCMPage;