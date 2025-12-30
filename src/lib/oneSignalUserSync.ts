import { getCurrentUser } from './simpleAuth'

declare global {
  interface Window {
    OneSignal: any;
  }
}

/**
 * OneSignal kullanıcı bilgilerini senkronize et
 * Kullanıcı giriş yaptığında ve subscribe olduğunda çağrılır
 */
export async function syncUserToOneSignal(): Promise<void> {
  const currentUser = getCurrentUser()
  
  if (!currentUser) {
    console.log('🔔 OneSignal: Kullanıcı giriş yapmamış, tags eklenmeyecek')
    return
  }

  // OneSignal yüklenene kadar bekle
  if (typeof window.OneSignal === 'undefined') {
    console.log('🔔 OneSignal: SDK henüz yüklenmemiş, bekliyor...')
    
    // OneSignal yüklenene kadar bekle (max 10 saniye)
    let attempts = 0
    const maxAttempts = 50 // 10 saniye (200ms * 50)
    
    while (typeof window.OneSignal === 'undefined' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 200))
      attempts++
    }
    
    if (typeof window.OneSignal === 'undefined') {
      console.error('🔔 OneSignal: SDK yüklenemedi')
      return
    }
  }

  try {
    // İsim ve soyismi ayır
    const nameParts = currentUser.full_name.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Telefon numarasını normalize et
    const phoneNumber = currentUser.phone.startsWith('+90') 
      ? currentUser.phone 
      : `+90${currentUser.phone.replace(/\D/g, '')}`

    // OneSignal'a kullanıcı bilgilerini tags olarak ekle
    window.OneSignal.push(function() {
      // External ID olarak Supabase user ID'sini kullan
      window.OneSignal.User.addAlias('external_id', currentUser.id)
      
      // Kullanıcı bilgilerini tags olarak ekle
      window.OneSignal.User.addTags({
        'first_name': firstName,
        'last_name': lastName,
        'phone_number': phoneNumber,
        'user_id': currentUser.id,
        'user_status': currentUser.status,
        'user_role': currentUser.role,
        'sync_source': 'pwa_login',
        'last_sync': new Date().toISOString()
      })
      
      console.log('🔔 OneSignal: Kullanıcı bilgileri eklendi', {
        firstName,
        lastName,
        phoneNumber,
        userId: currentUser.id,
        status: currentUser.status,
        role: currentUser.role
      })
    })

  } catch (error) {
    console.error('🔔 OneSignal: Kullanıcı bilgileri eklenirken hata:', error)
  }
}

/**
 * OneSignal subscription değişikliklerini dinle
 * Kullanıcı subscribe olduğunda otomatik olarak bilgilerini ekle
 */
export function setupOneSignalUserSync(): void {
  if (typeof window.OneSignal === 'undefined') {
    console.log('🔔 OneSignal: SDK henüz yüklenmemiş, listener kurulacak...')
    
    // OneSignal yüklendiğinde listener'ı kur
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(function(OneSignal: any) {
      setupSubscriptionListener(OneSignal)
    })
  } else {
    setupSubscriptionListener(window.OneSignal)
  }
}

function setupSubscriptionListener(OneSignal: any): void {
  try {
    // Subscription değişikliklerini dinle
    OneSignal.push(function() {
      OneSignal.on('subscriptionChange', function(isSubscribed: boolean) {
        console.log('🔔 OneSignal: Subscription değişti:', isSubscribed)
        
        if (isSubscribed === true) {
          console.log('🔔 OneSignal: Kullanıcı subscribe oldu, bilgiler ekleniyor...')
          // Kullanıcı subscribe olduğunda bilgilerini ekle
          setTimeout(() => {
            syncUserToOneSignal()
          }, 1000) // 1 saniye bekle, OneSignal'ın hazır olması için
        }
      })
    })

    // Sayfa yüklendiğinde mevcut subscription durumunu kontrol et
    OneSignal.push(function() {
      OneSignal.User.PushSubscription.optedIn.then((isOptedIn: boolean) => {
        if (isOptedIn) {
          console.log('🔔 OneSignal: Kullanıcı zaten subscribe, bilgiler kontrol ediliyor...')
          // Zaten subscribe ise bilgileri güncelle
          setTimeout(() => {
            syncUserToOneSignal()
          }, 2000) // 2 saniye bekle
        }
      }).catch((error: any) => {
        console.log('🔔 OneSignal: Subscription durumu kontrol edilemedi:', error)
      })
    })

    console.log('🔔 OneSignal: User sync listener kuruldu')
  } catch (error) {
    console.error('🔔 OneSignal: Listener kurulurken hata:', error)
  }
}

/**
 * Kullanıcı çıkış yaptığında OneSignal'dan bilgileri temizle
 */
export async function clearOneSignalUserData(): Promise<void> {
  if (typeof window.OneSignal === 'undefined') {
    console.log('🔔 OneSignal: SDK yüklü değil, temizlik yapılamıyor')
    return
  }

  try {
    window.OneSignal.push(function() {
      // Kullanıcı bilgilerini temizle
      window.OneSignal.User.removeTags([
        'first_name',
        'last_name', 
        'phone_number',
        'user_id',
        'user_status',
        'user_role',
        'sync_source',
        'last_sync'
      ])
      
      // External ID'yi temizle
      window.OneSignal.User.removeAlias('external_id')
      
      console.log('🔔 OneSignal: Kullanıcı bilgileri temizlendi')
    })
  } catch (error) {
    console.error('🔔 OneSignal: Kullanıcı bilgileri temizlenirken hata:', error)
  }
}