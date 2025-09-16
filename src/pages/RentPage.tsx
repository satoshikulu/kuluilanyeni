import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NeighborhoodSelect from '../components/NeighborhoodSelect'

function RentPage() {
  const [formData, setFormData] = useState({
    title: '',
    owner_name: '',
    owner_phone: '',
    neighborhood: '',
    property_type: 'Daire',
    rooms: '',
    area_m2: '', // only digits as string
    price_tl: '', // only digits as string
    description: '',
    is_for: 'kiralik' as const
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [previews, setPreviews] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const whatsappPhone = (import.meta.env.VITE_WHATSAPP_PHONE as string) || '+905556874803'

  function formatTL(digits: string): string {
    if (!digits) return ''
    try {
      const n = Number(digits)
      if (!Number.isFinite(n)) return ''
      return new Intl.NumberFormat('tr-TR').format(n)
    } catch { return '' }
  }

  const waMessage = useMemo(() => {
    const parts = [
      'Merhaba, kiralık ilan vermek istiyorum.',
      formData.title ? `\nBaşlık: ${formData.title}` : '',
      formData.owner_name ? `\nAd Soyad: ${formData.owner_name}` : '',
      formData.owner_phone ? `\nTelefon: ${formData.owner_phone}` : '',
      formData.neighborhood ? `\nMahalle: ${formData.neighborhood}` : '',
      formData.property_type ? `\nTür: ${formData.property_type}` : '',
      formData.rooms ? `\nOda: ${formData.rooms}` : '',
      formData.area_m2 ? `\nBrüt m²: ${formatTL(formData.area_m2)}` : '',
      formData.price_tl ? `\nKira: ${formatTL(formData.price_tl)} TL` : '',
      formData.description ? `\nAçıklama: ${formData.description}` : '',
    ]
    return parts.filter(Boolean).join('')
  }, [formData])

  const waLink = useMemo(() => {
    const phoneDigits = whatsappPhone.replace(/\D/g, '')
    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(waMessage)}`
  }, [whatsappPhone, waMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('listings')
        .insert([{
          ...formData,
          price_tl: formData.price_tl ? parseInt(formData.price_tl) : null,
          area_m2: formData.area_m2 ? parseInt(formData.area_m2) : null,
          status: 'pending'
        }])

      if (error) throw error

      setMessage('Kiralama ilanınız başarıyla gönderildi! Admin onayından sonra yayınlanacak.')
      setFormData({
        title: '',
        owner_name: '',
        owner_phone: '',
        neighborhood: '',
        property_type: 'Daire',
        rooms: '',
        area_m2: '',
        price_tl: '',
        description: '',
        is_for: 'kiralik'
      })
      setSelectedFiles([])
      setPreviews([])
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'İlan gönderilemedi'
      setMessage('Hata: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4">
          <section className="relative overflow-hidden rounded-2xl shadow-lg bg-[url('https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative z-10 px-6 py-16 text-center text-white">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Kiralama İlanı Ver</h1>
              <p className="mt-2 text-white/90">Bilgileri doldurun veya WhatsApp ile hızlı destek alın.</p>
              <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3">
                <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-green-700">
                  WhatsApp ile iletişime geçelim
                </a>
                <div className="text-xs text-white/80">Formu doldurmakta zorlananlar için hızlı çözüm</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* İlan Başlığı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İlan Başlığı *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Örn: 3+1 Daire Kiralık"
              />
            </div>

            {/* Sahip Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  name="owner_name"
                  value={formData.owner_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Adınız ve soyadınız"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası *
                </label>
                <input
                  type="tel"
                  name="owner_phone"
                  value={formData.owner_phone}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0555 123 45 67"
                />
              </div>
            </div>

            {/* Mahalle ve Emlak Türü */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mahalle *
                </label>
                <NeighborhoodSelect 
                  value={formData.neighborhood} 
                  onChange={(value) => setFormData(prev => ({ ...prev, neighborhood: value }))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emlak Türü *
                </label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Daire">Daire</option>
                  <option value="Müstakil">Müstakil Ev</option>
                  <option value="Dükkan">Dükkan</option>
                  <option value="Ofis">Ofis</option>
                  <option value="Depo">Depo</option>
                </select>
              </div>
            </div>

            {/* Oda Sayısı ve Alan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oda Sayısı
                </label>
                <input
                  type="text"
                  name="rooms"
                  value={formData.rooms}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Örn: 3+1, 2+1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alan (m²)
                </label>
                <input
                  type="number"
                  name="area_m2"
                  value={formData.area_m2}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="125"
                />
              </div>
            </div>

            {/* Kira Fiyatı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aylık Kira Fiyatı (TL) *
              </label>
              <input
                type="number"
                name="price_tl"
                value={formData.price_tl}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="5000"
              />
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Emlak hakkında detaylı bilgi verin..."
              />
            </div>

            {/* Görsel Yükleme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Görseller (İsteğe Bağlı)
              </label>
              <div
                className="mb-3 rounded-xl border-2 border-dashed p-4 text-center text-sm text-gray-600 hover:bg-gray-50"
                onDragOver={(e) => { e.preventDefault() }}
                onDrop={(e) => {
                  e.preventDefault()
                  const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
                  if (dropped.length === 0) return
                  const all = [...selectedFiles, ...dropped].slice(0, 5)
                  setSelectedFiles(all)
                  setPreviews(all.map((f) => URL.createObjectURL(f)))
                }}
              >
                <div className="text-gray-700 font-medium">Dosyalarınızı buraya sürükleyip bırakın</div>
                <div className="text-xs text-gray-500">veya aşağıdan dosya seçin (en fazla 5 görsel, max 5MB)</div>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const fl = e.target.files
                  if (fl && fl.length > 0) {
                    const arr = Array.from(fl).slice(0, 5)
                    setSelectedFiles(arr)
                    setPreviews(arr.map((f) => URL.createObjectURL(f)))
                  } else {
                    setSelectedFiles([])
                    setPreviews([])
                  }
                }}
                className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-green-600 file:px-3 file:py-2 file:text-white hover:file:bg-green-700"
              />
              {previews.length > 0 && (
                <ul className="mt-3 grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <li key={i} className="relative">
                      <img src={src} className="h-24 w-full object-cover rounded border" alt={`preview-${i}`} />
                      <button
                        type="button"
                        onClick={() => {
                          const nextFiles = selectedFiles.filter((_, idx) => idx !== i)
                          setSelectedFiles(nextFiles)
                          setPreviews(nextFiles.map((f) => URL.createObjectURL(f)))
                        }}
                        className="absolute right-1 top-1 rounded-md bg-white/90 px-2 py-0.5 text-xs text-red-600 shadow hover:bg-white"
                      >
                        Kaldır
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Mesaj */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('başarıyla') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* Gönder Butonları */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <a href={waLink} target="_blank" rel="noreferrer" className="rounded-lg bg-green-700 text-white px-5 py-3 text-center font-medium hover:bg-green-800">WhatsApp ile hızlı iletişim</a>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Gönderiliyor...' : 'İlanı Gönder'}
              </button>
            </div>
          </form>
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="mb-2 text-sm font-medium text-gray-800">Özet</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><span className="text-gray-500">Başlık:</span> {formData.title || '-'}</li>
              <li><span className="text-gray-500">Mahalle:</span> {formData.neighborhood || '-'}</li>
              <li><span className="text-gray-500">Tür:</span> {formData.property_type}</li>
              <li><span className="text-gray-500">Oda:</span> {formData.rooms || '-'}</li>
              <li><span className="text-gray-500">m²:</span> {formData.area_m2 ? formatTL(formData.area_m2) : '-'}</li>
              <li><span className="text-gray-500">Kira:</span> {formData.price_tl ? `${formatTL(formData.price_tl)} TL` : '-'}</li>
            </ul>
            <div className="mt-3 flex flex-col gap-2">
              <a href={waLink} target="_blank" rel="noreferrer" className="rounded-lg bg-green-700 text-white px-5 py-2 text-center text-sm font-medium hover:bg-green-800">WhatsApp ile hızlı iletişim</a>
              <button onClick={(e) => { e.preventDefault(); void (document.querySelector('form') as HTMLFormElement)?.requestSubmit() }} className="rounded-lg bg-green-600 text-white px-5 py-2 text-sm font-semibold hover:bg-green-700">İlanı Gönder</button>
            </div>
          </div>

          <div className="rounded-2xl border bg-blue-50 p-5">
            <h3 className="font-medium text-blue-800 mb-2">📋 Önemli Bilgiler</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• İlanınız admin onayından sonra yayınlanacaktır</li>
              <li>• Doğru ve güncel bilgiler giriniz</li>
              <li>• İletişim bilgileriniz güvenle saklanır</li>
              <li>• İlanınızı düzenlemek için admin ile iletişime geçin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RentPage


