import { useState } from 'react'
import { registerUser } from '../lib/simpleAuth'
import { Eye, EyeOff } from 'lucide-react'

function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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
              onChange={(e) => setFullName(e.target.value)}
              required
            />
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
