# 🔔 OneSignal Push Notifications - Kurulum Rehberi

## ✅ Tamamlanan Kodlama

Tüm kod hazır! Sadece OneSignal hesabı oluşturup API key'leri eklemeniz gerekiyor.

## 📋 Kurulum Adımları

### 1. OneSignal Hesabı Oluştur

1. [OneSignal](https://onesignal.com/) sitesine git
2. "Get Started Free" butonuna tıkla
3. Email ile kayıt ol (ücretsiz)

### 2. Yeni Uygulama Oluştur

1. Dashboard'da "New App/Website" butonuna tıkla
2. App Name: **Kulu İlan**
3. Platform seç: **Web Push**
4. "Create App" butonuna tıkla

### 3. Web Push Yapılandırması

#### Site URL Ayarları
1. **Site URL**: `https://your-domain.com` (production URL'iniz)
2. **Default Notification Icon**: `/icon-192x192.jpg` yükle
3. **Auto Resubscribe**: ✅ Aktif et

#### Permission Prompt Ayarları
1. **Slide Prompt**: ✅ Aktif et (bizim custom UI'ımız var ama yedek olarak)
2. **Prompt Delay**: 3 seconds
3. **Prompt Text**: "İlanınız onaylandığında bildirim almak ister misiniz?"

### 4. API Key'leri Al

1. Settings → Keys & IDs sayfasına git
2. Şu bilgileri kopyala:
   - **App ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **REST API Key**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 5. .env Dosyasını Güncelle

`kulu-ilan/.env` dosyasını oluştur veya güncelle:

\`\`\`env
# OneSignal Push Notifications
VITE_ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_ONESIGNAL_REST_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
\`\`\`

⚠️ **ÖNEMLİ**: `.env` dosyası `.gitignore`'da olmalı (zaten var)

### 6. Test Et

#### Development'ta Test
\`\`\`bash
npm run dev
\`\`\`

1. Siteyi aç: `http://localhost:3000`
2. Giriş yap veya üye ol
3. 3 saniye sonra bildirim prompt'u görünecek
4. "Bildirimleri Aç" butonuna tıkla
5. Tarayıcı izin isteyecek → "İzin Ver"

#### OneSignal Dashboard'dan Test Bildirimi Gönder

1. OneSignal Dashboard → Messages → New Push
2. **Audience**: Specific Users
3. **External User ID**: Telefon numaranı gir (örn: `5551234567`)
4. **Title**: Test Bildirimi
5. **Message**: Bu bir test bildirimidir
6. "Send Message" butonuna tıkla

Birkaç saniye içinde bildirim gelecek! 🎉

## 🎯 Bildirim Senaryoları

### 1. İlan Onaylandı ✅
**Ne zaman:** Admin bir ilanı onayladığında
**Kime:** İlanı veren kullanıcı
**Mesaj:** "🎉 İlanınız Onaylandı! [İlan Başlığı] ilanınız yayına alındı."

### 2. İlan Reddedildi ❌
**Ne zaman:** Admin bir ilanı reddettiğinde
**Kime:** İlanı veren kullanıcı
**Mesaj:** "❌ İlanınız Reddedildi. Detaylar için ilanlarım sayfasını ziyaret edin."

### 3. Üyelik Onaylandı ✅
**Ne zaman:** Admin bir üyeliği onayladığında
**Kime:** Üye olan kullanıcı
**Mesaj:** "✅ Üyeliğiniz Onaylandı! Hoş geldiniz [İsim]!"

### 4. Üyelik Reddedildi ❌
**Ne zaman:** Admin bir üyeliği reddettiğinde
**Kime:** Başvuran kullanıcı
**Mesaj:** "❌ Üyelik Başvurunuz Reddedildi."

## 🔧 Kod Yapısı

### Frontend (Kullanıcı Tarafı)

\`\`\`
src/
├── lib/
│   ├── oneSignal.ts           # OneSignal SDK wrapper
│   └── oneSignalAPI.ts        # REST API helper
├── components/
│   └── PushNotificationPrompt.tsx  # Bildirim izni UI
└── pages/
    └── AdminPage.tsx          # Bildirim gönderme
\`\`\`

### Kullanıcı Akışı

1. Kullanıcı giriş yapar
2. 3 saniye sonra bildirim prompt'u görünür
3. "Bildirimleri Aç" butonuna tıklar
4. Tarayıcı izin ister
5. İzin verilirse → OneSignal'e kaydedilir
6. Telefon numarası External User ID olarak kullanılır

### Admin Akışı

1. Admin ilan/üyelik onaylar/reddeder
2. Otomatik olarak push notification gönderilir
3. OneSignal REST API kullanılır
4. Kullanıcıya bildirim ulaşır

## 📱 Platform Desteği

### ✅ Desteklenen Platformlar
- Chrome (Desktop & Mobile)
- Firefox (Desktop & Mobile)
- Edge (Desktop & Mobile)
- Safari (Desktop & Mobile - iOS 16.4+)
- Opera (Desktop & Mobile)

### ❌ Desteklenmeyen
- iOS Safari (iOS 16.3 ve altı)
- Eski tarayıcılar

## 🎨 Bildirim Görünümü

### Desktop
```
┌─────────────────────────────────┐
│ 🎉 İlanınız Onaylandı!          │
│                                 │
│ "3+1 Satılık Daire" ilanınız   │
│ yayına alındı ve artık herkes   │
│ görebilir.                      │
│                                 │
│ [İlanı Görüntüle]               │
└─────────────────────────────────┘
```

### Mobile
```
┌──────────────────────┐
│ 🎉 İlanınız Onaylandı│
│                      │
│ "3+1 Satılık Daire"  │
│ ilanınız yayında     │
└──────────────────────┘
```

## 🔍 Debug & Test

### Console Log'ları

Başarılı kurulum:
\`\`\`
✅ OneSignal initialized
✅ User subscribed to OneSignal: 5551234567
✅ Push notification sent
\`\`\`

Hata durumu:
\`\`\`
❌ OneSignal initialization failed
❌ Push notification failed
\`\`\`

### OneSignal Dashboard

1. **Audience → All Users**: Kayıtlı kullanıcıları gör
2. **Messages → Delivery**: Gönderilen bildirimleri gör
3. **Analytics**: İstatistikleri gör

## 💰 Maliyet

### Ücretsiz Plan
- ✅ 10,000 kullanıcıya kadar
- ✅ Sınırsız bildirim
- ✅ Tüm özellikler

### Ücretli Plan (İhtiyaç olursa)
- 10,000+ kullanıcı için
- Aylık $9'dan başlıyor

## 🚀 Production Deployment

### Netlify/Vercel

1. Environment Variables ekle:
   - `VITE_ONESIGNAL_APP_ID`
   - `VITE_ONESIGNAL_REST_API_KEY`

2. OneSignal Settings'te Site URL'i güncelle:
   - `https://your-production-domain.com`

3. Deploy et!

### HTTPS Gereksinimi

⚠️ Push notifications sadece HTTPS üzerinde çalışır!
- ✅ Netlify/Vercel otomatik HTTPS sağlar
- ✅ Localhost'ta test edebilirsiniz

## 📊 İstatistikler

OneSignal Dashboard'da görebilirsiniz:
- 📈 Gönderilen bildirim sayısı
- 👁️ Görüntüleme oranı
- 🖱️ Tıklama oranı
- 📱 Platform dağılımı
- 🌍 Coğrafi dağılım

## 🎉 Tamamlandı!

Artık push notification sisteminiz hazır! 

### Sonraki Adımlar

1. ✅ OneSignal hesabı oluştur
2. ✅ API key'leri .env'ye ekle
3. ✅ Test et
4. ✅ Production'a deploy et

### Destek

Sorun yaşarsanız:
- [OneSignal Docs](https://documentation.onesignal.com/)
- [OneSignal Support](https://onesignal.com/support)

## 🔗 Faydalı Linkler

- [OneSignal Dashboard](https://dashboard.onesignal.com/)
- [OneSignal Web Push Guide](https://documentation.onesignal.com/docs/web-push-quickstart)
- [OneSignal REST API](https://documentation.onesignal.com/reference/create-notification)
