import { useState, useEffect } from 'react';
import { Download, Smartphone, Share } from 'lucide-react';

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
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isStandalone || isInWebAppiOS || isInWebAppChrome) {
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
      console.log('PWA was installed');
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
      // iOS manual install instructions - don't close modal
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || !showPrompt) {
    return null;
  }

  // Don't show if dismissed this session
  if (sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fadeIn" />
      
      {/* iPhone Style Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-96">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Kulu İlan</h2>
            <p className="text-blue-100 text-sm">Ana Ekrana Ekle</p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {isIOS ? (
              // iOS Instructions
              <div className="text-center">
                <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                  Kulu İlan'ı ana ekranınıza ekleyerek daha hızlı erişim sağlayın:
                </p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Share className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">1. Paylaş butonuna tıklayın</p>
                      <p className="text-xs text-gray-600">Safari'nin alt kısmındaki paylaş ikonu</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-xs font-bold">+</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">2. "Ana Ekrana Ekle" seçin</p>
                      <p className="text-xs text-gray-600">Listeden bu seçeneği bulun</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-xs font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">3. "Ekle" butonuna tıklayın</p>
                      <p className="text-xs text-gray-600">Sağ üst köşedeki ekle butonu</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Android/Desktop
              <div className="text-center">
                <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                  Kulu İlan'ı cihazınıza yükleyerek:
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-2 flex items-center justify-center">
                      <span className="text-blue-600 text-xl">⚡</span>
                    </div>
                    <p className="text-xs text-gray-600">Hızlı Erişim</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl mx-auto mb-2 flex items-center justify-center">
                      <span className="text-green-600 text-xl">🔔</span>
                    </div>
                    <p className="text-xs text-gray-600">Push Bildirimler</p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              {!isIOS && (
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  Yükle
                </button>
              )}
              <button
                onClick={handleDismiss}
                className={`${isIOS ? 'flex-1' : ''} px-6 py-4 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors rounded-2xl hover:bg-gray-50`}
              >
                {isIOS ? 'Anladım' : 'Şimdi Değil'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PWAInstallPrompt;