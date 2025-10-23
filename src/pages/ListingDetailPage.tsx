import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import FavoriteButton from '../components/FavoriteButton'
import { getListingImageUrl } from '../lib/storage'
import { getPlaceholderImage } from '../constants/placeholders'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { MapPin, Home, Maximize2, Share2, ArrowLeft } from 'lucide-react'

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

function parseImages(images: any, propertyType?: string | null): string[] {
  let arr: string[] = []
  if (Array.isArray(images)) arr = images as string[]
  else if (typeof images === 'string') {
    try { const parsed = JSON.parse(images); if (Array.isArray(parsed)) arr = parsed }
    catch { arr = [] }
  }
  // Storage path gelirse public URL'e çevir
  const parsed = arr.map((s) => (typeof s === 'string' && s.startsWith('http')) ? s : (s ? getListingImageUrl(s) : s)).filter(Boolean) as string[]
  
  // Eğer görsel yoksa placeholder ekle
  if (parsed.length === 0) {
    return [getPlaceholderImage(propertyType)]
  }
  return parsed
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

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
    return parseImages(item?.images, item?.property_type)
  }, [item])

  const lightboxSlides = useMemo(() => {
    return imageList.map(src => ({ src }))
  }, [imageList])

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
      <div className="mb-6">
        <Link to="/ilanlar" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Listeye Dön
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-600">
          <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg> 
          Yükleniyor...
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-sm">{error}</div>
      ) : !item ? (
        <div className="text-gray-600">İlan bulunamadı.</div>
      ) : (
        <div className="space-y-6">
          {/* Görsel Galeri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div 
              className="md:col-span-2 rounded-xl overflow-hidden cursor-pointer relative group"
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
            >
              <img src={imageList[0]} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300" alt={item.title} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3">
                  <Maximize2 className="w-6 h-6 text-gray-800" />
                </div>
              </div>
              {imageList.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                  1 / {imageList.length}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              {imageList.slice(1, 5).map((src, i) => (
                <div 
                  key={i} 
                  className="rounded-xl overflow-hidden cursor-pointer relative group"
                  onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true) }}
                >
                  <img src={src} className="w-full h-38 object-cover group-hover:scale-105 transition-transform duration-300" alt={`image-${i + 1}`} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2">
                      <Maximize2 className="w-4 h-4 text-gray-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Başlık ve Aksiyonlar */}
          <div className="flex flex-wrap items-start justify-between gap-4 bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.is_for === 'satilik' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {item.is_for === 'satilik' ? 'Satılık' : 'Kiralık'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {item.property_type || 'Emlak'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{item.neighborhood || 'Mahalle belirtilmemiş'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FavoriteButton listingId={item.id} />
              <button 
                onClick={() => { void share() }} 
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Paylaş
              </button>
            </div>
          </div>

          {/* Fiyat */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border border-green-100">
            <div className="text-sm text-gray-600 mb-1">Fiyat</div>
            <div className="text-4xl font-bold text-green-700">
              {item.price_tl ? item.price_tl.toLocaleString('tr-TR') : '-'}
              <span className="text-xl font-normal text-gray-600 ml-2">TL</span>
            </div>
          </div>

          {/* Özellikler */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {item.rooms && (
              <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Home className="w-5 h-5" />
                  <span className="text-xs font-medium">Oda Sayısı</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{item.rooms}</div>
              </div>
            )}
            {item.area_m2 && (
              <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Maximize2 className="w-5 h-5" />
                  <span className="text-xs font-medium">Alan</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{item.area_m2} m²</div>
              </div>
            )}
          </div>

          {/* Açıklama */}
          {item.description && (
            <div className="rounded-2xl border bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Açıklama</h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">{item.description}</div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
      />
    </div>
  )
}
