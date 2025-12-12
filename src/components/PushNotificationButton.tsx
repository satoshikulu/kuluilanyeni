// React component for OneSignal V16 push notification button

/**
 * Example component showing how to use the global enablePush() function
 * This demonstrates the correct V16 API usage
 */
export default function PushNotificationButton() {
  const handleEnablePush = () => {
    // Call the global enablePush function
    if (window.enablePush) {
      window.enablePush();
    } else {
      console.error('enablePush function not available');
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">OneSignal V16 Test</h3>
      <button 
        onClick={handleEnablePush}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Bildirim Aç
      </button>
      
      {/* Alternative: Direct HTML onclick (as requested) */}
      <button 
        onClick={() => (window as any).enablePush?.()}
        className="ml-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Enable Push (Direct)
      </button>
      
      {/* HTML onclick version (as requested in requirements) */}
      <div className="mt-4">
        <p className="text-sm text-gray-600 mb-2">HTML onclick version:</p>
        <button 
          onClick={() => {
            // This simulates the HTML onclick behavior
            (window as any).enablePush?.();
          }}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          Bildirim Aç (HTML Style)
        </button>
      </div>
    </div>
  );
}