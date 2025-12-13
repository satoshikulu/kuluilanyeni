import { useState } from 'react'
import { showPushSubscriptionPrompt, checkOneSignalPermission } from '../lib/oneSignal'
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
    setLoading(true)
    setResult('🔄 OneSignal slidedown popup gösteriliyor...')

    try {
      const success = await showPushSubscriptionPrompt()
      
      if (success) {
        setResult('✅ OneSignal slidedown başarılı! Push subscription aktif.')
      } else {
        setResult('❌ OneSignal slidedown reddedildi veya hata oluştu.')
      }
    } catch (error) {
      setResult('❌ Hata: ' + (error as Error).message)
    } finally {
      setLoading(false)
      // Permission durumunu yenile
      checkPermissionStatus()
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
    if (!currentUser) {
      setResult('❌ Önce giriş yapmanız gerekiyor')
      return
    }

    setLoading(true)
    setResult('🔄 Login success simülasyonu - slidedown tetikleniyor...')

    try {
      // Login sonrası davranışı simüle et
      setTimeout(async () => {
        const pushResult = await showPushSubscriptionPrompt()
        if (pushResult) {
          setResult('✅ Login sonrası OneSignal slidedown başarılı!')
        } else {
          setResult('⚠️ Login sonrası OneSignal slidedown reddedildi veya zaten var')
        }
        setLoading(false)
        checkPermissionStatus()
      }, 1000)
    } catch (error) {
      setResult('❌ Simülasyon hatası: ' + (error as Error).message)
      setLoading(false)
    }
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