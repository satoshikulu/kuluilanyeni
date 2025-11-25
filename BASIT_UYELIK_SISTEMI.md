# 👤 Basit Üyelik Sistemi

## 🎯 Amaç
Kullanıcıların hızlı ve kolay bir şekilde kayıt olup giriş yapabilmesi. Admin onayı ile spam ve sahte hesapları engellemek.

---

## ✨ Özellikler

### Kullanıcı Tarafı
- ✅ **Hızlı Kayıt:** Ad-Soyad + Telefon + Şifre
- ✅ **Basit Giriş:** Telefon + Şifre
- ✅ **Şifre Görünürlüğü:** Göz ikonu ile şifre göster/gizle
- ✅ **Otomatik Yönlendirme:** Giriş sonrası ana sayfaya yönlendirilir
- ✅ **Durum Bildirimi:** Bekleyen hesap uyarısı

### Admin Tarafı
- ✅ **Kullanıcı Onaylama:** Bekleyen kullanıcıları onayla
- ✅ **Kullanıcı Reddetme:** Spam/sahte hesapları reddet
- ✅ **Kullanıcı Listesi:** Tüm kullanıcıları görüntüle

---

## 🔧 Kurulum

### 1. Veritabanı Kurulumu

**Supabase SQL Editor'da çalıştırın:**
```bash
scripts/create-simple-auth-system.sql
```

Bu script:
- ✅ `users` tablosunu oluşturur
- ✅ Kayıt ve giriş RPC fonksiyonlarını ekler
- ✅ Admin onay/red fonksiyonlarını ekler
- ✅ İlk admin kullanıcısını oluşturur

**İlk Admin Bilgileri:**
```
Telefon: 5556874803
Şifre: admin123
```
⚠️ **ÖNEMLİ:** İlk girişte şifreyi değiştirin!

### 2. Frontend Kurulumu

Frontend kodu zaten hazır:
- ✅ `src/lib/simpleAuth.ts` - Auth fonksiyonları
- ✅ `src/pages/RegisterPage.tsx` - Kayıt sayfası
- ✅ `src/pages/LoginPage.tsx` - Giriş sayfası
- ✅ `src/App.tsx` - Header güncellendi

---

## 🚀 Kullanım

### Kullanıcı Kaydı

1. `/uye-ol` sayfasına git
2. Formu doldur:
   - **Ad Soyad:** Ahmet Yılmaz
   - **Telefon:** 0555 123 45 67
   - **Şifre:** sifre123 (en az 4 karakter)
3. "Kaydol" butonuna tıkla
4. Başarı mesajı: "Kayıt başarılı! Admin onayından sonra giriş yapabilirsiniz."

### Kullanıcı Girişi

1. `/giris` sayfasına git
2. Bilgileri gir:
   - **Telefon:** 5551234567
   - **Şifre:** sifre123
3. "Giriş Yap" butonuna tıkla

**Durumlar:**
- ✅ **Onaylı:** Ana sayfaya yönlendirilir
- ⏳ **Bekliyor:** "Hesabınız henüz onaylanmadı" mesajı
- ❌ **Reddedildi:** "Hesabınız reddedilmiş" mesajı

### Admin Onayı

1. Admin olarak giriş yap
2. `/admin` sayfasına git
3. "Bekleyen Kullanıcılar" bölümünü bul
4. Kullanıcıyı onayla veya reddet

---

## 📋 API Fonksiyonları

### Frontend (TypeScript)

```typescript
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser,
  isAuthenticated,
  isAdmin 
} from './lib/simpleAuth'

// Kayıt
const result = await registerUser('Ahmet Yılmaz', '5551234567', 'sifre123')
if (result.success) {
  console.log('Kayıt başarılı!')
}

// Giriş
const loginResult = await loginUser('5551234567', 'sifre123')
if (loginResult.success && loginResult.user) {
  console.log('Hoş geldin:', loginResult.user.full_name)
}

// Çıkış
logoutUser() // localStorage temizlenir ve ana sayfaya yönlendirilir

// Mevcut kullanıcı
const user = getCurrentUser()
if (user) {
  console.log('Giriş yapmış:', user.full_name)
}

// Giriş kontrolü
if (isAuthenticated()) {
  console.log('Kullanıcı giriş yapmış')
}

// Admin kontrolü
if (isAdmin()) {
  console.log('Kullanıcı admin')
}
```

### Backend (SQL)

```sql
-- Kayıt
SELECT register_user('Ahmet Yılmaz', '0555 123 45 67', 'sifre123');

-- Giriş
SELECT login_user('5551234567', 'sifre123');

-- Kullanıcı onayla (admin)
SELECT approve_user('user-uuid', 'admin-uuid');

-- Kullanıcı reddet (admin)
SELECT reject_user('user-uuid', 'admin-uuid');

-- Bekleyen kullanıcılar
SELECT * FROM users WHERE status = 'pending' ORDER BY created_at DESC;

-- Tüm kullanıcılar
SELECT id, full_name, phone, status, role, created_at 
FROM users 
ORDER BY created_at DESC;
```

---

## 🎨 Kullanıcı Arayüzü

### Kayıt Sayfası (`/uye-ol`)

```
┌─────────────────────────────────┐
│  Üye Ol                         │
│  Ad-soyad, telefon ve şifre ile│
│  hızlı kayıt.                   │
│                                 │
│  Ad Soyad *                     │
│  [Adınız Soyadınız        ]     │
│                                 │
│  Telefon Numarası *             │
│  [5xx xxx xx xx           ]     │
│  Giriş yaparken bu telefon      │
│  numarasını kullanacaksınız     │
│                                 │
│  Şifre *                        │
│  [••••••••••••••••]  👁️         │
│  ⚠️ Şifrenizi unutmayın!        │
│                                 │
│  [     Kaydol     ]             │
│                                 │
│  Zaten üye misiniz? Giriş Yap   │
└─────────────────────────────────┘
```

### Giriş Sayfası (`/giris`)

```
┌─────────────────────────────────┐
│  Giriş Yap                      │
│  Telefon ve şifre ile hızlı     │
│  giriş.                         │
│                                 │
│  Telefon Numarası *             │
│  [5xx xxx xx xx           ]     │
│                                 │
│  Şifre *                        │
│  [••••••••••••••••]  👁️         │
│                                 │
│  [   Giriş Yap    ]             │
│                                 │
│  Hesabın yok mu? Üye Ol         │
└─────────────────────────────────┘
```

### Header (Giriş Yapmış)

```
Kulu İlan · Kulu Emlak Pazarı    [İlanlara Bak] [Admin] [👤 Ahmet Yılmaz] [🚪 Çıkış]
```

---

## 🔒 Güvenlik

### Mevcut Durum
- ✅ Telefon numarası unique (duplicate engellendi)
- ✅ Admin onay sistemi
- ✅ RLS politikaları aktif
- ⚠️ Şifreler plain text (basit sistem)
- ⚠️ Session localStorage'da (basit sistem)

### Production İçin Öneriler

1. **Şifre Hash'leme:**
```bash
npm install bcryptjs
```

```typescript
import bcrypt from 'bcryptjs'

// Kayıt
const hashedPassword = await bcrypt.hash(password, 10)

// Giriş
const isValid = await bcrypt.compare(password, user.password_hash)
```

2. **JWT Token:**
```bash
npm install jsonwebtoken
```

```typescript
import jwt from 'jsonwebtoken'

// Token oluştur
const token = jwt.sign({ userId: user.id }, 'secret-key', { expiresIn: '7d' })

// Token doğrula
const decoded = jwt.verify(token, 'secret-key')
```

3. **Rate Limiting:**
- Supabase otomatik rate limiting sağlar
- Ek koruma için Cloudflare kullanabilirsiniz

4. **HTTPS:**
- Netlify/Vercel otomatik HTTPS sağlar
- Custom domain için SSL sertifikası ekleyin

---

## 🧪 Test Senaryoları

### 1. Başarılı Kayıt
```
Adım 1: /uye-ol sayfasına git
Adım 2: Form doldur (Ahmet Yılmaz, 5551234567, sifre123)
Adım 3: Kaydol butonuna tıkla
Beklenen: "Kayıt başarılı! Admin onayından sonra giriş yapabilirsiniz."
```

### 2. Duplicate Kayıt
```
Adım 1: Aynı telefon ile tekrar kayıt ol
Beklenen: "Bu telefon numarasıyla kayıt zaten mevcut"
```

### 3. Onaysız Giriş
```
Adım 1: Bekleyen hesapla giriş yap
Beklenen: "Hesabınız henüz onaylanmadı"
```

### 4. Başarılı Giriş
```
Adım 1: Admin hesabı onayla
Adım 2: Kullanıcı giriş yap
Beklenen: Ana sayfaya yönlendirilir, header'da isim görünür
```

### 5. Yanlış Şifre
```
Adım 1: Doğru telefon, yanlış şifre ile giriş yap
Beklenen: "Telefon numarası veya şifre hatalı"
```

---

## 🐛 Sorun Giderme

### Problem: RPC function bulunamıyor

**Hata:**
```
Error: function register_user does not exist
```

**Çözüm:**
```sql
-- SQL script'i tekrar çalıştırın
-- scripts/create-simple-auth-system.sql
```

### Problem: Giriş yapamıyorum

**Kontrol Listesi:**
1. ✅ Hesap onaylandı mı? (Admin panelinden kontrol et)
2. ✅ Telefon numarası doğru mu? (Sadece rakamlar)
3. ✅ Şifre doğru mu? (Büyük/küçük harf duyarlı)
4. ✅ Browser console'da hata var mı?

### Problem: Admin paneli görünmüyor

**Çözüm:**
```sql
-- Kullanıcıyı admin yap
UPDATE users 
SET role = 'admin' 
WHERE phone = '5551234567';
```

---

## 📊 Veritabanı Şeması

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  role TEXT DEFAULT 'user',      -- user, admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  last_login_at TIMESTAMPTZ
);
```

---

## 🔄 Workflow

```
┌─────────────┐
│  Kullanıcı  │
│   Kayıt     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Pending   │ ◄─── Admin onayı bekliyor
│   Status    │
└──────┬──────┘
       │
       ▼
    ┌──┴──┐
    │Admin│
    │Karar│
    └──┬──┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌────┐  ┌────┐
│Onayla│ │Reddet│
└──┬─┘  └──┬─┘
   │       │
   ▼       ▼
┌────┐  ┌────┐
│Giriş│ │Engel│
│Yapabilir│ │lendi│
└────┘  └────┘
```

---

## 📝 Changelog

### v1.0.0 (25 Kasım 2025)
- ✅ İlk versiyon
- ✅ Kayıt sistemi (Ad-Soyad + Telefon + Şifre)
- ✅ Giriş sistemi (Telefon + Şifre)
- ✅ Admin onay sistemi
- ✅ localStorage session yönetimi
- ✅ Header kullanıcı bilgisi gösterimi

---

## 🎯 Gelecek Özellikler

- [ ] Şifre sıfırlama (SMS ile)
- [ ] Email doğrulama
- [ ] 2FA (İki faktörlü doğrulama)
- [ ] Profil düzenleme
- [ ] Şifre değiştirme
- [ ] Hesap silme
- [ ] Giriş geçmişi

---

**Hazırlayan:** Kiro AI Assistant  
**Tarih:** 25 Kasım 2025  
**Versiyon:** 1.0.0
