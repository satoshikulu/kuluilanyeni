import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NeighborhoodSelect from '../components/NeighborhoodSelect'

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
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop', // modern house exterior
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop', // luxury apartment
  'https://images.unsplash.com/photo-1600607687644-c7171b42498b?q=80&w=1200&auto=format&fit=crop', // modern villa
  'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop', // apartment building
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1200&auto=format&fit=crop', // luxury villa
  'https://images.unsplash.com/photo-1448630360428-65456885c650?q=80&w=1200&auto=format&fit=crop', // suburban house
]

function ListingsPage() {
  const [items, setItems] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [isFor, setIsFor] = useState<'satilik' | 'kiralik' | ''>('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        let query = supabase.from('listings').select('*').eq('status', 'approved')
        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        setItems((data ?? []) as Listing[])
      } catch (e: any) {
        setError(e.message || 'İlanlar yüklenemedi')
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

  function getCardImage(l: Listing) {
    const urls: string[] = Array.isArray(l.images)
      ? l.images
      : typeof l.images === 'string'
        ? (() => { try { return JSON.parse(l.images) } catch { return [] } })()
        : []
    return urls[0] || FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Emlak İlanları</h1>
          <p className="text-xl text-blue-100">Kulu'da hayalinizdeki evi bulun</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Filtreler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mahalle</label>
              <NeighborhoodSelect value={neighborhood} onChange={setNeighborhood} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
              <select 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
          </div>
        </div>

        {/* Results Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">İlanlar yükleniyor...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">İlan bulunamadı</h3>
            <p className="text-gray-500">Aradığınız kriterlere uygun ilan bulunamadı. Filtreleri değiştirmeyi deneyin.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {filtered.length} ilan bulundu
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                <div key={item.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                  <div className="relative overflow-hidden">
                    <div
                      className="h-48 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                      style={{ backgroundImage: `url(${getCardImage(item)})` }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.is_for === 'satilik' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.is_for === 'satilik' ? 'Satılık' : 'Kiralık'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 group-hover:bg-gray-50 transition-colors duration-300">
                    <h4 className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors duration-300 mb-2">
                      {item.title}
                    </h4>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600">
                        <span className="text-sm">📍 {item.neighborhood || 'Mahalle belirtilmemiş'}</span>
                      </div>
                      {item.rooms && (
                        <div className="flex items-center text-gray-600">
                          <span className="text-sm">🏠 {item.rooms}</span>
                        </div>
                      )}
                      {item.area_m2 && (
                        <div className="flex items-center text-gray-600">
                          <span className="text-sm">📐 {item.area_m2} m²</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold text-green-600">
                        {item.price_tl ? item.price_tl.toLocaleString('tr-TR') : '-'} TL
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                        Detay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ListingsPage


