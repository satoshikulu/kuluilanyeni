import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { uploadListingImage } from '../lib/storage'
import NeighborhoodSelect from '../components/NeighborhoodSelect'
import LocationPickerWrapper from '../components/LocationPickerWrapper'
import { checkPhoneExists, isValidPhoneFormat, formatPhone, normalizePhone } from '../lib/phoneValidation'
import { toTitleCase } from '../lib/textUtils'
import { getCurrentUser } from '../lib/hybridAuth'
import { checkApprovedMembership, checkPendingMembership } from '../lib/membershipCheck'
import MembershipRequiredModal from '../components/MembershipRequiredModal'
import { 
  HEATING_OPTIONS, 
  FURNISHED_OPTIONS, 
  USAGE_OPTIONS,
  validateListingForm,
  isApartment,
  isDetached
} from '../types/listing'
import type { ListingFormData } from '../types/listing'

function RentPage() {
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    owner_name: '',
    owner_phone: '',
    neighborhood: '',
    property_type: 'Daire',
    rooms: '',
    area_m2: '',
    price_tl: '',
    description: '',
    is_for: 'kiralik' as const,
    // Yeni alanlar
    floor_number: '',
    total_floors: '',
    heating_type: '',
    building_age: '',
    furnished_status: '', // Kiralık için ZORUNLU
    usage_status: '',
    has_elevator: false,
    monthly_fee: '',
    has_balcony: false,
    garden_area_m2: '', // Müstakil için
    deed_status: '', // Satılık için (kiralıkta kullanılmaz)
    deposit_amount: '', // Kiralık için
    advance_payment_months: 0 // Kiralık için
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [previews, setPreviews] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [address, setAddress] = useState<string>('')
  const [latitude, setLatitude] = useState<number>(39.0919)
  const [longitude, setLongitude] = useState<number>(33.0794)
  const [locationType, setLocationType] = useState<'address' | 'coordinates'>('address')
  const [phoneWarning, setPhoneWarning] = useState<string>('')
  const [phoneChecking, setPhoneChecking] = useState(false)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [hasPendingMembership, setHasPendingMembership] = useState(false)

  const whatsappPhone = (import.meta.env.VITE_WHATSAPP_PHONE as string) || '+905556874803'

  function formatTL(digits: string): string {
    if (!digits) return ''
    try {
      const n = Number(digits)
      if (!Number.isFinite(n)) return ''
      return new Intl.NumberFormat('tr-TR').format(n)
    } catch { return '' }
  }

  const waMessage = useMemo(() => {
    return 'Merhaba ilan vermek istiyorum, Adınız Soyadınızı (isminizi Soyadınızı, Telefon Numaranızı girin) Mahalle ismini, oda sayısını, Resimlerini, fiyatını ve açıklama girin..'
  }, [])

  const waLink = useMemo(() => {
    const phoneDigits = whatsappPhone.replace(/\D/g, '')
    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(waMessage)}`
  }, [whatsappPhone, waMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Form validasyonu
      const validationErrors = validateListingForm(formData)
      if (validationErrors.length > 0) {
        setMessage('Hata: ' + validationErrors.join(', '))
        setLoading(false)
        return
      }

      // Telefon numarası kontrolü
      if (!isValidPhoneFormat(formData.owner_phone)) {
        setMessage('Hata: Geçerli bir telefon numarası girin (10 veya 11 haneli).')
        setLoading(false)
        return
      }
      
      const phoneCheck = await checkPhoneExists(formData.owner_phone)
      if (phoneCheck.pendingCount > 0) {
        setMessage(`Hata: Bu telefon numarasıyla zaten ${phoneCheck.pendingCount} adet bekleyen ilan var. Lütfen önceki ilanınızın onaylanmasını bekleyin.`)
        setLoading(false)
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
        const formPhone = normalizePhone(formData.owner_phone)
        
        if (currentUserPhone !== formPhone) {
          console.warn('⚠️ Güvenlik: Giriş yapmış kullanıcının telefonu farklı!', {
            currentUserPhone,
            formPhone,
            user: currentUser.full_name
          })
        }
      } else {
        // Giriş yapmış kullanıcı yok - telefon numarasına göre üyelik kontrol et
        const membershipCheck = await checkApprovedMembership(formData.owner_phone)
        if (membershipCheck.isMember) {
          finalUserId = membershipCheck.userId
          isMemberUser = true
          console.log('✅ Telefon numarasına göre üye tespit edildi:', membershipCheck.userName)
        }
      }
      
      const pendingCheck = await checkPendingMembership(formData.owner_phone)
      
      // 1) İlanı önce oluştur ve id al
      const finalAddress = address || `${formData.neighborhood || 'Kulu'}, Konya`
      
      // Form verilerini database formatına çevir
      const listingData = {
        ...formData,
        owner_phone: normalizePhone(formData.owner_phone),
        price_tl: formData.price_tl ? parseInt(formData.price_tl) : null,
        area_m2: formData.area_m2 ? parseInt(formData.area_m2) : null,
        // Yeni alanlar
        floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
        total_floors: formData.total_floors ? parseInt(formData.total_floors) : null,
        heating_type: formData.heating_type || null,
        building_age: formData.building_age ? parseInt(formData.building_age) : null,
        furnished_status: formData.furnished_status || null,
        usage_status: formData.usage_status || null,
        has_elevator: formData.has_elevator,
        monthly_fee: formData.monthly_fee ? parseFloat(formData.monthly_fee) : null,
        has_balcony: formData.has_balcony,
        garden_area_m2: formData.garden_area_m2 ? parseInt(formData.garden_area_m2) : null,
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
        advance_payment_months: formData.advance_payment_months || null,
        // Konum ve durum
        address: finalAddress,
        latitude: latitude,
        longitude: longitude,
        location_type: locationType,
        status: 'pending',
        user_id: finalUserId,
        requires_membership: !isMemberUser
      }

      const { data: inserted, error: insertError } = await supabase
        .from('listings')
        .insert([listingData])
        .select('id')
        .single()

      if (insertError) throw insertError

      const listingId = inserted?.id as string

      // 2) Görseller varsa, helper ile yükle ve URL topla
      const imageUrls: string[] = []
      if (listingId && selectedFiles.length > 0) {
        const uploads = selectedFiles
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
      
      setFormData({
        title: '',
        owner_name: '',
        owner_phone: '',
        neighborhood: '',
        property_type: 'Daire',
        rooms: '',
        area_m2: '',
        price_tl: '',
        description: '',
        is_for: 'kiralik',
        // Yeni alanları da temizle
        floor_number: '',
        total_floors: '',
        heating_type: '',
        building_age: '',
        furnished_status: '',
        usage_status: '',
        has_elevator: false,
        monthly_fee: '',
        has_balcony: false,
        garden_area_m2: '',
        deed_status: '',
        deposit_amount: '',
        advance_payment_months: 0
      })
      setSelectedFiles([])
      setPreviews([])
      setAddress('')
      setLatitude(39.0919)
      setLongitude(33.0794)
      setLocationType('address')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'İlan gönderilemedi'
      setMessage('Hata: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    // Telefon numarası özel işleme
    if (name === 'owner_phone') {
      const formatted = formatPhone(value)
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }))
      return
    }
    
    // Checkbox işleme
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
      return
    }
    
    // Number input işleme (advance_payment_months)
    if (name === 'advance_payment_months') {
      const numValue = parseInt(value) || 0
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }))
      return
    }
    
    // Otomatik büyük harf yapılacak alanlar
    const titleCaseFields = ['title', 'owner_name', 'description']
    const newValue = titleCaseFields.includes(name) ? toTitleCase(value) : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4">
          <section className="relative overflow-hidden rounded-2xl shadow-lg bg-[url('https://plus.unsplash.com/premium_photo-1661908377130-772731de98f6?q=80&w=1624&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative z-10 px-6 py-16 text-center text-white">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Kiralama İlanı Ver</h1>
              <p className="mt-2 text-white/90">Bilgileri doldurun veya WhatsApp ile hızlı destek alın.</p>
              <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3">
                <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-green-700">
                  WhatsApp ile iletişime geçelim
                </a>
                <div className="text-xs text-white/80">Formu doldurmakta zorlananlar için hızlı çözüm</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1) İlan Başlığı */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">1</span>
                İlan Başlığı *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Örn: 3+1 Daire Kiralık"
              />
              <p className="mt-1 text-xs text-gray-500">Her kelimenin ilk harfi otomatik büyük yapılır</p>
            </div>

            {/* 2) Sahip Bilgileri */}
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">2</span>
              İletişim Bilgileri
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  name="owner_name"
                  value={formData.owner_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Adınız ve soyadınız"
                />
                <p className="mt-1 text-xs text-gray-500">Her kelimenin ilk harfi otomatik büyük yapılır</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası *
                </label>
                <input
                  type="tel"
                  name="owner_phone"
                  value={formData.owner_phone}
                  onChange={handleChange}
                  onBlur={async () => {
                    if (formData.owner_phone && isValidPhoneFormat(formData.owner_phone)) {
                      setPhoneChecking(true)
                      const check = await checkPhoneExists(formData.owner_phone)
                      setPhoneChecking(false)
                      if (check.message) {
                        setPhoneWarning(check.message)
                      } else {
                        setPhoneWarning('')
                      }
                    }
                  }}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0555 123 45 67"
                />
                <div className="mt-1 text-xs text-gray-500">
                  {phoneChecking ? (
                    <span className="text-blue-600">Kontrol ediliyor...</span>
                  ) : phoneWarning ? (
                    <span className="text-orange-600 font-medium">⚠️ {phoneWarning}</span>
                  ) : (
                    'Telefon numaranızı girin'
                  )}
                </div>
              </div>
            </div>

            {/* 3) Mahalle ve Emlak Türü */}
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">3</span>
              Mahalle ve Emlak Türü
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mahalle *
                </label>
                <NeighborhoodSelect 
                  value={formData.neighborhood} 
                  onChange={(value) => setFormData(prev => ({ ...prev, neighborhood: value }))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emlak Türü *
                </label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Daire">Daire</option>
                  <option value="Müstakil">Müstakil Ev</option>
                  <option value="Dükkan">Dükkan</option>
                  <option value="Ofis">Ofis</option>
                  <option value="Depo">Depo</option>
                </select>
              </div>
            </div>

            {/* 4) Oda Sayısı ve Alan */}
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">4</span>
              Oda Sayısı ve Alan
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oda Sayısı
                </label>
                <select
                  name="rooms"
                  value={formData.rooms}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alan (m²)
                </label>
                <input
                  type="number"
                  name="area_m2"
                  value={formData.area_m2}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="125"
                />
              </div>
            </div>

            {/* 5) Kira Fiyatı */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">5</span>
                Aylık Kira Fiyatı (TL) *
              </label>
              <input
                type="text"
                name="price_tl"
                value={formatTL(formData.price_tl)}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '')
                  setFormData(prev => ({ ...prev, price_tl: digits }))
                }}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="5.000"
                inputMode="numeric"
              />
            </div>

            {/* 6) Profesyonel Detaylar */}
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">6</span>
              Profesyonel Detaylar
            </div>

            {/* Kat Bilgileri - Sadece Daire için */}
            {isApartment(formData.property_type) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kat
                  </label>
                  <input
                    type="number"
                    name="floor_number"
                    value={formData.floor_number}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="3"
                    min="-5"
                    max="50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Bodrum için negatif (-1, -2)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Toplam Kat
                  </label>
                  <input
                    type="number"
                    name="total_floors"
                    value={formData.total_floors}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="5"
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asansör
                  </label>
                  <div className="flex items-center space-x-4 pt-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="has_elevator"
                        checked={formData.has_elevator}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Asansör var</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Bahçe Alanı - Sadece Müstakil için */}
            {isDetached(formData.property_type) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bahçe Alanı (m²)
                </label>
                <input
                  type="number"
                  name="garden_area_m2"
                  value={formData.garden_area_m2}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="200"
                  min="0"
                />
              </div>
            )}

            {/* Genel Detaylar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Isıtma Türü
                </label>
                <select
                  name="heating_type"
                  value={formData.heating_type}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Isıtma türü seçin</option>
                  {HEATING_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bina Yaşı
                </label>
                <input
                  type="number"
                  name="building_age"
                  value={formData.building_age}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="5"
                  min="0"
                  max="200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eşya Durumu *
                </label>
                <select
                  name="furnished_status"
                  value={formData.furnished_status}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Eşya durumu seçin</option>
                  {FURNISHED_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-orange-600 font-medium">Kiralık ilanlar için zorunlu</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanım Durumu
                </label>
                <select
                  name="usage_status"
                  value={formData.usage_status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Kullanım durumu seçin</option>
                  {USAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aidat ve Balkon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {isApartment(formData.property_type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aylık Aidat (TL)
                  </label>
                  <input
                    type="text"
                    name="monthly_fee"
                    value={formatTL(formData.monthly_fee)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '')
                      setFormData(prev => ({ ...prev, monthly_fee: digits }))
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="500"
                    inputMode="numeric"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balkon
                </label>
                <div className="flex items-center space-x-4 pt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="has_balcony"
                      checked={formData.has_balcony}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Balkon var</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 7) Kiralık Özel Alanlar */}
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs">7</span>
              Kiralık Özel Bilgiler
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Depozito (TL)
                </label>
                <input
                  type="text"
                  name="deposit_amount"
                  value={formatTL(formData.deposit_amount)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '')
                    setFormData(prev => ({ ...prev, deposit_amount: digits }))
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="10.000"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peşinat (Ay)
                </label>
                <select
                  name="advance_payment_months"
                  value={formData.advance_payment_months}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {Array.from({ length: 13 }, (_, i) => (
                    <option key={i} value={i}>{i} ay</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 8) Açıklama */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">8</span>
                Açıklama
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Emlak hakkında detaylı bilgi verin..."
              />
              <p className="mt-1 text-xs text-gray-500">Her cümlenin ilk harfi otomatik büyük yapılır</p>
            </div>

            {/* 9) Konum Bilgileri */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">9</span>
                Konum Bilgileri
              </label>
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

            {/* 10) Görsel Yükleme */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">10</span>
                Görseller (İsteğe Bağlı)
              </label>
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
                  if (fl && fl.length > 0) {
                    const arr = Array.from(fl).slice(0, 5)
                    setSelectedFiles(arr)
                    setPreviews(arr.map((f) => URL.createObjectURL(f)))
                  } else {
                    setSelectedFiles([])
                    setPreviews([])
                  }
                }}
                className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white hover:file:bg-blue-700"
              />
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

            {/* Mesaj */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('başarıyla') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* 11) Gönder */}
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">11</span>
              Gönder
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Gönderiliyor...' : 'İlanı Gönder'}
              </button>
            </div>
          </form>
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="mb-2 text-sm font-medium text-gray-800">Özet</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><span className="text-gray-500">Başlık:</span> {formData.title || '-'}</li>
              <li><span className="text-gray-500">Mahalle:</span> {formData.neighborhood || '-'}</li>
              <li><span className="text-gray-500">Tür:</span> {formData.property_type}</li>
              <li><span className="text-gray-500">Oda:</span> {formData.rooms || '-'}</li>
              <li><span className="text-gray-500">m²:</span> {formData.area_m2 ? formatTL(formData.area_m2) : '-'}</li>
              <li><span className="text-gray-500">Kira:</span> {formData.price_tl ? `${formatTL(formData.price_tl)} TL` : '-'}</li>
              {/* Yeni alanlar */}
              {isApartment(formData.property_type) && formData.floor_number && (
                <li><span className="text-gray-500">Kat:</span> {formData.floor_number}{formData.total_floors ? `/${formData.total_floors}` : ''}</li>
              )}
              {formData.heating_type && (
                <li><span className="text-gray-500">Isıtma:</span> {formData.heating_type}</li>
              )}
              {formData.furnished_status && (
                <li><span className="text-gray-500">Eşya:</span> {formData.furnished_status}</li>
              )}
              {formData.deposit_amount && (
                <li><span className="text-gray-500">Depozito:</span> {formatTL(formData.deposit_amount)} TL</li>
              )}
              {formData.advance_payment_months > 0 && (
                <li><span className="text-gray-500">Peşinat:</span> {formData.advance_payment_months} ay</li>
              )}
            </ul>
            <div className="mt-3">
              <a href={waLink} target="_blank" rel="noreferrer" className="block rounded-lg bg-green-700 text-white px-5 py-2 text-center text-sm font-medium hover:bg-green-800">WhatsApp ile hızlı iletişim</a>
            </div>
          </div>

          <div className="rounded-2xl border bg-blue-50 p-5">
            <h3 className="font-medium text-blue-800 mb-2">📋 Önemli Bilgiler</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• İlanınız admin onayından sonra yayınlanacaktır</li>
              <li>• Doğru ve güncel bilgiler giriniz</li>
              <li>• İletişim bilgileriniz güvenle saklanır</li>
              <li>• İlanınızı düzenlemek için admin ile iletişime geçin</li>
            </ul>
          </div>
        </div>
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

export default RentPage


