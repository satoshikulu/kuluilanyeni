# 📞 Telefon Numarası Duplicate Kontrolü

## 🎯 Amaç
Aynı telefon numarasıyla çoklu ilan vermeyi engellemek ve spam'i önlemek.

---

## 🔧 Kurulum Adımları

### 1. Veritabanı Kurulumu (Supabase)

**Adım 1:** Supabase Dashboard'a gidin  
**Adım 2:** SQL Editor'ı açın  
**Adım 3:** `scripts/add-phone-duplicate-check.sql` dosyasındaki SQL kodunu çalıştırın

```bash
# Dosya yolu
kulu-ilan/scripts/add-phone-duplicate-check.sql
```

Bu script şunları yapar:
- ✅ Telefon numarasını normalize eden function oluşturur
- ✅ Telefon kontrolü için RPC function ekler
- ✅ Otomatik kontrol için trigger ekler
- ✅ Admin için istatistik view'i oluşturur

### 2. Frontend Kurulumu

Frontend kodu zaten eklenmiş durumda:
- ✅ `src/lib/phoneValidation.ts` - Validation fonksiyonları
- ✅ `src/pages/SellPage.tsx` - Satış sayfası kontrolü
- ✅ `src/pages/RentPage.tsx` - Kiralama sayfası kontrolü

---

## 🚀 Nasıl Çalışır?

### 3 Katmanlı Kontrol Sistemi

#### 1️⃣ **Frontend Kontrolü** (Kullanıcı Deneyimi)
Kullanıcı telefon numarasını girip başka bir alana geçtiğinde:
```typescript
// Otomatik kontrol
onBlur={async () => {
  const check = await checkPhoneExists(ownerPhone)
  if (check.pendingCount > 0) {
    // Uyarı göster
  }
}}
```

**Sonuç:** Kullanıcı hemen uyarı görür ⚠️

#### 2️⃣ **Form Submit Kontrolü** (Güvenlik)
Form gönderilmeden önce:
```typescript
const phoneCheck = await checkPhoneExists(ownerPhone)
if (phoneCheck.pendingCount > 0) {
  setError('Bu telefon numarasıyla bekleyen ilan var!')
  return // Form gönderilmez
}
```

**Sonuç:** Form gönderimi engellenir 🛑

#### 3️⃣ **Veritabanı Trigger** (Son Savunma)
Veritabanına kayıt eklenirken:
```sql
CREATE TRIGGER check_duplicate_phone_trigger
  BEFORE INSERT OR UPDATE
  ON listings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_phone();
```

**Sonuç:** Veritabanı seviyesinde engellenir 🔒

---

## 📋 Kontrol Kuralları

### Bekleyen İlan Kontrolü
```
❌ ENGELLEME: Aynı telefon numarasıyla bekleyen (pending) ilan varsa
   → Yeni ilan verilemez
   → Mesaj: "Bu telefon numarasıyla zaten bekleyen bir ilan var"
```

### Aktif İlan Limiti
```
⚠️ UYARI: 5+ aktif (approved) ilan varsa
   → Uyarı gösterilir ama ilan verilebilir
   → Mesaj: "Çok fazla aktif ilanınız var"

🛑 ENGELLEME: 10+ aktif ilan varsa (opsiyonel)
   → İsterseniz bu limiti de ekleyebilirsiniz
```

---

## 🧪 Test Etme

### Manuel Test

1. **İlk İlan:**
   ```
   Telefon: 0555 123 45 67
   Durum: Başarılı ✅
   ```

2. **İkinci İlan (Aynı Telefon):**
   ```
   Telefon: 0555 123 45 67
   Durum: ENGELLENDI ❌
   Mesaj: "Bu telefon numarasıyla zaten bekleyen bir ilan var"
   ```

3. **İlk İlan Onaylandıktan Sonra:**
   ```
   Telefon: 0555 123 45 67
   Durum: Başarılı ✅ (Yeni ilan verilebilir)
   ```

### SQL ile Test

```sql
-- Bir telefon numarasını kontrol et
SELECT * FROM check_phone_exists('0555 123 45 67');

-- Sonuç:
-- exists | listing_count | pending_count | approved_count
-- true   | 2             | 1             | 1

-- Duplicate telefon numaralarını listele
SELECT * FROM phone_statistics;
```

---

## 🎨 Kullanıcı Arayüzü

### Telefon Girişi Sırasında

**Normal Durum:**
```
Telefon: [5551234567]
ℹ️ Sadece rakam girin, biz formatlarız.
```

**Kontrol Ediliyor:**
```
Telefon: [5551234567]
🔄 Kontrol ediliyor...
```

