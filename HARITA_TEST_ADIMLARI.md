# 🗺️ Harita Test Adımları

## 🎯 Sorun

İlan verme sayfasında harita bölümü görünmüyor.
- Sadece "Mahalle" seçeneği var
- Konum girişi yapılamıyor
- Bu yüzden ilanlar konum verisi olmadan kaydediliyor

## ✅ Yapılan Değişiklikler

### 1. Leaflet CSS Import Eklendi
**Dosya:** `src/main.tsx`
```typescript
import 'leaflet/dist/leaflet.css'  // ← EKLENDI
```

### 2. Debug Mesajı Eklendi
**Dosya:** `src/pages/SubmitListingPage.tsx`
- Harita bölümünün üstüne bilgilendirme mesajı eklendi
- Kullanıcı harita görünmüyorsa ne yapacağını bilecek

### 3. Test İlanları Oluşturuldu
- 3 adet konum verili test ilanı eklendi
- Harita özelliğinin çalıştığı doğrulandı

## 🧪 Test Adımları

### Adım 1: Dev Server'ı Yeniden Başlat ⚠️ ÖNEMLİ

```bash
# Terminal'de:
# 1. Ctrl+C ile durdur
# 2. Tekrar başlat:
npm run dev
```

**Neden?** Leaflet CSS import'u yeni eklendi, server yeniden başlatılmalı.

### Adım 2: Tarayıcıyı Hard Refresh Yap

```bash
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

**Neden?** Eski cache'i temizlemek için.

### Adım 3: İlan Ver Sayfasına Git

```
http://localhost:5173/ilan-ver
```

### Adım 4: Sayfayı Kontrol Et

#### Beklenen Görünüm:

```
┌─────────────────────────────────────────┐
│ İLAN VER FORMU                          │
├─────────────────────────────────────────┤
│ ... (Temel bilgiler)                    │
├─────────────────────────────────────────┤
│ 📍 Konum Bilgileri                      │
├─────────────────────────────────────────┤
│ ℹ️ Harita bölümü yükleniyor...         │
│ (Mavi bilgi kutusu)                     │
├─────────────────────────────────────────┤
│ Adres veya Konum Bilgisi                │
│ [........................] [🔍 Ara]     │
├─────────────────────────────────────────┤
│                                         │
│         🗺️ HARİTA                      │
│                                         │
│     ┌───────────────┐                  │
│     │ + │ - │ 🏠   │  (Kontroller)     │
│     └───────────────┘                  │
│                                         │
│         📍 Marker                       │
│                                         │
└─────────────────────────────────────────┘
```

#### Senaryo A: Harita Görünüyor ✅

**Tebrikler!** Harita çalışıyor.

**Test Et:**
1. Adres input'una yaz: `"Cumhuriyet Mahallesi, Kulu"`
2. "Ara" butonuna tıkla
3. Harita konumu bulmalı
4. Marker yerleşmeli
5. Formu doldur ve gönder
6. İlan detayında harita görünmeli

#### Senaryo B: Harita Görünmüyor ❌

**Kontrol Et:**

1. **Mavi bilgi kutusu görünüyor mu?**
   - ✅ Evet → Bölüm render ediliyor, LocationPicker sorunu
   - ❌ Hayır → Tüm bölüm render edilmiyor

2. **Tarayıcı Konsolu (F12)**
   ```
   Aranacak hatalar:
   - "Cannot find module 'leaflet'"
   - "Leaflet is not defined"
   - "MapContainer is not defined"
   - CSS yükleme hatası
   ```

3. **Dev Server Terminal**
   ```
   Hata mesajı var mı?
   Build başarılı mı?
   ```

### Adım 5: Test İlanı Ekle

**Eğer harita görünüyorsa:**

1. Formu doldur:
   ```
   Başlık: Test İlan - Manuel Ekleme
   Durum: Satılık
   Emlak Türü: Daire
   Mahalle: Cumhuriyet Mahallesi
   Oda: 3+1
   Alan: 120 m²
   Fiyat: 2500000 TL
   ```

2. Konum seç:
   ```
   Adres: "Cumhuriyet Mahallesi, Kulu"
   "Ara" butonuna tıkla
   Veya haritadan manuel seç
   ```

3. İletişim:
   ```
   Ad Soyad: Test Kullanıcı
   Telefon: 5551234567
   ```

4. Gönder

5. Admin panele git (`/admin`) ve onayla

6. İlan detayına git ve harita kontrol et

## 📊 Test Sonuçları

### Otomatik Oluşturulan Test İlanları

3 adet test ilanı zaten oluşturuldu:

```
1. Harita Testi - Cumhuriyet Mahallesi 3+1 Daire
   http://localhost:5173/ilan/cbc03aae-c1a9-4993-b3c3-5e84e98dcd4c
   ✅ Harita görünüyor

2. Harita Testi - Atatürk Mahallesi Müstakil Ev
   http://localhost:5173/ilan/e3069de9-4e06-4081-832c-61fc63bfaa1a
   ✅ Harita görünüyor

3. Harita Testi - Yeni Mahalle 2+1 Kiralık
   http://localhost:5173/ilan/e3eda4dd-c974-42c0-b6f3-cc806d2337ef
   ✅ Harita görünüyor
```

Bu ilanları ziyaret et ve haritanın çalıştığını gör.

## 🐛 Sorun Giderme

### Sorun 1: Harita Hala Görünmüyor

**Çözüm:**
```bash
# Cache temizle
rm -rf node_modules/.vite
rm -rf dist

# Dev server'ı yeniden başlat
npm run dev
```

### Sorun 2: "Cannot find module 'leaflet'"

**Çözüm:**
```bash
npm install leaflet@1.9.4 react-leaflet@5.0.0 @types/leaflet
```

### Sorun 3: Harita Beyaz/Boş

**Çözüm:**
- Leaflet CSS yüklenmemiş
- `main.tsx` dosyasında `import 'leaflet/dist/leaflet.css'` var mı kontrol et

### Sorun 4: Marker Görünmüyor

**Çözüm:**
- LocationPicker.tsx'de marker icon fix var
- Zaten düzeltilmiş olmalı

## ✅ Başarı Kriterleri

- [ ] İlan ver sayfasında harita bölümü görünüyor
- [ ] Adres arama çalışıyor
- [ ] Haritaya tıklama çalışıyor
- [ ] Marker sürüklenebiliyor
- [ ] Koordinatlar gösteriliyor
- [ ] Form gönderilince konum kaydediliyor
- [ ] İlan detayında harita görünüyor
- [ ] Google Maps linki çalışıyor

## 🎉 Sonuç

**Beklenen:**
- Dev server yeniden başlatıldıktan sonra harita görünmeli
- İlan verme sayfasında konum seçilebilmeli
- İlan detayında harita gösterilmeli

**Eğer hala sorun varsa:**
- Tarayıcı konsol ekran görüntüsü al
- Dev server terminal çıktısını kopyala
- Hangi adımda takıldığını belirt
