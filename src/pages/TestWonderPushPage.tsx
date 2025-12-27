import { useState } from 'react';
import { wonderPush, subscribeToNotifications, trackEvent, addUserTag, removeUserTag, initWonderPush } from '../lib/wonderpush';
import { sendWonderPushNotification } from '../lib/wonderpushNotifications';

function TestWonderPushPage() {
  const [status, setStatus] = useState<string>('');
  const [testForm, setTestForm] = useState({
    title: 'Test Bildirimi',
    message: 'Bu bir test bildirimidir.',
    deepLink: '/test'
  });

  const updateStatus = (message: string) => {
    setStatus(prev => prev + '\n' + new Date().toLocaleTimeString() + ': ' + message);
  };

  const handleSubscribe = async () => {
    try {
      updateStatus('WonderPush initialization başlatılıyor...');
      
      // Önce WonderPush'ı initialize et
      await initWonderPush();
      updateStatus('WonderPush initialized successfully');
      
      updateStatus('WonderPush subscription başlatılıyor...');
      const success = await subscribeToNotifications({
        userId: 'test-user-' + Date.now(),
        phone: '05551234567',
        name: 'Test Kullanıcı',
        properties: {
          role: 'test',
          testDate: new Date().toISOString()
        }
      });
      
      if (success) {
        updateStatus('✅ WonderPush subscription başarılı!');
        updateStatus('Installation ID: ' + wonderPush.getInstallationId());
        updateStatus('User ID: ' + wonderPush.getUserId());
        updateStatus('Subscribed: ' + wonderPush.isSubscribed());
      } else {
        updateStatus('❌ WonderPush subscription başarısız!');
      }
    } catch (error) {
      updateStatus('❌ Hata: ' + (error as any)?.message);
    }
  };

  const handleSendNotification = async () => {
    try {
      updateStatus('Test bildirimi gönderiliyor...');
      const success = await sendWonderPushNotification({
        title: testForm.title,
        message: testForm.message,
        deepLink: testForm.deepLink,
        targetType: 'all'
      });
      
      if (success) {
        updateStatus('✅ Test bildirimi gönderildi!');
      } else {
        updateStatus('❌ Test bildirimi gönderilemedi!');
      }
    } catch (error) {
      updateStatus('❌ Hata: ' + (error as any)?.message);
    }
  };

  const handleTrackEvent = async () => {
    try {
      updateStatus('Event tracking...');
      await trackEvent('test_event', {
        page: 'test-page',
        timestamp: new Date().toISOString()
      });
      updateStatus('✅ Event tracked!');
    } catch (error) {
      updateStatus('❌ Event tracking hatası: ' + (error as any)?.message);
    }
  };

  const handleAddTag = async () => {
    try {
      updateStatus('Tag ekleniyor...');
      await addUserTag('test-user');
      updateStatus('✅ Tag eklendi: test-user');
    } catch (error) {
      updateStatus('❌ Tag ekleme hatası: ' + (error as any)?.message);
    }
  };

  const handleRemoveTag = async () => {
    try {
      updateStatus('Tag kaldırılıyor...');
      await removeUserTag('test-user');
      updateStatus('✅ Tag kaldırıldı: test-user');
    } catch (error) {
      updateStatus('❌ Tag kaldırma hatası: ' + (error as any)?.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 WonderPush Test Sayfası</h1>
          
          {/* WonderPush Status */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">📊 WonderPush Durumu</h2>
            <div className="space-y-1 text-sm">
              <div>Status: <code className="bg-white px-2 py-1 rounded">{wonderPush.getStatus()}</code></div>
              <div>WonderPush Ready: <code className="bg-white px-2 py-1 rounded">{wonderPush.isReady() ? '✅ Evet' : '❌ Hayır'}</code></div>
              <div>Installation ID: <code className="bg-white px-2 py-1 rounded">{wonderPush.getInstallationId() || 'Henüz yok'}</code></div>
              <div>User ID: <code className="bg-white px-2 py-1 rounded">{wonderPush.getUserId() || 'Henüz yok'}</code></div>
              <div>Subscribed: <code className="bg-white px-2 py-1 rounded">{wonderPush.isSubscribed() ? '✅ Evet' : '❌ Hayır'}</code></div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">🔔 Subscription İşlemleri</h2>
              
              <button
                onClick={handleSubscribe}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                📱 WonderPush'a Subscribe Ol
              </button>

              <button
                onClick={handleTrackEvent}
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                📊 Test Event Gönder
              </button>

              <button
                onClick={handleAddTag}
                className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                🏷️ Test Tag Ekle
              </button>

              <button
                onClick={handleRemoveTag}
                className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Test Tag Kaldır
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">📨 Bildirim Testi</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input
                  type="text"
                  value={testForm.title}
                  onChange={(e) => setTestForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
                <textarea
                  value={testForm.message}
                  onChange={(e) => setTestForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deep Link</label>
                <input
                  type="text"
                  value={testForm.deepLink}
                  onChange={(e) => setTestForm(prev => ({ ...prev, deepLink: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                onClick={handleSendNotification}
                className="w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
              >
                🚀 Test Bildirimi Gönder
              </button>
            </div>
          </div>

          {/* Status Log */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 İşlem Logları</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{status || 'Henüz işlem yapılmadı...'}</pre>
            </div>
            <button
              onClick={() => setStatus('')}
              className="mt-2 px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              🗑️ Logları Temizle
            </button>
          </div>

          {/* Environment Info */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-2">⚙️ Environment Bilgileri</h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <div>WonderPush Web Key: <code>✅ Tanımlı</code></div>
              <div>WonderPush App ID: <code>✅ Tanımlı</code></div>
              <div>Supabase URL: <code>{import.meta.env.VITE_SUPABASE_URL ? '✅ Tanımlı' : '❌ Tanımsız'}</code></div>
              <div>WonderPush Global: <code>{typeof window.WonderPush !== 'undefined' ? '✅ Yüklendi' : '❌ Yüklenmedi'}</code></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestWonderPushPage;