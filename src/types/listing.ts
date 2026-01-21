// ============================================
// LISTING TYPE DEFİNİTIONS
// ============================================
// Geliştirilmiş ilan türü tanımları
// ============================================

export interface Listing {
  // Temel Bilgiler
  id: string
  created_at: string
  approved_at?: string
  listing_number?: string // Otomatik oluşturulan ilan numarası
  
  // İlan Bilgileri
  title: string
  description?: string
  
  // Sahip Bilgileri
  owner_name: string
  owner_phone: string
  
  // Emlak Detayları
  neighborhood?: string
  property_type?: string
  rooms?: string
  area_m2?: number
  price_tl?: number
  
  // Konum Bilgileri
  address?: string
  latitude?: number
  longitude?: number
  location_type?: 'address' | 'coordinates'
  
  // Durum
  is_for: 'satilik' | 'kiralik'
  status: 'pending' | 'approved' | 'rejected'
  
  // Öne Çıkan İlan
  is_featured?: boolean
  featured_order?: number
  featured_until?: string
  
  // Fırsat İlan
  is_opportunity?: boolean
  opportunity_order?: number
  original_price_tl?: number
  discount_percentage?: number
  
  // Görseller
  images?: string[]
  
  // YENİ ALANLAR - Profesyonel Detaylar
  floor_number?: number // Kat
  total_floors?: number // Toplam Kat
  heating_type?: HeatingType // Isıtma
  building_age?: number // Bina Yaşı
  furnished_status?: FurnishedStatus // Eşya Durumu
  usage_status?: UsageStatus // Kullanım Durumu
  has_elevator?: boolean // Asansör
  monthly_fee?: number // Aidat
  has_balcony?: boolean // Balkon
  garden_area_m2?: number // Bahçe m² (müstakil için)
  deed_status?: DeedStatus // Tapu Durumu (satılık için)
  deposit_amount?: number // Depozito (kiralık için)
  advance_payment_months?: number // Peşinat Ayı (kiralık için)
  
  // İlişkili Veriler
  user_id?: string
  requires_membership?: boolean
}

// Isıtma Türleri
export type HeatingType = 
  | 'Doğalgaz'
  | 'Elektrik' 
  | 'Kömür'
  | 'Odun'
  | 'Güneş Enerjisi'
  | 'Jeotermal'
  | 'Klima'
  | 'Soba'
  | 'Merkezi Sistem'
  | 'Yok'

// Eşya Durumu
export type FurnishedStatus = 
  | 'Eşyalı'
  | 'Eşyasız' 
  | 'Yarı Eşyalı'

// Kullanım Durumu
export type UsageStatus = 
  | 'Boş'
  | 'Kiracılı'
  | 'Mülk Sahibi Oturuyor'
  | 'Tadilat Halinde'

// Tapu Durumu
export type DeedStatus = 
  | 'Kat Mülkiyeti'
  | 'Kat İrtifakı'
  | 'Arsa Tapusu'
  | 'Tahsis'
  | 'Diğer'

// Form Data Interface (Frontend için)
export interface ListingFormData {
  // Temel Bilgiler
  title: string
  description: string
  owner_name: string
  owner_phone: string
  
  // Emlak Detayları
  neighborhood: string
  property_type: string
  rooms: string
  area_m2: string // Form'da string olarak
  price_tl: string // Form'da string olarak
  is_for: 'satilik' | 'kiralik'
  
  // Yeni Detaylar
  floor_number: string // Form'da string olarak
  total_floors: string // Form'da string olarak
  heating_type: HeatingType | ''
  building_age: string // Form'da string olarak
  furnished_status: FurnishedStatus | ''
  usage_status: UsageStatus | ''
  has_elevator: boolean
  monthly_fee: string // Form'da string olarak
  has_balcony: boolean
  garden_area_m2: string // Form'da string olarak (müstakil için)
  deed_status: DeedStatus | '' // Satılık için
  deposit_amount: string // Form'da string olarak (kiralık için)
  advance_payment_months: number // Kiralık için
}

// Validation Rules
export const VALIDATION_RULES = {
  floor_number: { min: -5, max: 50 },
  total_floors: { min: 1, max: 50 },
  building_age: { min: 0, max: 200 },
  advance_payment_months: { min: 0, max: 12 },
  deposit_amount: { min: 0 },
  monthly_fee: { min: 0 },
  garden_area_m2: { min: 0 }
} as const

// Dropdown Options
export const HEATING_OPTIONS: HeatingType[] = [
  'Doğalgaz',
  'Elektrik',
  'Kömür', 
  'Odun',
  'Güneş Enerjisi',
  'Jeotermal',
  'Klima',
  'Soba',
  'Merkezi Sistem',
  'Yok'
]

export const FURNISHED_OPTIONS: FurnishedStatus[] = [
  'Eşyalı',
  'Eşyasız',
  'Yarı Eşyalı'
]

export const USAGE_OPTIONS: UsageStatus[] = [
  'Boş',
  'Kiracılı', 
  'Mülk Sahibi Oturuyor',
  'Tadilat Halinde'
]

export const DEED_OPTIONS: DeedStatus[] = [
  'Kat Mülkiyeti',
  'Kat İrtifakı',
  'Arsa Tapusu',
  'Tahsis',
  'Diğer'
]

// TARLA İÇİN ÖZEL SEÇENEKLER
export type LandType = 
  | 'Buğday Tarlası'
  | 'Arpa Tarlası'
  | 'Mısır Tarlası'
  | 'Pancar Tarlası'
  | 'Sebze Tarlası'
  | 'Meyve Bahçesi'
  | 'Boş Tarla'
  | 'Çayır/Mera'
  | 'Diğer'

export type IrrigationStatus = 
  | 'Sulu'
  | 'Kuru'
  | 'Kısmen Sulu'
  | 'Damla Sulama'

export type ElectricityStatus = 
  | 'Var'
  | 'Yok'
  | 'Yakında (500m içinde)'
  | 'Uzak (500m+)'

export type WellStatus = 
  | 'Su Kuyusu Var'
  | 'Su Kuyusu Yok'
  | 'Artezyen Var'
  | 'Sondaj Gerekli'

export type RoadCondition = 
  | 'Asfalt Yol'
  | 'Stabilize Yol'
  | 'Toprak Yol'
  | 'Patika'

export type MachineryAccess = 
  | 'Kolay Erişim'
  | 'Orta Erişim'
  | 'Zor Erişim'
  | 'Erişim Yok'

export type ZoningStatus = 
  | 'Tarım Arazisi'
  | 'İmarlı Arazi'
  | 'Sit Alanı'
  | 'Orman Alanı'
  | 'Mera Alanı'
  | 'Diğer'

export const LAND_TYPE_OPTIONS: LandType[] = [
  'Buğday Tarlası',
  'Arpa Tarlası',
  'Mısır Tarlası',
  'Pancar Tarlası',
  'Sebze Tarlası',
  'Meyve Bahçesi',
  'Boş Tarla',
  'Çayır/Mera',
  'Diğer'
]

export const IRRIGATION_OPTIONS: IrrigationStatus[] = [
  'Sulu',
  'Kuru',
  'Kısmen Sulu',
  'Damla Sulama'
]

export const ELECTRICITY_OPTIONS: ElectricityStatus[] = [
  'Var',
  'Yok',
  'Yakında (500m içinde)',
  'Uzak (500m+)'
]

export const WELL_OPTIONS: WellStatus[] = [
  'Su Kuyusu Var',
  'Su Kuyusu Yok',
  'Artezyen Var',
  'Sondaj Gerekli'
]

export const ROAD_OPTIONS: RoadCondition[] = [
  'Asfalt Yol',
  'Stabilize Yol',
  'Toprak Yol',
  'Patika'
]

export const MACHINERY_OPTIONS: MachineryAccess[] = [
  'Kolay Erişim',
  'Orta Erişim',
  'Zor Erişim',
  'Erişim Yok'
]

export const ZONING_OPTIONS: ZoningStatus[] = [
  'Tarım Arazisi',
  'İmarlı Arazi',
  'Sit Alanı',
  'Orman Alanı',
  'Mera Alanı',
  'Diğer'
]

