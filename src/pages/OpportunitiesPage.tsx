import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import NeighborhoodSelect from '../components/NeighborhoodSelect'
import FavoriteButton from '../components/FavoriteButton'

// DB model (uyumlu)
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
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498b?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1200&auto=format&fit=crop',
]

function getCardImage(l: Listing) {
  const urls: string[] = Array.isArray(l.images)
    ? l.images
    : typeof l.images === 'string'
      ? (() => { try { return JSON.parse(l.images) } catch { return [] } })()
      : []
  return urls[0] || FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]
}

function pricePerSqm(l: Listing) {
  if (!l.price_tl || !l.area_m2 || l.area_m2 <= 0) return Infinity
  return l.price_tl / l.area_m2
}

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filtreler
  const [neighborhood, setNeighborhood] = useState('')
  const [isFor, setIsFor] = useState<'satilik' | 'kiralik' | ''>('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState<'ppsqm' | 'price' | 'date'>('ppsqm')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        // Sadece onaylı ilanlar
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
        if (error) throw error
        setItems((data ?? []) as Listing[])
      } catch (e: any) {
        setError(e.message || 'Fırsat ilanları yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const filtered = useMemo(() => {
    return items.filter((l) => {
      if (neighborhood && l.neighborhood !== neighborhood) return false
      if (isFor && l.is_for !== isFor) return false
      if (typeFilter && l.property_type !== typeFilter) return false
      return true
    })
  }, [items, neighborhood, isFor, typeFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sortBy === 'ppsqm') {
      arr.sort((a, b) => pricePerSqm(a) - pricePerSqm(b))
    } else if (sortBy === 'price') {
      arr.sort((a, b) => (a.price_tl ?? Infinity) - (b.price_tl ?? Infinity))
    } else {
      arr.sort((a, b) => 0) // zaten created_at desc ile geldi
    }
    return arr
  }, [filtered, sortBy])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-[url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/50 to-red-600/40" />
        <div className="relative z-10 px-6 py-16 text-white">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Fırsat İlanları</h1>
          <p className="mt-2 text-white/90">m² başına en uygun seçenekler, onaylı ilanlar arasından</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="mt-6 bg-white rounded-2xl shadow p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mahalle</label>
            <NeighborhoodSelect value={neighborhood} onChange={setNeighborhood} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={isFor}
              onChange={(e) => setIsFor(e.target.value as any)}
            >
              <option value="">Hepsi</option>
              <option value="satilik">Satılık</option>
              <option value="kiralik">Kiralık</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tür</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Hepsi</option>
              <option value="Daire">Daire</option>
              <option value="Müstakil">Müstakil</option>
              <option value="Arsa">Arsa</option>
              <option value="Dükkan">Dükkan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sırala</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="ppsqm">m² başına fiyat (artan)</option>
              <option value="price">Toplam fiyat (artan)</option>
              <option value="date">Tarih (yeni → eski)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sonuçlar */}
      <div className="mt-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <span className="ml-3 text-gray-600">Fırsatlar yükleniyor...</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Fırsat bulunamadı</h3>
            <p className="text-gray-500">Filtreleri değiştirerek tekrar deneyin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((l) => (
              <div key={l.id} className="group rounded-2xl border-2 border-orange-200 overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-300">
                <div className="relative overflow-hidden">
                  <Link to={`/ilan/${l.id}`}>
                    <div
                      className="h-44 bg-cover bg-center bg-gray-200 group-hover:scale-110 transition-transform duration-500"
                      style={{ backgroundImage: `url(${getCardImage(l)})` }}
                    />
                  </Link>
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    FIRSAT
                  </div>
                </div>
                <div className="p-4 group-hover:bg-gray-50 transition-colors duration-300">
                  <Link to={`/ilan/${l.id}`} className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-1 inline-block">{l.title}</Link>
                  <div className="text-orange-600 text-sm font-medium">{l.neighborhood || 'Mahalle belirtilmemiş'}</div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-gray-600">
                    <div>Tür: {l.property_type || '-'}</div>
                    <div>Oda: {l.rooms || '-'}</div>
                    <div>m²: {l.area_m2 ?? '-'}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="font-bold text-orange-800 text-lg group-hover:text-green-600 transition-colors duration-300">
                      {l.price_tl ? l.price_tl.toLocaleString('tr-TR') : '-'} TL
                    </div>
                    <div className="flex items-center gap-2">
                      {Number.isFinite(pricePerSqm(l)) && (
                        <div className="text-xs text-gray-500 hidden sm:block">
                          {(Math.round(pricePerSqm(l)) || 0).toLocaleString('tr-TR')} TL/m²
                        </div>
                      )}
                      <FavoriteButton listingId={l.id} />
                      <Link to={`/ilan/${l.id}`} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">Detay</Link>
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${l.is_for === 'satilik' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {l.is_for === 'satilik' ? 'Satılık' : 'Kiralık'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
