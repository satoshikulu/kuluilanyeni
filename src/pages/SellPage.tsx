import { useMemo, useState } from 'react'
import NeighborhoodSelect from '../components/NeighborhoodSelect'
import LocationPickerWrapper from '../components/LocationPickerWrapper'
import { supabase } from '../lib/supabaseClient'
import { uploadListingImage } from '../lib/storage'
import { checkPhoneExists, isValidPhoneFormat, formatPhone, normalizePhone } from '../lib/phoneValidation'
import { toTitleCase } from '../lib/textUtils'
import { getCurrentUser } from '../lib/hybridAuth'
import { checkApprovedMembership, checkPendingMembership } from '../lib/membershipCheck'
import MembershipRequiredModal from '../components/MembershipRequiredModal'

function SellPage() {
  const whatsappPhone = (import.meta.env.VITE_WHATSAPP_PHONE as string) || '+905556874803'
  const [title, setTitle] = useState<string>('')
  const [ownerName, setOwnerName] = useState<string>('')
  const [ownerPhone, setOwnerPhone] = useState<string>('')
  const [neighborhood, setNeighborhood] = useState<string>('')
  const [propertyType, setPropertyType] = useState<string>('Daire')
  const [rooms, setRooms] = useState<string>('3+1')
  const [area, setArea] = useState<string>('')
  const [price, setPrice] = useState<string>('') // yalnizca rakamlar (örn: "2000000")
  const [isFor, setIsFor] = useState<'satilik' | 'kiralik'>('satilik')
  const [description, setDescription] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [address, setAddress] = useState<string>('')
  const [latitude, setLatitude] = useState<number>(39.0919)
  const [longitude, setLongitude] = useState<number>(33.0794)
  const [locationType, setLocationType] = useState<'address' | 'coordinates'>('address')
  const [phoneWarning, setPhoneWarning] = useState<string>('')
  const [phoneChecking, setPhoneChecking] = useState(false)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [hasPendingMembership, setHasPendingMembership] = useState(false)

  const waMessage = useMemo(() => {
    return 'Merhaba ilan vermek istiyorum, Adınız Soyadınızı (isminizi Soyadınızı, Telefon Numaranızı girin) Mahalle ismini, oda sayısını, Resimlerini, fiyatını ve açıklama girin..'
  }, [])

  const waLink = useMemo(() => {
    const phoneDigits = whatsappPhone.replace(/\D/g, '')
    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(waMessage)}`
  }, [whatsappPhone, waMessage])

  const canSubmit = useMemo(() => {
    const phoneOk = /^\+?\d{10,15}$/.test(ownerPhone.replace(/\D/g, ''))
    const priceOk = !price || /^\d{1,12}$/.test(price) // yalnizca rakam kontrolu
    const areaOk = !area || /^\d{1,5}$/.test(area)
    return Boolean(title.trim() && ownerName.trim() && phoneOk && priceOk && areaOk)
  }, [title, ownerName, ownerPhone, price, area])

  function formatTL(digits: string): string {
    if (!digits) return ''
    try {
      const n = Number(digits)
      if (!Number.isFinite(n)) return ''
      return new Intl.NumberFormat('tr-TR').format(n)
    } catch {
      return ''
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
  const selectClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
  const textareaClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

  async function handleSubmit() {
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const phoneDigits = ownerPhone.replace(/\D/g, '')
      if (!title || !ownerName || !phoneDigits) {
        setError('Başlık, ad-soyad ve telefon zorunludur.')
        return
      }
      if (!isValidPhoneFormat(ownerPhone)) {
        setError('Geçerli bir telefon numarası girin (10 veya 11 haneli).')
        return
      }
      
      // Telefon numarası kontrolü
      const phoneCheck = await checkPhoneExists(ownerPhone)
      if (phoneCheck.pendingCount > 0) {
        setError(`Bu telefon numarasıyla zaten ${phoneCheck.pendingCount} adet bekleyen ilan var. Lütfen önceki ilanınızın onaylanmasını bekleyin.`)
        return
      }
      
      // ÜYELİK KONTROLÜ - HİBRİT SİSTEM (GÜVENLİK FİKSİ)
      // 1. Önce giriş yapmış kullanıcıyı kontrol et
      const currentUser = await getCurrentUser()
      let finalUserId: string | null = null
      let isMemberUser = false
      
      if (currentUser && currentUser.status === 'approved') {
        // Giriş yapmış onaylı üye var - bu kullanıcıyı önceleyeceğiz
        finalUserId = currentUser.id
        isMemberUser = true
        console.log('✅ Giriş yapmış üye tespit edildi:', currentUser.full_name)
        
        // Güvenlik uyarısı: Farklı telefon numarası yazılmışsa uyar
        const currentUserPhone = currentUser.phone?.replace(/\D/g, '') || ''
        const formPhone = normalizePhone(ownerPhone)
        
        if (currentUserPhone !== formPhone) {
          console.warn('⚠️ Güvenlik: Giriş yapmış kullanıcının telefonu farklı!', {
            currentUserPhone,
            formPhone,
            user: currentUser.full_name
          })
        }
      } else {
        // Giriş yapmış kullanıcı yok - telefon numarasına göre üyelik kontrol et
        const membershipCheck = await checkApprovedMembership(ownerPhone)
        if (membershipCheck.isMember) {
          finalUserId = membershipCheck.userId
          isMemberUser = true
          console.log('✅ Telefon numarasına göre üye tespit edildi:', membershipCheck.userName)
        }
      }
      
      const pendingCheck = await checkPendingMembership(ownerPhone)
      
      // 1) İlanı önce oluştur ve id al
      // Konum verisi
      const finalAddress = address || `${neighborhood || 'Kulu'}, Konya`

      const { data: inserted, error: insertError } = await supabase
        .from('listings')
        .insert({
          title,
          owner_name: ownerName,
          owner_phone: normalizePhone(ownerPhone), // Telefon numarasını normalize et
          neighborhood: neighborhood || null,
          property_type: propertyType,
          rooms,
          area_m2: area ? Number(area) : null,
          price_tl: price ? Number(price) : null, // price yalnizca rakamlar oldugu icin dogrudan Number()
          is_for: isFor,
          description: description || null,
          address: finalAddress,
          latitude: latitude,
          longitude: longitude,
          location_type: locationType,
          status: 'pending',
          user_id: finalUserId, // Giriş yapmış kullanıcı öncelikli
          requires_membership: !isMemberUser, // Üye durumuna göre
        })
        .select('id')
        .single()
      if (insertError) throw insertError

      const listingId = inserted?.id as string

      // 2) Görseller varsa, helper ile yükle ve URL topla
      const imageUrls: string[] = []
      const sourceFiles = selectedFiles.length > 0
        ? selectedFiles
        : (files && files.length > 0 ? Array.from(files) : [])

      if (listingId && sourceFiles.length > 0) {
        const uploads = sourceFiles
          .slice(0, 5)
          .map(async (file) => {
            if (!file.type.startsWith('image/')) return
            if (file.size > 5 * 1024 * 1024) { // 5MB
              throw new Error('Görsel boyutu 5MB sınırını aşıyor')
            }
            const res = await uploadListingImage(file, listingId)
            if (res.publicUrl) imageUrls.push(res.publicUrl)
          })
        await Promise.all(uploads)

        // 3) İlanın images kolonunu güncelle
        if (imageUrls.length > 0) {
          const { error: updateError } = await supabase
            .from('listings')
            .update({ images: imageUrls })
            .eq('id', listingId)
          if (updateError) throw updateError
        }
      }

      // Başarı mesajı ve modal göster
      if (isMemberUser) {
        setMessage(`✅ İlanınız başarıyla gönderildi! Admin onayından sonra yayınlanacak.`)
      } else {
        setMessage('✅ İlanınız alındı!')
        setHasPendingMembership(pendingCheck)
        setShowMembershipModal(true)
      }
      
      // formu temizle
      setTitle('')
      setOwnerName('')
      setOwnerPhone('')
      setNeighborhood('')
      setPropertyType('Daire')
      setRooms('3+1')
      setArea('')
      setPrice('')
      setIsFor('satilik')
      setDescription('')
      setFiles(null)
      setSelectedFiles([])
      setPreviews([])
      setAddress('')
      setLatitude(39.0919)
      setLongitude(33.0794)
      setLocationType('address')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <section className="relative overflow-hidden rounded-2xl shadow-lg bg-[url('https://images.unsplash.com/photo-1531971589569-0d9370cbe1e5?q=80&w=1762&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center">
          <div className="absolute inset-0 bg-green-700/40" />
          <div className="relative z-10 px-6 py-12 text-white">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Satmak İstiyorum</h1>
            <p className="mt-2 text-white/90">Bilgileri doldurun veya WhatsApp ile hızlı destek alın. İlanınız admin onayı sonrası yayınlanır.</p>
            <div className="mt-5 inline-flex flex-wrap items-center gap-3">
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-green-700"
              >
                WhatsApp ile iletişime geçelim
              </a>
              <div className="text-xs text-white/85">Formu doldurmakta zorlananlar için hızlı çözüm</div>
            </div>
          </div>
        </section>
      </div>
      <div className="max-w-5xl mx-auto">
        <form className="grid grid-cols-1 lg:grid-cols-2 gap-6" onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-gray-800">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white text-xs">1</span>
                <h2 className="font-semibold">İlan Başlığı</h2>
              </div>
              <label className="block text-sm mb-1" htmlFor="title">Başlık</label>
              <input id="title" aria-describedby="title-help" className={inputClass} placeholder="Örn: Merkezi 3+1 Daire" value={title} onChange={(e) => setTitle(toTitleCase(e.target.value))} />
              <div id="title-help" className="mt-1 text-xs text-gray-500">İlanınız listelerde bu başlıkla görünecek. (Her kelimenin ilk harfi otomatik büyük yapılır)</div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-gray-800">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white text-xs">2</span>
                <h2 className="font-semibold">Sahip Bilgileri</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1" htmlFor="full_name">Ad Soyad</label>
                  <input id="full_name" className={inputClass} placeholder="Adınız Soyadınız" value={ownerName} onChange={(e) => setOwnerName(toTitleCase(e.target.value))} />
                  <div className="mt-1 text-xs text-gray-500">Her kelimenin ilk harfi otomatik büyük yapılır</div>
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="phone">Telefon</label>
                  <input 
                    id="phone" 
                    className={inputClass} 
                    placeholder="555 123 45 67" 
                    value={ownerPhone} 
                    onChange={(e) => setOwnerPhone(formatPhone(e.target.value))}
                    onBlur={async () => {
                      if (ownerPhone && isValidPhoneFormat(ownerPhone)) {
                        setPhoneChecking(true)
                        const check = await checkPhoneExists(ownerPhone)
                        setPhoneChecking(false)
                        if (check.message) {
                          setPhoneWarning(check.message)
                        } else {
                          setPhoneWarning('')
                        }
                      }
                    }}
                    inputMode="tel" 
                    aria-describedby="phone-help" 
                  />
                  <div id="phone-help" className="mt-1 text-xs text-gray-500">
                    {phoneChecking ? (
                      <span className="text-blue-600">Kontrol ediliyor...</span>
                    ) : phoneWarning ? (
                      <span className="text-orange-600 font-medium">⚠️ {phoneWarning}</span>
                    ) : (
                      'Sadece rakam girin, biz formatlarız.'
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-gray-800">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white text-xs">3</span>
                <h2 className="font-semibold">Açıklama</h2>
              </div>
              <label className="block text-sm mb-1" htmlFor="desc">Açıklama</label>
              <textarea id="desc" className={textareaClass} rows={6} placeholder="Detaylı açıklama" value={description} onChange={(e) => setDescription(toTitleCase(e.target.value))} />
              <div className="mt-1 text-xs text-gray-500">Her cümlenin ilk harfi otomatik büyük yapılır</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-gray-800">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white text-xs">4</span>
                <h2 className="font-semibold">Emlak Detayları</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Mahalle</label>
                  <NeighborhoodSelect value={neighborhood} onChange={setNeighborhood} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Emlak Türü</label>
                  <select className={selectClass} value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                    <option value="Daire">Daire</option>
                    <option value="Müstakil">Müstakil</option>
                    <option value="Arsa">Arsa</option>
                    <option value="Tarla">Tarla</option>
                    <option value="Dükkan">Dükkan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="rooms">Oda Sayısı</label>
                  <select id="rooms" className={inputClass} value={rooms} onChange={(e) => setRooms(e.target.value)}>
                    <option value="">Oda sayısı seçin</option>
                    <option value="1+1">1+1</option>
                    <option value="2+1">2+1</option>
                    <option value="3+1">3+1</option>
                    <option value="4+1">4+1</option>
                    <option value="5+1">5+1</option>
                    <option value="6 üstü">6 üstü</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="area">Brüt m²</label>
                  <div className="relative">
                    <input
                      id="area"
                      className={`${inputClass} pr-12`}
                      placeholder="125"
                      value={formatTL(area)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '')
                        setArea(digits)
                      }}
                      inputMode="numeric"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 border">m²</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="price">Fiyat (TL)</label>
                  <div className="relative">
                    <input
                      id="price"
                      className={`${inputClass} pr-14`}
                      placeholder="2.000.000"
                      value={formatTL(price)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '')
                        setPrice(digits)
                      }}
                      inputMode="numeric"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 border">TL</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Durum</label>
                  <select className={selectClass} value={isFor} onChange={(e) => setIsFor(e.target.value as 'satilik' | 'kiralik')}>
                    <option value="satilik">Satılık</option>
                    <option value="kiralik">Kiralık</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-gray-800">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white text-xs">5</span>
                <h2 className="font-semibold">Konum Bilgileri</h2>
              </div>
              <LocationPickerWrapper
                address={address}
                latitude={latitude}
                longitude={longitude}
                onLocationChange={(data) => {
                  setAddress(data.address)
                  setLatitude(data.latitude)
                  setLongitude(data.longitude)
                  setLocationType(data.locationType)
                }}
              />
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-gray-800">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white text-xs">6</span>
                <h2 className="font-semibold">Görseller</h2>
              </div>
              <label className="block text-sm mb-1">Görsel(ler)</label>
              <div
                className="mb-3 rounded-xl border-2 border-dashed p-4 text-center text-sm text-gray-600 hover:bg-gray-50"
                onDragOver={(e) => { e.preventDefault() }}
                onDrop={(e) => {
                  e.preventDefault()
                  const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
                  if (dropped.length === 0) return
                  const all = [...selectedFiles, ...dropped].slice(0, 5)
                  setSelectedFiles(all)
                  setPreviews(all.map((f) => URL.createObjectURL(f)))
                }}
              >
                <div className="text-gray-700 font-medium">Dosyalarınızı buraya sürükleyip bırakın</div>
                <div className="text-xs text-gray-500">veya aşağıdan dosya seçin (en fazla 5 görsel, max 5MB)</div>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const fl = e.target.files
                  setFiles(fl)
                  if (fl && fl.length > 0) {
                    const arr = Array.from(fl).slice(0, 5)
                    setSelectedFiles(arr)
                    setPreviews(arr.map((f) => URL.createObjectURL(f)))
                  } else {
                    setSelectedFiles([])
                    setPreviews([])
                  }
                }}
                className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white hover:file:bg-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">En fazla 5 görsel yükleyin. Yüklenen görseller Supabase Storage'a kaydedilir.</p>
              {previews.length > 0 && (
                <ul className="mt-3 grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <li key={i} className="relative">
                      <img src={src} className="h-24 w-full object-cover rounded border" alt={`preview-${i}`} />
                      <button
                        type="button"
                        onClick={() => {
                          const nextFiles = selectedFiles.filter((_, idx) => idx !== i)
                          setSelectedFiles(nextFiles)
                          setPreviews(nextFiles.map((f) => URL.createObjectURL(f)))
                          if (nextFiles.length === 0) {
                            setFiles(null)
                          }
                        }}
                        className="absolute right-1 top-1 rounded-md bg-white/90 px-2 py-0.5 text-xs text-red-600 shadow hover:bg-white"
                      >
                        Kaldır
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="lg:sticky lg:top-6">
              <div className="mb-4 rounded-2xl border bg-gray-50 p-4">
                <div className="mb-2 text-sm font-medium text-gray-800">Özet</div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><span className="text-gray-500">Başlık:</span> {title || '-'}
                  </li>
                  <li><span className="text-gray-500">Mahalle:</span> {neighborhood || '-'}</li>
                  <li><span className="text-gray-500">Tür:</span> {propertyType}</li>
                  <li><span className="text-gray-500">Oda:</span> {rooms || '-'}</li>
                  <li><span className="text-gray-500">m²:</span> {area ? formatTL(area) : '-'}</li>
                  <li><span className="text-gray-500">Fiyat:</span> {price ? `${formatTL(price)} TL` : '-'}</li>
                </ul>
              </div>
              {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
              {message && <div className="mb-2 text-green-600 text-sm">{message}</div>}
              <div className="flex flex-col gap-3">
                <button type="submit" disabled={submitting || !canSubmit} className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold hover:bg-orange-500 transition-colors disabled:opacity-60">
                  {submitting ? 'Gönderiliyor...' : 'İlanı Gönder (Admin Onayına Gider)'}
                </button>
                <a href={waLink} target="_blank" rel="noreferrer" className="w-full rounded-xl bg-green-600 text-white py-3 text-center font-semibold hover:bg-green-700">
                  WhatsApp ile hızlı iletişim
                </a>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {/* Üyelik Gerekli Modal */}
      <MembershipRequiredModal 
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        hasPendingMembership={hasPendingMembership}
      />
    </div>
  )
}

export default SellPage


