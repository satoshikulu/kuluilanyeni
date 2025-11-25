# 🧪 Test Kullanıcısı Oluşturma ve Giriş Testi

## 📋 Ön Hazırlık

### 1. SQL Script'lerini Çalıştır

**Supabase Dashboard → SQL Editor'da çalıştır:**

```sql
-- 1. Önce telefon duplicate kontrolü
-- scripts/add-phone-duplicate-check.sql

-- 2. Sonra basit auth sistemi
-- scripts/create-simple-auth-system.sql
```

---

## 🧪 Test Senaryosu

### Adım 1: Test Kullanıcısı Kaydet

1. **Tarayıcıda aç:** `http://localhost:5173/uye-ol`

2. **Formu doldur:**
   ```
   Ad Soyad: Test Kullanıcı
   Telefon: 5551234567
   Şifre: test123
   ```

3. **"Kaydol" butonuna tıkla**

4. **Beklenen sonuç:**
   ```
   ✅ Kayıt başarılı! Admin onayından sonra giriş yapabilirsiniz.
   ```

---

### Adım 2: Supabase'de Kontrol Et

**Supabase Dashboard → Table Editor → users tablosu:**

```sql
SELECT id, full_name, phone, password_hash, status, created_at 
FROM users 
WHERE phone = '5551234567';
```

**Beklenen sonuç:**
```
id: [uuid]
full_name: Test Kullanıcı
phone: 5551234567
password_hash: test123
status: pending
created_at: [timestamp]
```

---

### Adım 3: Admin ile Giriş Yap

1. **Tarayıcıda aç:** `http://localhost:5173/giris`

2. **Admin bilgileriyle giriş:**
   ```
   Telefon: 5556874803
   Şifre: admin123
   ```

3. **Beklenen sonuç:**
   - Ana sayfaya yönlendirilir
   - Header'da "Admin" butonu görünür
   - Kullanıcı adı görünür

---

### Adım 4: Admin Panelinde Kullanıcıyı Onayla

1. **Admin paneline git:** `http://localhost:5173/admin`

2. **"Bekleyen Üyelik Başvuruları" bölümünü bul**

3. **Test kullanıcısını gör:**
   ```
   Test Kullanıcı
   📞 5551234567
   🔑 Şifre: test123
   Başvuru: [tarih]
   ```

4. **"Onayla" butonuna tıkla**

5. **Beklenen sonuç:**
   - Kullanıcı "Bekleyen" listesinden kaybolur
   - "Onaylanmış Üyeler" listesinde görünür

---

### Adım 5: Test Kullanıcısı ile Giriş Yap

1. **Admin'den çıkış yap** (Header'daki "Çıkış" butonu)

2. **Giriş sayfasına git:** `http://localhost:5173/giris`

3. **Test kullanıcısı bilgileriyle giriş:**
   ```
   Telefon: 5551234567
   Şifre: test123
   ```

4. **Beklenen sonuç:**
   - ✅ Ana sayfaya yönlendirilir
   - Header'da "Test Kullanıcı" görünür
   - "Admin" butonu GÖRÜNMEZ (normal kullanıcı)

---

## 🔐 Şifre Sıfırlama Testi

### Senaryo: Kullanıcı Şifresini Unuttu

1. **Admin olarak giriş yap**

2. **Admin paneline git:** `http://localhost:5173/admin`

3. **"Onaylanmış Üyeler" bölümünde test kullanıcısını bul**

4. **"Şifre Değiştir" butonuna tıkla**

5. **Popup'ta yeni şifre gir:**
   ```
   Yeni Şifre: yenisifre123
   ```

6. **Beklenen sonuç:**
   ```
   ✅ Şifre başarıyla değiştirildi!
   
   Telefon: 5551234567
   Yeni Şifre: yenisifre123
   
   Bu bilgileri kullanıcıya iletin.
   ```

7. **Şifre değişti mi test et:**
   - Çıkış yap
   - Eski şifre ile giriş dene → ❌ Başarısız
   - Yeni şifre ile giriş dene → ✅ Başarılı

---

## 📊 Kontrol Listesi

### ✅ Kayıt İşlemi
- [ ] Kayıt formu açılıyor
- [ ] Form validasyonu çalışıyor (4 karakter min)
- [ ] Kayıt başarılı mesajı görünüyor
- [ ] Supabase'de kullanıcı oluşuyor
- [ ] Status: 'pending' olarak kaydediliyor

### ✅ Admin Onayı
- [ ] Admin panelinde bekleyen kullanıcı görünüyor
- [ ] Şifre görünüyor (🔑 Şifre: test123)
- [ ] "Onayla" butonu çalışıyor
- [ ] Kullanıcı "Onaylanmış" listeye taşınıyor
- [ ] Supabase'de status: 'approved' oluyor

### ✅ Giriş İşlemi
- [ ] Onaysız kullanıcı giriş yapamıyor
- [ ] Onaylı kullanıcı giriş yapabiliyor
- [ ] Yanlış şifre ile giriş yapamıyor
- [ ] Başarılı girişte ana sayfaya yönlendiriliyor
- [ ] Header'da kullanıcı adı görünüyor

### ✅ Şifre Sıfırlama
- [ ] Admin "Şifre Değiştir" butonunu görebiliyor
- [ ] Yeni şifre girişi çalışıyor
- [ ] Şifre değişiyor
- [ ] Eski şifre ile giriş yapılamıyor
- [ ] Yeni şifre ile giriş yapılabiliyor

---

## 🐛 Olası Sorunlar ve Çözümler

### Problem 1: "function register_user does not exist"

**Çözüm:**
```sql
-- SQL script'i tekrar çalıştır
-- scripts/create-simple-auth-system.sql
```

### Problem 2: Admin panelinde kullanıcı görünmüyor

**Çözüm:**
```sql
-- Doğru tabloyu kullanıyor mu kontrol et
SELECT * FROM users WHERE status = 'pending';
```

### Problem 3: Giriş yapamıyorum

**Kontrol:**
1. Kullanıcı onaylandı mı?
2. Telefon numarası doğru mu? (Sadece rakamlar: 5551234567)
3. Şifre doğru mu?
4. Browser console'da hata var mı?

### Problem 4: Şifre değişmiyor

**Çözüm:**
```sql
-- Manuel olarak değiştir
UPDATE users 
SET password_hash = 'yenisifre' 
WHERE phone = '5551234567';
```

---

## 📝 Test Sonuçları

### Test Tarihi: _____________

| Test | Durum | Notlar |
|------|-------|--------|
| Kayıt | ⬜ | |
| Admin Onayı | ⬜ | |
| Giriş | ⬜ | |
| Şifre Sıfırlama | ⬜ | |

---

## 🎯 Sonraki Adımlar

Tüm testler başarılı ise:

1. ✅ Sistemi production'a deploy et
2. ✅ Admin şifresini değiştir (admin123 → güçlü şifre)
3. ✅ Gerçek kullanıcıları ekle
4. ✅ Kullanıcılara şifrelerini hatırlat

---

**Hazırlayan:** Kiro AI Assistant  
**Tarih:** 25 Kasım 2025
