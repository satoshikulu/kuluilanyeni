# Supabase Storage Sorun Giderme Rehberi

Bu rehber, Kulu İlan projesinde Supabase Storage ile ilgili karşılaşabileceğiniz yaygın sorunları ve çözümlerini içerir.

## Yaygın Sorunlar ve Çözümleri

### 1. Storage Bucket Oluşturma Sorunu

**Sorun:** `listings.images` bucket'ı oluşturulamıyor.

**Çözüm:**
1. Supabase Dashboard'a giriş yapın
2. Sol menüden "Storage" seçeneğine tıklayın
3. "New bucket" butonuna tıklayın
4. Aşağıdaki ayarlarla bucket oluşturun:
   - Bucket name: `listings.images`
   - Public access: Evet (görsellerin görüntülenebilmesi için)
   - File size limit: 5MB
   - Allowed mime types: `image/*`

**Alternatif çözüm:**
SQL Editor'da aşağıdaki sorguyu çalıştırın:
```sql
insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values (
  'listings.images',
  'listings.images',
  true,
  '{"image/*"}',
  5242880
)
on conflict (id) do update set
  name = 'listings.images',
  public = true,
  allowed_mime_types = '{"image/*"}',
  file_size_limit = 5242880;
```

### 2. Görsel Yükleme İzni Hatası

**Sorun:** "You don't have permission to upload files" hatası alınıyor.

**Çözüm:**
1. Supabase Dashboard > SQL Editor'a gidin
2. Aşağıdaki RLS politikalarını kontrol edin ve gerekirse yeniden oluşturun:

```sql
-- Görsel yükleme politikası
create policy "Herkes ilan görseli yükleyebilir" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'listings.images');

-- Görsel görüntüleme politikası
create policy "Herkes ilan görsellerini görebilir" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'listings.images');
```

### 3. Görseller Görüntülenemiyor

**Sorun:** Yüklenen görseller görüntülenemiyor veya 404 hatası alınıyor.

**Çözüm:**
1. Bucket'ın public olduğundan emin olun
2. Public URL'nin doğru oluşturulduğundan emin olun:

```javascript
// Doğru kullanım
const { data: { publicUrl } } = supabase.storage
  .from('listings.images')
  .getPublicUrl(fileName);

// Yanlış kullanım
const { data: { url } } = supabase.storage
  .from('listings.images')
  .getUrl(fileName);
```

### 4. Dosya Boyutu Sınırı Hatası

**Sorun:** "File too large" hatası alınıyor.

**Çözüm:**
1. Uygulama tarafında dosya boyutunu kontrol edin:

```javascript
if (file.size > 5 * 1024 * 1024) { // 5MB
  throw new Error('Dosya boyutu 5MB sınırını aşıyor');
}
```

2. Gerekirse SQL'de dosya boyutu limitini artırın:

```sql
update storage.buckets 
set file_size_limit = 10485760 -- 10MB
where id = 'listings.images';
```

### 5. Geçersiz Dosya Türü Hatası

**Sorun:** "Invalid file type" hatası alınıyor.

**Çözüm:**
1. Sadece resim dosyalarına izin verildiğinden emin olun:

```javascript
if (!file.type.startsWith('image/')) {
  throw new Error('Sadece resim dosyaları yüklenebilir');
}
```

2. Gerekirse SQL'de izin verilen MIME türlerini güncelleyin:

```sql
update storage.buckets 
set allowed_mime_types = '{"image/*"}'
where id = 'listings.images';
```

## Frontend Tarafında Kontroller

### Dosya Yükleme Fonksiyonu

```javascript
async function uploadListingImage(file, listingId) {
  try {
    // Dosya kontrolleri
    if (!file) throw new Error('Dosya bulunamadı');
    if (!listingId) throw new Error('listingId zorunludur');
    if (!file.type.startsWith('image/')) throw new Error('Sadece resim dosyaları yüklenebilir');
    if (file.size > 5 * 1024 * 1024) throw new Error('Dosya boyutu 5MB sınırını aşıyor');

    // Güvenli dosya adı oluştur
    const fileExt = file.name.split('.').pop();
    const fileName = `${listingId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    // Dosyayı yükle
    const { error } = await supabase.storage
      .from('listings.images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;

    // Public URL'yi al
    const { data } = supabase.storage
      .from('listings.images')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Görsel yükleme hatası:', error);
    throw error;
  }
}
```

## SQL Kontrol Komutları

### Tüm Bucket'ları Listeleme
```sql
select * from storage.buckets;
```

### Belirli Bir Bucket'ın Detaylarını Görüntüleme
```sql
select * from storage.buckets where id = 'listings.images';
```

### Storage Objesi Politikalarını Kontrol Etme
```sql
select * from pg_policy where polrelid = 'storage.objects'::regclass;
```

### Storage İçin RLS Durumunu Kontrol Etme
```sql
select relname, relrowsecurity from pg_class where relname = 'objects' and relnamespace = 'storage'::regnamespace;
```

## Güvenlik Kontrolleri

### 1. RLS Etkin mi?
```sql
select relname, relrowsecurity from pg_class where relname = 'objects' and relnamespace = 'storage'::regnamespace;
```

### 2. Politikalar Doğru Tanımlı mı?
```sql
select polname, polroles, polcmd from pg_policy where polrelid = 'storage.objects'::regclass;
```

## Performans İpuçları

1. **İndeksler:** Storage objeleri için indeksler oluşturun:
```sql
create index if not exists storage_objects_bucket_id_idx on storage.objects (bucket_id);
create index if not exists storage_objects_owner_idx on storage.objects (owner);
```

2. **Cache Kontrolü:** Görseller için uygun cache süresi ayarlayın:
```javascript
const { error } = await supabase.storage
  .from('listings.images')
  .upload(fileName, file, {
    cacheControl: '3600', // 1 saat
    upsert: false
  });
```

## Debugging Yardımcıları

### 1. Storage Loglarını Kontrol Etme
Supabase Dashboard > Logs > Storage sekmesinden logları inceleyin.

### 2. Dosya Yükleme Testi
```sql
-- Test dosyası oluşturma
select storage.base_url() || 'listings.images/';
```

Bu rehberi takip ederek Supabase Storage ile ilgili sorunları çözebilirsiniz. Eğer sorun devam ederse, Supabase Dashboard'daki logları kontrol ederek daha detaylı hata bilgileri alabilirsiniz.