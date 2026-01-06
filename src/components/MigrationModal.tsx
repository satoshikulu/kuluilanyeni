import { useState } from 'react'
import { migrateToSupabaseAuth } from '../lib/migration'

interface MigrationModalProps {
  user: any
  onSuccess: () => void
  onSkip: () => void
}

function MigrationModal({ user, onSuccess, onSkip }: MigrationModalProps) {
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'intro' | 'migrating' | 'success' | 'error'>('intro')

  async function handleMigrate() {
    try {
      setMigrating(true)
      setStep('migrating')
      setError('')

      const result = await migrateToSupabaseAuth(user)
      
      if (result.success) {
        setStep('success')
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        setError(result.error || 'Migration başarısız')
        setStep('error')
      }
    } catch (error: any) {
      setError(error.message || 'Beklenmeyen hata')
      setStep('error')
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {step === 'intro' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔄</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Hesabını Yeni Sisteme Taşı
              </h2>
              <p className="text-gray-600 text-sm">
                Merhaba <strong>{user.full_name}</strong>! Hesabınızı daha güvenli yeni sistemimize taşıyalım.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-green-800 mb-2">✨ Yeni Sistemin Avantajları:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Daha güvenli şifreleme</li>
                <li>• Hızlı giriş/çıkış</li>
                <li>• Şifre sıfırlama özelliği</li>
                <li>• Gelişmiş güvenlik</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                Hesabımı Taşı (Önerilen)
              </button>
              <button
                onClick={onSkip}
                className="w-full rounded-lg bg-gray-100 text-gray-700 py-3 font-medium hover:bg-gray-200 transition-colors"
              >
                Şimdi Değil
              </button>
            </div>
          </>
        )}

        {step === 'migrating' && (
          <div className="text-center py-8">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hesabın Taşınıyor...</h3>
            <p className="text-gray-600 text-sm">Bu işlem birkaç saniye sürebilir</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Başarılı!</h3>
            <p className="text-gray-600 text-sm">Hesabınız yeni sisteme başarıyla taşındı</p>
          </div>
        )}

        {step === 'error' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">❌</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Hata Oluştu</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleMigrate}
                className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition-colors"
              >
                Tekrar Dene
              </button>
              <button
                onClick={onSkip}
                className="w-full rounded-lg bg-gray-100 text-gray-700 py-3 font-medium hover:bg-gray-200 transition-colors"
              >
                Şimdi Değil
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MigrationModal