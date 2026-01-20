import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import FavoriteButton from '../components/FavoriteButton'
import { getListingImageUrl } from '../lib/storage'
import { getPlaceholderImage } from '../constants/placeholders'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { MapPin, Home, Maximize2, Share2, ArrowLeft, MessageCircle, Eye } from 'lucide-react'
import LocationMap from '../components/LocationMap'
import { recordListingInterest, getListingInterestCount } from '../lib/listingInterests'
import { isLand } from '../types/listing'

type Listing = {
  id: string
  title: string
  neighborhood: string | null
  price_tl: number | null
  images?: any
  property_type?: string | null
  is_for?: 'satilik' | 'kiralik'
  rooms?: string | null
  area_m2?: number | null
  description?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  
  // Profesyonel Detaylar
  floor_number?: number | null
  total_floors?: number | null
  heating_type?: string | null
  building_age?: number | null
  furnished_status?: string | null
  usage_status?: string | null
  has_elevator?: boolean | null
  monthly_fee?: number | null
  has_balcony?: boolean | null
  garden_area_m2?: number | null
  deed_status?: string | null
  deposit_amount?: number | null
  advance_payment_months?: number | null
  
  // Tarla Detayları
  land_type?: string | null
  irrigation_status?: string | null
  electricity_status?: string | null
  well_status?: string | null
  road_condition?: string | null
  machinery_access?: string | null
  zoning_status?: string | null
}

