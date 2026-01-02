import { getCurrentUser } from './simpleAuth'

declare global {
  interface Window {
    OneSignal: any;
    handleOneSignalLogin: (userId: string, userInfo: any) => Promise<void>;
    handleOneSignalLogout: () => Promise<void>;
  }
}

/**
 * OneSignal hibrit yaklaşım - kullanıcı giriş yaptığında çağrılır
 * Anonymous kullanıcıları authenticated kullanıcıya dönüştürür
 */
export async function syncUserToOneSignal(): Promise<void> {
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    console.log('🔔 OneSignal: Kullanıcı giriş yapmamış, hibrit sync yapılmayacak')
    return
  }

  try {
    // Global login handler'ı çağır (index.html'de tanımlı)
    if (window.handleOneSignalLogin) {
      await window.handleOneSignalLogin(currentUser.id, currentUser)
      console.log('🔔 OneSignal: Hibrit login başarılı:', currentUser.id)
    } else {
      console.warn('🔔 OneSignal: handleOneSignalLogin fonksiyonu bulunamadı')
    }
  } catch (error) {
    console.error('🔔 OneSignal: Hibrit login hatası:', error)
  }
}

/**
 * OneSignal hibrit yaklaşım - kullanıcı çıkış yaptığında çağrılır
 * Authenticated kullanıcıyı anonymous kullanıcıya dönüştürür
 */
export async function clearOneSignalUserData(): Promise<void> {
  try {
    // Global logout handler'ı çağır (index.html'de tanımlı)
    if (window.handleOneSignalLogout) {
      await window.handleOneSignalLogout()
      console.log('🔔 OneSignal: Hibrit logout başarılı')
    } else {
      console.warn('🔔 OneSignal: handleOneSignalLogout fonksiyonu bulunamadı')
    }
  } catch (error) {
    console.error('🔔 OneSignal: Hibrit logout hatası:', error)
  }
}

/**
 * OneSignal subscription değişikliklerini dinle
 * Hibrit yaklaşımda bu otomatik olarak index.html'de yapılıyor
 */
export function setupOneSignalUserSync(): void {
  console.log('🔔 OneSignal: Hibrit yaklaşım kullanılıyor - setup otomatik')
  // Hibrit yaklaşımda bu işlem index.html'de otomatik olarak yapılıyor
}

/**
 * Manuel kullanıcı bilgisi güncelleme (eski API uyumluluğu için)
 * Hibrit yaklaşımda login/logout kullanılması önerilir
 */
export async function updateUserTags(): Promise<void> {
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    console.log('🔔 OneSignal: Kullanıcı giriş yapmamış, tags güncellenemez')
    return
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

    // OneSignalDeferred kullanarak kullanıcı bilgilerini güncelle
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(function(OneSignal: any) {
      try {
        // External ID olarak Supabase user ID'sini kullan
        OneSignal.User.addAlias('external_id', currentUser.id)
        
        // Kullanıcı bilgilerini tags olarak güncelle
        OneSignal.User.addTags({
          'first_name': firstName,
          'last_name': lastName,
          'phone_number': phoneNumber,
          'user_id': currentUser.id,
          'user_status': currentUser.status,
          'user_role': currentUser.role,
          'sync_source': 'manual_update',
          'last_sync': new Date().toISOString()
        })

        // Email subscription ekle (eğer email varsa)
        if (currentUser.email && currentUser.email.trim()) {
          try {
            OneSignal.User.addEmail(currentUser.email.trim())
            console.log('🔔 OneSignal: Email subscription eklendi:', currentUser.email)
          } catch (emailError) {
            console.warn('🔔 OneSignal: Email subscription hatası:', emailError)
          }
        }

        // SMS subscription ekle (telefon numarası ile)
        if (phoneNumber) {
          try {
            OneSignal.User.addSms(phoneNumber)
            console.log('🔔 OneSignal: SMS subscription eklendi:', phoneNumber)
          } catch (smsError) {
            console.warn('🔔 OneSignal: SMS subscription hatası:', smsError)
          }
        }
        
        console.log('🔔 OneSignal: Kullanıcı bilgileri güncellendi (manuel)', {
          firstName,
          lastName,
          phoneNumber,
          userId: currentUser.id,
          email: currentUser.email || 'yok'
        })
      } catch (error) {
        console.error('🔔 OneSignal: Tags güncellenirken hata:', error)
      }
    })

  } catch (error) {
    console.error('🔔 OneSignal: Manuel tag güncelleme hatası:', error)
  }
}