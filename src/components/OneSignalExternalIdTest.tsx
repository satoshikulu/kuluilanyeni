import { useState } from 'react'
import { linkUserToOneSignal, unlinkOneSignalUser, checkOneSignalPermission } from '../lib/oneSignal'
import { getCurrentUser } from '../lib/simpleAuth'

/**
 * OneSignal External ID Test Component
 * Supabase user ↔ OneSignal external_id eşlemesini test etmek için
 */
export default function OneSignalExternalIdTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [externalId, setExternalId] = useState('')
  const currentUser = getCurrentUser()

  const testLinkExternalId = async () => {
    if (!currentUser) {
      setResult('❌ Önce giriş yapmanız gerekiyor')
      return
    }

    setLoading(true)
    setResult('🔄 OneSignal external_id bağlanıyor...')

    try {
      const success = await linkUserToOneSignal({
        id: currentUser.id,
        email: (currentUser as any).email,
        phone: currentUser.phone
      })

      if (success) {
        setResult('✅ OneSignal external_id başarıyla bağlandı!')
        setExternalId(currentUser.id)
      } else {
        setResult('❌ OneSignal external_id bağlanamadı')
      }
    } catch (error) {
      setResult('❌ Hata: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const testUnlinkExternalId = async () => {
    setLoading(true)
    setResult('🔄 OneSignal external_id bağlantısı koparılıyor...')

    try {
      const success = await unlinkOneSignalUser()

      if (success) {
        setResult('🚪 OneSignal external_id bağlantısı başarıyla koparıldı!')
        setExternalId('')
      } else {
        setResult('❌ OneSignal external_id bağlantısı koparılamadı')
      }
    } catch (error) {
      setResult('❌ Hata: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const checkExternalIdStatus = async () => {
    setLoading(true)
    setResult('🔄 OneSignal external_id durumu kontrol ediliyor...')

    try {
      // OneSignal'dan external_id bilgisini al
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      window.OneSignalDeferred.push(async function (OneSignal: any) {
        try {
          const userId = await OneSignal.User.onesignalId;
          const externalUserId = await OneSignal.User.externalUserId;
          
          setResult(`📊 OneSignal Durumu:
• OneSignal ID: ${userId || 'Yok'}
• External ID: ${externalUserId || 'Yok'}
• Permission: ${await OneSignal.Notifications.permission ? 'Granted' : 'Not Granted'}`);
          
          setExternalId(externalUserId || '');
        } catch (error) {
          setResult('❌ OneSignal durumu alınamadı: ' + (error as Error).message);
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      setResult('❌ Hata: ' + (error as Error).message)
      setLoading(false)
    }
  }

  const simulateLoginLogout = async () => {
    if (!currentUser) {
      setResult('❌ Önce giriş yapmanız gerekiyor')
      return
    }

    setLoading(true)
    setResult('🔄 Login → External ID bağla → Logout → External ID kopar simülasyonu...')

    try {
      // 1. Login simülasyonu - External ID bağla
      await linkUserToOneSignal({
        id: currentUser.id,
        email: (currentUser as any).email,
        phone: currentUser.phone
      })
      
      setResult('1️⃣ Login simülasyonu - External ID bağlandı: ' + currentUser.id)
      
      // 2 saniye bekle
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 2. Logout simülasyonu - External ID kopar
      await unlinkOneSignalUser()
      
      setResult('2️⃣ Logout simülasyonu - External ID bağlantısı koparıldı')
      
    } catch (error) {
      setResult('❌ Simülasyon hatası: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
        <h3 className="text-lg font-bold mb-2 text-yellow-800">⚠️ OneSignal External ID Test</h3>
        <p className="text-yellow-700">Bu testi kullanmak için önce giriş yapmanız gerekiyor.</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-indigo-50 rounded-2xl border-2 border-indigo-200">
      <h3 className="text-lg font-bold mb-4 text-indigo-900">🔗 OneSignal External ID Test</h3>
      
      {/* User Info */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <h4 className="font-semibold mb-2">👤 Mevcut Kullanıcı:</h4>
        <div className="text-sm space-y-1">
          <p><strong>Supabase ID:</strong> {currentUser.id}</p>
          <p><strong>Ad:</strong> {currentUser.full_name}</p>
          <p><strong>Telefon:</strong> {currentUser.phone}</p>
          <p><strong>Email:</strong> {(currentUser as any).email || 'Yok'}</p>
        </div>
      </div>

      {/* External ID Status */}
      {externalId && (
        <div className="bg-white p-4 rounded-lg mb-4">
          <h4 className="font-semibold mb-2">🔗 OneSignal External ID:</h4>
          <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">{externalId}</p>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={testLinkExternalId}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
        >
          🔗 External ID Bağla
        </button>
        
        <button
          onClick={testUnlinkExternalId}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          🚪 External ID Kopar
        </button>
        
        <button
          onClick={checkExternalIdStatus}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          📊 Durum Kontrol
        </button>
        
        <button
          onClick={simulateLoginLogout}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          🔄 Login/Logout Simülasyonu
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white p-4 rounded-lg mb-4">
          <h4 className="font-semibold mb-2">📊 Sonuç:</h4>
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      {/* Expected Results */}
      <div className="bg-white p-4 rounded-lg">
        <h4 className="font-semibold mb-2">🎯 OneSignal Dashboard'da Beklenen:</h4>
        <div className="text-xs space-y-1">
          <p><strong>Audience → Users → Kullanıcı seç</strong></p>
          <p><strong>External User ID:</strong> {currentUser.id}</p>
          <p><strong>Bu UUID Supabase auth.users.id ile aynı olmalı</strong></p>
          <p><strong>Böylece admin panelden tek kullanıcıya push gönderebilirsin</strong></p>
        </div>
      </div>
    </div>
  )
}