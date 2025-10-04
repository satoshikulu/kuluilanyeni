-- ==========================================
-- KULU İLAN PROJESİ - SUPABASE STORAGE YAPILANDIRMASI
-- ==========================================

-- ==========================================
-- STORAGE BUCKET OLUŞTURMA
-- ==========================================

-- Storage şemasını oluştur (zaten varsa hata vermez)
create schema if not exists storage;

-- listings.images bucket'ını oluştur
-- Bu bucket ilan görselleri için kullanılacak
insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values (
  'listings.images',           -- bucket id
  'listings.images',           -- bucket name
  true,                        -- public erişim (görsellerin herkese açık olması için)
  '{"image/*"}',               -- sadece resim dosyalarına izin ver
  5242880                      -- 5MB dosya boyutu limiti
)
on conflict (id) do update set
  name = 'listings.images',
  public = true,
  allowed_mime_types = '{"image/*"}',
  file_size_limit = 5242880;

-- ==========================================
-- STORAGE İÇİN RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Storage objeleri için RLS'yi etkinleştir
-- Bu, storage.objects tablosu için satır seviyesi güvenlik politikalarını etkinleştirir
alter table storage.objects enable row level security;

-- ==========================================
-- STORAGE POLİTİKALARI
-- ==========================================

-- 1. Herkes ilan görseli yükleyebilir
-- Anonim kullanıcılar ve giriş yapmış kullanıcılar görsel yükleyebilir
create policy "Herkes ilan görseli yükleyebilir" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'listings.images'
  );

-- 2. Herkes ilan görsellerini görebilir
-- Tüm kullanıcılar (anonim dahil) görselleri görüntüleyebilir
create policy "Herkes ilan görsellerini görebilir" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'listings.images'
  );

-- 3. İlan sahibi kendi görsellerini silebilir
-- Giriş yapmış kullanıcılar sadece kendi yükledikleri görselleri silebilir
create policy "İlan sahibi kendi görsellerini silebilir" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'listings.images' 
    and owner = auth.uid()
  );

-- 4. Admin kullanıcılar tüm görselleri silebilir
-- Onaylı admin kullanıcılar tüm görselleri silebilir
create policy "Admin kullanıcılar tüm görselleri silebilir" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'listings.images' 
    and exists (
      select 1 from public.users_min
      where phone = current_setting('request.jwt.claim.phone', true)
      and status = 'approved'
    )
  );

-- ==========================================
-- STORAGE İÇİN İNDEKSLER
-- ==========================================

-- Performans için indeksler
create index if not exists storage_objects_bucket_id_idx on storage.objects (bucket_id);
create index if not exists storage_objects_owner_idx on storage.objects (owner);

-- ==========================================
-- YARDIMCI FONKSİYONLAR
-- ==========================================

-- Görsel URL'si oluşturma fonksiyonu
-- Bu fonksiyon, bir görselin public URL'sini döndürür
create or replace function get_image_url(bucket_name text, object_name text)
returns text as $$
begin
  return storage.base_url() || bucket_name || '/' || object_name;
end;
$$ language plpgsql;

-- ==========================================
-- KULLANIM ÖRNEKLERİ
-- ==========================================

/*
BU YAPILANDIRMAYI SUPABASE SQL EDITOR'DA ÇALIŞTIRIN

1. Supabase Dashboard'a giriş yapın
2. Sol menüden "SQL Editor" seçeneğine tıklayın
3. Bu dosyanın içeriğini kopyalayın ve yapıştırın
4. "Run" butonuna tıklayın

BU İŞLEMLERDEN SONRA:

1. "listings.images" adında bir storage bucket oluşturulacak
2. Bu bucket herkese açık olacak (görseller görüntülenebilecek)
3. Herkes görsel yükleyebilecek
4. Kullanıcılar sadece kendi görsellerini silebilecek
5. Admin kullanıcılar tüm görselleri silebilecek

FRONTEND (REACT) TARAFINDA GÖRSEL YÜKLEME ÖRNEĞİ:

import { supabase } from '../lib/supabaseClient';

async function uploadImage(file, listingId) {
  try {
    // Dosya adını güvenli hale getir
    const fileExt = file.name.split('.').pop();
    const fileName = `${listingId}/${Date.now()}.${fileExt}`;
    
    // Dosyayı yükle
    const { data, error } = await supabase.storage
      .from('listings.images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // Public URL'yi al
    const { data: { publicUrl } } = supabase.storage
      .from('listings.images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Görsel yükleme hatası:', error);
    throw error;
  }
}

BU YAPILANDIRMA İLE İLGİLİ SORUNLAR:

1. Eğer bucket oluşturulmazsa:
   - Supabase projenizin Storage özelliğinin etkin olduğundan emin olun
   - SQL Editor'da sorguyu tekrar çalıştırın
   
2. Eğer görseller yüklenemiyorsa:
   - Kullanıcının anonim veya giriş yapmış olduğundan emin olun
   - Dosya boyutunun 5MB altında olduğundan emin olun
   - Dosya türünün resim olduğundan emin olun (jpg, png, gif, vb.)
   
3. Eğer görseller görüntülenemiyorsa:
   - Bucket'ın public olduğundan emin olun
   - Public URL'nin doğru oluşturulduğundan emin olun
*/