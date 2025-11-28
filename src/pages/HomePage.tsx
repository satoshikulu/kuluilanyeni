import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { MapPin, Zap, ArrowRight, TrendingDown, MessageCircle, Eye } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getMultipleListingInterestCounts, recordListingInterest } from '../lib/listingInterests'

function HomePage() {
  const [typewriterText, setTypewriterText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [featuredListings, setFeaturedListings] = useState<any[]>([])
  const [opportunityListings, setOpportunityListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [opportunityLoading, setOpportunityLoading] = useState(true)
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({})
  
  const texts = [
    'Kulu Emlak Pazarı',
    'Güvenilir Emlak Platformu',
    'En İyi Fırsatlar Burada',
    'Hayalinizdeki Ev',
    'Uzman Değerlendirme'
  ]

  useEffect(() => {
    const currentText = texts[currentIndex]
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (typewriterText.length < currentText.length) {
          setTypewriterText(currentText.substring(0, typewriterText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), 2000) // 2 saniye bekle
        }
      } else {
        if (typewriterText.length > 0) {
          setTypewriterText(typewriterText.substring(0, typewriterText.length - 1))
        } else {
          setIsDeleting(false)
          setCurrentIndex((prev) => (prev + 1) % texts.length)
        }
      }
    }, isDeleting ? 50 : 100) // Silme hızlı, yazma yavaş

    return () => clearTimeout(timeout)
  }, [typewriterText, currentIndex, isDeleting, texts])

  useEffect(() => {
    fetchFeaturedListings()
    fetchOpportunityListings()
  }, [])

  useEffect(() => {
    // İlgi sayılarını getir
    const allListings = [...featuredListings, ...opportunityListings]
    if (allListings.length > 0) {
      const listingIds = allListings.map(l => l.id)
      getMultipleListingInterestCounts(listingIds).then(counts => {
        setInterestCounts(counts)
      })
    }
  }, [featuredListings, opportunityListings])

  const fetchFeaturedListings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .eq('is_featured', true)
        .order('featured_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error
      setFeaturedListings(data || [])
    } catch (error) {
      console.error('Öne çıkan ilanlar yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOpportunityListings = async () => {
    try {
      setOpportunityLoading(true)
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .eq('is_opportunity', true)
        .order('opportunity_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setOpportunityListings(data || [])
    } catch (error) {
      console.error('Fırsat ilanları yüklenirken hata:', error)
    } finally {
      setOpportunityLoading(false)
    }
  }

  const featuredImages = [
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop', // apartment building (3+1 Daire)
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop', // luxury apartment (2+1 Daire)
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop', // apartment building (5+1 Villa)
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop', // luxury apartment (3+1 Daire)
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1200&auto=format&fit=crop', // luxury villa (4+1 Villa)
    'https://images.unsplash.com/photo-1448630360428-65456885c650?q=80&w=1200&auto=format&fit=crop', // suburban house (6. kart)
  ]

  const opportunityImages = [
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop', // modern house exterior
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1200&auto=format&fit=crop', // luxury villa
    'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop', // modern house exterior (reliable)
  ]

  async function handleQuickContact(listing: any, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    
    // İlgi kaydını veritabanına ekle
    await recordListingInterest(listing.id)
    
    // İlgi sayısını güncelle
    setInterestCounts(prev => ({
      ...prev,
      [listing.id]: (prev[listing.id] || 0) + 1
    }))
    
    const whatsappPhone = '905556874803'
    const message = `Merhaba, bir ilanla ilgileniyorum:

📋 İlan: ${listing.title || listing.rooms + ' ' + listing.property_type}
🏠 Tür: ${listing.property_type || 'Belirtilmemiş'}
${listing.rooms ? `🚪 Oda: ${listing.rooms}` : ''}
${listing.area_m2 ? `📐 Alan: ${listing.area_m2} m²` : ''}
📍 Mahalle: ${listing.neighborhood || 'Belirtilmemiş'}
💰 Fiyat: ${listing.price_tl ? listing.price_tl.toLocaleString('tr-TR') + ' TL' : 'Belirtilmemiş'}
🔗 Link: ${window.location.origin}/ilan/${listing.id}

İlan sahibi ile görüşmek istiyorum.`

    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="relative">
      <section className="relative overflow-hidden rounded-2xl">
        {/* Ken Burns Effect Background */}
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center animate-ken-burns"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 px-6 py-20 text-white">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Kulu İlan
          </h1>
          <p className="mt-3 text-lg text-white/90 min-h-[2rem]">
            <span className="inline-block">{typewriterText}</span>
            <span className="animate-pulse">|</span>
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <Link 
              to="/satmak" 
              className="group relative inline-flex items-center justify-center rounded-xl bg-white/90 backdrop-blur-md text-gray-900 px-6 py-4 font-semibold shadow-lg border border-white/20 hover:bg-orange-500/90 hover:text-white hover:border-orange-400/50 hover:shadow-orange-500/50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="relative z-10">Satmak istiyorum</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/0 to-orange-600/0 group-hover:from-orange-400/20 group-hover:to-orange-600/20 transition-all duration-300"></div>
            </Link>
            <Link 
              to="/kiralamak" 
              className="group relative inline-flex items-center justify-center rounded-xl bg-white/90 backdrop-blur-md text-gray-900 px-6 py-4 font-semibold shadow-lg border border-white/20 hover:bg-orange-500/90 hover:text-white hover:border-orange-400/50 hover:shadow-orange-500/50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="relative z-10">Kiralamak istiyorum</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/0 to-orange-600/0 group-hover:from-orange-400/20 group-hover:to-orange-600/20 transition-all duration-300"></div>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/ilanlar"
              className="inline-flex items-center rounded-xl bg-blue-600/95 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-black/20 ring-1 ring-white/20 hover:bg-orange-500 hover:ring-orange-300 transition-colors"
            >
              İlanlara Bak
            </Link>
            <Link
              to="/giris"
              className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-base font-semibold text-gray-900 shadow-lg shadow-black/20 ring-1 ring-white/40 hover:bg-orange-50 hover:text-orange-700 hover:ring-orange-300 transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              to="/uye-ol"
              className="inline-flex items-center rounded-xl border-2 border-white/80 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-black/10 hover:border-orange-400 hover:bg-orange-500/10 hover:text-orange-200 transition-colors"
            >
              Üye Ol
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Öne çıkan ilanlar</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
        ) : featuredListings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Henüz öne çıkan ilan bulunmuyor</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing, i) => {
              const images = Array.isArray(listing.images) ? listing.images : []
              const firstImage = images.length > 0 ? images[0] : featuredImages[i % featuredImages.length]
              
              return (
                <Link 
                  key={listing.id} 
                  to={`/ilan/${listing.id}`}
                  className="group rounded-xl border overflow-hidden bg-white shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative overflow-hidden">
                    <div
                      className="h-40 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                      style={{ backgroundImage: `url(${firstImage})` }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                    {/* İlgi Badge */}
                    {interestCounts[listing.id] > 0 && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                        <Eye className="w-3 h-3" />
                        {interestCounts[listing.id]}
                      </div>
                    )}
                  </div>
                  <div className="p-4 group-hover:bg-gray-50 transition-colors duration-300">
                    <div className="font-medium group-hover:text-blue-600 transition-colors duration-300 mb-2">
                      {listing.rooms} {listing.property_type} · {listing.area_m2} m²
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      {listing.neighborhood}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-lg group-hover:text-green-600 transition-colors duration-300">
                        {listing.price_tl?.toLocaleString('tr-TR')} TL
                      </div>
                      <button
                        onClick={(e) => handleQuickContact(listing, e)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        title="İlanla ilgileniyorum"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        İlgileniyorum
                      </button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-16 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-3xl p-10 shadow-xl border border-orange-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mb-4 shadow-lg animate-pulse">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Fırsat İlanlar
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full mb-6"></div>
          <p className="text-gray-700 text-base leading-relaxed max-w-3xl mx-auto font-medium">
            Uzman analistlerimiz tarafından detaylı fiyat analizi yapılan, hem yatırım hem de yaşam için 
            <span className="text-orange-600 font-semibold"> kaçırılmayacak fırsatlar</span>. 
            Hem alıcı hem de satıcıyı memnun edecek, piyasa değerinin altında değerlendirilmiş 
            <span className="text-orange-600 font-semibold"> özel seçilmiş ilanlar</span>.
          </p>
        </div>
        {opportunityLoading ? (
          <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
        ) : opportunityListings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Henüz fırsat ilan bulunmuyor</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunityListings.map((listing, i) => {
              const images = Array.isArray(listing.images) ? listing.images : []
              const firstImage = images.length > 0 ? images[0] : opportunityImages[i % opportunityImages.length]
              const discount = listing.discount_percentage || (listing.original_price_tl && listing.price_tl 
                ? Math.round(((listing.original_price_tl - listing.price_tl) / listing.original_price_tl) * 100)
                : 0)
              
              return (
                <Link
                  key={listing.id}
                  to={`/ilan/${listing.id}`}
                  className="group rounded-2xl border-2 border-orange-200 overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative overflow-hidden">
                    <div
                      className="h-40 bg-cover bg-center bg-gray-200 group-hover:scale-110 transition-transform duration-500"
                      style={{ 
                        backgroundImage: `url(${firstImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
                      <Zap className="w-3 h-3" />
                      FIRSAT
                    </div>
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {discount > 0 && (
                        <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                          <TrendingDown className="w-3 h-3" />
                          %{discount}
                        </div>
                      )}
                      {/* İlgi Badge */}
                      {interestCounts[listing.id] > 0 && (
                        <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                          <Eye className="w-3 h-3" />
                          {interestCounts[listing.id]}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-5 group-hover:bg-gray-50 transition-colors duration-300">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 mb-2">
                      {listing.rooms} {listing.property_type} · {listing.area_m2} m²
                    </div>
                    <div className="flex items-center gap-1 text-orange-600 text-sm font-medium mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      {listing.neighborhood}
                    </div>
                    <div className="flex items-end justify-between pt-3 border-t border-gray-200">
                      <div>
                        {listing.original_price_tl && (
                          <div className="text-xs text-gray-500 line-through mb-1">
                            {listing.original_price_tl.toLocaleString('tr-TR')} TL
                          </div>
                        )}
                        <div className="font-bold text-green-600 text-xl group-hover:text-green-700 transition-colors duration-300">
                          {listing.price_tl?.toLocaleString('tr-TR')}
                          <span className="text-sm font-normal text-gray-600 ml-1">TL</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleQuickContact(listing, e)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                        title="İlanla ilgileniyorum"
                      >
                        <MessageCircle className="w-4 h-4" />
                        İlgileniyorum
                      </button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
        <div className="text-center mt-8">
          <Link to="/firsatlar" className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <span className="relative z-10">Tüm Fırsat İlanlarını Gör</span>
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage


