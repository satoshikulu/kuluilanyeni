import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// Minimal types
type Favorite = { listing_id: string }

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
]

function getCardImage(l: Listing) {
  const urls: string[] = Array.isArray(l.images)
    ? l.images
    : typeof l.images === 'string'
      ? (() => { try { return JSON.parse(l.images) } catch { return [] } })()
      : []
  return urls[0] || FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]
}

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState<Listing[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        // User kontrol
        const { data: auth } = await supabase.auth.getUser()
        const uid = auth?.user?.id
        if (!uid) {
          setError('Favorilerinizi görmek için lütfen giriş yapın.')
          setItems([])
          return
        }
        setUserId(uid)
        // Önce favorilerden listing_id'leri al
        const { data: favs, error: favErr } = await supabase
          .from('favorites')
          .select('listing_id')
          .eq('user_id', uid)
        if (favErr) throw favErr
        const ids = (favs as Favorite[] | null)?.map(f => f.listing_id) || []
        if (ids.length === 0) {
          setItems([])
          return
        }
        // Sonra listings'i çek
        const { data: listings, error: listErr } = await supabase
          .from('listings')
          .select('*')
          .in('id', ids)
        if (listErr) throw listErr
        setItems((listings ?? []) as Listing[])
      } catch (e: any) {
        setError(e.message || 'Favoriler yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function removeFavorite(listingId: string) {
    try {
      if (!userId) return
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('listing_id', listingId)
        .eq('user_id', userId)
      if (error) throw error
      setItems((prev) => prev.filter((x) => x.id !== listingId))
    } catch (e: any) {
      setError(e.message || 'Favoriden çıkarılamadı')
    }
  }

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => (b.price_tl ?? 0) - (a.price_tl ?? 0))
  }, [items])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Favorilerim</h1>
        <p className="text-gray-600 text-sm">Giriş yaptığınız hesapla eklediğiniz favori ilanlar</p>
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-sm">{error}</div>
      )}
      {loading ? (
        <div className="flex items-center gap-3 text-gray-600"><svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> Yükleniyor...</div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          Henüz favori ilanınız yok. <Link to="/ilanlar" className="text-blue-700 hover:underline">İlanlara göz atın</Link>.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((item) => (
            <div key={item.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <Link to={`/ilan/${item.id}`}>
                <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${getCardImage(item)})` }} />
              </Link>
              <div className="p-5">
                <Link to={`/ilan/${item.id}`} className="font-semibold text-lg text-gray-800 hover:text-blue-600">{item.title}</Link>
                <div className="text-sm text-gray-600 mt-1">{item.neighborhood || 'Mahalle belirtilmemiş'}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xl font-bold text-green-700">{item.price_tl ? item.price_tl.toLocaleString('tr-TR') : '-'} TL</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { void removeFavorite(item.id) }} className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Favoriden çıkar</button>
                    <Link to={`/ilan/${item.id}`} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">Detay</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
