import { useState } from 'react'
import { enablePushAfterLogin } from '../lib/oneSignal'
import { denyPushForFiveDays, markPushPermissionGranted, denyPushPermanently } from '../lib/pushPermission'
import { getCurrentUser } from '../lib/simpleAuth'

interface Props {
  onClose: () => void;
}

export default function PushPermissionModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAllowPush = async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      setError('Kullanıcı bilgisi bulunamadı')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log("🔔 Modal'dan push permission isteniyor...");
      
      // OneSignal V16 API ile push permission iste
      const success = await enablePushAfterLogin({
        id: currentUser.id,
        phone: currentUser.phone
      })

      if (success) {
        // Başarılı - izin verildi olarak işaretle
        markPushPermissionGranted()
        console.log("✅ Push permission başarıyla verildi!");
        onClose()
      } else {
        // Kullanıcı izni reddetti
        console.log("❌ Kullanıcı push permission'ı reddetti");
        setError('Bildirim izni reddedildi. Tarayıcı ayarlarından manuel olarak açabilirsiniz.')
        
        // 5 gün boyunca tekrar sorma
        denyPushForFiveDays()
        
        // 3 saniye sonra modal'ı kapat
        setTimeout(() => {
          onClose()
        }, 3000)
      }
    } catch (err) {
      console.error("❌ Push permission error:", err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const handleDenyPush = () => {
    console.log("🔔 Kullanıcı push permission'ı 5 gün erteledi");
    denyPushForFiveDays()
    onClose()
  }

  const handleNeverAsk = () => {
    console.log("🔔 Kullanıcı push permission'ı kalıcı olarak reddetti");
    denyPushPermanently()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔔</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bildirimleri Açmak İster misin?
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Yeni ilanlar, ilan onayları ve önemli güncellemelerden anında haberdar ol. 
            İstediğin zaman kapatabilirsin.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Benefits */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">📱 Neler hakkında bildirim alırsın:</h3>
          <ul className="text-blue-800 text-xs space-y-1">
            <li>• İlanın onaylandığında</li>
            <li>• Yeni mesajlar geldiğinde</li>
            <li>• Özel fırsatlar ve kampanyalar</li>
            <li>• Hesap güvenliği bildirimleri</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAllowPush}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Etkinleştiriliyor...
              </span>
            ) : (
              '✅ Bildirimleri Aç'
            )}
          </button>

          <button
            onClick={handleDenyPush}
            disabled={loading}
            className="w-full rounded-xl border-2 border-gray-200 text-gray-700 py-3 px-4 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 disabled:opacity-50"
          >
            ⏰ 5 Gün Sonra Hatırlat
          </button>

          <button
            onClick={handleNeverAsk}
            disabled={loading}
            className="w-full text-gray-500 py-2 px-4 text-sm hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Bir daha sorma
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Bildirimleri istediğin zaman tarayıcı ayarlarından kapatabilirsin
          </p>
        </div>
      </div>
    </div>
  )
}

// CSS Animation için Tailwind config'e eklenecek
// animate-scale-up: transform scale(0.95) -> scale(1) with opacity