function parseImages(images: any, propertyType?: string | null): string[] {
  let arr: string[] = []
  if (Array.isArray(images)) arr = images as string[]
  else if (typeof images === 'string') {
    try { const parsed = JSON.parse(images); if (Array.isArray(parsed)) arr = parsed }
    catch { arr = [] }
  }
  // Storage path gelirse public URL'e çevir
  const parsed = arr.map((s) => (typeof s === 'string' && s.startsWith('http')) ? s : (s ? getListingImageUrl(s) : s)).filter(Boolean) as string[]
  
  // Eğer görsel yoksa placeholder ekle
  if (parsed.length === 0) {
    return [getPlaceholderImage(propertyType)]
  }
  return parsed
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [interestCount, setInterestCount] = useState<number>(0)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      setError('')
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .limit(1)
          .single()
        if (error) throw error
        setItem(data as Listing)
        
        // İlgi sayısını getir
        const count = await getListingInterestCount(id)
        setInterestCount(count)
      } catch (e: any) {
        setError(e.message || 'İlan yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  const imageList = useMemo(() => {
    return parseImages(item?.images, item?.property_type)
  }, [item])

  const lightboxSlides = useMemo(() => {
    return imageList.map(src => ({ src }))
  }, [imageList])

  async function share() {
    const url = window.location.href
    const title = item?.title || 'Kulu İlan'
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Bağlantı kopyalandı')
      }
    } catch {
      // kullanıcı paylaşımı iptal etti
    }
  }

  async function handleContactClick() {
    if (!item) return
    
    // İlgi kaydını veritabanına ekle
    const recorded = await recordListingInterest(item.id)
    if (recorded) {
      // İlgi sayısını güncelle
      setInterestCount(prev => prev + 1)
    }
    
    const whatsappPhone = '905556874803' // Admin telefon numarası
    const message = `Merhaba, bir ilanla ilgileniyorum:

📋 İlan: ${item.title}
🏠 Tür: ${item.property_type || 'Belirtilmemiş'}
${item.rooms ? `🚪 Oda: ${item.rooms}` : ''}
${item.area_m2 ? `📐 Alan: ${item.area_m2} m²` : ''}
📍 Mahalle: ${item.neighborhood || 'Belirtilmemiş'}
💰 Fiyat: ${item.price_tl ? item.price_tl.toLocaleString('tr-TR') + ' TL' : 'Belirtilmemiş'}
🔗 Link: ${window.location.href}

İlan sahibi ile görüşmek istiyorum.`

    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <Link to="/ilanlar" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Listeye Dön
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-600">
          <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg> 
          Yükleniyor...
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-sm">{error}</div>
      ) : !item ? (
        <div className="text-gray-600">İlan bulunamadı.</div>
      ) : (
        <div className="space-y-6">
          {/* Görsel Galeri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div 
              className="md:col-span-2 rounded-xl overflow-hidden cursor-pointer relative group"
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
            >
              <img src={imageList[0]} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300" alt={item.title} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3">
                  <Maximize2 className="w-6 h-6 text-gray-800" />
                </div>
              </div>
              {imageList.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                  1 / {imageList.length}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              {imageList.slice(1, 5).map((src, i) => (
                <div 
                  key={i} 
                  className="rounded-xl overflow-hidden cursor-pointer relative group"
                  onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true) }}
                >
                  <img src={src} className="w-full h-38 object-cover group-hover:scale-105 transition-transform duration-300" alt={`image-${i + 1}`} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2">
                      <Maximize2 className="w-4 h-4 text-gray-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Başlık ve Aksiyonlar */}
          <div className="flex flex-wrap items-start justify-between gap-4 bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.is_for === 'satilik' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {item.is_for === 'satilik' ? 'Satılık' : 'Kiralık'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {item.property_type || 'Emlak'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{item.neighborhood || 'Mahalle belirtilmemiş'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FavoriteButton listingId={item.id} />
              <button 
                onClick={() => { void share() }} 
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Paylaş
              </button>
            </div>
          </div>

          {/* İlanla İlgileniyorum Butonu - ÖNEMLİ */}
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-6 shadow-lg border-2 border-green-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Bu İlanla İlgileniyor musunuz?</h3>
                <p className="text-gray-600 text-sm">
                  WhatsApp üzerinden bizimle iletişime geçin. İlan sahibi ile sizi buluşturalım ve size en iyi hizmeti sunalım.
                </p>
              </div>
              <button
                onClick={handleContactClick}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-700 to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-green-800 hover:to-emerald-800 transform hover:scale-105 transition-all duration-300"
              >
                <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                <span>İlanla İlgileniyorum</span>
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          {/* Fiyat ve İlgi Sayısı */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border border-green-100">
              <div className="text-sm text-gray-600 mb-1">Fiyat</div>
              <div className="text-4xl font-bold text-green-700">
                {item.price_tl ? item.price_tl.toLocaleString('tr-TR') : '-'}
                <span className="text-xl font-normal text-gray-600 ml-2">TL</span>
              </div>
            </div>
            
            {/* İlgi Sayısı Badge */}
            {interestCount > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 shadow-lg border border-orange-100">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm font-medium">İlgi</span>
                </div>
                <div className="text-3xl font-bold text-orange-700">
                  {interestCount}
                  <span className="text-base font-normal text-gray-600 ml-2">kişi</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">ilgilendi</div>
              </div>
            )}
          </div>

          {/* Özellikler */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {item.rooms && (
              <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Home className="w-5 h-5" />
                  <span className="text-xs font-medium">Oda Sayısı</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{item.rooms}</div>
              </div>
            )}
            {item.area_m2 && (
              <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Maximize2 className="w-5 h-5" />
                  <span className="text-xs font-medium">Alan</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{item.area_m2} m²</div>
              </div>
            )}
            {item.property_type && (
              <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Home className="w-5 h-5" />
                  <span className="text-xs font-medium">Emlak Türü</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{item.property_type}</div>
              </div>
            )}
          </div>

          {/* Emlak Detayları */}
          <div className="rounded-2xl border bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              Emlak Detayları
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Kat Bilgileri */}
              {item.floor_number !== null && item.floor_number !== undefined && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">KAT</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Bulunduğu Kat</div>
                    <div className="font-semibold text-gray-900">
                      {item.floor_number === 0 ? 'Zemin Kat' : 
                       item.floor_number < 0 ? `${Math.abs(item.floor_number)}. Bodrum` : 
                       `${item.floor_number}. Kat`}
                    </div>
                  </div>
                </div>
              )}

              {item.total_floors && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">TOP</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Toplam Kat</div>
                    <div className="font-semibold text-gray-900">{item.total_floors} Kat</div>
                  </div>
                </div>
              )}

              {/* Asansör */}
              {item.has_elevator !== null && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-xs">ASN</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Asansör</div>
                    <div className="font-semibold text-gray-900">
                      {item.has_elevator ? '✅ Var' : '❌ Yok'}
                    </div>
                  </div>
                </div>
              )}

              {/* Balkon */}
              {item.has_balcony !== null && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <span className="text-teal-600 font-semibold text-xs">BLK</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Balkon</div>
                    <div className="font-semibold text-gray-900">
                      {item.has_balcony ? '✅ Var' : '❌ Yok'}
                    </div>
                  </div>
                </div>
              )}

              {/* Bahçe Alanı */}
              {item.garden_area_m2 && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-xs">BAH</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Bahçe Alanı</div>
                    <div className="font-semibold text-gray-900">{item.garden_area_m2} m²</div>
                  </div>
                </div>
              )}

              {/* Aylık Aidat */}
              {item.monthly_fee && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-xs">AİD</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Aylık Aidat</div>
                    <div className="font-semibold text-gray-900">{item.monthly_fee.toLocaleString('tr-TR')} TL</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profesyonel Detaylar */}
          <div className="rounded-2xl border bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">PRO</span>
              </div>
              Profesyonel Detaylar
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Isıtma Türü */}
              {item.heating_type && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 font-semibold text-xs">ISI</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Isıtma Türü</div>
                    <div className="font-semibold text-gray-900">{item.heating_type}</div>
                  </div>
                </div>
              )}

              {/* Bina Yaşı */}
              {item.building_age !== null && item.building_age !== undefined && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold text-xs">YAŞ</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Bina Yaşı</div>
                    <div className="font-semibold text-gray-900">
                      {item.building_age === 0 ? 'Sıfır Bina' : `${item.building_age} Yıl`}
                    </div>
                  </div>
                </div>
              )}

              {/* Eşya Durumu */}
              {item.furnished_status && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <span className="text-pink-600 font-semibold text-xs">EŞY</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Eşya Durumu</div>
                    <div className="font-semibold text-gray-900">{item.furnished_status}</div>
                  </div>
                </div>
              )}

              {/* Kullanım Durumu */}
              {item.usage_status && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <span className="text-cyan-600 font-semibold text-xs">KUL</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Kullanım Durumu</div>
                    <div className="font-semibold text-gray-900">{item.usage_status}</div>
                  </div>
                </div>
              )}

              {/* Tapu Durumu */}
              {item.deed_status && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 font-semibold text-xs">TAP</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Tapu Durumu</div>
                    <div className="font-semibold text-gray-900">{item.deed_status}</div>
                  </div>
                </div>
              )}

              {/* Depozito (Kiralık için) */}
              {item.deposit_amount && item.is_for === 'kiralik' && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-xs">DEP</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Depozito</div>
                    <div className="font-semibold text-gray-900">{item.deposit_amount.toLocaleString('tr-TR')} TL</div>
                  </div>
                </div>
              )}

              {/* Peşin Ödeme (Kiralık için) */}
              {item.advance_payment_months && item.is_for === 'kiralik' && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <span className="text-violet-600 font-semibold text-xs">PEŞ</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Peşin Ödeme</div>
                    <div className="font-semibold text-gray-900">{item.advance_payment_months} Ay</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🌾 Tarla Detayları - Sadece Tarla/Arsa için */}
          {isLand(item.property_type || '') && (
            <div className="rounded-2xl border bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-green-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🌾</span>
                </div>
                Tarla Detayları
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Tarla Türü */}
                {item.land_type && (
                  <div className="flex items-center gap-3 p-4 bg-white/70 rounded-lg border border-green-100">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-lg">🌱</span>
                    </div>
                    <div>
                      <div className="text-sm text-green-600 font-medium">Tarla Türü</div>
                      <div className="font-semibold text-green-800">{item.land_type}</div>
                    </div>
                  </div>
                )}

                {/* Sulama Durumu */}
                {item.irrigation_status && (
                  <div className="flex items-center gap-3 p-4 bg-white/70 rounded-lg border border-green-100">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">💧</span>
                    </div>
                    <div>
                      <div className="text-sm text-green-600 font-medium">Sulama Durumu</div>
                      <div className="font-semibold text-green-800">{item.irrigation_status}</div>
                    </div>
                  </div>
                )}

                {/* Elektrik Durumu */}
                {item.electricity_status && (
                  <div className="flex items-center gap-3 p-4 bg-white/70 rounded-lg border border-green-100">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600 text-lg">⚡</span>
                    </div>
                    <div>
                      <div className="text-sm text-green-600 font-medium">Elektrik Durumu</div>
                      <div className="font-semibold text-green-800">{item.electricity_status}</div>
                    </div>
                  </div>
                )}

                {/* Su Kuyusu */}
                {item.well_status && (
                  <div className="flex items-center gap-3 p-4 bg-white/70 rounded-lg border border-green-100">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <span className="text-cyan-600 text-lg">🚰</span>
                    </div>
                    <div>
                      <div className="text-sm text-green-600 font-medium">Su Kuyusu</div>
                      <div className="font-semibold text-green-800">{item.well_status}</div>
                    </div>
                  </div>
                )}

                {/* Yol Durumu */}
                {item.road_condition && (
                  <div className="flex items-center gap-3 p-4 bg-white/70 rounded-lg border border-green-100">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 text-lg">🛣️</span>
                    </div>
                    <div>
                      <div className="text-sm text-green-600 font-medium">Yol Durumu</div>
                      <div className="font-semibold text-green-800">{item.road_condition}</div>
                    </div>
                  </div>
                )}

                {/* Makine Erişimi */}
                {item.machinery_access && (
                  <div className="flex items-center gap-3 p-4 bg-white/70 rounded-lg border border-green-100">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 text-lg">🚜</span>
                    </div>
                    <div>
                      <div className="text-sm text-green-600 font-medium">Makine Erişimi</div>
                      <div className="font-semibold text-green-800">{item.machinery_access}</div>
                    </div>
                  </div>
                )}

                {/* İmar Durumu */}
                {item.zoning_status && (
                  <div className="flex items-center gap-3 p-4 bg-white/70 rounded-lg border border-green-100">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-indigo-600 text-lg">📋</span>
                    </div>
                    <div>
                      <div className="text-sm text-green-600 font-medium">İmar Durumu</div>
                      <div className="font-semibold text-green-800">{item.zoning_status}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Tarla için özel not */}
              <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">🌾</span>
                  <div>
                    <div className="font-semibold text-green-800 mb-1">Tarım Arazisi Bilgilendirmesi</div>
                    <div className="text-sm text-green-700 leading-relaxed">
                      Bu ilan tarım arazisi kategorisindedir. Satın alma öncesinde tapu durumu, imar planı ve 
                      tarım mevzuatı hakkında yetkili kurumlardan bilgi almanız önerilir.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Açıklama */}
          {item.description && (
            <div className="rounded-2xl border bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Açıklama</h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">{item.description}</div>
            </div>
          )}

          {/* Konum Haritası */}
          {item.latitude && item.longitude && (
            <div className="rounded-2xl border bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Konum</h2>
              <LocationMap
                latitude={item.latitude}
                longitude={item.longitude}
                address={item.address || undefined}
                title={item.title}
                height="400px"
              />
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
      />
    </div>
  )
}
