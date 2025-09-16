import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function HomePage() {
  const [typewriterText, setTypewriterText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  
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

  const opportunityListings = [
    {
      title: '2+1 Daire · 95 m²',
      neighborhood: 'Yeni Mahallesi',
      currentPrice: '1.650.000',
      originalPrice: '1.850.000',
      discount: '%11',
      image: opportunityImages[0]
    },
    {
      title: '3+1 Daire · 125 m²',
      neighborhood: 'Cumhuriyet Mahallesi',
      currentPrice: '2.200.000',
      originalPrice: '2.500.000',
      discount: '%12',
      image: opportunityImages[1]
    },
    {
      title: '4+1 Villa · 180 m²',
      neighborhood: 'Zincirlikuyu Mahallesi',
      currentPrice: '4.200.000',
      originalPrice: '5.800.000',
      discount: '%16',
      image: opportunityImages[2]
    }
  ]
  return (
    <div className="relative">
      <section className="relative overflow-hidden rounded-2xl bg-[url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center">
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
            <Link to="/satmak" className="inline-flex items-center justify-center rounded-xl bg-white text-gray-900 px-6 py-4 font-medium hover:bg-white/90">
              Satmak istiyorum
            </Link>
            <Link to="/kiralamak" className="inline-flex items-center justify-center rounded-xl bg-white text-gray-900 px-6 py-4 font-medium hover:bg-white/90">
              Kiralamak istiyorum
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { type: "3+1 Daire", area: "125 m²", location: "Cumhuriyet Mahallesi", price: "2.750.000 TL" },
            { type: "2+1 Daire", area: "95 m²", location: "Yeni Mahallesi", price: "1.850.000 TL" },
            { type: "5+1 Villa", area: "220 m²", location: "Karşıyaka Mahallesi", price: "5.500.000 TL" },
            { type: "3+1 Daire", area: "110 m²", location: "Cumhuriyet Mahallesi", price: "2.200.000 TL" },
            { type: "4+1 Villa", area: "160 m²", location: "Güzel Yayla Mahallesi", price: "3.800.000 TL" },
            { type: "3+1 Daire", area: "130 m²", location: "Fatih Sultan Mehmet Mahallesi", price: "2.950.000 TL" }
          ].map((property, i) => (
            <div key={i} className="group rounded-xl border overflow-hidden bg-white shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="relative overflow-hidden">
                <div
                  className="h-40 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                  style={{ backgroundImage: `url(${featuredImages[i]})` }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
              </div>
              <div className="p-4 group-hover:bg-gray-50 transition-colors duration-300">
                <div className="font-medium group-hover:text-blue-600 transition-colors duration-300">{property.type} · {property.area}</div>
                <div className="text-gray-500 text-sm">{property.location}</div>
                <div className="mt-2 font-semibold text-lg group-hover:text-green-600 transition-colors duration-300">{property.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-3xl p-10 shadow-xl border border-orange-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunityListings.map((listing, i) => (
            <div
              key={i}
              className="group rounded-2xl border-2 border-orange-200 overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="relative overflow-hidden">
                <div
                  className="h-40 bg-cover bg-center bg-gray-200 group-hover:scale-110 transition-transform duration-500"
                  style={{ 
                    backgroundImage: `url(${listing.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  FIRSAT
                </div>
              </div>
              <div className="p-4 group-hover:bg-gray-50 transition-colors duration-300">
                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{listing.title}</div>
                <div className="text-orange-600 text-sm font-medium">{listing.neighborhood}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="font-bold text-orange-800 text-lg group-hover:text-green-600 transition-colors duration-300">{listing.currentPrice} TL</div>
                  <div className="text-xs text-gray-500 line-through">{listing.originalPrice} TL</div>
                </div>
                <div className="mt-1 text-xs text-green-600 font-medium">{listing.discount} indirim</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <span className="relative z-10">Tüm Fırsat İlanlarını Gör</span>
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </section>
    </div>
  )
}

export default HomePage


