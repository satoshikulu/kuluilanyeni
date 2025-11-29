import { Link } from 'react-router-dom'
import { UserPlus, Phone, X } from 'lucide-react'

interface MembershipRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  hasPendingMembership?: boolean
}

export default function MembershipRequiredModal({ 
  isOpen, 
  onClose,
  hasPendingMembership = false 
}: MembershipRequiredModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-6 py-8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
            <UserPlus className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            🎉 İlanınız Alındı!
          </h2>
          <p className="text-white/90 text-sm">
            Harika! İlanınız başarıyla kaydedildi
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-8">
          {hasPendingMembership ? (
            <>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 mb-2">
                      Üyelik Başvurunuz Beklemede
                    </h3>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Üyelik başvurunuz admin onayında. Onaylandıktan sonra ilanınız otomatik olarak yayınlanacak.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-600 text-sm mb-6">
                Admin sizi en kısa sürede arayacak 📞
              </p>
            </>
          ) : (
            <>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-3xl">⚠️</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-yellow-900 mb-2">
                      Yayınlanması İçin Üyelik Gerekiyor
                    </h3>
                    <p className="text-sm text-yellow-700 leading-relaxed">
                      İlanınız kaydedildi ancak yayınlanması için <strong>üye olmanız</strong> gerekiyor. 
                      Üyelik tamamen <strong>ücretsiz</strong> ve sadece <strong>30 saniye</strong> sürüyor!
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">✓</div>
                  <span>İlanlarınızı kolayca yönetin</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">✓</div>
                  <span>Daha hızlı onay süreci</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">✓</div>
                  <span>Birden fazla ilan verebilme</span>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {!hasPendingMembership && (
              <Link
                to="/uye-ol"
                className="block w-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-center px-6 py-4 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all shadow-lg"
              >
                🚀 Hemen Üye Ol (30 saniye)
              </Link>
            )}
            <button
              onClick={onClose}
              className="block w-full bg-gray-100 text-gray-700 text-center px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              {hasPendingMembership ? 'Tamam' : 'Daha Sonra'}
            </button>
          </div>

          {!hasPendingMembership && (
            <p className="text-center text-xs text-gray-500 mt-4">
              💡 Admin sizi arayıp üyelik konusunda yardımcı olacak
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
