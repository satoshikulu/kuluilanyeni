# 🚀 Supabase Edge Function Kurulumu

## Gereksinimler

- Supabase CLI kurulu olmalı
- Supabase projesine bağlı olmalı

## Kurulum Adımları

### 1. Supabase CLI Kurulumu

```bash
# Windows (PowerShell)
scoop install supabase

# veya npm ile
npm install -g supabase
```

### 2. Supabase Projesine Bağlan

```bash
cd kulu-ilan
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

**Project Ref Bulma:**
- Supabase Dashboard → Settings → General
- Project Reference ID'yi kopyalayın

### 3. Environment Variables (Secrets) Ekle

```bash
# Tüm secrets'leri tek seferde ekle
npx supabase secrets set \
  ONESIGNAL_APP_ID=e6fae242-8add-4541-9264-61266c6b030a \
  ONESIGNAL_REST_API_KEY=os_v2_app_435oequk3vcudetemetgy2ydbkut34uc4zrekru47aycxca7guxcfxufpyiwcogruciflvhtxnqhbren3hjuja7ah6lg7yv635la67a
```

**Not:** Yukarıdaki değerler `.env` dosyanızdaki değerlerle aynı olmalı.

### 4. Edge Function Deploy Et

```bash
npx supabase functions deploy send-notification
```

### 5. Function URL'i Al

Deploy sonrası console'da göreceksiniz:
```
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification
```

Bu URL'i kopyalayın ve `oneSignalAPI.ts` dosyasında kullanın.

## Kullanım

### Frontend'den Çağırma

```typescript
import { supabase } from './supabaseClient'

async function sendNotification(userId: string, phone: string, type: string) {
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: {
      userId,
      phone,
      type: 'user_approved',
      userName: 'Ahmet Yılmaz'
    }
  })
  
  if (error) {
    console.error('Notification error:', error)
    return false
  }
  
  console.log('Notification sent:', data)
  return true
}
```

### Bildirim Tipleri

1. **user_approved** - Kullanıcı onaylandı
   ```typescript
   {
     userId: '123',
     phone: '5551234567',
     type: 'user_approved',
     userName: 'Ahmet Yılmaz'
   }
   ```

2. **listing_approved** - İlan onaylandı
   ```typescript
   {
     userId: '123',
     phone: '5551234567',
     type: 'listing_approved',
     listingTitle: '3+1 Satılık Daire'
   }
   ```

3. **listing_rejected** - İlan reddedildi
   ```typescript
   {
     userId: '123',
     phone: '5551234567',
     type: 'listing_rejected',
     listingTitle: '3+1 Satılık Daire'
   }
   ```

## Test Etme

### Local Test (Supabase CLI ile)

```bash
# Local Supabase başlat
npx supabase start

# Function'ı local'de serve et
npx supabase functions serve send-notification

# Test isteği gönder
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"userId":"123","phone":"5551234567","type":"user_approved","userName":"Test User"}'
```

### Production Test

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"userId":"123","phone":"5551234567","type":"user_approved","userName":"Test User"}'
```

## Sorun Giderme

### "Function not found" Hatası

```bash
# Function'ları listele
npx supabase functions list

# Yeniden deploy et
npx supabase functions deploy send-notification
```

### "Secrets not found" Hatası

```bash
# Secrets'leri listele
npx supabase secrets list

# Eksik secret'i ekle
npx supabase secrets set ONESIGNAL_APP_ID=your_app_id
```

### CORS Hatası

Edge function'da CORS headers zaten ekli. Eğer hala hata alıyorsanız:
- Supabase Dashboard → Edge Functions → send-notification → Settings
- CORS ayarlarını kontrol edin

## Güvenlik

- ✅ Edge Function server-side çalışır (API key'ler güvenli)
- ✅ Supabase Auth ile korunabilir
- ✅ Rate limiting otomatik
- ✅ CORS yapılandırılmış

## Maliyet

- Supabase Edge Functions: 500,000 istek/ay ücretsiz
- OneSignal: 10,000 kullanıcı ücretsiz

## Sonraki Adımlar

1. ✅ Supabase CLI kur
2. ✅ Projeye bağlan
3. ✅ Secrets ekle
4. ✅ Deploy et
5. ✅ Frontend'i güncelle
6. ✅ Test et

---

**Hazır! Artık admin panelden güvenli bildirim gönderebilirsiniz.** 🎉
