import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AdminGate from '../components/AdminGate'
import NeighborhoodSelect from '../components/NeighborhoodSelect'

type Listing = {
  id: string
  created_at: string
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
}

type UserMin = {
  id: string
  created_at: string
  full_name: string
  phone: string
  status: 'pending' | 'approved' | 'rejected'
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

  async function load() {
    setLoading(true)
    setError('')
    try {
      // Initial load for users (static on mount)
      const { data: usersData, error: usersError } = await supabase
        .from('users_min')
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
      const { error } = await supabase
        .from('listings')
        .update({ status: decision })
        .eq('id', id)
      if (error) throw error
      setListings((prev) => prev.filter((l) => l.id !== id))
    } catch (e: any) {
      // basit toast
      setError(e.message || 'Güncellenemedi')
    }
  }

  async function decideUser(id: string, decision: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('users_min')
        .update({ status: decision })
        .eq('id', id)
      if (error) throw error
      setPendingUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (e: any) {
      alert(e.message || 'Kullanıcı durumu güncellenemedi')
    }
  }

  return (
    <AdminGate>
    <div>
      <h1 className="text-2xl font-semibold mb-2">Admin Onay</h1>
      <p className="text-gray-600 mb-4">İlanları filtreleyin, sıralayın ve onaylayın.</p>

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
            <div key={l.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{l.title}</div>
                  <div className="text-sm text-gray-600">
                    {l.is_for === 'satilik' ? 'Satılık' : 'Kiralık'} · {l.property_type || 'Tür yok'} · {l.rooms || 'Oda yok'} · {l.area_m2 ? `${l.area_m2} m²` : 'm² yok'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {l.neighborhood || 'Mahalle yok'} · {l.price_tl ? `${l.price_tl.toLocaleString('tr-TR')} TL` : 'Fiyat yok'}
                  </div>
                  <div className="text-sm text-gray-600">{l.owner_name} · {l.owner_phone}</div>
                  {l.description && <div className="text-sm mt-2">{l.description}</div>}
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => void decide(l.id, 'approved')} className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm hover:bg-green-700">Onayla</button>
                  <button onClick={() => void decide(l.id, 'rejected')} className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm hover:bg-red-700">Reddet</button>
                </div>
              </div>
            </div>
          ))}
          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-600">Toplam: {totalCount}</div>
            {listings.length < totalCount && (
              <button disabled={querying} onClick={() => void queryListings(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
                {querying ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
              </button>
            )}
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mt-10 mb-3">Bekleyen Üyelik Başvuruları</h2>
      {loading ? (
        <div>Yükleniyor...</div>
      ) : pendingUsers.length === 0 ? (
        <div className="text-gray-600">Bekleyen kullanıcı başvurusu yok.</div>
      ) : (
        <div className="space-y-3">
          {pendingUsers.map((u) => (
            <div key={u.id} className="rounded-xl border p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{(u.full_name || '').trim() || 'Ad Soyad (eksik)'}</div>
                <div className="text-sm text-gray-600">{u.phone}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => void decideUser(u.id, 'approved')} className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm hover:bg-green-700">Onayla</button>
                <button onClick={() => void decideUser(u.id, 'rejected')} className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm hover:bg-red-700">Reddet</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold mt-10 mb-3">Onaylanmış Üyeler</h2>
      {approvedUsers.length === 0 ? (
        <div className="text-gray-600">Onaylanmış kullanıcı yok.</div>
      ) : (
        <div className="space-y-2">
          {approvedUsers.map((u) => (
            <div key={u.id} className="rounded-xl border p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{(u.full_name || '').trim() || 'Ad Soyad (eksik)'}</div>
                <div className="text-sm text-gray-600">{u.phone}</div>
              </div>
              <span className="text-xs rounded bg-green-600/10 px-2 py-1 text-green-700">approved</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold mt-10 mb-3">Reddedilen Üyeler</h2>
      {rejectedUsers.length === 0 ? (
        <div className="text-gray-600">Reddedilen kullanıcı yok.</div>
      ) : (
        <div className="space-y-2">
          {rejectedUsers.map((u) => (
            <div key={u.id} className="rounded-xl border p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{(u.full_name || '').trim() || 'Ad Soyad (eksik)'}</div>
                <div className="text-sm text-gray-600">{u.phone}</div>
              </div>
              <span className="text-xs rounded bg-red-600/10 px-2 py-1 text-red-700">rejected</span>
            </div>
          ))}
        </div>
      )}
    </div>
    </AdminGate>
  )
}

export default AdminPage