// Koşullu Gösterim Kuralları
export const CONDITIONAL_FIELDS = {
  // Daire için gösterilecek alanlar
  apartment: ['floor_number', 'total_floors', 'has_elevator', 'monthly_fee'],
  
  // Müstakil için gösterilecek alanlar  
  detached: ['garden_area_m2'],
  
  // Satılık için gösterilecek alanlar
  sale: ['deed_status'],
  
  // Kiralık için gösterilecek alanlar
  rent: ['deposit_amount', 'advance_payment_months'],
  
  // Kiralık için zorunlu alanlar
  rentRequired: ['furnished_status']
} as const

// Helper Functions
export function isApartment(propertyType: string): boolean {
  return propertyType === 'Daire'
}

export function isDetached(propertyType: string): boolean {
  return propertyType === 'Müstakil'
}

export function isLand(propertyType: string): boolean {
  return propertyType === 'Tarla' || propertyType === 'Arsa'
}

export function isSale(isFor: string): boolean {
  return isFor === 'satilik'
}

export function isRent(isFor: string): boolean {
  return isFor === 'kiralik'
}

// Validation Helper
export function validateListingForm(data: ListingFormData): string[] {
  const errors: string[] = []
  
  // Kiralık için eşya durumu zorunlu
  if (isRent(data.is_for) && !data.furnished_status) {
    errors.push('Kiralık ilanlar için eşya durumu zorunludur')
  }
  
  // Kat numarası validasyonu
  if (data.floor_number) {
    const floor = parseInt(data.floor_number)
    if (isNaN(floor) || floor < VALIDATION_RULES.floor_number.min || floor > VALIDATION_RULES.floor_number.max) {
      errors.push(`Kat numarası ${VALIDATION_RULES.floor_number.min} ile ${VALIDATION_RULES.floor_number.max} arasında olmalıdır`)
    }
  }
  
  // Toplam kat validasyonu
  if (data.total_floors) {
    const totalFloors = parseInt(data.total_floors)
    if (isNaN(totalFloors) || totalFloors < VALIDATION_RULES.total_floors.min || totalFloors > VALIDATION_RULES.total_floors.max) {
      errors.push(`Toplam kat sayısı ${VALIDATION_RULES.total_floors.min} ile ${VALIDATION_RULES.total_floors.max} arasında olmalıdır`)
    }
  }
  
  // Bina yaşı validasyonu
  if (data.building_age) {
    const age = parseInt(data.building_age)
    if (isNaN(age) || age < VALIDATION_RULES.building_age.min || age > VALIDATION_RULES.building_age.max) {
      errors.push(`Bina yaşı ${VALIDATION_RULES.building_age.min} ile ${VALIDATION_RULES.building_age.max} arasında olmalıdır`)
    }
  }
  
  // Peşinat ayı validasyonu
  if (isRent(data.is_for) && data.advance_payment_months < VALIDATION_RULES.advance_payment_months.min || data.advance_payment_months > VALIDATION_RULES.advance_payment_months.max) {
    errors.push(`Peşinat ayı ${VALIDATION_RULES.advance_payment_months.min} ile ${VALIDATION_RULES.advance_payment_months.max} arasında olmalıdır`)
  }
  
  // Depozito validasyonu
  if (isRent(data.is_for) && data.deposit_amount) {
    const deposit = parseFloat(data.deposit_amount)
    if (isNaN(deposit) || deposit < VALIDATION_RULES.deposit_amount.min) {
      errors.push('Depozito miktarı geçerli bir sayı olmalıdır')
    }
  }
  
  return errors
}

// Format Helper Functions
export function formatListingNumber(number?: string): string {
  if (!number) return 'Henüz atanmadı'
  return `#${number}`
}

export function formatFloor(floor?: number, totalFloors?: number): string {
  if (floor === undefined) return '-'
  
  let floorText = ''
  if (floor === 0) floorText = 'Zemin Kat'
  else if (floor < 0) floorText = `${Math.abs(floor)}. Bodrum`
  else floorText = `${floor}. Kat`
  
  if (totalFloors) {
    floorText += ` / ${totalFloors}`
  }
  
  return floorText
}

export function formatCurrency(amount?: number): string {
  if (!amount) return '-'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatArea(area?: number): string {
  if (!area) return '-'
  return `${area.toLocaleString('tr-TR')} m²`
}