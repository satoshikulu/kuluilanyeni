import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      if (!fullName || !phone) {
        setError('Ad Soyad ve Telefon zorunludur.')
        return
      }
      const { error } = await supabase.from('users_min').insert({
        full_name: fullName,
        phone,
        status: 'pending',
      })
      if (error) throw error
      setMessage('Başvurunuz alındı. Admin onayından sonra giriş yapabilirsiniz.')
      setFullName('')
      setPhone('')
    } catch (e: any) {
      setError(e.message || 'Kayıt yapılamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Üye Ol</h1>
      <p className="text-gray-600 mb-6">Sadece ad-soyad ve telefon ile hızlı kayıt.</p>

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
        <button disabled={submitting} className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 disabled:opacity-60">Kaydol</button>
      </form>
    </div>
  )
}

export default RegisterPage


