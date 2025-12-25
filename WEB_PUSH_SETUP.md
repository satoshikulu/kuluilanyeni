# 🔔 Web Push Protocol Setup Guide

Bu dokümantasyon, Firebase/OneSignal bağımlılığından kurtularak kendi Web Push Protocol sistemimizi nasıl kurduğumuzu açıklar.

## 🎯 Avantajlar

- ✅ **Bağımsızlık**: Firebase/OneSignal'a bağımlılık yok
- ✅ **Maliyet**: Ücretsiz, kendi sunucumuzda çalışıyor
- ✅ **Kontrol**: Tam kontrol bizde
- ✅ **Güvenlik**: VAPID ile güvenli
- ✅ **Standart**: Web Push Protocol standart

## 🔧 Kurulum Adımları

### 1. VAPID Keys Oluştur

```bash
cd kulu-ilan
node scripts/generate-vapid-keys.js
```

Bu komut size şu çıktıyı verecek:
```
PUBLIC KEY (for frontend):
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...

PRIVATE KEY (for backend/edge functions):
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEH...
```

### 2. Environment Variables Ayarla

#### Frontend (.env)
```env
VITE_VAPID_PUBLIC_KEY=MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
```

#### Supabase Edge Functions (Supabase Dashboard > Settings > Edge Functions)
```env
VAPID_PRIVATE_KEY=MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEH...
VAPID_SUBJECT=mailto:satoshinakamototokyo42@gmail.com
```

### 3. Database Schema Uygula

```sql
-- Supabase SQL Editor'da çalıştır
-- WEB_PUSH_SCHEMA.sql dosyasındaki kodu çalıştır
```

### 4. Edge Function Deploy Et

```bash
supabase functions deploy send-web-push
```

### 5. Frontend Kodu Güncelle

Web Push Protocol kullanıyoruz:

```typescript
// Web Push
import { setupPushNotificationsForUser } from '../lib/webPushMessaging'
import { sendListingApprovedNotification } from '../lib/webPushAPI'
```

## 📱 Kullanım

### Admin Panelinde

1. **Admin login yap**: `http://localhost:3000/admin/login`
2. **Notification permission ver**: Tarayıcı izin isteyecek
3. **Web Push kurulumu**: Otomatik olarak çalışacak
4. **Test et**: Admin panelinde test butonu ile

### Kullanıcı Tarafında

```typescript
import { setupPushNotificationsForUser } from '../lib/webPushMessaging'

// Kullanıcı login olduktan sonra
await setupPushNotificationsForUser()
```

### Bildirim Gönderme

```typescript
import { sendListingApprovedNotification } from '../lib/webPushAPI'

// İlan onaylandı bildirimi
await sendListingApprovedNotification(
  '5453526056', // telefon
  'Güzel Ev',   // ilan başlığı
  'listing123'  // ilan ID
)
```

## 🔍 Debug

### 1. Browser Console
```javascript
// Service Worker durumu
navigator.serviceWorker.getRegistrations()

// Push subscription durumu
navigator.serviceWorker.ready.then(reg => 
  reg.pushManager.getSubscription()
)
```

### 2. Supabase Logs
```bash
supabase functions logs send-web-push
```

### 3. Database Kontrol
```sql
-- Push subscriptions kontrol
SELECT * FROM push_subscriptions;

-- Belirli telefon için subscription
SELECT * FROM push_subscriptions WHERE phone = '5453526056';
```

## 🚀 Production Deployment

### Netlify
1. Environment variables ekle:
   - `VITE_VAPID_PUBLIC_KEY`

### Supabase
1. Edge Function secrets ekle:
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`

2. Database schema uygula:
   ```sql
   -- WEB_PUSH_SCHEMA.sql
   ```

3. Edge function deploy:
   ```bash
   supabase functions deploy send-web-push
   ```

## 🔒 Güvenlik

- **VAPID Keys**: Private key'i asla frontend'e koyma
- **HTTPS**: Production'da mutlaka HTTPS kullan
- **RLS**: Database'de Row Level Security aktif
- **CORS**: Edge function'da CORS ayarları mevcut

## 📊 Monitoring

### Success/Failure Tracking
```typescript
const result = await sendListingApprovedNotification(phone, title, id)
if (result) {
  console.log('✅ Notification sent')
} else {
  console.log('❌ Notification failed')
}
```

### Bulk Notifications
```typescript
import { sendBulkNotifications } from '../lib/webPushAPI'

const result = await sendBulkNotifications(
  ['5453526056', '5556874803'],
  'Toplu Bildirim',
  'Herkese merhaba!'
)
console.log(`${result.success} başarılı, ${result.failed} başarısız`)
```

## 🔄 Migration from Firebase

### 1. Migration Completed
- `firebase-messaging-sw.js` → Removed completely
- `firebaseMessaging.ts` → Replaced with `webPushMessaging.ts`
- `firebaseAPI.ts` → Replaced with `webPushAPI.ts`

### 2. Database Migration
```sql
-- Eski FCM tokens'ları temizle (opsiyonel)
DROP TABLE IF EXISTS fcm_tokens;

-- Yeni push subscriptions tablosu
-- WEB_PUSH_SCHEMA.sql'i çalıştır
```

### 3. Environment Variables
```env
# Eski (kaldır)
VITE_FIREBASE_VAPID_KEY=...
FIREBASE_SERVER_KEY=...

# Yeni (ekle)
VITE_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=... (Supabase'de)
```

## 🎉 Sonuç

Artık tamamen bağımsız bir push notification sistemimiz var! Firebase/OneSignal'a ihtiyacımız yok. Kendi VAPID keys'lerimiz, kendi edge function'ımız ve kendi database'imiz ile çalışıyor.

**Test etmek için:**
1. Admin paneline git
2. "Web Push Kurulum (Test)" butonuna bas
3. Notification permission ver
4. Test bildirimi gönder

🚀 **Başarılar!**