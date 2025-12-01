# 🧪 Push Notification Test Rehberi

## ✅ Kurulum Tamamlandı!

OneSignal key'leri `.env` dosyasına eklendi. Artık test edebilirsiniz!

## 🚀 Test Adımları

### 1. Dev Server'ı Yeniden Başlat

```bash
# Mevcut server'ı durdur (Ctrl+C)
# Yeniden başlat
npm run dev
```

⚠️ **ÖNEMLİ**: `.env` değişiklikleri için server'ı yeniden başlatmalısınız!

### 2. Kullanıcı Olarak Test

#### A. Yeni Kullanıcı Kaydı
1. `http://localhost:3000` → "Üye Ol"
2. Bilgileri doldur ve kayıt ol
3. **3 saniye sonra** yeşil bildirim prompt'u görünecek:
   ```
   🔔 Bildirimleri Aç
   İlanınız ve üyeliğiniz onaylandığında hemen haberdar olun!
   [Bildirimleri Aç] [Daha Sonra]
   ```
4. "Bildirimleri Aç" butonuna tıkla
5. Tarayıcı izin isteyecek → **"İzin Ver"** / **"Allow"**
6. Başarı mesajı: "✅ Bildirimler açıldı!"

#### B. Console'da Kontrol
F12 → Console:
```
✅ OneSignal initialized
✅ User subscribed to OneSignal: 5551234567
```

### 3. Admin Olarak Test

#### A. Üyelik Onaylama Testi
1. Yeni sekmede admin girişi yap
2. Admin Panel → Üyeler Tab
3. Yeni kaydolan kullanıcıyı bul
4. "✓ Onayla" butonuna tıkla
5. Alert: "✅ Kullanıcı onaylandı! Bildirim gönderildi."

#### B. Kullanıcı Bildirim Alacak
Birkaç saniye içinde kullanıcının tarayıcısında bildirim görünecek:
```
┌─────────────────────────────────┐
│ ✅ Üyeliğiniz Onaylandı!        │
│                                 │
│ Hoş geldiniz [İsim]! Artık     │
│ ilan verebilir ve favorilerinizi│
│ kaydedebilirsiniz.              │
└─────────────────────────────────┘
```

#### C. İlan Onaylama Testi
1. Kullanıcı bir ilan versin
2. Admin Panel → İlanlar Tab
3. İlanı bul ve "✓ Onayla" butonuna tıkla
4. Alert: "✅ İlan onaylandı! Bildirim gönderildi."

#### D. Kullanıcı Bildirim Alacak
```
┌─────────────────────────────────┐
│ 🎉 İlanınız Onaylandı!          │
│                                 │
│ "3+1 Satılık Daire" ilanınız   │
│ yayına alındı ve artık herkes   │
│ görebilir.                      │
└─────────────────────────────────┘
```

### 4. OneSignal Dashboard'dan Test

#### Manuel Test Bildirimi Gönder
1. [OneSignal Dashboard](https://dashboard.onesignal.com/) → Messages → New Push
2. **Audience**: Specific Users
3. **External User ID**: Telefon numaranı gir (örn: `5551234567`)
4. **Title**: Test Bildirimi
5. **Message**: Bu bir test mesajıdır
6. **Launch URL**: `http://localhost:3000`
7. "Send Message" butonuna tıkla

Birkaç saniye içinde bildirim gelecek! 🎉

## 🔍 Sorun Giderme

### Bildirim Prompt'u Görünmüyor
**Sebep**: Daha önce "Daha Sonra" tıklanmış
**Çözüm**: 
```javascript
// Console'da çalıştır
localStorage.removeItem('push-notification-dismissed')
// Sayfayı yenile
```

### "OneSignal initialization failed" Hatası
**Sebep**: API key'ler yanlış veya eksik
**Çözüm**:
1. `.env` dosyasını kontrol et
2. Key'lerin doğru kopyalandığından emin ol
3. Server'ı yeniden başlat

### Bildirim İzni "Denied" (Reddedildi)
**Sebep**: Tarayıcıda bildirim izni reddedilmiş
**Çözüm**:
1. Chrome: Adres çubuğu → Kilit ikonu → Site Settings → Notifications → Allow
2. Firefox: Adres çubuğu → i ikonu → Permissions → Notifications → Allow
3. Sayfayı yenile

### Bildirim Gelmiyor
**Kontrol Listesi**:
- ✅ OneSignal Dashboard → Audience → All Users → Kullanıcı kayıtlı mı?
- ✅ Console'da hata var mı?
- ✅ Tarayıcı bildirimleri açık mı?
- ✅ REST API Key doğru mu?

## 📱 Farklı Tarayıcılarda Test

### Chrome (Önerilen)
✅ Tam destek
✅ Desktop + Mobile

### Firefox
✅ Tam destek
✅ Desktop + Mobile

### Safari
⚠️ iOS 16.4+ gerekli
✅ Desktop tam destek

### Edge
✅ Tam destek (Chrome tabanlı)

## 🎯 Test Senaryoları

### Senaryo 1: Yeni Kullanıcı Akışı
1. ✅ Kayıt ol
2. ✅ Bildirim izni ver
3. ✅ Admin onaylasın
4. ✅ Bildirim gelsin
5. ✅ Bildirime tıkla → Ana sayfaya git

### Senaryo 2: İlan Verme Akışı
1. ✅ Giriş yap
2. ✅ İlan ver
3. ✅ Admin onaylasın
4. ✅ Bildirim gelsin
5. ✅ Bildirime tıkla → İlan detayına git

### Senaryo 3: Red Bildirimi
1. ✅ İlan ver
2. ✅ Admin reddetsin
3. ✅ Red bildirimi gelsin
4. ✅ Bildirime tıkla → İlanlarım sayfasına git

## 📊 OneSignal Dashboard İnceleme

### Audience (Kullanıcılar)
- Kayıtlı kullanıcı sayısı
- External User ID'ler (telefon numaraları)
- Subscription durumu

### Messages (Mesajlar)
- Gönderilen bildirimler
- Delivery rate (teslim oranı)
- Click rate (tıklama oranı)

### Analytics (İstatistikler)
- Günlük/haftalık/aylık grafikler
- Platform dağılımı
- Coğrafi dağılım

## 🎉 Başarı Kriterleri

Test başarılı sayılır eğer:
- ✅ Bildirim prompt'u görünüyor
- ✅ İzin veriliyor
- ✅ OneSignal Dashboard'da kullanıcı görünüyor
- ✅ Admin onayladığında bildirim geliyor
- ✅ Bildirime tıklayınca doğru sayfaya gidiyor

## 🚀 Production'a Geçiş

Test başarılı olduktan sonra:

1. **OneSignal Settings → Platforms → Web Push**
   - Site URL'i production URL ile değiştir
   - `https://your-domain.com`

2. **Netlify/Vercel Environment Variables**
   - `VITE_ONESIGNAL_APP_ID`
   - `VITE_ONESIGNAL_REST_API_KEY`

3. **Deploy!**

## 📝 Notlar

- Bildirimler sadece HTTPS'de çalışır (localhost hariç)
- OneSignal ücretsiz plan: 10,000 kullanıcı
- Bildirim TTL: 24 saat (sonra expire olur)
- External User ID: Telefon numarası kullanıyoruz

## 🆘 Yardım

Sorun yaşarsanız:
1. Console log'larını kontrol edin
2. OneSignal Dashboard → Delivery → Errors
3. [OneSignal Docs](https://documentation.onesignal.com/)

---

**Hazır mısınız? Test başlasın! 🚀**

\`\`\`bash
npm run dev
\`\`\`
