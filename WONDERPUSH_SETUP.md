# WonderPush Entegrasyonu Kurulum Rehberi

Bu rehber, Kulu İlan projesine WonderPush push bildirim sisteminin nasıl entegre edileceğini açıklar.

## 🚀 Özellikler

- ✅ Otomatik bildirimler (kullanıcı onayı, ilan onayı)
- ✅ Manuel duyuru bildirimleri (admin paneli)
- ✅ Fırsat ve öne çıkan ilan bildirimleri
- ✅ Kullanıcı segmentasyonu ve hedefleme
- ✅ Deep link desteği
- ✅ Event tracking
- ✅ Tag-based kullanıcı yönetimi

## 📋 Gereksinimler

1. **WonderPush Hesabı**: [wonderpush.com](https://www.wonderpush.com) üzerinden ücretsiz hesap oluşturun
2. **Supabase Projesi**: Edge Functions için aktif Supabase projesi
3. **HTTPS**: WonderPush sadece HTTPS üzerinde çalışır

## 🔧 Kurulum Adımları

### 1. WonderPush Hesap Kurulumu

1. [WonderPush Dashboard](https://dashboard.wonderpush.com)'a gidin
2. Yeni bir uygulama oluşturun
3. Aşağıdaki bilgileri not edin:
   - **Application ID**
   - **Web Key** 
   - **Access Token** (API erişimi için)

### 2. Environment Variables Ayarları

`.env` dosyanıza aşağıdaki değişkenleri ekleyin:

```bash
# WonderPush Configuration
VITE_WONDERPUSH_WEB_KEY=your_web_key_here
VITE_WONDERPUSH_APP_ID=your_app_id_here
```

### 3. Supabase Edge Function Environment Variables

Supabase Dashboard > Settings > Edge Functions > Environment Variables bölümünden ekleyin:

```bash
WONDERPUSH_ACCESS_TOKEN=your_access_token_here
WONDERPUSH_APP_ID=your_app_id_here
```

### 4. Edge Function Deploy

```bash
# Supabase CLI ile deploy edin
supabase functions deploy send-wonderpush-notification
```

### 5. WonderPush Worker Dosyası

`public/wonderpush-worker-loader.min.js` dosyası zaten projede mevcut. Eğer güncellemek isterseniz:

1. [WonderPush SDK](https://cdn.wonderpush.com/sdk/web/wonderpush-worker-loader.min.js) adresinden indirin
2. `public/` klasörüne yerleştirin

## 🧪 Test Etme

### Test Sayfası

Geliştirme ortamında test için özel sayfa:
```
http://localhost:5173/test/wonderpush
```

### Manuel Test

1. Uygulamayı başlatın: `npm run dev`
2. Test sayfasına gidin
3. "WonderPush'a Subscribe Ol" butonuna tıklayın
4. Tarayıcı bildirim izni isteyecek - "İzin Ver" seçin
5. "Test Bildirimi Gönder" ile bildirim test edin

### Admin Panel Test

1. Admin paneline giriş yapın: `/admin`
2. "Bildirimler" tab'ına gidin
3. Duyuru formu ile test bildirimi gönderin

## 📱 Kullanım Senaryoları

### Otomatik Bildirimler

1. **Kullanıcı Onayı**: Admin bir kullanıcıyı onayladığında
2. **İlan Onayı**: Admin bir ilanı onayladığında
3. **Fırsat İlanı**: İlan fırsat ilanı olarak işaretlendiğinde
4. **Öne Çıkan İlan**: İlan öne çıkarıldığında

### Manuel Bildirimler

Admin paneli > Bildirimler tab'ından:
- Genel duyurular
- Özel kampanyalar
- Sistem bildirimleri

## 🔧 Geliştirici Notları

### WonderPush API Kullanımı

```typescript
import { sendWonderPushNotification } from '../lib/wonderpushNotifications';

// Tüm kullanıcılara bildirim
await sendWonderPushNotification({
  title: 'Başlık',
  message: 'Mesaj',
  deepLink: '/sayfa',
  targetType: 'all'
});

// Belirli kullanıcıya bildirim
await sendWonderPushNotification({
  title: 'Başlık',
  message: 'Mesaj',
  targetType: 'user',
  targetValue: 'user-id'
});
```

### Kullanıcı Subscribe

```typescript
import { subscribeToNotifications } from '../lib/wonderpush';

await subscribeToNotifications({
  userId: 'unique-user-id',
  phone: '05551234567',
  name: 'Kullanıcı Adı',
  properties: {
    role: 'user',
    city: 'Kulu'
  }
});
```

### Event Tracking

```typescript
import { trackEvent } from '../lib/wonderpush';

await trackEvent('listing_viewed', {
  listingId: 'ilan-id',
  category: 'satilik',
  price: 250000
});
```

## 🐛 Sorun Giderme

### Bildirimler Gelmiyor

1. **Environment Variables**: Tüm değişkenlerin doğru tanımlandığından emin olun
2. **HTTPS**: Geliştirme ortamında `localhost` kullanın, `127.0.0.1` değil
3. **Tarayıcı İzinleri**: Bildirim izinlerini kontrol edin
4. **Console Logları**: Tarayıcı console'unda hata mesajlarını kontrol edin

### Edge Function Hataları

```bash
# Supabase logs kontrol edin
supabase functions logs send-wonderpush-notification

# Local test
supabase functions serve send-wonderpush-notification
```

### WonderPush Dashboard

1. [WonderPush Dashboard](https://dashboard.wonderpush.com) > Analytics bölümünden istatistikleri kontrol edin
2. Delivery reports ile bildirim durumlarını takip edin

## 📊 Monitoring ve Analytics

### WonderPush Dashboard

- Bildirim gönderim istatistikleri
- Kullanıcı engagement metrikleri
- Delivery ve click rates

### Custom Events

Özel event'ler tanımlayarak kullanıcı davranışlarını takip edebilirsiniz:

```typescript
// İlan görüntüleme
trackEvent('listing_view', { listingId, category });

// Favoriye ekleme
trackEvent('favorite_add', { listingId });

// Arama yapma
trackEvent('search', { query, filters });
```

## 🔒 Güvenlik

- **API Keys**: Environment variables'ları asla commit etmeyin
- **Access Token**: Sadece server-side (Edge Functions) kullanın
- **Rate Limiting**: WonderPush API rate limitlerini göz önünde bulundurun

## 📚 Kaynaklar

- [WonderPush Documentation](https://docs.wonderpush.com/)
- [WonderPush Web SDK](https://docs.wonderpush.com/docs/web-sdk)
- [WonderPush REST API](https://docs.wonderpush.com/docs/rest-api)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 🆘 Destek

Sorun yaşadığınızda:

1. Bu dokümandaki sorun giderme bölümünü kontrol edin
2. WonderPush documentation'ını inceleyin
3. Supabase Edge Functions loglarını kontrol edin
4. GitHub issues açın veya geliştirici ile iletişime geçin