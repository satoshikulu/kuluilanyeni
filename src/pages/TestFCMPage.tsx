import { useState } from 'react';

function TestFCMPage() {
  const [phone, setPhone] = useState('5453526056');
  const [results, setResults] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      // We'll implement the test directly here since we can't easily import the test function
      console.log('🔍 Testing FCM token for phone:', phone);
      setResults(`Testing FCM token for phone: ${phone}`);
    } catch (error) {
      console.error('❌ Test error:', error);
      setResults('Test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">FCM Token Test</h1>
      
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
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test FCM Token'}
        </button>
      </div>
      
      {results && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Results</h2>
          <pre className="bg-white p-4 rounded-md overflow-x-auto">
            {results}
          </pre>
        </div>
      )}
    </div>
  );
}

export default TestFCMPage;