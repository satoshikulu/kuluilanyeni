import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AdminGate from '../components/AdminGate'
import NeighborhoodSelect from '../components/NeighborhoodSelect'

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
  is_featured: boolean
  featured_order: number
  featured_until?: string | null
  is_opportunity: boolean
  opportunity_order: number
  original_price_tl?: number | null
  discount_percentage?: number | null
}

type UserMin = {
  id: string
  created_at: string
  full_name: string
  phone: string
  password_hash: string
  status: 'pending' | 'approved' | 'rejected'
  role?: string
}

function AdminPage() {
  // Data state
  const [listings, setListings] = useState<Listing[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [pendingUsers, setPendingUsers] = useState<UserMin[]>([])
  const [approvedUsers, setApprovedUsers] = useState<UserMin[]>([])
  const [rejectedUsers, setRejectedUsers] = useState<UserMin[]>([])

  // UI state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [querying, setQuerying] = useState<boolean>(false)

  // Filters & sorting
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [isFor, setIsFor] = useState<'satilik' | 'kiralik' | 'all'>('all')
  const [neighborhood, setNeighborhood] = useState<string>('')
  const [propertyType, setPropertyType] = useState<string>('')
  const [priceMin, setPriceMin] = useState<string>('')
  const [priceMax, setPriceMax] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const [orderBy, setOrderBy] = useState<'created_at' | 'price_tl' | 'area_m2'>('created_at')
  const [orderAsc, setOrderAsc] = useState<boolean>(false)

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState<number>(1)

  // Tab state
  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings')

  // Helpers
  function formatDate(ts?: string) {
    if (!ts) return '-'
    try { return new Date(ts).toLocaleString('tr-TR') } catch { return ts }
  }
  function daysSince(ts?: string) {
    if (!ts) return '-'
    const d = new Date(ts).getTime()
    if (!Number.isFinite(d)) return '-'
    const diff = Date.now() - d
    const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
    return `${days} gün`
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      // Initial load for users (static on mount)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      if (usersError) throw usersError
      const all = (usersData as UserMin[]) || []
      setPendingUsers(all.filter((u) => u.status === 'pending'))
      setApprovedUsers(all.filter((u) => u.status === 'approved'))
      setRejectedUsers(all.filter((u) => u.status === 'rejected'))

      // Then query listings with current filters
      await queryListings(true)
    } catch (e: any) {
      setError(e.message || 'Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  async function queryListings(resetPage = false) {
    setQuerying(true)
    setError('')
    try {
      const currentPage = resetPage ? 1 : page
      const from = (currentPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let q = supabase
        .from('listings')
        .select('*', { count: 'exact' })

      if (status !== 'all') q = q.eq('status', status)
      if (isFor !== 'all') q = q.eq('is_for', isFor)
      if (neighborhood) q = q.ilike('neighborhood', `%${neighborhood}%`)
      if (propertyType) q = q.eq('property_type', propertyType)
      if (priceMin) q = q.gte('price_tl', Number(priceMin))
      if (priceMax) q = q.lte('price_tl', Number(priceMax))

      if (search.trim()) {
        const s = search.trim()
        q = q.or(
          `title.ilike.%${s}%,owner_name.ilike.%${s}%,owner_phone.ilike.%${s}%`
        )
      }

      q = q.order(orderBy, { ascending: orderAsc, nullsFirst: false })
      q = q.range(from, to)

      const { data, error, count } = await q
      if (error) throw error

      setTotalCount(count ?? 0)
      setPage(currentPage)
      setListings(resetPage ? (data as Listing[]) : [...listings, ...(data as Listing[])])
    } catch (e: any) {
      setError(e.message || 'İlanlar getirilemedi')
    } finally {
      setQuerying(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function decide(id: string, decision: 'approved' | 'rejected') {
    try {
      // RPC fonksiyonunu kullan (RLS bypass için)
      const rpcFunction = decision === 'approved' ? 'approve_listing' : 'reject_listing'
      
      // Admin ID'yi al (şimdilik dummy, sonra gerçek admin ID kullanılacak)
      const adminId = '00000000-0000-0000-0000-000000000000' // Dummy admin ID
      
      const { data, error } = await supabase
        .rpc(rpcFunction, {
          p_listing_id: id,
          p_admin_id: adminId
        })
      
      if (error) {
        console.error('RPC Error:', error)
        throw error
      }
      
      const result = data as any
      if (!result.success) {
        throw new Error(result.error || 'İşlem başarısız')
      }
      
      // UI'dan ilanı kaldır
      setListings((prev) => prev.filter((l) => l.id !== id))
      
      // Başarı mesajı göster
      alert(`✅ İlan ${decision === 'approved' ? 'onaylandı' : 'reddedildi'}!`)
    } catch (e: any) {
      console.error('decide error:', e)
      // Hata mesajını göster
      alert('Hata: ' + (e.message || 'İlan durumu güncellenemedi'))
    }
  }

  async function decideUser(id: string, decision: 'approved' | 'rejected') {
    try {
      // RPC fonksiyonunu kullan (RLS bypass için)
      const rpcFunction = decision === 'approved' ? 'approve_user' : 'reject_user'
      
      // Admin ID'yi al (şimdilik dummy, sonra gerçek admin ID kullanılacak)
      const adminId = '00000000-0000-0000-0000-000000000000' // Dummy admin ID
      
      const { data, error } = await supabase
        .rpc(rpcFunction, {
          p_user_id: id,
          p_admin_id: adminId
        })
      
      if (error) {
        console.error('RPC Error:', error)
        throw error
      }
      
      const result = data as any
      if (!result.success) {
        throw new Error(result.error || 'İşlem başarısız')
      }
      
      // Listeyi güncelle
      setPendingUsers((prev) => prev.filter((u) => u.id !== id))
      
      // Onaylanan/reddedilen listeye ekle
      if (decision === 'approved') {
        const user = pendingUsers.find(u => u.id === id)
        if (user) {
          setApprovedUsers((prev) => [{ ...user, status: 'approved' }, ...prev])
        }
      } else {
        const user = pendingUsers.find(u => u.id === id)
        if (user) {
          setRejectedUsers((prev) => [{ ...user, status: 'rejected' }, ...prev])
        }
      }
      
      alert(`✅ Kullanıcı ${decision === 'approved' ? 'onaylandı' : 'reddedildi'}!`)
    } catch (e: any) {
      console.error('decideUser error:', e)
      alert('Hata: ' + (e.message || 'Kullanıcı durumu güncellenemedi'))
    }
  }

  async function resetPassword(userId: string, phone: string) {
    const newPassword = prompt(`${phone} için yeni şifre girin:`)
    if (!newPassword) return
    
    if (newPassword.length < 4) {
      alert('Şifre en az 4 karakter olmalıdır')
      return
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newPassword })
        .eq('id', userId)
      
      if (error) throw error
      
      alert(`✅ Şifre başarıyla değiştirildi!\n\nTelefon: ${phone}\nYeni Şifre: ${newPassword}\n\nBu bilgileri kullanıcıya iletin.`)
      
      // Listeyi yenile
      await load()
    } catch (e: any) {
      alert('Hata: ' + (e.message || 'Şifre değiştirilemedi'))
    }
  }

  async function toggleFeatured(id: string, currentFeatured: boolean) {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_featured: !currentFeatured })
        .eq('id', id)
      if (error) throw error
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, is_featured: !currentFeatured } : l))
    } catch (e: any) {
      alert(e.message || 'Öne çıkarma durumu güncellenemedi')
    }
  }

  async function updateFeaturedOrder(id: string, order: number) {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ featured_order: order })
        .eq('id', id)
      if (error) throw error
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, featured_order: order } : l))
    } catch (e: any) {
      alert(e.message || 'Sıralama güncellenemedi')
    }
  }

  async function toggleOpportunity(id: string, currentOpportunity: boolean) {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_opportunity: !currentOpportunity })
        .eq('id', id)
      if (error) throw error
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, is_opportunity: !currentOpportunity } : l))
    } catch (e: any) {
      alert(e.message || 'Fırsat ilan durumu güncellenemedi')
    }
  }

  async function updateOpportunityOrder(id: string, order: number) {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ opportunity_order: order })
        .eq('id', id)
      if (error) throw error
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, opportunity_order: order } : l))
    } catch (e: any) {
      alert(e.message || 'Fırsat sıralaması güncellenemedi')
    }
  }

  async function updateOpportunityPricing(id: string, originalPrice: number, discount: number) {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          original_price_tl: originalPrice,
          discount_percentage: discount
        })
        .eq('id', id)
      if (error) throw error
      setListings((prev) => prev.map((l) => l.id === id ? { 
        ...l, 
        original_price_tl: originalPrice,
        discount_percentage: discount
      } : l))
    } catch (e: any) {
      alert(e.message || 'Fiyat bilgileri güncellenemedi')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('isAdmin')
    window.location.href = '/'
  }

  return (
    <AdminGate>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Modern Admin Header with Background Image */}
      <div className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/95 via-purple-900/90 to-pink-900/95 backdrop-blur-sm"></div>
        </div>

        {/* Header Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {/* Left Side - Title & User */}
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl">👑</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white shadow-lg"></div>
              </div>

              {/* Title & User Info */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-black text-white tracking-tight">
                    Admin Panel
                  </h1>
                  <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow-lg">
                    PRO
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                    <span className="text-2xl">👤</span>
                    <div>
                      <div className="text-white font-bold text-sm">Admin Yönetici</div>
                      <div className="text-purple-200 text-xs">Tam Yetki • Süper Admin</div>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/20"></div>
                  <div className="text-white/80 text-sm">
                    <div className="font-semibold">Yönetim Kontrol Merkezi</div>
                    <div className="text-xs text-white/60">Tüm sistem erişimi aktif</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-3">
              {/* Stats */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <div className="text-2xl font-bold text-white">{totalCount}</div>
                  <div className="text-xs text-white/70">İlanlar</div>
                </div>
                <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <div className="text-2xl font-bold text-white">{pendingUsers.length}</div>
                  <div className="text-xs text-white/70">Bekleyen</div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="group flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-red-500 backdrop-blur-md rounded-xl transition-all duration-300 border border-white/20 hover:border-red-400 shadow-lg hover:shadow-red-500/50"
              >
                <span className="text-xl group-hover:rotate-12 transition-transform duration-300">🚪</span>
                <span className="font-bold text-white">Çıkış</span>
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 48h1440V0c-240 48-480 48-720 24C480 0 240 0 0 24v24z" fill="currentColor" className="text-gray-50"/>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Modern Tab Navigation */}
      <div className="mb-8">
        <div className="flex gap-3 bg-gray-100 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 px-6 py-3 font-semibold text-sm rounded-lg transition-all duration-200 relative ${
              activeTab === 'listings'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              📋 İlanlar
              {status === 'pending' && listings.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse">
                  {totalCount}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-3 font-semibold text-sm rounded-lg transition-all duration-200 relative ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              👥 Üyeler
              {pendingUsers.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse">
                  {pendingUsers.length}
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* İlanlar Tab */}
      {activeTab === 'listings' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">İlan Yönetimi</h2>
          
          {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Durum</label>
          <select className="w-full rounded-lg border px-3 py-2" value={status} onChange={(e) => { setStatus(e.target.value as any); void queryListings(true) }}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">Tümü</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tür</label>
          <select className="w-full rounded-lg border px-3 py-2" value={isFor} onChange={(e) => { setIsFor(e.target.value as any); void queryListings(true) }}>
            <option value="all">Tümü</option>
            <option value="satilik">Satılık</option>
            <option value="kiralik">Kiralık</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Mahalle</label>
          <NeighborhoodSelect value={neighborhood} onChange={(v) => { setNeighborhood(v); void queryListings(true) }} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Emlak Türü</label>
          <select className="w-full rounded-lg border px-3 py-2" value={propertyType} onChange={(e) => { setPropertyType(e.target.value); void queryListings(true) }}>
            <option value="">Tümü</option>
            <option value="Daire">Daire</option>
            <option value="Müstakil">Müstakil</option>
            <option value="Dükkan">Dükkan</option>
            <option value="Ofis">Ofis</option>
            <option value="Depo">Depo</option>
            <option value="Arsa">Arsa</option>
            <option value="Tarla">Tarla</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Fiyat Min (TL)</label>
            <input value={priceMin} onChange={(e) => setPriceMin(e.target.value.replace(/\D/g, ''))} className="w-full rounded-lg border px-3 py-2" inputMode="numeric" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Fiyat Max (TL)</label>
            <input value={priceMax} onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ''))} className="w-full rounded-lg border px-3 py-2" inputMode="numeric" />
          </div>
          <button className="h-10 px-3 rounded-lg bg-blue-600 text-white text-sm" onClick={() => void queryListings(true)}>Uygula</button>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Ara (başlık / ad soyad / telefon)</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void queryListings(true) } }} className="w-full rounded-lg border px-3 py-2" placeholder="Örn: 3+1, Ali Veli, 0555" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Sırala</label>
          <div className="flex gap-2">
            <select className="flex-1 rounded-lg border px-3 py-2" value={orderBy} onChange={(e) => { setOrderBy(e.target.value as any); void queryListings(true) }}>
              <option value="created_at">Tarih</option>
              <option value="price_tl">Fiyat</option>
              <option value="area_m2">m²</option>
            </select>
            <button className="rounded-lg border px-3 py-2" onClick={(e) => { e.preventDefault(); setOrderAsc((v) => !v); void queryListings(true) }}>{orderAsc ? 'Artan' : 'Azalan'}</button>
          </div>
        </div>
      </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-sm">{error}</div>
          )}
          {loading ? (
            <div className="flex items-center gap-3 text-gray-600"><svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> Yükleniyor...</div>
          ) : listings.length === 0 ? (
            <div className="text-gray-600">Kriterlere uygun ilan bulunamadı.</div>
          ) : (
            <div className="space-y-4">
              {listings.map((l) => (
                <div key={l.id} className="group relative rounded-2xl border border-gray-200 p-6 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    {l.status === 'pending' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                        ⏳ Bekliyor
                      </span>
                    )}
                    {l.status === 'approved' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        ✓ Onaylı
                      </span>
                    )}
                    {l.status === 'rejected' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        ✕ Reddedildi
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 pr-24">
                      <div className="font-bold text-xl text-gray-900 mb-3">{l.title}</div>
                      {/* Property Details */}
                      <div className="flex flex-wrap gap-3 mb-3">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {l.is_for === 'satilik' ? '🏷️ Satılık' : '🔑 Kiralık'}
                        </span>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          🏠 {l.property_type || 'Tür yok'}
                        </span>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          🚪 {l.rooms || 'Oda yok'}
                        </span>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-teal-50 text-teal-700 border border-teal-100">
                          📐 {l.area_m2 ? `${l.area_m2} m²` : 'm² yok'}
                        </span>
                      </div>

                      {/* Location & Price */}
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-sm text-gray-600">
                          📍 {l.neighborhood || 'Mahalle yok'}
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          💰 {l.price_tl ? `${l.price_tl.toLocaleString('tr-TR')} TL` : 'Fiyat yok'}
                        </span>
                      </div>

                      {/* Owner Info */}
                      <div className="flex items-center gap-4 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-sm font-medium text-gray-700">
                          👤 {l.owner_name}
                        </span>
                        <span className="text-sm text-gray-600">
                          📞 {l.owner_phone}
                        </span>
                      </div>

                      {/* Time Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>🕐 Başvuru: {formatDate(l.created_at)}</span>
                        <span>⏱️ Geçen: {daysSince(l.created_at)}</span>
                        {l.status === 'approved' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 font-medium">
                            ✓ Yayında: {daysSince(l.approved_at || l.created_at)}
                          </span>
                        )}
                      </div>

                      {l.description && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-gray-700 leading-relaxed">{l.description}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2.5 min-w-[140px]">
                      <button onClick={() => void decide(l.id, 'approved')} className="group/btn rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        <span className="flex items-center justify-center gap-2">
                          ✓ Onayla
                        </span>
                      </button>
                      <button onClick={() => void decide(l.id, 'rejected')} className="group/btn rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2.5 text-sm font-semibold hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        <span className="flex items-center justify-center gap-2">
                          ✕ Reddet
                        </span>
                      </button>
                      {l.status === 'approved' && (
                        <>
                          <button 
                            onClick={() => void toggleFeatured(l.id, l.is_featured)} 
                            className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
                              l.is_featured 
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 hover:from-yellow-500 hover:to-amber-600' 
                                : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                            }`}
                          >
                            {l.is_featured ? '⭐ Öne Çıkan' : '⭐ Öne Çıkar'}
                          </button>
                          {l.is_featured && (
                            <input 
                              type="number" 
                              value={l.featured_order} 
                              onChange={(e) => void updateFeaturedOrder(l.id, Number(e.target.value))}
                              className="rounded-lg border-2 border-yellow-300 px-3 py-2 text-sm font-semibold text-center focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
                              placeholder="Sıra"
                              min="0"
                            />
                          )}
                          <button 
                            onClick={() => void toggleOpportunity(l.id, l.is_opportunity)} 
                            className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
                              l.is_opportunity 
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600' 
                                : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                            }`}
                          >
                            {l.is_opportunity ? '🔥 Fırsat İlan' : '🔥 Fırsat Yap'}
                          </button>
                      {l.is_opportunity && (
                        <div className="space-y-1">
                          <input 
                            type="number" 
                            value={l.opportunity_order} 
                            onChange={(e) => void updateOpportunityOrder(l.id, Number(e.target.value))}
                            className="rounded-lg border px-2 py-1 text-sm w-full"
                            placeholder="Sıra"
                            min="0"
                          />
                          <input 
                            type="number" 
                            value={l.original_price_tl || ''} 
                            onChange={(e) => {
                              const original = Number(e.target.value)
                              const current = l.price_tl || 0
                              const discount = original > 0 ? Math.round(((original - current) / original) * 100) : 0
                              void updateOpportunityPricing(l.id, original, discount)
                            }}
                            className="rounded-lg border px-2 py-1 text-sm w-full"
                            placeholder="Eski Fiyat"
                            min="0"
                          />
                          {l.original_price_tl && l.price_tl && (
                            <div className="text-xs text-green-600 font-semibold">
                              %{Math.round(((l.original_price_tl - l.price_tl) / l.original_price_tl) * 100)} İndirim
                            </div>
                          )}
                        </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600 font-medium">Toplam: {totalCount} ilan</div>
                {listings.length < totalCount && (
                  <button disabled={querying} onClick={() => void queryListings(false)} className="rounded-lg border border-blue-600 text-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-50 disabled:opacity-60 transition-colors">
                    {querying ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Üyeler Tab */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Bekleyen Üyelik Başvuruları</h2>
          {loading ? (
            <div className="flex items-center gap-3 text-gray-600"><svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> Yükleniyor...</div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-gray-600 bg-gray-50 rounded-lg p-4 text-center">Bekleyen kullanıcı başvurusu yok.</div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((u) => (
                <div key={u.id} className="group relative rounded-2xl border border-gray-200 p-6 bg-gradient-to-br from-white to-blue-50 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                  {/* Pending Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse">
                      ⏳ Bekliyor
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 pr-24">
                      <div className="font-bold text-xl text-gray-900 mb-3">{(u.full_name || '').trim() || 'Ad Soyad (eksik)'}</div>
                      
                      {/* Contact Info */}
                      <div className="flex flex-col gap-2 mb-3">
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">📞 Telefon:</span>
                          <span className="text-sm text-gray-900 font-semibold">{u.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">🔑 Şifre:</span>
                          <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-md text-gray-900 font-semibold">{u.password_hash}</span>
                        </div>
                      </div>

                      {/* Time Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>🕐 Başvuru: {formatDate(u.created_at)}</span>
                        <span>⏱️ Geçen: {daysSince(u.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 min-w-[140px]">
                      <button onClick={() => void decideUser(u.id, 'approved')} className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        ✓ Onayla
                      </button>
                      <button onClick={() => void decideUser(u.id, 'rejected')} className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2.5 text-sm font-semibold hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        ✕ Reddet
                      </button>
                      <button onClick={() => void resetPassword(u.id, u.phone)} className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        🔑 Şifre
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-semibold mt-8 mb-4">Onaylanmış Üyeler ({approvedUsers.length})</h2>
          {approvedUsers.length === 0 ? (
            <div className="text-gray-600 bg-gray-50 rounded-lg p-4 text-center">Onaylanmış kullanıcı yok.</div>
          ) : (
            <div className="space-y-3">
              {approvedUsers.map((u) => (
                <div key={u.id} className="rounded-xl border border-green-200 p-4 bg-gradient-to-br from-white to-green-50 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-semibold text-lg text-gray-900">{(u.full_name || '').trim() || 'Ad Soyad (eksik)'}</div>
                        {u.role === 'admin' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                            👑 ADMIN
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="text-sm text-gray-600">📞 {u.phone}</div>
                        <div className="text-sm text-gray-600">🔑 Şifre: <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">{u.password_hash}</span></div>
                        <div className="text-xs text-gray-500">🕐 Başvuru: {formatDate(u.created_at)} · ⏱️ Geçen: {daysSince(u.created_at)}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        ✓ Onaylı
                      </span>
                      <button onClick={() => void resetPassword(u.id, u.phone)} className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1.5 text-xs font-semibold hover:from-blue-600 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200">
                        🔑 Şifre Değiştir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-semibold mt-8 mb-4">Reddedilen Üyeler ({rejectedUsers.length})</h2>
          {rejectedUsers.length === 0 ? (
            <div className="text-gray-600 bg-gray-50 rounded-lg p-4 text-center">Reddedilen kullanıcı yok.</div>
          ) : (
            <div className="space-y-3">
              {rejectedUsers.map((u) => (
                <div key={u.id} className="rounded-xl border border-red-200 p-4 bg-gradient-to-br from-white to-red-50 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg text-gray-900 mb-2">{(u.full_name || '').trim() || 'Ad Soyad (eksik)'}</div>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-gray-600">📞 {u.phone}</div>
                      <div className="text-xs text-gray-500">🕐 Başvuru: {formatDate(u.created_at)} · ⏱️ Geçen: {daysSince(u.created_at)}</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                    ✕ Reddedildi
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
    </AdminGate>
  )
}

export default AdminPage


