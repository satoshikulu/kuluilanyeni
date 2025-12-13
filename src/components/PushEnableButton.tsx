import { useState, useEffect } from 'react'
import { checkOneSignalPermission, setOneSignalUserData, linkUserToOneSignal } from '../lib/oneSignal'
import { getCurrentUser } from '../lib/simpleAuth'

interface Props {
  show: boolean;
  onComplete: () => void;
}

/**
 * Login sonrası gösterilen Push Enable Button
 * User click event içinde OneSignal slidedown açar
 */
export default function PushEnableButton({ show, onComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const currentUser = getCurrentUser()

  useEffect(() => {
    if (show) {
      checkPermissionStatus()
    }
  }, [show])

  const checkPermissionStatus = async () => {
    try {
      const permission = await checkOneSignalPermission()
      setHasPermission(permission)
      
      // Eğer zaten izin varsa butonu gizle
      if (permission) {
        console.log("✅ Kullanıcı zaten push izni vermiş, buton gizleniyor")
        onComplete()
      }
    } catch (error) {
      console.error('Permission check error:', error)
      setHasPermission(false)
    }
  }

  const handleEnablePush = async () => {
    if (!currentUser) {
      console.error('No user found for push enable')
      return
    }

    setLoading(true)
    console.log("🔔 User click - OneSignal slidedown açılıyor...")

    try {
      // OneSignal slidedown'ı user click event içinde aç
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      window.OneSignalDeferred.push(async function (OneSignal: any) {
        try {
          // Önce permission kontrol et
          const permission = await OneSignal.Notifications.permission;
          
          if (permission) {
            console.log("✅ Kullanıcı zaten push izni vermiş")
            onComplete()
            return
          }

          console.log("🔔 OneSignal slidedown prompt açılıyor (user click içinde)...")
          
          // User click içinde slidedown aç - %100 çalışır
          const result = await OneSignal.Slidedown.promptPush()
          
          if (result) {
            console.log("✅ Kullanıcı OneSignal slidedown'dan izin verdi!")
            
            // 🔗 External ID bağlama (Supabase user.id = OneSignal external_id)
            try {
              await linkUserToOneSignal({
                id: currentUser.id,
                email: (currentUser as any).email,
                phone: currentUser.phone
              })
              console.log("🔗 OneSignal external_id bağlandı")
            } catch (linkError) {
              console.warn("⚠️ OneSignal external_id bağlanamadı:", linkError)
            }
            
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
            
            onComplete()
          } else {
            console.log("❌ Kullanıcı OneSignal slidedown'ı reddetti")
            onComplete()
          }
        } catch (error) {
          console.error("❌ OneSignal slidedown error:", error)
          onComplete()
        }
      })
    } catch (error) {
      console.error("❌ Push enable button error:", error)
      onComplete()
    } finally {
      setLoading(false)
    }
  }

  // Buton gösterilmeyecekse render etme
  if (!show || hasPermission === true) {
    return null
  }

  return (
    <div className="fixed top-20 left-4 right-4 z-50 flex justify-center animate-slide-up">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl p-4 text-white max-w-md w-full">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
            <span className="text-3xl">🔔</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Bildirimleri Aç</h3>
            <p className="text-sm text-green-100 mb-3">
              Yeni ilanlar ve güncellemeler hakkında bildirim al!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEnablePush}
                disabled={loading}
                className="flex-1 bg-white text-green-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    Açılıyor...
                  </span>
                ) : (
                  '🔔 Bildirimleri Aç'
                )}
              </button>
              <button
                onClick={onComplete}
                disabled={loading}
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Daha Sonra
              </button>
            </div>
          </div>
          <button
            onClick={onComplete}
            disabled={loading}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}