# OneSignal Kullanıcı Senkronizasyonu - Deployment Rehberi

## 🎯 Özellikler
- Supabase'de yeni kullanıcı onaylandığında otomatik OneSignal kullanıcısı oluşturma
- PWA'da kullanıcı giriş yaptığında ve subscribe olduğunda otomatik tags ekleme
- Database trigger ile asenkron senkronizasyon
- Admin panelinde senkronizasyon durumu takibi
- Başarısız senkronizasyonları yeniden deneme
- OneSignal'ın önerdiği JSON formatı ve tags kullanımı

## 📋 Deployment Adımları

### 1. Environment Variables Ayarlama
Supabase Dashboard > Settings > Environment Variables:

```bash
ONESIGNAL_REST_API_KEY=your_rest_api_key_here
ONESIGNAL_APP_ID=your_app_id_here
```

### 2. Database Migration Çalıştırma
```bash
cd kulu-ilan
supabase db push
```

Veya manuel olarak `supabase/migrations/20241230_onesignal_user_sync.sql` dosyasını Supabase SQL Editor'da çalıştırın.

### 3. Edge Functions Deploy Etme
```bash
# OneSignal kullanıcı oluşturma function'ı
supabase functions deploy create-onesignal-user

# Diğer OneSignal functions (zaten mevcut)
supabase functions deploy send-onesignal-notification
supabase functions deploy bulk-onesignal-subscribe
supabase functions deploy onesignal-subscribe
```

### 4. Database Trigger URL Güncelleme
`supabase/migrations/20241230_onesignal_user_sync.sql` dosyasında:

```sql
-- Production URL'i ile değiştirin
function_url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-onesignal-user';
```

### 5. Frontend Deploy
```bash
npm run build
# Netlify'a deploy edin
```

## 🔧 Nasıl Çalışır

### Otomatik Senkronizasyon (Backend)
1. Kullanıcı üye olur (status: 'pending')
2. Admin kullanıcıyı onaylar (status: 'approved')
3. Database trigger tetiklenir
4. `create_onesignal_user_sync()` fonksiyonu çalışır
5. Edge Function çağrılır
6. OneSignal API'sine kullanıcı oluşturma isteği gönderilir
7. Sonuç `onesignal_users` tablosuna kaydedilir

### PWA Kullanıcı Tags Senkronizasyonu (Frontend)
1. Kullanıcı PWA'da giriş yapar
2. `syncUserToOneSignal()` fonksiyonu çalışır
3. OneSignal'a external_id ve tags eklenir
4. Kullanıcı subscribe olduğunda da otomatik tags eklenir

### OneSignal API Format
**Backend (User Creation):**
```json
{
  "identity": {
    "external_id": "supabase_user_id"
  },
  "properties": {
    "tags": {
      "first_name": "Ahmet",
      "last_name": "Yılmaz", 
      "phone_number": "+905551234567",
      "source": "supabase_auto_sync",
      "created_at": "2024-12-30T10:00:00Z"
    }
  }
}
```

**Frontend (PWA Tags):**
```javascript
OneSignal.User.addAlias('external_id', user.id);
OneSignal.User.addTags({
  'first_name': 'Ahmet',
  'last_name': 'Yılmaz',
  'phone_number': '+905551234567',
  'user_id': 'supabase_user_id',
  'user_status': 'approved',
  'user_role': 'user',
  'sync_source': 'pwa_login',
  'last_sync': '2024-12-30T10:00:00Z'
});
```

### Admin Panel Özellikleri
- **OneSignal Tab**: Senkronizasyon durumlarını görüntüleme
- **İstatistikler**: Toplam, bekleyen, başarılı, başarısız sayıları
- **Yeniden Deneme**: Başarısız senkronizasyonları tekrar çalıştırma
- **Silme**: Senkronizasyon kayıtlarını temizleme

### Test Sayfası Özellikleri
- **Kullanıcı Durumu**: Giriş yapmış kullanıcı bilgileri
- **OneSignal Tags**: Mevcut kullanıcı tags'lerini görüntüleme
- **Manuel Senkronizasyon**: Kullanıcı bilgilerini manuel olarak OneSignal'a ekleme
- **Tags Kontrolü**: OneSignal'daki mevcut tags'leri kontrol etme

## 📊 Veritabanı Tabloları