**Uyarı Durumu:**
```
Telefon: [5551234567]
⚠️ Bu telefon numarasıyla 1 adet bekleyen ilan var.
```

**Hata Durumu (Form Submit):**
```
❌ Bu telefon numarasıyla zaten bekleyen bir ilan var. 
   Lütfen önceki ilanınızın onaylanmasını bekleyin.
```

---

## 🔍 Admin İçin İstatistikler

### Duplicate Telefon Listesi

```sql
-- Admin panelinde kullanılabilir
SELECT * FROM phone_statistics
ORDER BY total_listings DESC;
```

**Sonuç:**
```
normalized_phone | original_phone  | owner_name | total_listings | pending | approved
5551234567       | 0555 123 45 67 | Ahmet Y.   | 3              | 1       | 2
5559876543       | 555 987 65 43  | Mehmet K.  | 2              | 0       | 2
```

---

## ⚙️ Özelleştirme

### Limit Değiştirme

**Bekleyen İlan Limiti:**
```typescript
// src/lib/phoneValidation.ts
if (phoneCheck.pendingCount > 0) {  // 0'dan fazla engelle
  // Değiştir: > 1 (2'den fazla engelle)
}
```

**Aktif İlan Limiti:**
```typescript
// src/lib/phoneValidation.ts
if (check.approvedCount >= 10) {  // 10'dan fazla engelle
  return { allowed: false, reason: 'Çok fazla ilan' }
}
```

### Telefon Formatı

Şu anlar desteklenen formatlar:
```
✅ 5551234567      (10 haneli)
✅ 05551234567     (11 haneli)
✅ 0555 123 45 67  (boşluklu)
✅ 555-123-45-67   (tireli)
✅ (555) 123 45 67 (parantezli)
```

Tümü normalize edilir: `5551234567`

---

## 🐛 Sorun Giderme

### Problem: RPC function bulunamıyor

**Hata:**
```
Error: function check_phone_exists does not exist
```

**Çözüm:**
```sql
-- SQL script'i tekrar çalıştırın
-- scripts/add-phone-duplicate-check.sql
```

### Problem: Trigger çalışmıyor

**Kontrol:**
```sql
-- Trigger'ın varlığını kontrol et
SELECT * FROM pg_trigger 
WHERE tgname = 'check_duplicate_phone_trigger';

-- Yoksa tekrar oluştur
DROP TRIGGER IF EXISTS check_duplicate_phone_trigger ON listings;
CREATE TRIGGER check_duplicate_phone_trigger...
```

### Problem: Frontend kontrolü çalışmıyor

**Kontrol:**
1. Browser console'da hata var mı?
2. Supabase bağlantısı çalışıyor mu?
3. RPC function oluşturuldu mu?

**Debug:**
```typescript
// src/lib/phoneValidation.ts içinde
console.log('Phone check result:', check)
```

---

## 📊 Performans

### Veritabanı İndeksi

Performans için telefon numarasına indeks ekleyin:

```sql
-- Normalize edilmiş telefon için functional index
CREATE INDEX idx_listings_normalized_phone 
ON listings (normalize_phone(owner_phone));
```

### Cache (Opsiyonel)

Sık kontrol edilen telefonlar için cache ekleyebilirsiniz:

```typescript
// Basit in-memory cache
const phoneCache = new Map<string, { result: any, timestamp: number }>()

export async function checkPhoneExists(phone: string) {
  const cached = phoneCache.get(phone)
  if (cached && Date.now() - cached.timestamp < 60000) { // 1 dakika
    return cached.result
  }
  
  const result = await actualCheck(phone)
  phoneCache.set(phone, { result, timestamp: Date.now() })
  return result
}
```

---

## 🔐 Güvenlik Notları

1. **RLS Politikaları:** RPC function `SECURITY DEFINER` ile çalışır
2. **SQL Injection:** Supabase ORM kullanıldığı için güvenli
3. **Rate Limiting:** Supabase otomatik rate limiting sağlar
4. **Client-Side Bypass:** Trigger sayesinde bypass edilemez

---

## 📝 Changelog

### v1.0.0 (25 Kasım 2025)
- ✅ İlk versiyon
- ✅ 3 katmanlı kontrol sistemi
- ✅ Frontend + Backend entegrasyonu
- ✅ Admin istatistik view'i
- ✅ Otomatik telefon normalizasyonu

---

## 🤝 Destek

Sorun yaşarsanız:
1. Bu dokümantasyonu kontrol edin
2. SQL script'in tamamen çalıştırıldığından emin olun
3. Browser console'da hata loglarını kontrol edin
4. Supabase logs'ları inceleyin

---

**Hazırlayan:** Kiro AI Assistant  
**Tarih:** 25 Kasım 2025  
**Versiyon:** 1.0.0
