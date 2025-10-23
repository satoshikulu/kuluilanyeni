import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { uploadListingImage } from '../lib/storage'
import NeighborhoodSelect from '../components/NeighborhoodSelect'
import LocationPickerWrapper from '../components/LocationPickerWrapper'
import { MapPin, Upload, Send } from 'lucide-react'

function SubmitListingPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ownerName: '',
    ownerPhone: '',
    neighborhood: '',
    propertyType: 'Daire',
    rooms: '',
    areaM2: '',
    priceTl: '',
    isFor: 'satilik' as 'satilik' | 'kiralik',
    address: '',
    latitude: 39.0919,
    longitude: 33.0794,
    locationType: 'address' as 'address' | 'coordinates',
  })

  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleLocationChange = (data: {
    address: string
    latitude: number
    longitude: number
    locationType: 'address' | 'coordinates'
  }) => {
    setFormData((prev) => ({
      ...prev,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      locationType: data.locationType,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setImages((prev) => [...prev, ...files].slice(0, 10)) // Max 10 görsel
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validasyon
      if (!formData.title || !formData.ownerName || !formData.ownerPhone) {
        throw new Error('Lütfen zorunlu alanları doldurun')
      }

      // İlan oluştur
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          title: formData.title,
          description: formData.description,
          owner_name: formData.ownerName,
          owner_phone: formData.ownerPhone,
          neighborhood: formData.neighborhood,
          property_type: formData.propertyType,
          rooms: formData.rooms,
          area_m2: formData.areaM2 ? parseInt(formData.areaM2) : null,
          price_tl: formData.priceTl ? parseInt(formData.priceTl) : null,
          is_for: formData.isFor,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          location_type: formData.locationType,
          status: 'pending',
        })
        .select()
        .single()

      if (listingError) throw listingError

      // Görselleri yükle
      if (images.length > 0 && listing) {
        const uploadPromises = images.map((file) => uploadListingImage(file, listing.id))
        const uploadResults = await Promise.all(uploadPromises)
        const imageUrls = uploadResults.map((r) => r.publicUrl)

        // İlanı görsellerle güncelle
        await supabase
          .from('listings')
          .update({ images: imageUrls })
          .eq('id', listing.id)
      }

      setSuccess(true)
      // Formu temizle
      setFormData({
        title: '',
        description: '',
        ownerName: '',
        ownerPhone: '',
        neighborhood: '',
        propertyType: 'Daire',
        rooms: '',
        areaM2: '',
        priceTl: '',
        isFor: 'satilik',
        address: '',
        latitude: 39.0919,
        longitude: 33.0794,
        locationType: 'address',
      })
      setImages([])
    } catch (err: any) {
      setError(err.message || 'İlan gönderilirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">İlan Ver</h1>
        <p className="text-gray-600 mb-8">
          Gönderdiğiniz ilan admin onayından sonra yayına alınır.
        </p>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            ✅ İlanınız başarıyla gönderildi! Admin onayından sonra yayına alınacaktır.
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Temel Bilgiler</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İlan Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Örn: Merkez Konumda 3+1 Satılık Daire"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durum *
                </label>
                <select
                  value={formData.isFor}
                  onChange={(e) => setFormData({ ...formData, isFor: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="satilik">Satılık</option>
                  <option value="kiralik">Kiralık</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emlak Türü
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Daire">Daire</option>
                  <option value="Müstakil">Müstakil</option>
                  <option value="Villa">Villa</option>
                  <option value="Arsa">Arsa</option>
                  <option value="Dükkan">Dükkan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mahalle
                </label>
                <NeighborhoodSelect
                  value={formData.neighborhood}
                  onChange={(val) => setFormData({ ...formData, neighborhood: val })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oda Sayısı
                </label>
                <input
                  type="text"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Örn: 3+1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alan (m²)
                </label>
                <input
                  type="number"
                  value={formData.areaM2}
                  onChange={(e) => setFormData({ ...formData, areaM2: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiyat (TL)
                </label>
                <input
                  type="number"
                  value={formData.priceTl}
                  onChange={(e) => setFormData({ ...formData, priceTl: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2500000"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="İlan detaylarını buraya yazın..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Konum Bilgileri */}
          <div className="space-y-4 pt-6 border-t bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">📍 Konum Bilgileri</h2>
            </div>
            
            {/* BÜYÜK UYARI KUTUSU - EĞER BUNU GÖRÜYORsan BÖLÜM RENDER EDİLİYOR */}
            <div className="bg-red-100 border-4 border-red-500 p-6 rounded-lg mb-4">
              <p className="text-red-900 font-bold text-lg mb-2">
                ⚠️ EĞER BU KUTUYU GÖRÜYORsan:
              </p>
              <p className="text-red-800 text-base">
                ✅ "Konum Bilgileri" bölümü render ediliyor!
              </p>
              <p className="text-red-700 text-sm mt-2">
                Aşağıda harita görünmeli. Eğer görünmüyorsa tarayıcı konsolunu (F12) kontrol et.
              </p>
            </div>
            
            {/* Debug: Kontrol mesajı */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
              <p className="text-blue-800 text-sm">
                ℹ️ Harita bölümü yükleniyor... Eğer harita görünmüyorsa:
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1">
                <li>• Dev server'ı yeniden başlatın (Ctrl+C, sonra npm run dev)</li>
                <li>• Tarayıcıyı hard refresh yapın (Ctrl+Shift+R)</li>
                <li>• Tarayıcı konsolunu kontrol edin (F12)</li>
              </ul>
            </div>
            
            {/* Harita Bölümü */}
            <LocationPickerWrapper
              address={formData.address}
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={handleLocationChange}
            />
          </div>

          {/* İletişim Bilgileri */}
          <div className="space-y-4 pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900">İletişim Bilgileri</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ahmet Yılmaz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5551234567"
                />
              </div>
            </div>
          </div>

          {/* Görseller */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Görseller</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotoğraf Ekle (Maksimum 10 adet)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gönder Butonu */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white py-3 px-6 font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  İlanı Gönder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubmitListingPage


