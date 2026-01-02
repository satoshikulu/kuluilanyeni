import { useState, useEffect } from 'react';
import { 
  initOneSignal, 
  subscribeToNotifications, 
  addUserTag, 
  trackEvent, 
  getOneSignalStatus,
  getNotificationPermission 
} from '../lib/oneSignal';
import { 
  sendOneSignalNotification,
  bulkSubscribeUsersToOneSignal,
  OneSignalNotificationTemplates
} from '../lib/oneSignalNotifications';
import { syncUserToOneSignal } from '../lib/oneSignalUserSync';
import { getCurrentUser } from '../lib/simpleAuth';

function OneSignalTestPage() {
  const [status, setStatus] = useState<string>('');
  const [oneSignalStatus, setOneSignalStatus] = useState<any>({});
  const [permission, setPermission] = useState<string>('default');
  const [userTags, setUserTags] = useState<any>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [testForm, setTestForm] = useState({
    title: 'Test Bildirimi',
    message: 'Bu bir test bildirimidir.',
    deepLink: '/test',
    phone: '05551234567'
  });

  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      setCurrentUser(user);
    }
    loadUser();
  }, []);

  const updateStatus = (message: string) => {
    setStatus(prev => prev + '\n' + new Date().toLocaleTimeString() + ': ' + message);
  };

  const refreshStatus = async () => {
    const osStatus = getOneSignalStatus();
    setOneSignalStatus(osStatus);
    
    const perm = await getNotificationPermission();
    setPermission(perm);

    // OneSignal kullanıcı tags'lerini kontrol et
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(function(OneSignal: any) {
      try {
        // getTags() senkron bir fonksiyon, Promise değil
        const tags = OneSignal.User.getTags();
        setUserTags(tags || {});
      } catch (error) {
        console.log('Tags alınamadı:', error);
        setUserTags({});
      }
    });
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleInitialize = async () => {
    try {
      updateStatus('OneSignal initialization başlatılıyor...');
      const success = await initOneSignal();
      
      if (success) {
        updateStatus('✅ OneSignal başarıyla initialize edildi!');
        refreshStatus();
      } else {
        updateStatus('❌ OneSignal initialization başarısız!');
      }
    } catch (error) {
      updateStatus('❌ Hata: ' + (error as any)?.message);
    }
  };

  const handleSubscribe = async () => {
    try {
      updateStatus('OneSignal subscription başlatılıyor...');
      const success = await subscribeToNotifications({
        userId: 'test-user-' + Date.now(),
        phone: testForm.phone,
        name: 'Test Kullanıcı',
        email: 'test@example.com',
        properties: {
          role: 'test',
          testDate: new Date().toISOString()
        }
      });
      
      if (success) {
        updateStatus('✅ OneSignal subscription başarılı!');
        refreshStatus();
      } else {
        updateStatus('❌ OneSignal subscription başarısız!');
      }
    } catch (error) {
      updateStatus('❌ Hata: ' + (error as any)?.message);
    }
  };

  const handleSendToAll = async () => {
    try {
      updateStatus('Tüm kullanıcılara bildirim gönderiliyor...');
      const success = await sendOneSignalNotification({
        title: testForm.title,
        message: testForm.message,
        targetType: 'all',
        url: testForm.deepLink
      });
      
      if (success) {
        updateStatus('✅ Tüm kullanıcılara bildirim gönderildi!');
      } else {
        updateStatus('❌ Bildirim gönderilemedi!');
      }
    } catch (error) {
      updateStatus('❌ Hata: ' + (error as any)?.message);
    }
  };

  const handleSendToUser = async () => {
    try {
      updateStatus(`Test kullanıcısına bildirim gönderiliyor...`);
      const success = await sendOneSignalNotification({
        title: testForm.title,
        message: testForm.message,
        targetType: 'user',
        targetValue: 'test-user-123', // Test user ID
        url: testForm.deepLink
      });
      
      if (success) {
        updateStatus('✅ Kullanıcıya bildirim gönderildi!');
      } else {
        updateStatus('❌ Kullanıcıya bildirim gönderilemedi!');
      }
    } catch (error) {
      updateStatus('❌ Hata: ' + (error as any)?.message);
    }
  };

  const handleSendMembershipApproved = async () => {
    try {
      updateStatus('Üyelik onayı bildirimi gönderiliyor...');
      const template = OneSignalNotificationTemplates.userApproved('Test Kullanıcı', 'test-user-123');
      const success = await sendOneSignalNotification(template);
      
      if (success) {
        updateStatus('✅ Üyelik onayı bildirimi gönderildi!');
      } else {
        updateStatus('❌ Üyelik onayı bildirimi gönderilemedi!');
      }
    } catch (error) {
      updateStatus('❌ Hata: ' + (error as any)?.message);
    }
  };

  const handleSendOpportunity = async () => {
    try {
      updateStatus('Fırsat ilanı bildirimi gönderiliyor...');
      const template = OneSignalNotificationTemplates.opportunityListing(
        'Test Fırsat İlanı',
        250000,
        'Merkez',
        'test-123'
      );
      const success = await sendOneSignalNotification(template);
      
      if (success) {
        updateStatus('✅ Fırsat ilanı bildirimi gönderildi!');
      } else {
        updateStatus('❌ Fırsat ilanı bildirimi gönderilemedi!');
      }
    } catch (error) {
      updateStatus('❌ Hata: ' + (error as any)?.message);
    }
  };

  const handleSendFeatured = async () => {
    try {
      updateStatus('Öne çıkan ilan bildirimi gönderiliyor...');
      const template = OneSignalNotificationTemplates.featuredListing(
        'Test Öne Çıkan İlan',
        350000,
        'Yeni Mahalle',
        'test-456'
      );
      const success = await sendOneSignalNotification(template);
      
      if (success) {
        updateStatus('✅ Öne çıkan ilan bildirimi gönderildi!');
      } else {
        updateStatus('❌ Öne çıkan ilan bildirimi gönderilemedi!');
      }
    } catch (error) {
      updateStatus('❌ Hata: ' + (error as any)?.message);
    }
  };

  const handleBulkSubscribe = async () => {
    try {
      updateStatus('Toplu abonelik işlemi başlatılıyor...');
      const result = await bulkSubscribeUsersToOneSignal();
      
      if (result.success) {
        updateStatus(`✅ Toplu abonelik tamamlandı!`);
        if (result.results) {
          updateStatus(`📊 Toplam: ${result.results.total}, Başarılı: ${result.results.successful}, Başarısız: ${result.results.failed}`);
        }
      } else {
        updateStatus('❌ Toplu abonelik başarısız!');
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
      await addUserTag('test-user', 'active');
      updateStatus('✅ Tag eklendi: test-user = active');
    } catch (error) {
      updateStatus('❌ Tag ekleme hatası: ' + (error as any)?.message);
    }
  };

  const handleSyncUserInfo = async () => {
    try {
      updateStatus('Kullanıcı bilgileri OneSignal\'a hibrit senkronize ediliyor...');
      await syncUserToOneSignal();
      updateStatus('✅ Kullanıcı bilgileri OneSignal\'a hibrit login ile eklendi!');
      setTimeout(refreshStatus, 1000); // 1 saniye sonra durumu yenile
    } catch (error) {
      updateStatus('❌ Kullanıcı bilgileri eklenirken hata: ' + (error as any)?.message);
    }
  };

  const handleTestHibridLogin = async () => {
    try {
      updateStatus('OneSignal hibrit login test ediliyor...');
      
      if (!currentUser) {
        updateStatus('❌ Test için giriş yapmanız gerekiyor');
        return;
      }

      // Global hibrit login fonksiyonunu çağır
      if (window.handleOneSignalLogin) {
        await window.handleOneSignalLogin(currentUser.id, currentUser);
        updateStatus('✅ Hibrit login başarılı!');
        setTimeout(refreshStatus, 1000);
      } else {
        updateStatus('❌ handleOneSignalLogin fonksiyonu bulunamadı');
      }
    } catch (error) {
      updateStatus('❌ Hibrit login hatası: ' + (error as any)?.message);
    }
  };

  const handleTestHibridLogout = async () => {
    try {
      updateStatus('OneSignal hibrit logout test ediliyor...');
      
      // Global hibrit logout fonksiyonunu çağır
      if (window.handleOneSignalLogout) {
        await window.handleOneSignalLogout();
        updateStatus('✅ Hibrit logout başarılı!');
        setTimeout(refreshStatus, 1000);
      } else {
        updateStatus('❌ handleOneSignalLogout fonksiyonu bulunamadı');
      }
    } catch (error) {
      updateStatus('❌ Hibrit logout hatası: ' + (error as any)?.message);
    }
  };

  const handleCheckUserTags = async () => {
    try {
      updateStatus('OneSignal kullanıcı tags\'leri kontrol ediliyor...');
      
      window.OneSignalDeferred = window.OneSignalDeferred || []
      window.OneSignalDeferred.push(function(OneSignal: any) {
        try {
          // getTags() senkron bir fonksiyon
          const tags = OneSignal.User.getTags();
          updateStatus('📋 Mevcut tags: ' + JSON.stringify(tags, null, 2));
          setUserTags(tags || {});
        } catch (error: any) {
          updateStatus('❌ Tags alınamadı: ' + error.message);
        }
      });
    } catch (error) {
      updateStatus('❌ Tags kontrol hatası: ' + (error as any)?.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🔔 OneSignal Test Sayfası</h1>
          
          {/* OneSignal Status */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">📊 OneSignal Durumu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div>Ready: <code className="bg-white px-2 py-1 rounded">{oneSignalStatus.ready ? '✅ Evet' : '❌ Hayır'}</code></div>
                <div>Subscribed: <code className="bg-white px-2 py-1 rounded">{oneSignalStatus.subscribed ? '✅ Evet' : '❌ Hayır'}</code></div>
                <div>Permission: <code className="bg-white px-2 py-1 rounded">{permission}</code></div>
              </div>
              <div className="space-y-1">
                <div>User ID: <code className="bg-white px-2 py-1 rounded text-xs">{oneSignalStatus.userId || 'Henüz yok'}</code></div>
                <div>Push Token: <code className="bg-white px-2 py-1 rounded text-xs">{oneSignalStatus.pushToken ? 'Var' : 'Henüz yok'}</code></div>
              </div>
            </div>
          </div>

          {/* Current User Info */}
          {currentUser && (
            <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
              <h2 className="text-lg font-semibold text-green-900 mb-2">👤 Mevcut Kullanıcı</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div>Ad Soyad: <code className="bg-white px-2 py-1 rounded">{currentUser.full_name}</code></div>
                  <div>Telefon: <code className="bg-white px-2 py-1 rounded">{currentUser.phone}</code></div>
                  <div>Durum: <code className="bg-white px-2 py-1 rounded">{currentUser.status}</code></div>
                </div>
                <div className="space-y-1">
                  <div>Rol: <code className="bg-white px-2 py-1 rounded">{currentUser.role}</code></div>
                  <div>ID: <code className="bg-white px-2 py-1 rounded text-xs">{currentUser.id}</code></div>
                </div>
              </div>
            </div>
          )}

          {/* OneSignal User Tags */}
          <div className="mb-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h2 className="text-lg font-semibold text-purple-900 mb-2">🏷️ OneSignal Kullanıcı Tags</h2>
            {Object.keys(userTags).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {Object.entries(userTags).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="font-medium text-purple-700">{key}:</span>
                    <code className="bg-white px-2 py-1 rounded text-purple-900">{String(value)}</code>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-purple-700 text-sm">Henüz tag eklenmemiş veya OneSignal hazır değil.</p>
            )}
          </div>

          {/* Test Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Initialization & Subscription */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">🚀 Başlatma & Abonelik</h2>
              
              <button
                onClick={handleInitialize}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔧 OneSignal'ı Başlat
              </button>

              <button
                onClick={handleSubscribe}
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                📱 Bildirimlere Abone Ol
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Telefon</label>
                <input
                  type="text"
                  value={testForm.phone}
                  onChange={(e) => setTestForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="05551234567"
                />
              </div>

              <button
                onClick={handleSyncUserInfo}
                className="w-full px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                disabled={!currentUser}
              >
                👤 Hibrit Kullanıcı Senkronize Et
              </button>

              <button
                onClick={handleTestHibridLogin}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!currentUser}
              >
                🔐 Hibrit Login Test Et
              </button>

              <button
                onClick={handleTestHibridLogout}
                className="w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
              >
                🚪 Hibrit Logout Test Et
              </button>

              <button
                onClick={handleCheckUserTags}
                className="w-full px-4 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors"
              >
                🏷️ Kullanıcı Tags'lerini Kontrol Et
              </button>

              <button
                onClick={handleTrackEvent}
                className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                📊 Test Event Gönder
              </button>

              <button
                onClick={handleAddTag}
                className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                🏷️ Test Tag Ekle
              </button>

              {!currentUser && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Hibrit login/logout testleri için giriş yapın. Anonymous kullanıcılar otomatik abone olabilir.
                  </p>
                </div>
              )}
            </div>

            {/* Manual Notifications */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">📨 Manuel Bildirimler</h2>
              
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
                onClick={handleSendToAll}
                className="w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
              >
                📢 Herkese Gönder
              </button>

              <button
                onClick={handleSendToUser}
                className="w-full px-4 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                👤 Kullanıcıya Gönder
              </button>
            </div>

            {/* Template Notifications */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">🎯 Şablon Bildirimler</h2>
              
              <button
                onClick={handleSendMembershipApproved}
                className="w-full px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                🎉 Üyelik Onayı
              </button>

              <button
                onClick={handleSendOpportunity}
                className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                🔥 Fırsat İlanı
              </button>

              <button
                onClick={handleSendFeatured}
                className="w-full px-4 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
              >
                ⭐ Öne Çıkan İlan
              </button>

              <button
                onClick={handleBulkSubscribe}
                className="w-full px-4 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors"
              >
                👥 Toplu Abonelik
              </button>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">💡 Hibrit Yaklaşım İpuçları</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Anonymous kullanıcılar hemen abone olabilir</li>
                  <li>• Giriş yapanlar tüm cihazlarında bildirim alır</li>
                  <li>• Login/logout cihazları birleştirir/ayırır</li>
                  <li>• Performans sorunu çözüldü</li>
                </ul>
              </div>
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
              <div>OneSignal App ID: <code>{import.meta.env.VITE_ONESIGNAL_APP_ID}</code></div>
              <div>Safari Web ID: <code>{import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID}</code></div>
              <div>OneSignal Global: <code>{typeof window !== 'undefined' && window.OneSignal ? '✅ Yüklendi' : '❌ Yüklenmedi'}</code></div>
              <div>Service Worker: <code>/OneSignalSDKWorker.js</code></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OneSignalTestPage;