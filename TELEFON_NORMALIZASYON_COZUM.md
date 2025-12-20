# Telefon Normalizasyonu Sorunu ve Çözümü

## Sorun
Edge function'dan `No FCM token found for phone: 5453526056` hatası alınıyor.

## Kök Neden
1. **Edge function** zaten `normalizePhone` kullanıyor ✅
2. **Frontend** token kaydederken `normalizePhone` kullanıyor ✅
3. **SORUN**: Admin panelinden gelen telefon numaraları (`listing.owner_phone`, `user.phone`) Supabase'den ham formatta geliyor ve normalize edilmeden edge function'a gönderiliyor

## Çözüm Adımları

### 1. Veritabanındaki Telefon Formatını Kontrol Et
```sql
-- fcm_tokens tablosundaki telefon formatlarını kontrol et
SELECT phone, LENGTH(phone), token FROM fcm_tokens;

-- listings tablosundaki owner_phone formatını kontrol et
SELECT owner_phone, LENGTH(owner_phone) FROM listings WHERE owner_phone IS NOT NULL LIMIT 10;

-- users tablosundaki phone formatını kontrol et
SELECT phone, LENGTH(phone) FROM users WHERE phone IS NOT NULL LIMIT 10;
```

### 2. Eğer Veritabanında Normalize Edilmemiş Telefonlar Varsa
```sql
-- fcm_tokens tablosunu normalize et
UPDATE fcm_tokens 
SET phone = REGEXP_REPLACE(phone, '[^0-9]', '', 'g')::text;

-- Son 10 haneyi al
UPDATE fcm_tokens 
SET phone = RIGHT(phone, 10);

-- listings tablosunu normalize et
UPDATE listings 
SET owner_phone = RIGHT(REGEXP_REPLACE(owner_phone, '[^0-9]', '', 'g'), 10)
WHERE owner_phone IS NOT NULL;

-- users tablosunu normalize et
UPDATE users 
SET phone = RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)
WHERE phone IS NOT NULL;
```

### 3. Frontend'de Normalize Fonksiyonu Ekle (firebaseAPI.ts)
`src/lib/firebaseAPI.ts` dosyasına normalize fonksiyonu ekle ve tüm bildirim fonksiyonlarında kullan.

### 4. Test Et
```bash
# Admin panelinden bir ilan veya kullanıcı onayla
# Console'da şu logları göreceksin:
# 🔍 Incoming phone: 0545 352 60 56 ➡ normalized: 5453526056
# ✅ FCM token found: ...
```

## Önemli Notlar
- Telefon numaraları her zaman **10 haneli** olmalı (başında 0 olmadan)
- Örnek: `5453526056` ✅
- Yanlış: `0545 352 60 56` ❌, `+90 545 352 60 56` ❌
