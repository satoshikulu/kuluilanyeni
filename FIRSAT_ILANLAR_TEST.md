# Fırsat İlanları - Test Adımları

## ⚠️ ÖNEMLİ: Önce Migration Çalıştırın!

### 1. Veritabanı Güncellemesi

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden **SQL Editor**'ı açın
4. `OPPORTUNITY_LISTINGS_MIGRATION.sql` dosyasındaki SQL kodunu kopyalayın
5. SQL Editor'a yapıştırın ve **Run** butonuna tıklayın

### 2. Migration Kontrolü

Migration başarılı olduysa şu komutu çalıştırın:
```bash
node scripts/test-opportunity-columns.mjs
```

Beklenen çıktı:
```
✅ Fırsat ilan kolonları mevcut!
```

## 📋 Test Senaryosu

### Adım 1: Admin Paneline Giriş
1. Tarayıcıda `http://localhost:5173/admin` adresine gidin
2. Admin şifresini girin: `Sevimbebe4242.`

### Adım 2: İlan Onaylama
1. Bekleyen (pending) bir ilan seçin
2. "Onayla" butonuna tıklayın

### Adım 3: İlanı Fırsat Olarak İşaretle
1. Onaylı bir ilanın yanındaki **"Fırsat Yap"** butonuna tıklayın
2. Buton **"🔥 Fırsat İlan"** olarak değişecek
3. Altında 3 input görünecek:
   - **Sıra**: Fırsat ilanları arasındaki sıralama (0, 1, 2...)
   - **Eski Fiyat**: İlanın orijinal fiyatı (indirim göstermek için)
   - İndirim yüzdesi otomatik hesaplanacak

### Adım 4: Fiyat Bilgilerini Gir
1. **Eski Fiyat** alanına örnek: `3000000` (3 milyon TL)
2. İlanın mevcut fiyatı: `2500000` (2.5 milyon TL)
3. Otomatik hesaplanan indirim: **%17** görünecek

### Adım 5: Ana Sayfada Kontrol
1. Ana sayfaya gidin: `http://localhost:5173/`
2. **"Fırsat İlanlar"** bölümünde işaretlediğiniz ilanları göreceksiniz
3. İlanlar `opportunity_order` sırasına göre gösterilir
4. Maksimum 3 ilan gösterilir
5. İndirim yüzdesi yeşil badge ile gösterilir

### Adım 6: Fırsatlar Sayfasında Kontrol
1. Fırsatlar sayfasına gidin: `http://localhost:5173/firsatlar`
2. Sadece fırsat olarak işaretlenmiş ilanlar gösterilir
3. İlanlar sıralamaya göre listelenir
4. Her ilan "FIRSAT" badge'i ile işaretli

### Adım 7: Fırsat İşaretini Kaldırma
1. Admin paneline dönün
2. Fırsat ilanın **"🔥 Fırsat İlan"** butonuna tekrar tıklayın
3. İlan fırsat listesinden çıkacak
4. Ana sayfada ve fırsatlar sayfasında artık görünmeyecek

## 🎯 Beklenen Sonuçlar

### Ana Sayfa
- ✅ Fırsat ilanları dinamik olarak yükleniyor
- ✅ Maksimum 3 ilan gösteriliyor
- ✅ İlanlar `opportunity_order` sırasına göre sıralanıyor
- ✅ Eski fiyat üstü çizili gösteriliyor
- ✅ İndirim yüzdesi yeşil badge ile gösteriliyor
- ✅ "FIRSAT" badge'i turuncu renkte
- ✅ İlanlara tıklandığında detay sayfasına gidiyor
- ✅ Fırsat ilan yoksa mesaj gösteriliyor

### Fırsatlar Sayfası
- ✅ Sadece fırsat ilanları gösteriliyor
- ✅ Otomatik m² fiyatı hesaplanmıyor (admin belirlediği ilanlar)
- ✅ Filtreleme çalışıyor (mahalle, tür, satılık/kiralık)
- ✅ Sıralama seçenekleri mevcut

### Admin Panel
- ✅ Onaylı ilanlar için "Fırsat Yap" butonu görünüyor
- ✅ Fırsat ilanlar turuncu butonla işaretleniyor
- ✅ Sıra numarası değiştirilebiliyor
- ✅ Eski fiyat girilebiliyor
- ✅ İndirim yüzdesi otomatik hesaplanıyor
- ✅ Fırsat durumu toggle edilebiliyor

## 🔧 Özellikler

### Yeni Veritabanı Kolonları
- `is_opportunity` (boolean): İlan fırsat mı?
- `opportunity_order` (integer): Sıralama numarası
- `original_price_tl` (bigint): Orijinal/eski fiyat
- `discount_percentage` (integer): İndirim yüzdesi

### Admin Fonksiyonları
- `toggleOpportunity()`: Fırsat durumunu değiştir
- `updateOpportunityOrder()`: Sıralamayı güncelle
- `updateOpportunityPricing()`: Fiyat bilgilerini güncelle

### Frontend Güncellemeleri
- HomePage: Dinamik fırsat ilanları
- OpportunitiesPage: Sadece fırsat ilanları göster
- AdminPage: Fırsat yönetim butonları

## 📝 Örnek Senaryo

1. Admin 3 ilanı fırsat olarak işaretler:
   - İlan A: Sıra 1, Eski: 3M TL, Yeni: 2.5M TL (%17 indirim)
   - İlan B: Sıra 2, Eski: 2M TL, Yeni: 1.8M TL (%10 indirim)
   - İlan C: Sıra 3, Eski: 5M TL, Yeni: 4M TL (%20 indirim)

2. Ana sayfada bu 3 ilan sırayla gösterilir
3. Her ilanın üstünde "FIRSAT" badge'i var
4. Sol üstte indirim yüzdesi gösteriliyor
5. Eski fiyat üstü çizili, yeni fiyat yeşil renkte

## ⚠️ Dikkat

- Migration çalıştırılmadan özellik çalışmaz
- Sadece onaylı ilanlar fırsat olarak işaretlenebilir
- Eski fiyat girilmezse indirim yüzdesi gösterilmez
- Ana sayfada maksimum 3, fırsatlar sayfasında tüm fırsat ilanları gösterilir

## 🚀 Sonraki Adımlar

1. ✅ Veritabanı migration'ı çalıştır
2. ⏳ Test et
3. ⏳ GitHub'a push et
