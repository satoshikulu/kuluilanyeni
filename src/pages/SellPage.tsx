import { useMemo, useState } from 'react'
import NeighborhoodSelect from '../components/NeighborhoodSelect'
import { supabase } from '../lib/supabaseClient'
import { uploadListingImage } from '../lib/storage'

function SellPage() {
  const [title, setTitle] = useState<string>('')
  const [ownerName, setOwnerName] = useState<string>('')
  const [ownerPhone, setOwnerPhone] = useState<string>('')
  const [neighborhood, setNeighborhood] = useState<string>('')
  const [propertyType, setPropertyType] = useState<string>('Daire')
  const [rooms, setRooms] = useState<string>('3+1')
  const [area, setArea] = useState<string>('')
  const [price, setPrice] = useState<string>('') // yalnizca rakamlar (örn: "2000000")
  const [isFor, setIsFor] = useState<'satilik' | 'kiralik'>('satilik')
  const [description, setDescription] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [previews, setPreviews] = useState<string[]>([])

  const canSubmit = useMemo(() => {
    const phoneOk = /^\+?\d{10,15}$/.test(ownerPhone.replace(/\D/g, ''))
    const priceOk = !price || /^\d{1,12}$/.test(price) // yalnizca rakam kontrolu
    const areaOk = !area || /^\d{1,5}$/.test(area)
    return Boolean(title.trim() && ownerName.trim() && phoneOk && priceOk && areaOk)
  }, [title, ownerName, ownerPhone, price, area])

  function formatTL(digits: string): string {
    if (!digits) return ''
    try {
      const n = Number(digits)
      if (!Number.isFinite(n)) return ''
      return new Intl.NumberFormat('tr-TR').format(n)
    } catch {
      return ''
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const phoneDigits = ownerPhone.replace(/\D/g, '')
      if (!title || !ownerName || !phoneDigits) {
        setError('Başlık, ad-soyad ve telefon zorunludur.')
        return
      }
      if (phoneDigits.length < 10) {
        setError('Telefon numarası eksik görünüyor.')
        return
      }
      // 1) İlanı önce oluştur ve id al
      const { data: inserted, error: insertError } = await supabase
        .from('listings')
        .insert({
          title,
          owner_name: ownerName,
          owner_phone: ownerPhone,
          neighborhood: neighborhood || null,
          property_type: propertyType,
          rooms,
          area_m2: area ? Number(area) : null,
          price_tl: price ? Number(price) : null, // price yalnizca rakamlar oldugu icin dogrudan Number()
          is_for: isFor,
          description: description || null,
          status: 'pending',
        })
        .select('id')
        .single()
      if (insertError) throw insertError

      const listingId = inserted?.id as string

      // 2) Görseller varsa, helper ile yükle ve URL topla
      let imageUrls: string[] = []
      if (listingId && files && files.length > 0) {
        const uploads = Array.from(files)
          .slice(0, 5)
          .map(async (file) => {
            if (!file.type.startsWith('image/')) return
            if (file.size > 5 * 1024 * 1024) { // 5MB
              throw new Error('Görsel boyutu 5MB sınırını aşıyor')
            }
            const res = await uploadListingImage(file, listingId)
            if (res.publicUrl) imageUrls.push(res.publicUrl)
          })
        await Promise.all(uploads)

        // 3) İlanın images kolonunu güncelle
        if (imageUrls.length > 0) {
          const { error: updateError } = await supabase
            .from('listings')
            .update({ images: imageUrls })
            .eq('id', listingId)
          if (updateError) throw updateError
        }
      }

      setMessage('İlanınız alındı. Admin onayından sonra yayına alınacaktır.')
      // formu temizle
      setTitle('')
      setOwnerName('')
      setOwnerPhone('')
      setNeighborhood('')
      setPropertyType('Daire')
      setRooms('3+1')
      setArea('')
      setPrice('')
      setIsFor('satilik')
      setDescription('')
      setFiles(null)
      setPreviews([])
    } catch (e: any) {
      setError(e.message || 'Bir hata oluştu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Satmak istiyorum</h1>
      <p className="text-gray-600 mb-6">İlanınız admin onayından sonra yayına alınır.</p>

      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>
        <div className="sm:col-span-2">
          <label className="block text-sm mb-1">Başlık</label>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Örn: Merkezi 3+1 Daire" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Ad Soyad</label>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Adınız Soyadınız" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Telefon</label>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="5xx xxx xx xx" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} inputMode="tel" />
        </div>

        <div>
          <label className="block text-sm mb-1">Mahalle</label>
          <NeighborhoodSelect value={neighborhood} onChange={setNeighborhood} />
        </div>
        <div>
          <label className="block text-sm mb-1">Emlak Türü</label>
          <select className="w-full rounded-lg border px-3 py-2" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
            <option value="Daire">Daire</option>
            <option value="Müstakil">Müstakil</option>
            <option value="Arsa">Arsa</option>
            <option value="Dükkan">Dükkan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Oda Sayısı</label>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="3+1" value={rooms} onChange={(e) => setRooms(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Brüt m²</label>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="125" value={area} onChange={(e) => setArea(e.target.value)} inputMode="numeric" />
        </div>

        <div>
          <label className="block text-sm mb-1">Fiyat (TL)</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="2.000.000"
            value={formatTL(price)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              setPrice(digits)
            }}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Durum</label>
          <select className="w-full rounded-lg border px-3 py-2" value={isFor} onChange={(e) => setIsFor(e.target.value as 'satilik' | 'kiralik')}>
            <option value="satilik">Satılık</option>
            <option value="kiralik">Kiralık</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm mb-1">Açıklama</label>
          <textarea className="w-full rounded-lg border px-3 py-2" rows={4} placeholder="Detaylı açıklama" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm mb-1">Görsel(ler)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              const fl = e.target.files
              setFiles(fl)
              if (fl && fl.length > 0) {
                const urls = Array.from(fl).slice(0, 5).map((f) => URL.createObjectURL(f))
                setPreviews(urls)
              } else {
                setPreviews([])
              }
            }}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white hover:file:bg-orange-500"
          />
          <p className="text-xs text-gray-500 mt-1">En fazla 5 görsel yükleyin. Yüklenen görseller Supabase Storage'a kaydedilir.</p>
          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <img key={i} src={src} className="h-24 w-full object-cover rounded border" alt={`preview-${i}`} />
              ))}
            </div>
          )}
        </div>

        {error && <div className="sm:col-span-2 text-red-600 text-sm">{error}</div>}
        {message && <div className="sm:col-span-2 text-green-600 text-sm">{message}</div>}
        <button type="submit" disabled={submitting || !canSubmit} className="sm:col-span-2 rounded-xl bg-blue-600 text-white py-3 font-semibold hover:bg-orange-500 transition-colors disabled:opacity-60">
          {submitting ? 'Gönderiliyor...' : 'İlanı Gönder (Admin Onayına Gider)'}
        </button>
      </form>
    </div>
  )
}

export default SellPage


