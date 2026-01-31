import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AdminGate from '../components/AdminGate'
import NeighborhoodSelect from '../components/NeighborhoodSelect'
import { enforceAdminAccess, setupAdminRoleWatcher } from '../lib/adminSecurity'
import { getCurrentUser } from '../lib/simpleAuth'
import { requireAdmin } from '../lib/simpleAuth'
import { 
  sendOneSignalNotification,
  OneSignalNotificationTemplates
} from '../lib/oneSignalNotifications'
import { useDebounce } from '../hooks/useDebounce'

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
  user_id?: string | null
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

type OneSignalUser = {
  id: string
  user_id: string
  onesignal_external_id: string
  onesignal_user_id?: string
  sync_status: 'pending' | 'success' | 'failed'
  sync_error?: string
  last_sync_at?: string
  created_at: string
}

function AdminPage() {
  // Data state
  const [listings, setListings] = useState<Listing[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [userRequests, setUserRequests] = useState<any[]>([]) // Kayıt başvuruları
  const [pendingUsers, setPendingUsers] = useState<UserMin[]>([])
  const [approvedUsers, setApprovedUsers] = useState<UserMin[]>([])
  const [rejectedUsers, setRejectedUsers] = useState<UserMin[]>([])
  const [oneSignalUsers, setOneSignalUsers] = useState<OneSignalUser[]>([])
  const [oneSignalStats, setOneSignalStats] = useState({
    total: 0,
    pending: 0,
    success: 0,
    failed: 0
  })

  // UI state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [querying, setQuerying] = useState<boolean>(false)

  // Filters & sorting
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [isFor, setIsFor] = useState<'satilik' | 'kiralik' | 'all'>('all')
  const [membershipFilter, setMembershipFilter] = useState<'all' | 'members' | 'non-members'>('all')
  const [neighborhood, setNeighborhood] = useState<string>('')
  const [propertyType, setPropertyType] = useState<string>('')
  const [priceMin, setPriceMin] = useState<string>('')
  const [priceMax, setPriceMax] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const debouncedSearch = useDebounce(search, 500) // 500ms debounce

  const [orderBy, setOrderBy] = useState<'created_at' | 'price_tl' | 'area_m2'>('created_at')
  const [orderAsc, setOrderAsc] = useState<boolean>(false)

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState<number>(1)

  // Tab state
  const [activeTab, setActiveTab] = useState<'listings' | 'users' | 'onesignal'>('listings')
  
  // User listings modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userListings, setUserListings] = useState<Listing[]>([])
  const [userListingsLoading, setUserListingsLoading] = useState(false)
  const [userListingsCounts, setUserListingsCounts] = useState<Record<string, { pending: number; approved: number; rejected: number }>>({})

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
      // User requests yükle (kayıt başvuruları)
      const { data: requestsData, error: requestsError } = await supabase
        .from('user_requests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (requestsError) throw requestsError
      setUserRequests(requestsData || [])

      // Load users from both simple_users and profiles tables
      let usersData: any[] = []
      
      // 1. simple_users tablosundan yükle
      try {
        const { data: simpleUsersData, error: simpleUsersError } = await supabase
          .from('simple_users')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!simpleUsersError && simpleUsersData) {
          usersData = [...usersData, ...simpleUsersData]
          console.log(`✅ ${simpleUsersData.length} kullanıcı simple_users'dan yüklendi`)
        }
      } catch (simpleError) {
        console.log('simple_users tablosu erişilemez:', simpleError)
      }
      
      // 2. profiles tablosundan da yükle
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!profilesError && profilesData) {
          // Duplicate'leri önlemek için phone numarasına göre filtrele
          const existingPhones = new Set(usersData.map(u => u.phone))
          const newProfiles = profilesData.filter(p => !existingPhones.has(p.phone))
          usersData = [...usersData, ...newProfiles]
          console.log(`✅ ${newProfiles.length} yeni kullanıcı profiles'dan yüklendi`)
        }
      } catch (profilesError) {
        console.log('profiles tablosu erişilemez:', profilesError)
      }
      
      console.log(`📊 Toplam ${usersData.length} kullanıcı yüklendi`)
      
      const all = (usersData as UserMin[]) || []
      setPendingUsers(all.filter((u) => u.status === 'pending'))
      setApprovedUsers(all.filter((u) => u.status === 'approved'))
      setRejectedUsers(all.filter((u) => u.status === 'rejected'))

      // Load OneSignal sync data
      await loadOneSignalData()

      // Then query listings with current filters
      await queryListings(true)
    } catch (e: any) {
      setError(e.message || 'Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  async function loadOneSignalData() {
    try {
      // OneSignal kullanıcı verilerini yükle - simple_users ile JOIN
      const { data: oneSignalData, error: oneSignalError } = await supabase
        .from('onesignal_users')
        .select(`
          *,
          simple_users!inner(full_name, phone, status)
        `)
        .order('created_at', { ascending: false })
      
      if (oneSignalError) throw oneSignalError
      
      const oneSignalUsers = (oneSignalData as any[]) || []
      setOneSignalUsers(oneSignalUsers)
      
      // Calculate stats
      setOneSignalStats({
        total: oneSignalUsers.length,
        pending: oneSignalUsers.filter(u => u.sync_status === 'pending').length,
        success: oneSignalUsers.filter(u => u.sync_status === 'success').length,
        failed: oneSignalUsers.filter(u => u.sync_status === 'failed').length
      })
      
    } catch (e: any) {
      console.error('OneSignal data load error:', e)
      // Hata durumunda boş stats
      setOneSignalUsers([])
      setOneSignalStats({ total: 0, pending: 0, success: 0, failed: 0 })
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

      // Membership filter
      if (membershipFilter === 'members') {
        q = q.not('user_id', 'is', null)
      } else if (membershipFilter === 'non-members') {
        q = q.is('user_id', null)
      }

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

  // Debounced search effect - arama değiştiğinde otomatik ara
  useEffect(() => {
    if (debouncedSearch.trim()) {
      void queryListings(true) // Reset page when searching
    }
  }, [debouncedSearch])

  // 🔐 GÜVENLİK KONTROLÜ - EN ÖNEMLİ!
  useEffect(() => {
    console.log('🔐 Admin güvenlik kontrolü başlatılıyor...')
    
    // Admin erişim kontrolü
    enforceAdminAccess('/')
    
    // Real-time role watcher
    const cleanup = setupAdminRoleWatcher((role) => {
      console.log('👤 User role changed:', role)
      if (role !== 'admin') {
        console.warn('⚠️ Admin rolü kaldırıldı!')
      }
    })
    
    return cleanup
  }, [])

  async function decide(id: string, decision: 'approved' | 'rejected') {
    // Güvenlik kontrolü
    if (!(await requireAdmin())) return;
    
    try {
      // İlan bilgilerini al (push notification için)
      const listing = listings.find(l => l.id === id)
      
      // RPC fonksiyonunu kullan (RLS bypass için)
      const rpcFunction = decision === 'approved' ? 'approve_listing' : 'reject_listing'
      
      // simpleAuth'dan admin ID'yi al
      const currentUser = await getCurrentUser()
      
      if (!currentUser || currentUser.role !== 'admin') {
        alert('Admin yetkisi bulunamadı. Lütfen /admin/login sayfasından tekrar giriş yapın.')
        window.location.href = '/admin/login'
        return
      }
      
      const adminId = currentUser.id
      console.log('✅ Using admin ID:', adminId)
      
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
      
      // OneSignal bildirimi gönder (sadece onaylanan ilanlar için)
      if (decision === 'approved' && listing) {
        try {
          console.log('📤 OneSignal bildirimi gönderiliyor...')
          const template = OneSignalNotificationTemplates.listingApproved(
            listing.title,
            listing.id,
            listing.user_id || 'unknown-user'
          );
          await sendOneSignalNotification(template);
          console.log('✅ İlan onayı bildirimi gönderildi');
        } catch (notificationError) {
          console.error('❌ OneSignal bildirim hatası:', notificationError);
          // Bildirim hatası ana işlemi etkilemesin
        }
      }
      
      // UI'dan ilanı kaldır
      setListings((prev) => prev.filter((l) => l.id !== id))
      
      // Başarı mesajı göster
      alert(`✅ İlan ${decision === 'approved' ? 'onaylandı' : 'reddedildi'}! ${decision === 'approved' ? 'Bildirim gönderildi.' : ''}`)
    } catch (e: any) {
      console.error('decide error:', e)
      // Hata mesajını göster
      alert('Hata: ' + (e.message || 'İlan durumu güncellenemedi'))
    }
  }

  async function deleteListing(id: string, title: string) {
    // Onay dialogu
    const confirmed = window.confirm(
      `Bu ilanı kalıcı olarak silmek istediğinize emin misiniz?\n\n` +
      `İlan: ${title}\n\n` +
      `⚠️ Bu işlem geri alınamaz!`
    )
    
    if (!confirmed) return
    
    try {
      // simpleAuth'dan admin ID'yi al
      const currentUser = await getCurrentUser()
      
      if (!currentUser || currentUser.role !== 'admin') {
        alert('Admin yetkisi bulunamadı. Lütfen /admin/login sayfasından tekrar giriş yapın.')
        window.location.href = '/admin/login'
        return
      }
      
      const adminId = currentUser.id
      console.log('✅ Using admin ID:', adminId)
      
      const { data, error } = await supabase
        .rpc('delete_listing', {
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
      
      alert('✅ İlan başarıyla silindi!')
    } catch (e: any) {
      console.error('deleteListing error:', e)
      alert('Hata: ' + (e.message || 'İlan silinemedi'))
    }
  }

  // User request onaylama/reddetme
  async function handleUserRequest(requestId: string, decision: 'approved' | 'rejected') {
    try {
      const request = userRequests.find(r => r.id === requestId)
      if (!request) return

      if (decision === 'approved') {
        // 1. User_requests'i onayla
        const { error: updateError } = await supabase
          .from('user_requests')
          .update({ 
            status: 'approved',
            approved_at: new Date().toISOString()
          })
          .eq('id', requestId)

        if (updateError) throw updateError

        // 2. Simple_users tablosuna ekle
        const { error: insertError } = await supabase
          .from('simple_users')
          .insert({
            full_name: request.full_name,
            phone: request.phone,
            password_hash: request.password_hash,
            role: 'user',
            status: 'approved'
          })

        if (insertError) {
          console.error('Simple user oluşturma hatası:', insertError)
          alert('⚠️ Başvuru onaylandı ama kullanıcı oluşturulamadı: ' + insertError.message)
        } else {
          alert('✅ Kullanıcı başvurusu onaylandı! Artık giriş yapabilir.')
        }
        
      } else {
        const { error } = await supabase
          .from('user_requests')
          .update({ 
            status: 'rejected'
          })
          .eq('id', requestId)

        if (error) throw error
        
        alert('❌ Kullanıcı başvurusu reddedildi.')
      }

      // UI'dan kaldır
      setUserRequests(prev => prev.filter(r => r.id !== requestId))
      
    } catch (error: any) {
      console.error('User request error:', error)
      alert('Hata: ' + (error.message || 'İşlem başarısız'))
    }
  }

  async function decideUser(id: string, decision: 'approved' | 'rejected') {
    // Güvenlik kontrolü
    if (!(await requireAdmin())) return;
    
    try {
      // Kullanıcı bilgilerini al (push notification için)
      const user = pendingUsers.find(u => u.id === id)
      
      // RPC fonksiyonunu kullan (RLS bypass için)
      const rpcFunction = decision === 'approved' ? 'approve_user' : 'reject_user'
      
      // simpleAuth'dan admin ID'yi al
      const currentUser = await getCurrentUser()
      
      if (!currentUser || currentUser.role !== 'admin') {
        alert('Admin yetkisi bulunamadı. Lütfen /admin/login sayfasından tekrar giriş yapın.')
        window.location.href = '/admin/login'
        return
      }
      
      const adminId = currentUser.id
      console.log('✅ Using admin ID:', adminId)
      
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
      
      // OneSignal bildirimi gönder (sadece onaylanan kullanıcılar için)
      if (decision === 'approved' && user) {
        try {
          const template = OneSignalNotificationTemplates.userApproved(
            user.full_name,
            user.id
          );
          await sendOneSignalNotification(template);
          console.log('Üyelik onayı bildirimi gönderildi');
        } catch (notificationError) {
          console.error('Bildirim gönderme hatası:', notificationError);
          // Bildirim hatası ana işlemi etkilemesin
        }
      }
      
      // Listeyi güncelle
      setPendingUsers((prev) => prev.filter((u) => u.id !== id))
      
      // Onaylanan/reddedilen listeye ekle
      if (decision === 'approved') {
        if (user) {
          setApprovedUsers((prev) => [{ ...user, status: 'approved' }, ...prev])
        }
      } else {
        if (user) {
          setRejectedUsers((prev) => [{ ...user, status: 'rejected' }, ...prev])
        }
      }
      
      alert(`✅ Kullanıcı ${decision === 'approved' ? 'onaylandı' : 'reddedildi'}! ${decision === 'approved' ? 'Bildirim gönderildi.' : ''}`)
    } catch (e: any) {
      console.error('decideUser error:', e)
      alert('Hata: ' + (e.message || 'Kullanıcı durumu güncellenemedi'))
    }
  }

  async function deleteUser(id: string, fullName: string, phone: string) {
    // Onay dialogu
    const confirmed = window.confirm(
      `Bu kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz?\n\n` +
      `Kullanıcı: ${fullName}\n` +
      `Telefon: ${phone}\n\n` +
      `⚠️ UYARI: Kullanıcının TÜM ilanları da silinecek!\n` +
      `⚠️ Bu işlem geri alınamaz!`
    )
    
    if (!confirmed) return
    
    try {
      // simpleAuth'dan admin ID'yi al
      const currentUser = await getCurrentUser()
      
      if (!currentUser || currentUser.role !== 'admin') {
        alert('Admin yetkisi bulunamadı. Lütfen /admin/login sayfasından tekrar giriş yapın.')
        window.location.href = '/admin/login'
        return
      }
      
      const adminId = currentUser.id
      console.log('✅ Using admin ID:', adminId)
      
      const { data, error } = await supabase
        .rpc('delete_user', {
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
      
      // UI'dan kullanıcıyı kaldır
      setPendingUsers((prev) => prev.filter((u) => u.id !== id))
      setApprovedUsers((prev) => prev.filter((u) => u.id !== id))
      setRejectedUsers((prev) => prev.filter((u) => u.id !== id))
      
      const deletedListings = result.deleted_listings || 0
      alert(`✅ Kullanıcı başarıyla silindi!\n${deletedListings} ilan da silindi.`)
    } catch (e: any) {
      console.error('deleteUser error:', e)
      alert('Hata: ' + (e.message || 'Kullanıcı silinemedi'))
    }
  }

  // TODO: Update this function to work with Supabase Auth password reset
  async function resetPassword(userId: string, phone: string) {
    console.log('Reset password for user:', userId, phone);
    alert('⚠️ Şifre sıfırlama özelliği şu anda devre dışı.\nSupabase Auth entegrasyonu tamamlandıktan sonra aktif olacak.')
    return
    
    /* OLD CODE - DISABLED
    const newPassword = prompt(`${phone} için yeni şifre girin:`)
    if (!newPassword) return
    
    if (newPassword.length < 6) {
      alert('Şifre en az 6 karakter olmalıdır')
      return
    }
    
    try {
      // Try simple_users first
      let updateError = null
      try {
        const { error } = await supabase
          .from('simple_users')
          .update({ password_hash: newPassword })
          .eq('id', userId)
        updateError = error
      } catch (simpleError) {
        // Fallback to profiles (though profiles doesn't have password_hash)
        console.log('simple_users güncellenemedi, profiles deneniyor')
        const { error } = await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', userId)
        updateError = error
      }
      
      if (updateError) throw updateError
      
      alert(`✅ Şifre başarıyla değiştirildi!\n\nTelefon: ${phone}\nYeni Şifre: ${newPassword}\n\nBu bilgileri kullanıcıya iletin.`)
      
      // Listeyi yenile
      await load()
    } catch (e: any) {
      alert('Hata: ' + (e.message || 'Şifre değiştirilemedi'))
    }
    */
  }

  async function toggleFeatured(id: string, currentFeatured: boolean) {
    try {
      const listing = listings.find(l => l.id === id);
      
      const { error } = await supabase
        .from('listings')
        .update({ is_featured: !currentFeatured })
        .eq('id', id)
      if (error) throw error
      
      // OneSignal bildirimi gönder (sadece öne çıkarma işlemi için)
      if (!currentFeatured && listing) {
        try {
          const template = OneSignalNotificationTemplates.featuredListing(
            listing.title,
            listing.price_tl || 0,
            listing.neighborhood || 'Bilinmiyor',
            listing.id
          );
          await sendOneSignalNotification(template);
          console.log('Öne çıkan ilan bildirimi gönderildi');
        } catch (notificationError) {
          console.error('Bildirim gönderme hatası:', notificationError);
          // Bildirim hatası ana işlemi etkilemesin
        }
      }
      
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, is_featured: !currentFeatured } : l))
      
      if (!currentFeatured) {
        alert('✅ İlan öne çıkarıldı! Tüm kullanıcılara bildirim gönderildi.');
      }
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
      const listing = listings.find(l => l.id === id);
      
      const { error } = await supabase
        .from('listings')
        .update({ is_opportunity: !currentOpportunity })
        .eq('id', id)
      if (error) throw error
      
      // OneSignal bildirimi gönder (sadece fırsat yapma işlemi için)
      if (!currentOpportunity && listing) {
        try {
          const template = OneSignalNotificationTemplates.opportunityListing(
            listing.title,
            listing.price_tl || 0,
            listing.neighborhood || 'Bilinmiyor',
            listing.id
          );
          await sendOneSignalNotification(template);
          console.log('Fırsat ilanı bildirimi gönderildi');
        } catch (notificationError) {
          console.error('Bildirim gönderme hatası:', notificationError);
          // Bildirim hatası ana işlemi etkilemesin
        }
      }
      
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, is_opportunity: !currentOpportunity } : l))
      
      if (!currentOpportunity) {
        alert('✅ İlan fırsat ilanı yapıldı! Tüm kullanıcılara bildirim gönderildi.');
      }
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



  async function loadUserListings(userId: string, phone: string) {
    setSelectedUserId(userId)
    setUserListingsLoading(true)
    try {
      // Telefon numarasına göre ilanları getir
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('owner_phone', phone)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUserListings((data as Listing[]) || [])
    } catch (e: any) {
      console.error('Kullanıcı ilanları yüklenirken hata:', e)
      alert('Hata: ' + (e.message || 'İlanlar yüklenemedi'))
    } finally {
      setUserListingsLoading(false)
    }
  }

  async function loadUserListingsCounts() {
    try {
      // Tüm kullanıcılar için ilan sayılarını getir
      const allUsers = [...pendingUsers, ...approvedUsers, ...rejectedUsers]
      const counts: Record<string, { pending: number; approved: number; rejected: number }> = {}
      
      for (const user of allUsers) {
        const { data, error } = await supabase
          .from('listings')
          .select('status')
          .eq('owner_phone', user.phone)
        
        if (!error && data) {
          counts[user.id] = {
            pending: data.filter(l => l.status === 'pending').length,
            approved: data.filter(l => l.status === 'approved').length,
            rejected: data.filter(l => l.status === 'rejected').length
          }
        }
      }
      
      setUserListingsCounts(counts)
    } catch (e: any) {
      console.error('İlan sayıları yüklenirken hata:', e)
    }
  }

  useEffect(() => {
    if (activeTab === 'users' && (pendingUsers.length > 0 || approvedUsers.length > 0 || rejectedUsers.length > 0)) {
      void loadUserListingsCounts()
    }
  }, [activeTab, pendingUsers, approvedUsers, rejectedUsers])
  return (
    <AdminGate>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 admin-quicksand">
      {/* Modern Admin Header */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/95 via-purple-900/90 to-pink-900/95 backdrop-blur-sm"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <span className="text-3xl sm:text-4xl">👑</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-400 rounded-full border-2 sm:border-4 border-white shadow-lg"></div>
              </div>

              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    Admin Panel
                  </h1>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow-lg">
                    PRO
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                    <span className="text-xl sm:text-2xl">👤</span>
                    <div>
                      <div className="text-white font-bold text-xs sm:text-sm">Admin Yönetici</div>
                      <div className="text-purple-200 text-xs hidden sm:block">Tam Yetki • Süper Admin</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <div className="flex lg:hidden items-center gap-2 flex-1">
                <div className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <div className="text-lg font-bold text-white">{totalCount}</div>
                  <div className="text-xs text-white/70">İlanlar</div>
                </div>
                <div className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <div className="text-lg font-bold text-white">{pendingUsers.length}</div>
                  <div className="text-xs text-white/70">Bekleyen</div>
                </div>
              </div>
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


            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 48h1440V0c-240 48-480 48-720 24C480 0 240 0 0 24v24z" fill="currentColor" className="text-gray-50"/>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Modern Tab Navigation */}
      <div className="mb-8">
        <div className="flex gap-4 bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-2xl shadow-lg border border-gray-200">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 px-8 py-4 font-bold text-base rounded-xl transition-all duration-300 relative transform hover:scale-105 ${
              activeTab === 'listings'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-200 border-2 border-blue-300'
                : 'bg-white text-gray-700 hover:text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg border-2 border-transparent hover:border-blue-200'
            }`}
          >
            <span className="flex items-center justify-center gap-3 text-lg">
              📋 İlanlar
              {status === 'pending' && listings.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg">
                  {totalCount}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-8 py-4 font-bold text-base rounded-xl transition-all duration-300 relative transform hover:scale-105 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl shadow-green-200 border-2 border-green-300'
                : 'bg-white text-gray-700 hover:text-green-600 hover:bg-green-50 shadow-md hover:shadow-lg border-2 border-transparent hover:border-green-200'
            }`}
          >
            <span className="flex items-center justify-center gap-3 text-lg">
              👥 Üyeler
              {(pendingUsers.length > 0 || userRequests.filter(r => r.status === 'pending').length > 0) && (
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg">
                  {pendingUsers.length + userRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('onesignal')}
            className={`flex-1 px-8 py-4 font-bold text-base rounded-xl transition-all duration-300 relative transform hover:scale-105 ${
              activeTab === 'onesignal'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl shadow-purple-200 border-2 border-purple-300'
                : 'bg-white text-gray-700 hover:text-purple-600 hover:bg-purple-50 shadow-md hover:shadow-lg border-2 border-transparent hover:border-purple-200'
            }`}
          >
            <span className="flex items-center justify-center gap-3 text-lg">
              🔔 OneSignal
              {oneSignalStats.failed > 0 && (
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg">
                  {oneSignalStats.failed}
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
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
          <label className="block text-xs text-gray-600 mb-1">Üyelik Durumu</label>
          <select className="w-full rounded-lg border px-3 py-2" value={membershipFilter} onChange={(e) => { setMembershipFilter(e.target.value as any); void queryListings(true) }}>
            <option value="all">Tümü</option>
            <option value="members">Sadece Üyeler</option>
            <option value="non-members">Sadece Üye Olmayanlar</option>
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
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Yükleniyor...
            </div>
          ) : listings.length === 0 ? (
            <div className="text-gray-600">Kriterlere uygun ilan bulunamadı.</div>
          ) : (
            <div className="space-y-4">
              {listings.map((l) => (
                <div key={l.id} className="group relative rounded-2xl border border-gray-200 p-6 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
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
                  
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                    <div className="flex-1 w-full lg:pr-24">
                      <div className="font-bold text-xl text-gray-900 mb-3">{l.title}</div>
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

                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-sm text-gray-600">
                          📍 {l.neighborhood || 'Mahalle yok'}
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          💰 {l.price_tl ? `${l.price_tl.toLocaleString('tr-TR')} TL` : 'Fiyat yok'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-sm font-medium text-gray-700">
                          👤 {l.owner_name}
                        </span>
                        <span className="text-sm text-gray-600">
                          📞 {l.owner_phone}
                        </span>
                      </div>

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
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto lg:min-w-[140px]">
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
                      <button onClick={() => void deleteListing(l.id, l.title)} className="group/btn rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2.5 text-sm font-semibold hover:from-red-700 hover:to-red-900 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                        <span className="flex items-center justify-center gap-2">
                          🗑️ Sil
                        </span>
                      </button>
                      {/* Üyelik Badge - Butonların Altında */}
                      {!l.user_id && (
                        <div className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 text-sm font-bold shadow-lg animate-pulse text-center border-2 border-orange-600">
                          ⚠️ ÜYE DEĞİL
                        </div>
                      )}
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
          {/* User Requests Bölümü */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📝 Kayıt Başvuruları ({userRequests.filter(r => r.status === 'pending').length})</h2>
            {userRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="text-gray-600 bg-gray-50 rounded-lg p-4 text-center">Bekleyen kayıt başvurusu yok.</div>
            ) : (
              <div className="space-y-3">
                {userRequests.filter(r => r.status === 'pending').map((request) => (
                  <div key={request.id} className="rounded-xl border border-yellow-200 p-4 bg-gradient-to-br from-white to-yellow-50 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{request.full_name}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            📝 Başvuru
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>📞 <span className="font-medium">{request.phone}</span></div>
                          <div>📅 <span className="font-medium">{new Date(request.created_at).toLocaleDateString('tr-TR')}</span></div>
                          <div>🔐 Şifre Hash: <span className="font-mono text-xs">{request.password_hash}</span></div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                        <button 
                          onClick={() => handleUserRequest(request.id, 'approved')}
                          className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                          ✅ Onayla
                        </button>
                        <button 
                          onClick={() => handleUserRequest(request.id, 'rejected')}
                          className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2.5 text-sm font-semibold hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                          ❌ Reddet
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h2 className="text-xl font-semibold mb-4">👥 Üye Yönetimi</h2>
          
          {loading ? (
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Yükleniyor...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bekleyen Üyeler Tablosu */}
              {pendingUsers.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      ⏳ Bekleyen Üyeler ({pendingUsers.length})
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Üye Bilgileri</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İletişim</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">İlan Sayısı</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Başvuru Tarihi</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pendingUsers.map((u) => {
                          const totalListings = userListingsCounts[u.id] 
                            ? userListingsCounts[u.id].pending + userListingsCounts[u.id].approved + userListingsCounts[u.id].rejected 
                            : 0;
                          
                          return (
                            <tr key={u.id} className="hover:bg-yellow-50 transition-colors duration-200">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">👤</span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{u.full_name || 'Ad Soyad (eksik)'}</div>
                                    <div className="text-xs text-yellow-600 font-medium">⏳ Onay Bekliyor</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 font-medium">{u.phone}</div>
                                <div className="text-xs text-gray-500">Telefon</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {totalListings > 0 ? (
                                  <button 
                                    onClick={() => void loadUserListings(u.id, u.phone)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold hover:bg-blue-200 transition-colors"
                                  >
                                    📋 {totalListings}
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-sm">0</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{formatDate(u.created_at)}</div>
                                <div className="text-xs text-gray-500">{daysSince(u.created_at)} önce</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => void decideUser(u.id, 'approved')}
                                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                    title="Onayla"
                                  >
                                    ✓
                                  </button>
                                  <button 
                                    onClick={() => void decideUser(u.id, 'rejected')}
                                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                    title="Reddet"
                                  >
                                    ✕
                                  </button>
                                  <button 
                                    onClick={() => void deleteUser(u.id, u.full_name, u.phone)}
                                    className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    title="Sil"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Onaylanmış Üyeler Tablosu */}
              {approvedUsers.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      ✅ Onaylanmış Üyeler ({approvedUsers.length})
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Üye Bilgileri</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İletişim</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">İlan Sayısı</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Üyelik Tarihi</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {approvedUsers.map((u) => {
                          const totalListings = userListingsCounts[u.id] 
                            ? userListingsCounts[u.id].pending + userListingsCounts[u.id].approved + userListingsCounts[u.id].rejected 
                            : 0;
                          
                          return (
                            <tr key={u.id} className="hover:bg-green-50 transition-colors duration-200">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">✓</span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{u.full_name || 'Ad Soyad (eksik)'}</div>
                                    <div className="text-xs text-green-600 font-medium">✅ Aktif Üye</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 font-medium">{u.phone}</div>
                                <div className="text-xs text-gray-500">Telefon</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {totalListings > 0 ? (
                                  <button 
                                    onClick={() => void loadUserListings(u.id, u.phone)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold hover:bg-blue-200 transition-colors"
                                  >
                                    📋 {totalListings}
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-sm">0</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{formatDate(u.created_at)}</div>
                                <div className="text-xs text-gray-500">{daysSince(u.created_at)} önce</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => void resetPassword(u.id, u.phone)}
                                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                    title="Şifre Sıfırla"
                                  >
                                    🔑
                                  </button>
                                  <button 
                                    onClick={() => void deleteUser(u.id, u.full_name, u.phone)}
                                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                    title="Sil"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Reddedilen Üyeler Tablosu */}
              {rejectedUsers.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      ❌ Reddedilen Üyeler ({rejectedUsers.length})
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Üye Bilgileri</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İletişim</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">İlan Sayısı</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Red Tarihi</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rejectedUsers.map((u) => {
                          const totalListings = userListingsCounts[u.id] 
                            ? userListingsCounts[u.id].pending + userListingsCounts[u.id].approved + userListingsCounts[u.id].rejected 
                            : 0;
                          
                          return (
                            <tr key={u.id} className="hover:bg-red-50 transition-colors duration-200">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">✕</span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{u.full_name || 'Ad Soyad (eksik)'}</div>
                                    <div className="text-xs text-red-600 font-medium">❌ Reddedildi</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 font-medium">{u.phone}</div>
                                <div className="text-xs text-gray-500">Telefon</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {totalListings > 0 ? (
                                  <button 
                                    onClick={() => void loadUserListings(u.id, u.phone)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold hover:bg-blue-200 transition-colors"
                                  >
                                    📋 {totalListings}
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-sm">0</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{formatDate(u.created_at)}</div>
                                <div className="text-xs text-gray-500">{daysSince(u.created_at)} önce</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => void decideUser(u.id, 'approved')}
                                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                    title="Onayla"
                                  >
                                    ✓
                                  </button>
                                  <button 
                                    onClick={() => void deleteUser(u.id, u.full_name, u.phone)}
                                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                    title="Sil"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Boş Durum */}
              {pendingUsers.length === 0 && approvedUsers.length === 0 && rejectedUsers.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz üye yok</h3>
                  <p className="text-gray-600">Üye başvuruları geldiğinde burada görünecek.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* OneSignal Tab */}
      {activeTab === 'onesignal' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">OneSignal Senkronizasyon Durumu</h2>
          
          {/* OneSignal Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{oneSignalStats.total}</div>
              <div className="text-sm text-blue-600">Toplam Kullanıcı</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">{oneSignalStats.pending}</div>
              <div className="text-sm text-yellow-600">Bekleyen</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{oneSignalStats.success}</div>
              <div className="text-sm text-green-600">Başarılı</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{oneSignalStats.failed}</div>
              <div className="text-sm text-red-600">Başarısız</div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="mb-6">
            <button 
              onClick={() => void loadOneSignalData()}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 font-semibold hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              🔄 Verileri Yenile
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Yükleniyor...
            </div>
          ) : oneSignalUsers.length === 0 ? (
            <div className="text-gray-600 bg-gray-50 rounded-lg p-4 text-center">
              Henüz OneSignal'a senkronize edilmiş kullanıcı yok.
            </div>
          ) : (
            <div className="space-y-4">
              {oneSignalUsers.map((osUser: any) => (
                <div key={osUser.id} className="group relative rounded-2xl border border-gray-200 p-6 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                  <div className="absolute top-4 right-4">
                    {osUser.sync_status === 'pending' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse">
                        ⏳ Bekliyor
                      </span>
                    )}
                    {osUser.sync_status === 'success' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        ✓ Başarılı
                      </span>
                    )}
                    {osUser.sync_status === 'failed' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        ✕ Başarısız
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                    <div className="flex-1 w-full lg:pr-24">
                      <div className="font-bold text-xl text-gray-900 mb-3">
                        {osUser.simple_users?.full_name || 'Bilinmeyen Kullanıcı'}
                      </div>
                      
                      <div className="flex flex-col gap-2 mb-3">
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">📞 Telefon:</span>
                          <span className="text-sm text-gray-900 font-semibold">{osUser.simple_users?.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">🆔 External ID:</span>
                          <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-md text-gray-900">{osUser.onesignal_external_id}</span>
                        </div>
                        {osUser.onesignal_user_id && (
                          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                            <span className="text-sm font-medium text-gray-700">🔔 OneSignal ID:</span>
                            <span className="font-mono text-sm bg-blue-100 px-3 py-1 rounded-md text-blue-900">{osUser.onesignal_user_id}</span>
                          </div>
                        )}
                        {osUser.sync_error && (
                          <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                            <span className="text-sm font-medium text-red-700">❌ Hata:</span>
                            <span className="text-sm text-red-800 flex-1">{osUser.sync_error}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>🕐 Oluşturulma: {formatDate(osUser.created_at)}</span>
                        {osUser.last_sync_at && (
                          <span>🔄 Son Sync: {formatDate(osUser.last_sync_at)}</span>
                        )}
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                          👤 {osUser.simple_users?.status || 'Bilinmiyor'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 w-full lg:w-auto lg:min-w-[140px]">
                      {osUser.sync_status === 'failed' && (
                        <button 
                          onClick={async () => {
                            try {
                              // Retry sync by calling the edge function
                              const { error } = await supabase.functions.invoke('create-onesignal-user', {
                                body: {
                                  user_id: osUser.user_id,
                                  full_name: osUser.simple_users?.full_name,
                                  phone: osUser.simple_users?.phone
                                }
                              })
                              
                              if (error) throw error
                              
                              alert('✅ Yeniden senkronizasyon başlatıldı!')
                              await loadOneSignalData() // Refresh data
                            } catch (e: any) {
                              alert('Hata: ' + (e.message || 'Senkronizasyon başlatılamadı'))
                            }
                          }}
                          className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2.5 text-sm font-semibold hover:from-orange-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                          🔄 Yeniden Dene
                        </button>
                      )}
                      
                      <button 
                        onClick={async () => {
                          const confirmed = window.confirm(
                            `OneSignal senkronizasyon kaydını silmek istediğinize emin misiniz?\n\n` +
                            `Kullanıcı: ${osUser.simple_users?.full_name}\n` +
                            `Bu işlem geri alınamaz!`
                          )
                          
                          if (!confirmed) return
                          
                          try {
                            const { error } = await supabase
                              .from('onesignal_users')
                              .delete()
                              .eq('id', osUser.id)
                            
                            if (error) throw error
                            
                            alert('✅ OneSignal kaydı silindi!')
                            await loadOneSignalData() // Refresh data
                          } catch (e: any) {
                            alert('Hata: ' + (e.message || 'Kayıt silinemedi'))
                          }
                        }}
                        className="rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2.5 text-sm font-semibold hover:from-red-700 hover:to-red-900 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>

    {/* Kullanıcı İlanları Modal */}
    {selectedUserId && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUserId(null)}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Kullanıcı İlanları</h3>
            <button 
              onClick={() => setSelectedUserId(null)}
              className="text-white hover:bg-white/20 rounded-lg px-3 py-1 transition-colors"
            >
              ✕ Kapat
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {userListingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-purple-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span className="ml-3 text-gray-600">İlanlar yükleniyor...</span>
              </div>
            ) : userListings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600">Bu kullanıcının henüz ilanı yok.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* İstatistikler */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-700">{userListings.filter(l => l.status === 'pending').length}</div>
                    <div className="text-sm text-yellow-600">Bekleyen</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{userListings.filter(l => l.status === 'approved').length}</div>
                    <div className="text-sm text-green-600">Onaylı</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-700">{userListings.filter(l => l.status === 'rejected').length}</div>
                    <div className="text-sm text-red-600">Reddedilen</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{userListings.filter(l => l.user_id).length}</div>
                    <div className="text-sm text-blue-600">Üyeli İlan</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-orange-700">{userListings.filter(l => !l.user_id).length}</div>
                    <div className="text-sm text-orange-600">Üyesiz İlan</div>
                  </div>
                </div>

                {/* İlan Listesi */}
                {userListings.map((listing) => (
                  <div key={listing.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{listing.title}</h4>
                          {listing.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Bekliyor</span>
                          )}
                          {listing.status === 'approved' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Onaylı</span>
                          )}
                          {listing.status === 'rejected' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Reddedildi</span>
                          )}
                          {!listing.user_id && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full border border-orange-600">
                              ⚠️ Üye Değil
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          <span>{listing.property_type}</span>
                          <span>•</span>
                          <span>{listing.rooms}</span>
                          <span>•</span>
                          <span>{listing.area_m2} m²</span>
                          <span>•</span>
                          <span className="font-semibold text-green-600">{listing.price_tl?.toLocaleString('tr-TR')} TL</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(listing.created_at)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {listing.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => { void decide(listing.id, 'approved'); setUserListings(prev => prev.filter(l => l.id !== listing.id)) }}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700"
                            >
                              ✓
                            </button>
                            <button 
                              onClick={() => { void decide(listing.id, 'rejected'); setUserListings(prev => prev.filter(l => l.id !== listing.id)) }}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                            >
                              ✕
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => { void deleteListing(listing.id, listing.title); setUserListings(prev => prev.filter(l => l.id !== listing.id)) }}
                          className="px-3 py-1.5 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </AdminGate>
  )
}

export default AdminPage