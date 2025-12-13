import { useState } from 'react'
import { enablePushAfterLogin } from '../lib/oneSignal'
import { getCurrentUser } from '../lib/simpleAuth'

/**
 * OneSignal V16 Push Notification Button Component
 * TypeScript strict build uyumlu - hiçbir global window kullanımı yok
 */
export default function PushNotificationButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleEnablePush = async () => {
    const currentUser = getCurrentUser()
    
    if (!currentUser) {
      setMessage('❌ Lütfen önce giriş yapın!')
      return
    }

    setLoading(true)
    setMessage('🔔 Push notification etkinleştiriliyor...')

    try {
      const success = await enablePushAfterLogin({
        id: currentUser.id,
        phone: currentUser.phone
      })

      if (success) {
        setMessage('✅ Push notifications başarıyla etkinleştirildi!')
      } else {
        setMessage('❌ Push notification etkinleştirilemedi (izin reddedildi)')
      }
    } catch (error) {
      console.error('Push enable error:', error)
      setMessage('❌ Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border">
      <h3 className="text-xl font-bold mb-4 text-gray-900">OneSignal V16 Push Notifications</h3>
      
      <div className="space-y-4">
        <button 
          onClick={handleEnablePush}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {loading ? '🔄 Etkinleştiriliyor...' : '🔔 Push Notifications Etkinleştir'}
        </button>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : message.includes('❌')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-semibold mb-1">ℹ️ Nasıl Çalışır:</p>
          <ul className="space-y-1">
            <li>• Önce giriş yapmanız gerekir</li>
            <li>• OneSignal External ID otomatik bağlanır</li>
            <li>• Tarayıcı izin popup'ı çıkar</li>
            <li>• İzin verirseniz push notifications etkin olur</li>
          </ul>
        </div>
      </div>
    </div>
  )
}