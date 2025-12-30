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
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-w-sm relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
              {/* House icon using CSS */}
              <div className="relative">
                {/* House roof */}
                <div className="w-6 h-4 relative">
                  <div className="absolute inset-0 bg-white transform rotate-45 origin-bottom-left" 
                       style={{clipPath: 'polygon(0 100%, 100% 0, 100% 100%)'}}></div>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-sm"></div>
                </div>
                {/* House base */}
                <div className="w-5 h-3 bg-white rounded-sm mt-1 relative">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-orange-500 rounded-t-sm"></div>
                </div>
                {/* Key symbol */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-3 bg-white rounded-full"></div>
                  <div className="w-2 h-1 bg-white rounded-full -mt-1"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Kulu İlan</h3>
            {isIOS ? (
              <p className="text-xs text-gray-600 leading-relaxed mb-2">
                Safari'de <span className="font-medium">Paylaş</span> → <span className="font-medium">Ana Ekrana Ekle</span>
              </p>
            ) : (
              <p className="text-xs text-gray-600 leading-relaxed mb-2">
                Hızlı erişim için ana ekrana ekle
              </p>
            )}
            
            {/* Action button */}
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              {isIOS ? (
                <>
                  <span className="text-xs">📱</span>
                  Anladım
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  Yükle
                </>
              )}
            </button>
          </div>
        </div>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/20 to-transparent pointer-events-none rounded-2xl"></div>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;