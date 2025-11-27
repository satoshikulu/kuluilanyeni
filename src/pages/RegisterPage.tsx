import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../lib/simpleAuth'
import { Eye, EyeOff } from 'lucide-react'
import { toTitleCase } from '../lib/textUtils'

function RegisterPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isAdminSession, setIsAdminSession] = useState(false)

  useEffect(() => {
    // Admin session kontrolü
    const adminFlag = sessionStorage.getItem('isAdmin') === 'true'
    if (adminFlag) {
      setIsAdminSession(true)
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    
    try {
      if (!fullName || !phone || !password) {
        setError('Tüm alanları doldurun.')
        return
      }

      if (password.length < 4) {
        setError('Şifre en az 4 karakter olmalıdır.')
        return
      }

      const result = await registerUser(fullName, phone, password)
      
      if (result.success) {
        setMessage(result.message || 'Kayıt başarılı! Admin onayından sonra giriş yapabilirsiniz.')
        setFullName('')
        setPhone('')
        setPassword('')
      } else {
        setError(result.error || 'Kayıt başarısız')
      }
    } catch (e: any) {
      setError(e?.message || 'Kayıt yapılamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleAdminLogout() {
    sessionStorage.removeItem('isAdmin')
    setIsAdminSession(false)
  }

  if (isAdminSession) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-8 border-2 border-yellow-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Oturumu Aktif</h2>
            <p className="text-gray-700">
              Şu anda admin olarak giriş yapmış durumdasınız. Yeni üye kaydı yapmak için önce admin oturumunuzu kapatmanız gerekiyor.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAdminLogout}
              className="w-full rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 font-semibold hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg transition-all"
            >
              🚪 Admin Oturumunu Kapat
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 font-semibold hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
            >
              👑 Admin Paneline Dön
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full rounded-lg bg-gray-100 text-gray-700 py-3 font-semibold hover:bg-gray-200 transition-all"
            >
              🏠 Ana Sayfaya Git
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Üye Ol</h1>
        <p className="text-gray-600 mb-6">Ad-soyad, telefon ve şifre ile hızlı kayıt.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad *</label>
            <input 
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Adınız Soyadınız" 
              value={fullName} 
              onChange={(e) => setFullName(toTitleCase(e.target.value))}
              required
            />
            <p className="mt-1 text-xs text-gray-500">Her kelimenin ilk harfi otomatik büyük yapılır</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefon Numarası *</label>
            <input 
              type="tel"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="5xx xxx xx xx" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <div className="text-xs text-gray-500 mt-1">Giriş yaparken bu telefon numarasını kullanacaksınız</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Şifre *</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="En az 4 karakter" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-xs text-orange-600 mt-1 font-medium">
              ⚠️ Şifrenizi unutmayın! Giriş yaparken kullanacaksınız.
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={submitting} 
            className="w-full rounded-lg bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Kaydediliyor...' : 'Kaydol'}
          </button>
          
          <div className="text-center text-sm text-gray-600 mt-4">
            Zaten üye misiniz?{' '}
            <a href="/giris" className="text-blue-600 hover:text-blue-700 font-medium">
              Giriş Yap
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage
