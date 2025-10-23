# 🗺️ Harita Özelliği Kurulum Talimatları

## ✅ Yapılan Değişiklikler

### 1. Yeni Paketler Kuruldu
- `leaflet` - Harita kütüphanesi
- `react-leaflet` - React entegrasyonu
- `@types/leaflet` - TypeScript tipleri

### 2. Supabase Veritabanı Güncellemesi Gerekli

**ÖNEMLİ:** Aşağıdaki SQL script'ini Supabase Dashboard'da çalıştırmanız gerekiyor:

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden "SQL Editor" seçin
4. Aşağıdaki script'i yapıştırın ve "Run" butonuna tıklayın:

```sql
-- Mevcut listings tablosuna konum kolonlarını ekle
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'address' CHECK (location_type IN ('address', 'coordinates'));

-- İndeksler ekle
CREATE INDEX IF NOT EXISTS idx_listings_latitude ON public.listings(latitude);
CREATE INDEX IF NOT EXISTS idx_listings_longitude ON public.listings(longitude);

-- Başarılı mesajı
SELECT 'Konum kolonları başarıyla eklendi!' as message;
```

**Alternatif:** `scripts/add-location-columns.sql` dosyasını da kullanabilirsiniz.

### 3. Yeni Bileşenler

#### LocationPicker (İlan Verme Sayfası)
- Adres arama özelliği (Nominatim API)
- Haritadan manuel konum seçimi
- Sürüklenebilir marker
- Koordinat gösterimi

#### LocationMap (İlan Detay Sayfası)
- İlan konumunu haritada gösterir
- Google Maps ve Apple Maps'e yönlendirme
- Adres bilgisi gösterimi

### 4. Güncellenen Sayfalar

- **SubmitListingPage**: Harita ile konum seçimi eklendi
- **ListingDetailPage**: İlan konumu haritada gösteriliyor

## 🧪 Test Adımları

### 1. Localhost'ta Test Edin

```bash
npm run dev
```

Tarayıcıda açın: http://localhost:5173

### 2. Test Senaryoları

#### İlan Verme Testi:
1. "İlan Ver" sayfasına gidin
2. Formu doldurun
3. Adres alanına bir adres yazın (örn: "Cumhuriyet Mahallesi, Kulu")
4. "Ara" butonuna tıklayın
5. Haritada konumun işaretlendiğini görün
6. İşaretçiyi sürükleyerek konumu değiştirin
7. Formu gönderin

#### İlan Görüntüleme Testi:
1. Konum bilgisi olan bir ilana gidin
2. Sayfanın altında harita bölümünü görün
3. "Google Maps'te Aç" butonunu test edin
4. Haritanın doğru konumu gösterdiğini kontrol edin

### 3. Sorun Giderme

**Harita görünmüyorsa:**
- Tarayıcı konsolunu kontrol edin (F12)
- Leaflet CSS'inin yüklendiğinden emin olun
- Internet bağlantınızı kontrol edin

**Adres arama çalışmıyorsa:**
- Nominatim API'si ücretsiz ama yavaş olabilir
- Birkaç saniye bekleyin
- Manuel olarak haritadan seçin

**Supabase hatası alıyorsanız:**
- SQL script'ini çalıştırdığınızdan emin olun
- Supabase bağlantınızı kontrol edin

## 📝 Notlar

- **Geocoding API**: Nominatim (OpenStreetMap) kullanılıyor - ücretsiz
- **Harita Tiles**: OpenStreetMap - ücretsiz
- **Kulu Merkez Koordinatları**: 39.0919, 33.0794
- **Maksimum Görsel**: 10 adet

## 🚀 Canlıya Alma

Test tamamlandıktan sonra:

```bash
git add .
git commit -m "Harita özelliği eklendi: Konum seçimi ve görüntüleme"
git push
```

## 🎯 Özellikler

✅ Adres arama (Türkiye odaklı)
✅ Manuel konum seçimi
✅ Sürüklenebilir marker
✅ Koordinat gösterimi
✅ Google Maps entegrasyonu
✅ Apple Maps entegrasyonu
✅ Responsive tasarım
✅ Görsel uyumlu tasarım

## 💡 İpuçları

- Tarla/arsa ilanları için GPS koordinatı kullanın
- Şehir içi ilanlar için adres kullanın
- Haritayı zoom yaparak daha hassas konum seçin
- Koordinatları not alın (yedek için)
