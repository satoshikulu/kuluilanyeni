import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // iOS detection
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Android/Chrome install prompt - sadece event yakala, otomatik prompt gösterme
    const handler = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setShowInstallPrompt(true) // Modal'ı göster ama otomatik prompt yapma
    }

    window.addEventListener('beforeinstallprompt', handler)

    // iOS için otomatik göster (eğer daha önce dismiss edilmemişse)
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
        setTimeout(() => setShowInstallPrompt(true), 3000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('✅ PWA installed')
    } else {
      console.log('❌ PWA installation dismissed')
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Check if user dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < sevenDays) {
        setShowInstallPrompt(false)
      }
    }
  }, [])

  // Don't show if already installed
  if (isStandalone) return null

  // Don't show if not ready
  if (!showInstallPrompt) return null

  // Kompakt PWA Modal - Küçük ve Minimal
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl w-full max-w-xs p-4 rounded-2xl shadow-xl animate-slide-up">
        {/* Kompakt Header */}
        <div className="flex items-center gap-3 mb-3">
          <img 
            src="/icon-192x192.png" 
            alt="Kulu İlan" 
            className="w-10 h-10 rounded-xl shadow-md"
          />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {isIOS ? 'Ana Ekrana Ekle' : 'Uygulamayı Yükle'}
            </h2>
          </div>
        </div>
        
        {/* Kısa Açıklama */}
        {isIOS ? (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Kulu İlan'ı ana ekranınıza ekleyin
            </p>
            <div className="text-xs text-gray-500 space-y-0.5">
              <p>Safari → Paylaş (□↑) → Ana Ekrana Ekle</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 mb-4">
            Kulu İlan'ı cihazınıza ekleyip daha hızlı erişin
          </p>
        )}
        
        {/* Kompakt Butonlar */}
        <div className="flex gap-2">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-3 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors"
            >
              Yükle
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            className={`${!isIOS && deferredPrompt ? 'flex-1' : 'w-full'} py-2.5 px-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors`}
          >
            {isIOS ? 'Anladım' : 'Kapat'}
          </button>
        </div>
      </div>
    </div>
  )
}
