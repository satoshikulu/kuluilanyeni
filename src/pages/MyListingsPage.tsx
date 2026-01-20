import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getCurrentUser } from '../lib/simpleAuth'

type Listing = {
  id: string
  created_at: string
  approved_at?: string | null
  title: string
  owner_name: string
  owner_phone: string
  neighborhood: string | null
  property_type: string | null
  rooms: string | null
  area_m2: number | null
  price_tl: number | null
  is_for: 'satilik' | 'kiralik'
  description: string | null
  status: 'pending' | 'approved' | 'rejected'
  images?: string[]
}

function MyListingsPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkUser() {
      const user = await getCurrentUser()
      if (!user) {
        navigate('/giris')
        return
      }
      setCurrentUser(user)
      loadMyListings(user)
    }
    checkUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadMyListings(user = currentUser) {
    if (!user) return
    
    setLoading(true)
    setError('')
    
    try {
      console.log('🔍 MyListingsPage - User bilgileri:', user)
      
      let query = supabase.from('listings').select('*')
      
      // Simple auth sistemi - phone ile sorgula
      if (user.phone) {
        console.log('📞 Phone ile sorgulama:', user.phone)
        query = query.eq('owner_phone', user.phone)
      } else if (user.id) {
        console.log('🆔 ID ile sorgulama:', user.id)
        // Fallback: user_id ile sorgula
        query = query.eq('user_id', user.id)
      } else {
        console.error('❌ Kullanıcı bilgileri eksik:', user)
        throw new Error('Kullanıcı bilgileri eksik')
      }
      
      const { data, error: fetchError } = await query.order('created_at', { ascending: false })

      if (fetchError) {
        console.error('❌ Supabase sorgu hatası:', fetchError)
        throw fetchError
      }

      console.log('✅ İlanlar yüklendi:', data?.length || 0, 'adet')
      setListings(data as Listing[])
    } catch (e: any) {
      console.error('❌ loadMyListings hatası:', e)
      setError(e.message || 'İlanlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
            ⏳ Onay Bekliyor
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            ✓ Yayında
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            ✕ Reddedildi
          </span>
        )
      default:
        return null
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">İlanlarım</h1>
        <p className="text-gray-600">Yayınladığınız tüm ilanları buradan görüntüleyebilirsiniz</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-600">
            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-lg">Yükleniyor...</span>
          </div>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">📋</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz ilan yok</h3>
          <p className="text-gray-600 mb-6">Henüz hiç ilan yayınlamadınız</p>
          <button
            onClick={() => navigate('/satilik')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <span>➕</span>
            <span>İlk İlanınızı Verin</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/ilan/${listing.id}`)}
            >
              <div className="flex items-start gap-6">
                {/* Görsel Thumbnail */}
                <div className="flex-shrink-0">
                  {listing.images && listing.images.length > 0 ? (
                    <div className="w-32 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <div className="hidden w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-2xl">🖼️</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-32 h-24 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <span className="text-2xl text-gray-400">🏠</span>
                    </div>
                  )}
                </div>

                {/* İlan Bilgileri */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {listing.title}
                    </h3>
                    {getStatusBadge(listing.status)}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {listing.is_for === 'satilik' ? '🏷️ Satılık' : '🔑 Kiralık'}
                    </span>
                    {listing.property_type && (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        🏠 {listing.property_type}
                      </span>
                    )}
                    {listing.rooms && (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        🚪 {listing.rooms}
                      </span>
                    )}
                    {listing.area_m2 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-teal-50 text-teal-700 border border-teal-100">
                        📐 {listing.area_m2} m²
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    {listing.neighborhood && (
                      <span className="text-sm text-gray-600">
                        📍 {listing.neighborhood}
                      </span>
                    )}
                    {listing.price_tl && (
                      <span className="text-lg font-bold text-green-600">
                        💰 {listing.price_tl.toLocaleString('tr-TR')} TL
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    📅 Yayın Tarihi: {formatDate(listing.created_at)}
                    {listing.approved_at && listing.status === 'approved' && (
                      <span className="ml-3">
                        ✓ Onaylandı: {formatDate(listing.approved_at)}
                      </span>
                    )}
                  </div>

                  {listing.description && (
                    <p className="mt-3 text-sm text-gray-700 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {listing.description}
                    </p>
                  )}
                </div>

                {/* Detay Butonu */}
                <div className="flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/ilan/${listing.id}`)
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    Detay →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyListingsPage
