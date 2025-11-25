import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { loginUser } from '../lib/simpleAuth'
import { Eye, EyeOff } from 'lucide-react'

function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    
    try {
      if (!phone || !password) {
        setError('Telefon ve şifre gereklidir.')
        return
      }

      const result = await loginUser(phone, password)
      
      if (result.success && result.user) {
        // Başarılı giriş - ana sayfaya yönlendir
        navigate('/')
        window.location.reload() // Header'ı güncellemek için
      } else {
        setError(result.error || 'Giriş başarısız')
      }
    } catch (e: any) {
      setError(e?.message || 'Giriş başarısız')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Giriş Yap</h1>
        <p className="text-gray-600 mb-6">Telefon ve şifre ile hızlı giriş.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
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
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Şifre *</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Şifrenizi girin" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
          
          <div className="text-center text-sm text-gray-600 mt-4">
            Hesabın yok mu?{' '}
            <Link to="/uye-ol" className="text-blue-600 hover:text-blue-700 font-medium">
              Üye Ol
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage


