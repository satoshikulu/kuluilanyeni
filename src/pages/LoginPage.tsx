import { Link } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function LoginPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      const { data, error } = await supabase
        .from('users_min')
        .select('*')
        .eq('phone', phone)
        .eq('full_name', fullName)
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (!data) {
        setError('Kullanıcı bulunamadı. Lütfen kayıt olun.')
        return
      }
      if (data.status !== 'approved') {
        setError('Hesabınız onay bekliyor. Admin onayından sonra giriş yapabilirsiniz.')
        return
      }
      setMessage('Giriş başarılı! (Not: Basit akış, token yok)')
    } catch (e: any) {
      setError(e.message || 'Giriş başarısız')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Giriş Yap</h1>
      <p className="text-gray-600 mb-6">Telefon ve ad-soyad ile hızlı giriş.</p>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm mb-1">Ad Soyad</label>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Adınız Soyadınız" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Telefon Numarası</label>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="5xx xxx xx xx" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {message && <div className="text-sm text-green-600">{message}</div>}
        <button className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700">Giriş Yap</button>
      </form>

      <div className="text-sm text-gray-600 mt-4">
        Hesabın yok mu? <Link to="/uye-ol" className="text-blue-600">Üye Ol</Link>
      </div>
    </div>
  )
}

export default LoginPage


