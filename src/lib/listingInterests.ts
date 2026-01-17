import { supabase } from './supabaseClient'

/**
 * İlana ilgi kaydeder
 * @param listingId - İlan ID
 * @returns Başarı durumu
 */
export async function recordListingInterest(listingId: string): Promise<boolean> {
  try {
    // Aynı kullanıcının 24 saat içinde tekrar kayıt yapmasını önle
    const storageKey = `interest_${listingId}`
    const lastInterest = localStorage.getItem(storageKey)
    
    if (lastInterest) {
      const lastTime = new Date(lastInterest).getTime()
      const now = Date.now()
      const hoursPassed = (now - lastTime) / (1000 * 60 * 60)
      
      // 24 saat geçmemişse kaydetme
      if (hoursPassed < 24) {
        return true // Sessizce başarılı dön (kullanıcı fark etmesin)
      }
    }

    // İlgi kaydını veritabanına ekle
    const { error } = await supabase
      .from('listing_interests')
      .insert({
        listing_id: listingId,
        interested_at: new Date().toISOString()
      })

    if (error) {
      console.error('İlgi kaydı hatası:', error)
      return false
    }

    // LocalStorage'a kaydet (24 saat kontrolü için)
    localStorage.setItem(storageKey, new Date().toISOString())
    
    return true
  } catch (error) {
    console.error('İlgi kaydı hatası:', error)
    return false
  }
}

/**
 * İlan için ilgi sayısını getirir
 * @param listingId - İlan ID
 * @returns İlgi sayısı
 */
export async function getListingInterestCount(listingId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('listing_interests')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId)

    if (error) {
      console.error('İlgi sayısı getirme hatası:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('İlgi sayısı getirme hatası:', error)
    return 0
  }
}

/**
 * Birden fazla ilan için ilgi sayılarını getirir
 * @param listingIds - İlan ID'leri
 * @returns İlan ID -> İlgi sayısı map'i
 */
export async function getMultipleListingInterestCounts(
  listingIds: string[]
): Promise<Record<string, number>> {
  try {
    // View yerine doğrudan listing_interests tablosundan aggregate et
    const { data, error } = await supabase
      .from('listing_interests')
      .select('listing_id')
      .in('listing_id', listingIds)

    if (error) {
      console.error('Toplu ilgi sayısı getirme hatası:', error)
      return {}
    }

    // Manuel olarak count'ları hesapla
    const result: Record<string, number> = {}
    
    // Önce tüm listing_id'leri 0 ile initialize et
    listingIds.forEach(id => {
      result[id] = 0
    })
    
    // Sonra gerçek count'ları hesapla
    data?.forEach((item) => {
      result[item.listing_id] = (result[item.listing_id] || 0) + 1
    })

    return result
  } catch (error) {
    console.error('Toplu ilgi sayısı getirme hatası:', error)
    return {}
  }
}

/**
 * Son 7 gün içindeki ilgi sayısını getirir
 * @param listingId - İlan ID
 * @returns Son 7 gündeki ilgi sayısı
 */
export async function getRecentInterestCount(listingId: string): Promise<number> {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count, error } = await supabase
      .from('listing_interests')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId)
      .gte('interested_at', sevenDaysAgo.toISOString())

    if (error) {
      console.error('Son ilgi sayısı getirme hatası:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Son ilgi sayısı getirme hatası:', error)
    return 0
  }
}
