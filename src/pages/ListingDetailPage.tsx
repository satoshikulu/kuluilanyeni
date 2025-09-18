import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import FavoriteButton from '../components/FavoriteButton'
import { getListingImageUrl } from '../lib/storage'

type Listing = {
  id: string
  title: string
  neighborhood: string | null
  price_tl: number | null
  images?: any
  property_type?: string | null
  is_for?: 'satilik' | 'kiralik'
  rooms?: string | null
  area_m2?: number | null
  description?: string | null
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop',
]

function parseImages(images: any): string[] {
  let arr: string[] = []
  if (Array.isArray(images)) arr = images as string[]
  else if (typeof images === 'string') {
    try { const parsed = JSON.parse(images); if (Array.isArray(parsed)) arr = parsed }
    catch { arr = [] }
  }
  // Storage path gelirse public URL'e çevir
  return arr.map((s) => (typeof s === 'string' && s.startsWith('http')) ? s : (s ? getListingImageUrl(s) : s)).filter(Boolean) as string[]
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      setError('')
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .limit(1)
          .single()
        if (error) throw error
        setItem(data as Listing)
      } catch (e: any) {
        setError(e.message || 'İlan yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  const imageList = useMemo(() => {
    const imgs = parseImages(item?.images)
    return imgs.length > 0 ? imgs : FALLBACK_IMAGES
  }, [item])

  async function share() {
    const url = window.location.href
    const title = item?.title || 'Kulu İlan'
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Bağlantı kopyalandı')
      }
    } catch {
      // kullanıcı paylaşımı iptal etti
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-4">
        <Link to="/ilanlar" className="text-sm text-blue-700 hover:underline">← Listeye Dön</Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-600"><svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> Yükleniyor...</div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-sm">{error}</div>
      ) : !item ? (
        <div className="text-gray-600">İlan bulunamadı.</div>
      ) : (
        <div className="space-y-6">
          {/* Görsel Galeri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 rounded-xl overflow-hidden">
              <img src={imageList[0]} className="w-full h-80 object-cover" alt={item.title} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              {imageList.slice(1, 5).map((src, i) => (
                <img key={i} src={src} className="w-full h-38 object-cover rounded-xl" alt={`image-${i}`} />
              ))}
            </div>
          </div>

          {/* Başlık ve Aksiyonlar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{item.title}</h1>
              <div className="text-sm text-gray-600">{item.neighborhood || 'Mahalle belirtilmemiş'}</div>
            </div>
            <div className="flex items-center gap-2">
              <FavoriteButton listingId={item.id} />
              <button onClick={() => { void share() }} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                Paylaş
              </button>
            </div>
          </div>

          {/* Özellikler */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-gray-500">Durum</div>
              <div className="mt-1 text-sm font-medium">{item.is_for === 'satilik' ? 'Satılık' : 'Kiralık'}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-gray-500">Tür</div>
              <div className="mt-1 text-sm font-medium">{item.property_type || '-'}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-gray-500">Oda</div>
              <div className="mt-1 text-sm font-medium">{item.rooms || '-'}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-gray-500">m²</div>
              <div className="mt-1 text-sm font-medium">{item.area_m2 ?? '-'}</div>
            </div>
          </div>

          {/* Fiyat ve Açıklama */}
          <div className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-700">{item.price_tl ? item.price_tl.toLocaleString('tr-TR') : '-'} TL</div>
            </div>
            {item.description && (
              <div className="mt-4 text-gray-700 whitespace-pre-line">{item.description}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
