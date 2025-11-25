import { supabase } from './supabaseClient'

/**
 * Telefon numarasını normalize eder (sadece rakamlar)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Telefon numarası formatını kontrol eder
 */
export function isValidPhoneFormat(phone: string): boolean {
  const normalized = normalizePhone(phone)
  // Türkiye için: 10 haneli (5xxxxxxxxx) veya 11 haneli (05xxxxxxxxx)
  return normalized.length === 10 || normalized.length === 11
}

/**
 * Telefon numarasını güzel formatta gösterir
 */
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone)
  
  if (normalized.length === 10) {
    // 5551234567 -> 555 123 45 67
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8)}`
  } else if (normalized.length === 11) {
    // 05551234567 -> 0555 123 45 67
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 9)} ${normalized.slice(9)}`
  }
  
  return phone
}

/**
 * Telefon numarasının daha önce kullanılıp kullanılmadığını kontrol eder
 */
export async function checkPhoneExists(phone: string): Promise<{
  exists: boolean
  listingCount: number
  pendingCount: number
  approvedCount: number
  message?: string
}> {
  try {
    const normalized = normalizePhone(phone)
    
    if (!isValidPhoneFormat(phone)) {
      return {
        exists: false,
        listingCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        message: 'Geçersiz telefon numarası formatı'
      }
    }

    // Supabase RPC function'ı çağır
    const { data, error } = await supabase
      .rpc('check_phone_exists', { phone_number: normalized })
      .single()

    if (error) {
      console.error('Telefon kontrolü hatası:', error)
      // Hata durumunda devam etmesine izin ver (fail-safe)
      return {
        exists: false,
        listingCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        message: 'Kontrol yapılamadı'
      }
    }

    const responseData = data as any
    const result: {
      exists: boolean
      listingCount: number
      pendingCount: number
      approvedCount: number
      message?: string
    } = {
      exists: responseData?.exists || false,
      listingCount: responseData?.listing_count || 0,
      pendingCount: responseData?.pending_count || 0,
      approvedCount: responseData?.approved_count || 0
    }

    // Mesaj oluştur
    if (result.pendingCount > 0) {
      result.message = `Bu telefon numarasıyla ${result.pendingCount} adet bekleyen ilan var. Lütfen önceki ilanınızın onaylanmasını bekleyin.`
    } else if (result.approvedCount >= 5) {
      result.message = `Bu telefon numarasıyla ${result.approvedCount} adet aktif ilan var. Çok fazla ilan vermek spam olarak algılanabilir.`
    } else if (result.approvedCount > 0) {
      result.message = `Bu telefon numarasıyla ${result.approvedCount} adet aktif ilan mevcut.`
    }

    return result
  } catch (error) {
    console.error('Telefon kontrolü hatası:', error)
    return {
      exists: false,
      listingCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      message: 'Kontrol yapılamadı'
    }
  }
}

/**
 * Telefon numarasının ilan vermesine izin verilip verilmediğini kontrol eder
 */
export async function canPhoneCreateListing(phone: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const check = await checkPhoneExists(phone)
  
  // Bekleyen ilan varsa izin verme
  if (check.pendingCount > 0) {
    return {
      allowed: false,
      reason: check.message || 'Bu telefon numarasıyla bekleyen ilan var'
    }
  }
  
  // 10'dan fazla aktif ilan varsa uyar ama izin ver
  if (check.approvedCount >= 10) {
    return {
      allowed: true,
      reason: 'Çok fazla aktif ilanınız var. Spam olarak algılanabilir.'
    }
  }
  
  return { allowed: true }
}
