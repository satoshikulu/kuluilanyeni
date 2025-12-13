import { useEffect } from 'react'

export default function PushNotificationPrompt() {
  useEffect(() => {
    // OneSignal artık sadece login sonrası çalışıyor
    // Bu component artık otomatik popup göstermeyecek
    console.log('🔔 PushNotificationPrompt: Otomatik popup devre dışı - sadece login sonrası push etkin')
  }, [])

  // Artık hiçbir prompt göstermiyoruz - sadece login sonrası OneSignal çalışıyor
  return null
}