import { supabase } from './supabaseClient'

/**
 * Telefon numarasına göre onaylı üye kontrolü yapar
 * @param phone - Telefon numarası
 * @returns Üye bilgisi veya null
 */
export async function checkApprovedMembership(phone: string): Promise<{
  isMember: boolean
  userId: string | null
  userName: string | null
}> {
  try {
    // Telefon numarasını temizle
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Önce simple_users tablosunda ara
    try {
      const { data: simpleUserData, error: simpleUserError } = await supabase
        .from('simple_users')
        .select('id, full_name, status')
        .eq('phone', cleanPhone)
        .eq('status', 'approved')
        .single()

      if (!simpleUserError && simpleUserData) {
        return {
          isMember: true,
          userId: simpleUserData.id,
          userName: simpleUserData.full_name
        }
      }
    } catch (simpleError) {
      console.log('simple_users tablosu erişilemez:', simpleError)
    }

    // Fallback: profiles tablosunda ara
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, status')
      .eq('phone', cleanPhone)
      .eq('status', 'approved')
      .single()

    if (error || !data) {
      return {
        isMember: false,
        userId: null,
        userName: null
      }
    }

    return {
      isMember: true,
      userId: data.id,
      userName: data.full_name
    }
  } catch (error) {
    console.error('Üyelik kontrolü hatası:', error)
    return {
      isMember: false,
      userId: null,
      userName: null
    }
  }
}

/**
 * Telefon numarasına göre bekleyen üyelik başvurusu kontrolü
 * @param phone - Telefon numarası
 * @returns Bekleyen başvuru var mı?
 */
export async function checkPendingMembership(phone: string): Promise<boolean> {
  try {
    const cleanPhone = phone.replace(/\D/g, '')
    
    // user_requests tablosunda bekleyen başvuru ara
    const { data, error } = await supabase
      .from('user_requests')
      .select('id')
      .eq('phone', cleanPhone)
      .eq('status', 'pending')
      .single()

    return !error && !!data
  } catch (error) {
    return false
  }
}
