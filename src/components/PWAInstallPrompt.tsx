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

  // iOS için özel mesaj
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-3xl">📱</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Ana Ekrana Ekle</h3>
              <p className="text-sm text-blue-100 mb-2">
                Kulu İlan'ı ana ekranınıza ekleyin:
              </p>
              <ol className="text-sm text-blue-100 mb-3 space-y-1">
                <li>1. Safari'de Paylaş butonuna (□↑) tıklayın</li>
                <li>2. "Ana Ekrana Ekle" seçeneğini seçin</li>
                <li>3. "Ekle" butonuna tıklayın</li>
              </ol>
              <button
                onClick={handleDismiss}
                className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
              >
                Anladım
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Android/Chrome için normal prompt
  if (!deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
            <span className="text-3xl">📱</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Uygulamayı Yükle</h3>
            <p className="text-sm text-blue-100 mb-3">
              Kulu İlan'ı telefonunuza yükleyin ve offline erişim sağlayın!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
              >
                Yükle
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-white/10 hover:bg-white/20 transition-colors"
              >
                Daha Sonra
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
