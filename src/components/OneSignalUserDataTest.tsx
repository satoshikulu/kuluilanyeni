import { useState } from 'react'
import { setOneSignalUserData, getOneSignalUserId } from '../lib/oneSignal'
import { getCurrentUser } from '../lib/simpleAuth'

/**
 * OneSignal User Data Test Component
 * Telefon ve email ekleme fonksiyonlarını test etmek için
 */
export default function OneSignalUserDataTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [oneSignalId, setOneSignalId] = useState('')
  const currentUser = getCurrentUser()

  const testAddUserData = async () => {
    if (!currentUser) {
      setResult('❌ Kullanıcı giriş yapmamış')
      return
    }

    setLoading(true)
    setResult('🔄 OneSignal kullanıcı bilgileri ekleniyor...')

    try {
      const success = await setOneSignalUserData({
        phone: currentUser.phone,
        email: (currentUser as any).email || 'test@example.com' // Test email
      })

      if (success) {
        setResult('✅ OneSignal kullanıcı bilgileri başarıyla eklendi!')
      } else {
        setResult('❌ OneSignal kullanıcı bilgileri eklenemedi')
      }
    } catch (error) {
      setResult('❌ Hata: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const getOneSignalUserIdTest = async () => {
    setLoading(true)
    try {
      const userId = await getOneSignalUserId()
      setOneSignalId(userId || 'Bulunamadı')
    } catch (error) {
      setOneSignalId('Hata: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const testPhoneFormats = () => {
    const testPhones = [
      '5551234567',      // 5xxxxxxxxx -> +905xxxxxxxxx
      '05551234567',     // 05xxxxxxxxx -> +905xxxxxxxxx  
      '905551234567',    // 905xxxxxxxxx -> +905xxxxxxxxx
      '+905551234567',   // Zaten doğru format
    ]

    console.log('📱 Telefon Format Testleri:')
    testPhones.forEach(phone => {
      let formatted = phone
      
      if (phone.startsWith('5') && phone.length === 10) {
        formatted = '+90' + phone
      } else if (phone.startsWith('05') && phone.length === 11) {
        formatted = '+9' + phone
      } else if (phone.startsWith('905') && phone.length === 12) {
        formatted = '+' + phone
      } else if (!phone.startsWith('+90')) {
        formatted = '+90' + phone.replace(/^0+/, '')
      }

      console.log(`${phone} -> ${formatted}`)
    })

    setResult('📱 Telefon format testleri console\'da görüntülendi')
  }

  if (!currentUser) {
    return (
      <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
        <h3 className="text-lg font-bold mb-2 text-yellow-800">⚠️ OneSignal User Data Test</h3>
        <p className="text-yellow-700">Bu testi kullanmak için önce giriş yapmanız gerekiyor.</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
      <h3 className="text-lg font-bold mb-4 text-blue-900">📱 OneSignal User Data Test</h3>
      
      {/* User Info */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <h4 className="font-semibold mb-2">👤 Mevcut Kullanıcı:</h4>
        <div className="text-sm space-y-1">
          <p><strong>ID:</strong> {currentUser.id}</p>
          <p><strong>Ad:</strong> {currentUser.full_name}</p>
          <p><strong>Telefon:</strong> {currentUser.phone}</p>
          <p><strong>Email:</strong> {(currentUser as any).email || 'Yok'}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <button
          onClick={testAddUserData}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          📱 User Data Ekle
        </button>
        
        <button
          onClick={getOneSignalUserIdTest}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          🆔 OneSignal ID Al
        </button>
        
        <button
          onClick={testPhoneFormats}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
        >
          📞 Format Test
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white p-4 rounded-lg mb-4">
          <h4 className="font-semibold mb-2">📊 Sonuç:</h4>
          <p className="text-sm">{result}</p>
        </div>
      )}

      {/* OneSignal ID */}
      {oneSignalId && (
        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-semibold mb-2">🆔 OneSignal User ID:</h4>
          <p className="text-xs font-mono bg-gray-100 p-2 rounded">{oneSignalId}</p>
        </div>
      )}

      {/* Expected Results */}
      <div className="bg-white p-4 rounded-lg mt-4">
        <h4 className="font-semibold mb-2">🎯 OneSignal Dashboard'da Beklenen:</h4>
        <div className="text-xs space-y-1">
          <p><strong>OneSignal ID:</strong> Otomatik</p>
          <p><strong>External ID:</strong> {currentUser.id}</p>
          <p><strong>Email:</strong> {(currentUser as any).email || 'test@example.com'}</p>
          <p><strong>Phone:</strong> +90{currentUser.phone.replace(/^0+/, '')}</p>
          <p><strong>Tags:</strong> user_id, phone</p>
          <p><strong>Push:</strong> Login sonrası</p>
        </div>
      </div>
    </div>
  )
}