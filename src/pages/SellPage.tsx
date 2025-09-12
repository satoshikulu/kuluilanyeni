import { useState } from 'react'
import NeighborhoodSelect from '../components/NeighborhoodSelect'
import { supabase } from '../lib/supabaseClient'

function SellPage() {
  const [title, setTitle] = useState<string>('')
  const [ownerName, setOwnerName] = useState<string>('')
  const [ownerPhone, setOwnerPhone] = useState<string>('')
  const [neighborhood, setNeighborhood] = useState<string>('')
  const [propertyType, setPropertyType] = useState<string>('Daire')
  const [rooms, setRooms] = useState<string>('3+1')
  const [area, setArea] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [isFor, setIsFor] = useState<'satilik' | 'kiralik'>('satilik')
  const [description, setDescription] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [files, setFiles] = useState<FileList | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      if (!title || !ownerName || !ownerPhone) {
        setError('Başlık, ad-soyad ve telefon zorunludur.')
        return
      }
      // 1) Görselleri (varsa) Supabase Storage'a yükle ve public URL'lerini topla
      let imageUrls: string[] = []
      if (files && files.length > 0) {
        const bucket = 'listing-images'
        const uploads = Array.from(files).slice(0, 5).map(async (file, idx) => {
          const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
          const safeTitle = title.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40)
          const path = `${safeTitle}_${Date.now()}_${idx}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type || undefined,
            })
          if (uploadError) throw uploadError
          const { data } = supabase.storage.from(bucket).getPublicUrl(path)
          if (data?.publicUrl) imageUrls.push(data.publicUrl)
        })
        await Promise.all(uploads)
      }

      // 2) İlan kaydını oluştur (images alanına public URL listesini ekle)
      const { error: insertError } = await supabase.from('listings').insert({
        title,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        neighborhood: neighborhood || null,
        property_type: propertyType,
        rooms,
        area_m2: area ? Number(area) : null,
        price_tl: price ? Number(price) : null,
        is_for: isFor,
        description: description || null,
        images: imageUrls.length ? imageUrls : null,
        status: 'pending',
      })
      if (insertError) throw insertError
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
          <input className="w-full rounded-lg border px-3 py-2" placeholder="5xx xxx xx xx" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
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
          <input className="w-full rounded-lg border px-3 py-2" placeholder="125" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Fiyat (TL)</label>
          <input className="w-full rounded-lg border px-3 py-2" placeholder="2750000" value={price} onChange={(e) => setPrice(e.target.value)} />
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
            onChange={(e) => setFiles(e.target.files)}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white hover:file:bg-orange-500"
          />
          <p className="text-xs text-gray-500 mt-1">En fazla 5 görsel yükleyin. Yüklenen görseller Supabase Storage'a kaydedilir.</p>
        </div>

        {error && <div className="sm:col-span-2 text-red-600 text-sm">{error}</div>}
        {message && <div className="sm:col-span-2 text-green-600 text-sm">{message}</div>}
        <button type="submit" disabled={submitting} className="sm:col-span-2 rounded-xl bg-blue-600 text-white py-3 font-semibold hover:bg-orange-500 transition-colors disabled:opacity-60">
          {submitting ? 'Gönderiliyor...' : 'İlanı Gönder (Admin Onayına Gider)'}
        </button>
      </form>
    </div>
  )
}

export default SellPage


