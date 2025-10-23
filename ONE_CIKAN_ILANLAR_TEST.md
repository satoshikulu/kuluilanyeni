# Öne Çıkan İlanlar - Test Adımları

## 1. Veritabanı Güncellemesi

Önce Supabase'de veritabanını güncellemeniz gerekiyor:

1. Supabase Dashboard'a gidin
2. SQL Editor'ı açın
3. `FEATURED_LISTINGS_MIGRATION.sql` dosyasındaki SQL kodunu çalıştırın

## 2. Test Senaryosu

### Adım 1: Admin Paneline Giriş
1. Tarayıcıda `http://localhost:5173/admin` adresine gidin
2. Admin şifresini girin

### Adım 2: İlan Onaylama
1. Bekleyen (pending) bir ilan seçin
2. "Onayla" butonuna tıklayın
3. İlan onaylandıktan sonra "Öne Çıkar" butonu görünecek

### Adım 3: İlanı Öne Çıkarma
1. Onaylı bir ilanın yanındaki "Öne Çıkar" butonuna tıklayın
2. Buton "⭐ Öne Çıkan" olarak değişecek
3. Altında bir sıra numarası input'u görünecek (varsayılan: 0)
4. İsterseniz sıra numarasını değiştirin (küçük numara önce gösterilir)

### Adım 4: Ana Sayfada Kontrol
1. Ana sayfaya gidin: `http://localhost:5173/`
2. "Öne çıkan ilanlar" bölümünde öne çıkardığınız ilanları göreceksiniz
3. İlanlar `featured_order` sırasına göre gösterilir
4. Maksimum 6 ilan gösterilir

### Adım 5: Öne Çıkarmayı Kaldırma
1. Admin paneline dönün
2. Öne çıkan bir ilanın "⭐ Öne Çıkan" butonuna tekrar tıklayın
3. İlan öne çıkan listesinden çıkacak
4. Ana sayfada artık görünmeyecek

## 3. Beklenen Sonuçlar

✅ Admin panelinde onaylı ilanlar için "Öne Çıkar" butonu görünüyor
✅ Öne çıkarılan ilanlar sarı butonla işaretleniyor
✅ Sıra numarası değiştirilebiliyor
✅ Ana sayfada öne çıkan ilanlar dinamik olarak yükleniyor
✅ İlan görselleri, başlıkları, fiyatları doğru gösteriliyor
✅ İlanlara tıklandığında detay sayfasına gidiyor
✅ Öne çıkan ilan yoksa "Henüz öne çıkan ilan bulunmuyor" mesajı gösteriliyor

## 4. Sorun Giderme

### Öne çıkan ilanlar görünmüyorsa:
1. Tarayıcı konsolunu açın (F12)
2. Hata mesajlarını kontrol edin
3. Network sekmesinde Supabase isteklerini kontrol edin
4. Veritabanında `is_featured` kolonunun eklendiğinden emin olun

### Migration çalışmadıysa:
```sql
-- Manuel olarak kontrol edin:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' 
AND column_name IN ('is_featured', 'featured_order', 'featured_until');
```

## 5. Özellikler

- ✅ Dinamik öne çıkan ilan sistemi
- ✅ Admin panelinden kolay yönetim
- ✅ Sıralama özelliği
- ✅ Gerçek veritabanı entegrasyonu
- ✅ Responsive tasarım
- ✅ Hover efektleri
- ✅ İlan detayına yönlendirme