### `onesignal_users`
- `user_id`: Supabase kullanıcı ID'si (FK)
- `onesignal_external_id`: OneSignal external ID
- `onesignal_user_id`: OneSignal'dan dönen user ID
- `sync_status`: 'pending' | 'success' | 'failed'
- `sync_error`: Hata mesajı (varsa)
- `last_sync_at`: Son senkronizasyon zamanı

## 🚨 Önemli Notlar

1. **Çift Senkronizasyon**: 
   - Backend: Database trigger ile OneSignal kullanıcısı oluşturma
   - Frontend: PWA'da giriş/subscribe sırasında tags ekleme

2. **External ID**: Supabase user ID'si OneSignal external_id olarak kullanılır

3. **Tags Kullanımı**: Kullanıcı bilgileri OneSignal'da tags olarak saklanır (segmentasyon için)

4. **Asenkron İşlem**: Trigger asenkron çalışır, kullanıcı onaylama işlemini yavaşlatmaz

5. **Hata Yönetimi**: Başarısız senkronizasyonlar loglanır ve admin panelinden yeniden denenebilir

6. **Telefon Format**: Telefon numaraları "+90" prefixi ile OneSignal'a gönderilir

7. **Çıkış Temizliği**: Kullanıcı çıkış yaptığında OneSignal tags'leri temizlenir

## 🔍 Test Etme

### Backend Test
1. Yeni bir kullanıcı kayıt edin
2. Admin panelinden kullanıcıyı onaylayın
3. OneSignal tab'ında senkronizasyon durumunu kontrol edin
4. OneSignal Dashboard'da kullanıcının oluştuğunu doğrulayın

### Frontend Test
1. PWA'da kullanıcı girişi yapın
2. `/onesignal-test` sayfasına gidin
3. "Kullanıcı Bilgilerini Senkronize Et" butonuna tıklayın
4. "Kullanıcı Tags'lerini Kontrol Et" ile tags'leri görüntüleyin
5. OneSignal Dashboard'da tags'lerin eklendiğini doğrulayın

## 🛠️ Sorun Giderme

### Backend Senkronizasyon Başarısız Olursa
1. Admin panelinde OneSignal tab'ını açın
2. Başarısız kaydı bulun
3. Hata mesajını kontrol edin
4. "Yeniden Dene" butonuna tıklayın

### Frontend Tags Eklenmiyorsa
1. `/onesignal-test` sayfasında OneSignal durumunu kontrol edin
2. Kullanıcı giriş yapmış mı kontrol edin
3. OneSignal ready durumunu kontrol edin
4. Manuel senkronizasyon butonunu deneyin

### Environment Variables Eksikse
- Supabase Dashboard'da ONESIGNAL_REST_API_KEY ve ONESIGNAL_APP_ID'yi kontrol edin
- Edge Functions'ı yeniden deploy edin

### Trigger Çalışmıyorsa
- SQL Editor'da trigger'ın var olduğunu kontrol edin:
```sql
SELECT * FROM information_schema.triggers WHERE trigger_name = 'trigger_create_onesignal_user';
```

## ✅ Başarılı Deployment Kontrolü

- [ ] Environment variables ayarlandı
- [ ] Migration çalıştırıldı
- [ ] Edge functions deploy edildi
- [ ] Trigger URL güncellendi
- [ ] Frontend deploy edildi
- [ ] Backend test kullanıcısı ile doğrulandı
- [ ] Frontend PWA tags testi yapıldı
- [ ] Admin panelinde OneSignal tab görünüyor
- [ ] Test sayfasında kullanıcı bilgileri görünüyor
- [ ] OneSignal Dashboard'da tags görünüyor

## 🎉 Sonuç

Bu sistem sayesinde:
- Yeni kullanıcılar otomatik olarak OneSignal'a eklenir (Backend)
- Kullanıcı bilgileri PWA'da tags olarak senkronize edilir (Frontend)
- Push notification gönderimi için hazır hale gelir
- Segmentasyon ve kişiselleştirme için kullanıcı bilgileri kullanılabilir
- Admin panelinden tam kontrol sağlanır
- Hata durumları takip edilir ve düzeltilebilir

Artık hem backend hem frontend'de OneSignal kullanıcı senkronizasyonu tam olarak çalışıyor! 🚀