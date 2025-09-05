import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NeighborhoodSelect from '../components/NeighborhoodSelect'

function RentPage() {
  const [formData, setFormData] = useState({
    title: '',
    owner_name: '',
    owner_phone: '',
    neighborhood: '',
    property_type: 'Daire',
    rooms: '',
    area_m2: '',
    price_tl: '',
    description: '',
    is_for: 'kiralik' as const
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('listings')
        .insert([{
          ...formData,
          price_tl: formData.price_tl ? parseInt(formData.price_tl) : null,
          area_m2: formData.area_m2 ? parseInt(formData.area_m2) : null,
          status: 'pending'
        }])

      if (error) throw error

      setMessage('Kiralama ilanınız başarıyla gönderildi! Admin onayından sonra yayınlanacak.')
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
        is_for: 'kiralik'
      })
    } catch (error: any) {
      setMessage('Hata: ' + (error.message || 'İlan gönderilemedi'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Kiralama İlanı Ver</h1>
          <p className="text-xl text-green-100">Emlakınızı kiralama için ilan verin</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">İlan Bilgileri</h2>
            <p className="text-gray-600">Lütfen tüm alanları doldurun. İlanınız admin onayından sonra yayınlanacaktır.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* İlan Başlığı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
            </div>

            {/* Sahip Bilgileri */}
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
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0555 123 45 67"
                />
              </div>
            </div>

            {/* Mahalle ve Emlak Türü */}
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

            {/* Oda Sayısı ve Alan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oda Sayısı
                </label>
                <input
                  type="text"
                  name="rooms"
                  value={formData.rooms}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Örn: 3+1, 2+1"
                />
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

            {/* Kira Fiyatı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aylık Kira Fiyatı (TL) *
              </label>
              <input
                type="number"
                name="price_tl"
                value={formData.price_tl}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="5000"
              />
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
            </div>

            {/* Görsel Yükleme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Görseller (İsteğe Bağlı)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-gray-600">Görsel yükleme özelliği yakında eklenecek</p>
              </div>
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

            {/* Gönder Butonu */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Gönderiliyor...' : 'İlanı Gönder'}
              </button>
            </div>
          </form>

          {/* Bilgi Notu */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
    </div>
  )
}

export default RentPage


