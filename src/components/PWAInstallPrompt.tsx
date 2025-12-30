import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // iOS detection
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show prompt after 4 seconds delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    // For iOS, show manual install instructions after delay
    if (iOS && !isInWebAppiOS) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS, just close the prompt as instructions are shown
      setShowPrompt(false);
      sessionStorage.setItem('pwa-prompt-dismissed', 'true');
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      setDeferredPrompt(null);
      setShowPrompt(false);
      
      if (choiceResult.outcome === 'accepted') {
        sessionStorage.setItem('pwa-installed', 'true');
      } else {
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed, dismissed, or not ready
  if (isInstalled || !showPrompt) {
    return null;
  }

  // Don't show if dismissed this session
  if (sessionStorage.getItem('pwa-prompt-dismissed') || sessionStorage.getItem('pwa-installed')) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fadeIn" />
      
      {/* Centered Modal - Compact Size */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 max-w-sm w-full relative animate-slideUp">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header with Logo */}
          <div className="text-center mb-4">
            {/* App Icon */}
            <div className="w-16 h-16 mx-auto mb-3 relative">
              <img 
                src="/icon-192x192.png" 
                alt="Kulu İlan Logo" 
                className="w-full h-full rounded-2xl shadow-lg"
                onError={(e) => {
                  // Fallback to public folder if dist version not found
                  e.currentTarget.src = '/icon-192x192.png';
                }}
              />
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Kulu İlan</h2>
            <p className="text-xs text-gray-600">Ana Ekrana Ekle</p>
          </div>

          {/* Simple Instructions */}
          <div className="mb-4">
            {isIOS ? (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-sm font-medium text-blue-900 mb-2">📱 Safari'de:</p>
                <div className="text-xs text-blue-800 space-y-1">
                  <p>1. Paylaş ⬆️ butonuna tıklayın</p>
                  <p>2. "Ana Ekrana Ekle" seçin</p>
                  <p>3. "Ekle" butonuna tıklayın</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isIOS && (
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                Yükle
              </button>
            )}
            <button
              onClick={handleDismiss}
              className={`${isIOS ? 'flex-1' : ''} px-4 py-2.5 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors rounded-xl hover:bg-gray-50 border border-gray-200`}
            >
              {isIOS ? 'Anladım' : 'Şimdi Değil'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default PWAInstallPrompt;