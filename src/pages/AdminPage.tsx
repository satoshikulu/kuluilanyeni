import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AdminGate from '../components/AdminGate'

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
  const [pending, setPending] = useState<Listing[]>([])
  const [pendingUsers, setPendingUsers] = useState<UserMin[]>([])
  const [approvedUsers, setApprovedUsers] = useState<UserMin[]>([])
  const [rejectedUsers, setRejectedUsers] = useState<UserMin[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw error
      setPending(data as Listing[])

      const { data: usersData, error: usersError } = await supabase
        .from('users_min')
        .select('*')
        .order('created_at', { ascending: false })
      if (usersError) throw usersError
      const all = (usersData as UserMin[]) || []
      setPendingUsers(all.filter((u) => u.status === 'pending'))
      setApprovedUsers(all.filter((u) => u.status === 'approved'))
      setRejectedUsers(all.filter((u) => u.status === 'rejected'))
    } catch (e: any) {
      setError(e.message || 'Bekleyen ilanlar yüklenemedi')
    } finally {
      setLoading(false)
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
      setPending((prev) => prev.filter((l) => l.id !== id))
    } catch (e: any) {
      alert(e.message || 'Güncellenemedi')
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
      <p className="text-gray-600 mb-6">Bekleyen ilanları inceleyip onaylayın veya reddedin.</p>

      {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}
      {loading ? (
        <div>Yükleniyor...</div>
      ) : pending.length === 0 ? (
        <div className="text-gray-600">Bekleyen ilan yok.</div>
      ) : (
        <div className="space-y-4">
          {pending.map((l) => (
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


