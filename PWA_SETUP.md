# PWA (Progressive Web App) Kurulumu

## ✅ Tamamlanan Özellikler

### 1. PWA Yapılandırması
- ✅ `manifest.json` oluşturuldu
- ✅ Service Worker yapılandırıldı
- ✅ Icon'lar eklendi (192x192, 512x512, Apple Touch Icon)
- ✅ Meta tag'ler eklendi

### 2. Offline Çalışma
- ✅ Vite PWA Plugin kuruldu
- ✅ Workbox ile cache stratejileri yapılandırıldı
- ✅ Supabase API cache (NetworkFirst - 24 saat)
- ✅ Image cache (CacheFirst - 30 gün)

### 3. Install Prompt
- ✅ PWAInstallPrompt component'i oluşturuldu
- ✅ Kullanıcı dostu install UI
- ✅ "Daha Sonra" seçeneği (7 gün hatırlanır)
- ✅ Animasyonlu prompt

### 4. Özellikler
- 📱 Standalone mod (tam ekran uygulama)
- 🎨 Tema rengi: Mavi (#3b82f6)
- 🔄 Otomatik güncelleme
- 📴 Offline çalışma
- 🚀 Hızlı yükleme
- 📲 Ana ekrana ekleme
- 🍎 iOS desteği

## 📱 Kullanım

### Mobil Cihazlarda Yükleme

#### Android (Chrome)
1. Siteyi ziyaret edin
2. Ekranın altında "Uygulamayı Yükle" prompt'u görünecek
3. "Yükle" butonuna tıklayın
4. Uygulama ana ekrana eklenecek

#### iOS (Safari)
1. Siteyi Safari'de açın
2. Paylaş butonuna (⬆️) tıklayın
3. "Ana Ekrana Ekle" seçeneğini seçin
4. "Ekle" butonuna tıklayın

#### Desktop (Chrome/Edge)
1. Adres çubuğunun sağındaki yükle ikonuna tıklayın
2. "Yükle" butonuna tıklayın
3. Uygulama masaüstüne eklenecek

## 🔧 Geliştirme

### Build
\`\`\`bash
npm run build
\`\`\`

### Preview (PWA Test)
\`\`\`bash
npm run preview
\`\`\`

### Dev Mode (PWA Enabled)
\`\`\`bash
npm run dev
\`\`\`

## 📦 Dosya Yapısı

\`\`\`
kulu-ilan/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icon-192x192.jpg       # Small icon
│   ├── icon-512x512.jpg       # Large icon
│   └── apple-touch-icon.jpg   # iOS icon
├── src/
│   ├── components/
│   │   └── PWAInstallPrompt.tsx  # Install prompt UI
│   ├── main.tsx               # Service Worker registration
│   └── index.css              # PWA animations
└── vite.config.ts             # PWA plugin config
\`\`\`

## 🎯 Cache Stratejileri

### NetworkFirst (Supabase API)
- Önce network'ten veri çekmeyi dener
- Network başarısız olursa cache'den döner
- 24 saat cache süresi
- Maksimum 50 entry

### CacheFirst (Images)
- Önce cache'den bakar
- Cache'de yoksa network'ten çeker
- 30 gün cache süresi
- Maksimum 100 entry

## 🔍 Test Etme

### Lighthouse Audit
1. Chrome DevTools'u açın (F12)
2. Lighthouse tab'ine gidin
3. "Progressive Web App" seçeneğini işaretleyin
4. "Generate report" butonuna tıklayın

### PWA Özellikleri Kontrolü
- ✅ Installable
- ✅ Works offline
- ✅ Fast load time
- ✅ Responsive design
- ✅ HTTPS (production)

## 📝 Notlar

- PWA özellikleri sadece HTTPS üzerinde çalışır (localhost hariç)
- Service Worker güncellemeleri otomatik yapılır
- Cache temizleme: DevTools > Application > Clear storage
- iOS'ta bazı PWA özellikleri sınırlıdır

## 🚀 Deployment

Netlify/Vercel otomatik olarak PWA'yı destekler. Ek yapılandırma gerekmez.

### Netlify
\`\`\`toml
# netlify.toml
[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"
\`\`\`

## 🎨 Icon Gereksinimleri

- **192x192**: Splash screen ve app icon
- **512x512**: High-res app icon
- **Apple Touch Icon**: iOS home screen icon
- Format: JPG/PNG (PNG önerilir)
- Şeffaf arka plan (PNG için)

## 📱 Shortcuts (Kısayollar)

Manifest'te tanımlı kısayollar:
- 🏷️ Satılık İlanlar → `/satilik`
- 🔑 Kiralık İlanlar → `/kiralik`

Android'de uzun basınca görünür.

## 🔄 Güncelleme Stratejisi

- Service Worker otomatik güncellenir
- Kullanıcı sayfayı yenilediğinde yeni versiyon yüklenir
- Cache'ler otomatik temizlenir
- Eski versiyonlar silinir

## 🎉 Başarıyla Kuruldu!

PWA özellikleri aktif. Kullanıcılar artık uygulamayı cihazlarına yükleyebilir ve offline kullanabilir!
