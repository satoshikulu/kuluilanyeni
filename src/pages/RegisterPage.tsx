import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function normalizeName(name: string) {
    return name.replace(/\s+/g, ' ').trim()
  }

  function normalizePhone(raw: string) {
    // Sadece rakamları tut (ör: "555 687 48 03" -> "5556874803")
    const digits = (raw || '').replace(/\D/g, '')
    return digits
  }

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
      const nameN = normalizeName(fullName)
      const phoneN = normalizePhone(phone)

      if (phoneN.length < 10) {
        setError('Telefon numarasını eksiksiz girin (en az 10 hane).')
        return
      }

      // Var mı kontrol et (telefon uniq kabulümüz)
      const { data: exists, error: selErr } = await supabase
        .from('users_min')
        .select('id, full_name, phone, status')
        .eq('phone', phoneN)
        .maybeSingle()
      if (selErr) throw selErr
      if (exists) {
        setError('Bu telefon numarası ile bir başvuru zaten mevcut. Lütfen giriş yapmayı deneyin veya admin onayını bekleyin.')
        return
      }

      const { error: insErr } = await supabase.from('users_min').insert({
        full_name: nameN,
        phone: phoneN,
        status: 'pending',
      })
      if (insErr) throw insErr
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
          <div className="text-xs text-gray-500 mt-1">Telefon yalnızca rakam olarak kaydedilir (örn: 5556874803)</div>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {message && <div className="text-sm text-green-600">{message}</div>}
        <button disabled={submitting} className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 disabled:opacity-60">Kaydol</button>
      </form>
    </div>
  )
}

export default RegisterPage
