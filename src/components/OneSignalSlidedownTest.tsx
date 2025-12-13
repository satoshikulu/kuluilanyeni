import { useState } from 'react'
import { checkOneSignalPermission, setOneSignalUserData } from '../lib/oneSignal'
import { getCurrentUser } from '../lib/simpleAuth'

/**
 * OneSignal Slidedown Test Component
 * Native OneSignal slidedown popup'ını test etmek için
 */
export default function OneSignalSlidedownTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const currentUser = getCurrentUser()

  const testSlidedownPrompt = async () => {
    if (!currentUser) {
      setResult('❌ Önce giriş yapmanız gerekiyor')
      return
    }

    setLoading(true)
    setResult('🔄 OneSignal slidedown popup gösteriliyor (user click içinde)...')

    try {
      // User click event içinde OneSignal slidedown aç
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      window.OneSignalDeferred.push(async function (OneSignal: any) {
        try {
          const permission = await OneSignal.Notifications.permission;
          
          if (permission) {
            setResult('✅ Kullanıcı zaten push izni vermiş')
            setLoading(false)
            checkPermissionStatus()
            return
          }

          console.log("🔔 OneSignal slidedown prompt açılıyor (user click içinde)...")
          
          const result = await OneSignal.Slidedown.promptPush()
          
          if (result) {
            setResult('✅ OneSignal slidedown başarılı! Push subscription aktif.')
            
            // User data ekle
            try {
              await setOneSignalUserData({
                phone: currentUser.phone,
                email: (currentUser as any).email
              })
              console.log("✅ OneSignal user data eklendi")
            } catch (userDataError) {
              console.warn("⚠️ OneSignal user data eklenemedi:", userDataError)
            }
          } else {
            setResult('❌ OneSignal slidedown reddedildi')
          }
        } catch (error) {
          setResult('❌ OneSignal slidedown hatası: ' + (error as Error).message)
        } finally {
          setLoading(false)
          checkPermissionStatus()
        }
      })
    } catch (error) {
      setResult('❌ Hata: ' + (error as Error).message)
      setLoading(false)
    }
  }

  const checkPermissionStatus = async () => {
    try {
      const permission = await checkOneSignalPermission()
      setHasPermission(permission)
    } catch (error) {
      console.error('Permission check error:', error)
      setHasPermission(null)
    }
  }

  const simulateLoginSuccess = async () => {
    setResult('✅ Login success simülasyonu - Artık PushEnableButton komponenti kullanılıyor!')
    setResult('ℹ️ Gerçek uygulamada login sonrası PushEnableButton gösterilir ve user click ile slidedown açılır.')
  }

  // Component mount olduğunda permission durumunu kontrol et
  useState(() => {
    checkPermissionStatus()
  })

  return (
    <div className="p-6 bg-green-50 rounded-2xl border-2 border-green-200">
      <h3 className="text-lg font-bold mb-4 text-green-900">🔔 OneSignal Slidedown Test</h3>
      
      {/* User Info */}
      {currentUser && (
        <div className="bg-white p-4 rounded-lg mb-4">
          <h4 className="font-semibold mb-2">👤 Mevcut Kullanıcı:</h4>
          <div className="text-sm space-y-1">
            <p><strong>ID:</strong> {currentUser.id}</p>
            <p><strong>Ad:</strong> {currentUser.full_name}</p>
            <p><strong>Telefon:</strong> {currentUser.phone}</p>
          </div>
        </div>
      )}

      {/* Permission Status */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <h4 className="font-semibold mb-2">📊 Push Permission Durumu:</h4>
        <div className="text-sm">
          {hasPermission === null ? (
            <p className="text-gray-500">🔄 Kontrol ediliyor...</p>
          ) : hasPermission ? (
            <p className="text-green-600">✅ Push izni verilmiş</p>
          ) : (
            <p className="text-red-600">❌ Push izni verilmemiş</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <button
          onClick={testSlidedownPrompt}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          🔔 Slidedown Test
        </button>
        
        <button
          onClick={simulateLoginSuccess}
          disabled={loading || !currentUser}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          🚪 Login Simülasyonu
        </button>
        
        <button
          onClick={checkPermissionStatus}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          🔍 Permission Kontrol
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white p-4 rounded-lg mb-4">
          <h4 className="font-semibold mb-2">📊 Sonuç:</h4>
          <p className="text-sm">{result}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white p-4 rounded-lg">
        <h4 className="font-semibold mb-2">📋 Nasıl Çalışır:</h4>
        <div className="text-xs space-y-1">
          <p>• <strong>Slidedown Test:</strong> OneSignal native popup'ını manuel gösterir</p>
          <p>• <strong>Login Simülasyonu:</strong> Login sonrası davranışı test eder</p>
          <p>• <strong>Permission Kontrol:</strong> Mevcut izin durumunu kontrol eder</p>
          <p>• <strong>Önemli:</strong> Zaten izin varsa popup gösterilmez</p>
        </div>
      </div>

      {!currentUser && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg mt-4">
          ⚠️ Bu testi tam olarak kullanmak için önce giriş yapmanız gerekiyor.
        </div>
      )}
    </div>
  )
}