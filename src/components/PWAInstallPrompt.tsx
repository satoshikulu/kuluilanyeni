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

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
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

  // iOS Tarzı Modal - Fullscreen Overlay
  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-sm p-6 rounded-3xl shadow-2xl animate-slide-up">
        {/* App Icon */}
        <div className="flex justify-center mb-4">
          <img 
            src="/icon-192x192.png" 
            alt="Kulu İlan" 
            className="w-16 h-16 rounded-2xl shadow-lg"
          />
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          {isIOS ? 'Ana Ekrana Ekle' : 'Uygulamayı Yükle'}
        </h2>
        
        {/* Description */}
        {isIOS ? (
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-3">
              Kulu İlan'ı ana ekranınıza ekleyin
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>1. Safari'de Paylaş butonuna (□↑) tıklayın</p>
              <p>2. "Ana Ekrana Ekle" seçeneğini seçin</p>
              <p>3. "Ekle" butonuna tıklayın</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-center mb-6">
            Kulu İlan'ı cihazınıza ekleyip daha hızlı erişin
          </p>
        )}
        
        {/* Buttons */}
        <div className="space-y-3">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 bg-blue-500 text-white font-medium rounded-2xl hover:bg-blue-600 transition-colors"
            >
              Yükle
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-2xl hover:bg-gray-200 transition-colors"
          >
            {isIOS ? 'Anladım' : 'Kapat'}
          </button>
        </div>
      </div>
    </div>
  )
}
