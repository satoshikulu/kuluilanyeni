-- ==========================================
-- KULU İLAN PROJESİ - AÇIKLANMIŞ SUPABASE VERİTABANI ŞEMASI
-- ==========================================

/*
Bu dosya, Kulu İlan projesinin Supabase veritabanı şemasını detaylı olarak açıklamaktadır.
Şema, projenin gereksinimlerine göre tasarlanmıştır ve aşağıdaki özelliklere sahiptir:

1. Üyeliksiz ilan gönderme: Kullanıcılar kayıt olmadan ilan verebilir
2. Admin onay sistemi: Tüm ilanlar ve kullanıcı başvuruları admin onayından geçer
3. Favori sistem: Kullanıcılar ilanları favorilerine ekleyebilir
4. Detaylı filtreleme: Mahalle, fiyat, oda sayısı gibi kriterlere göre filtreleme
5. Görsel destek: İlanlara görsel eklenebilir
*/

-- UUID üreteci için gerekli eklenti
-- PostgreSQL'de UUID oluşturmak için kullanılır
create extension if not exists pgcrypto;

-- ==========================================
-- TABLOLAR
-- ==========================================

/*
listings tablosu:
- İlan bilgilerini saklar
- Her ilan bir onay sürecinden geçer (status alanı)
- Sahibi adı ve telefonu ile ilişkilidir
- Fiyat, alan, oda sayısı gibi detayları içerir
*/
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(), -- Benzersiz ilan ID'si
  created_at timestamp with time zone default now(), -- Oluşturulma tarihi
  approved_at timestamp with time zone, -- Onaylanma tarihi
  status text not null default 'pending', -- Onay durumu: pending | approved | rejected
  title text not null, -- İlan başlığı
  owner_name text not null, -- İlan sahibinin adı
  owner_phone text not null, -- İlan sahibinin telefonu
  neighborhood text, -- Mahalle
  property_type text, -- Emlak türü (Daire, Müstakil, Arsa, vb.)
  rooms text, -- Oda sayısı (3+1, 2+1, vb.)
  area_m2 integer, -- Metrekare cinsinden alan
  price_tl bigint, -- TL cinsinden fiyat
  is_for text default 'satilik', -- İlan türü: satilik | kiralik
  description text, -- Açıklama
  images jsonb default '[]'::jsonb -- Görsel URL'leri dizisi
);

/*
users_min tablosu:
- Kullanıcı kayıt başvurularını saklar
- Her kullanıcı bir onay sürecinden geçer
- Telefon numarası benzersiz olmalıdır
*/
create table if not exists public.users_min (
  id uuid primary key default gen_random_uuid(), -- Benzersiz kullanıcı ID'si
  created_at timestamp with time zone default now(), -- Oluşturulma tarihi
  full_name text not null, -- Kullanıcının tam adı
  phone text not null unique, -- Telefon numarası (benzersiz)
  status text not null default 'pending' -- Onay durumu: pending | approved | rejected
);

/*
favorites tablosu:
- Kullanıcıların favori ilanlarını saklar
- Hem giriş yapmış kullanıcılar hem de cihaz bazlı favoriler desteklenir
*/
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(), -- Benzersiz favori ID'si
  created_at timestamp with time zone default now(), -- Oluşturulma tarihi
  listing_id uuid not null references public.listings(id) on delete cascade, -- Favorilenen ilan
  user_id uuid references auth.users(id) on delete cascade, -- Giriş yapmış kullanıcı (varsa)
  device_id text, -- Cihaz bazlı favoriler için cihaz ID'si
  unique (listing_id, user_id), -- Aynı kullanıcı aynı ilanı birden fazla favorileyemez
  unique (listing_id, device_id) -- Aynı cihaz aynı ilanı birden fazla favorileyemez
);

-- ==========================================
-- RLS (ROW LEVEL SECURITY) - SATIR SEVİYESİ GÜVENLİK
-- ==========================================

/*
RLS (Row Level Security), kullanıcıların sadece yetkileri olan verilere erişmesini sağlar.
Bu özellik, veritabanı seviyesinde güvenlik sağlar.
*/
alter table public.listings enable row level security;
alter table public.users_min enable row level security;
alter table public.favorites enable row level security;

-- ==========================================
-- LİSTİNGS TABLOSU POLİTİKALARI
-- ==========================================

-- Herkes onaylanmış ilanları görebilir
-- Bu politika, sadece onaylanmış ilanların herkese açık olmasını sağlar
create policy "Herkes onaylanmış ilanları görebilir" on public.listings
  for select using (status = 'approved');

-- Herkes ilan ekleyebilir (kayıt olmadan ilan verebilmek için)
-- Bu politika, kullanıcıların kayıt olmadan ilan eklemesini sağlar
create policy "Herkes ilan ekleyebilir" on public.listings
  for insert with check (true);

-- Sadece admin kullanıcılar ilan durumunu güncelleyebilir (onay/reddetme)
-- Bu politika, sadece onaylı kullanıcıların ilan durumunu değiştirmesini sağlar
create policy "Sadece admin ilan durumunu güncelleyebilir" on public.listings
  for update using (
    exists (
      select 1 from public.users_min
      where phone = current_setting('request.jwt.claim.phone', true)
      and status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.users_min
      where phone = current_setting('request.jwt.claim.phone', true)
      and status = 'approved'
    )
  );

-- İlan sahibi kendi ilanını düzenleyebilir
-- Bu politika, ilan sahiplerinin kendi ilanlarını düzenlemesini sağlar
create policy "İlan sahibi kendi ilanını düzenleyebilir" on public.listings
  for update using (
    owner_phone = current_setting('request.jwt.claim.phone', true)
  )
  with check (
    owner_phone = current_setting('request.jwt.claim.phone', true)
  );

-- İlan sahibi kendi ilanını silebilir
-- Bu politika, ilan sahiplerinin kendi ilanlarını silmesini sağlar
create policy "İlan sahibi kendi ilanını silebilir" on public.listings
  for delete using (
    owner_phone = current_setting('request.jwt.claim.phone', true)
  );

-- ==========================================
-- USERS_MIN TABLOSU POLİTİKALARI
-- ==========================================

-- Herkes kullanıcı başvurusu yapabilir
-- Bu politika, kullanıcıların kayıt başvurusu yapabilmesini sağlar
create policy "Herkes kullanıcı başvurusu yapabilir" on public.users_min
  for insert with check (true);

-- Herkes kullanıcı listesini görebilir (giriş için gerekli)
-- Bu politika, kullanıcıların giriş yapabilmesi için gerekli bilgileri görmesini sağlar
create policy "Herkes kullanıcı listesini görebilir" on public.users_min
  for select using (true);

-- Sadece admin kullanıcı durumunu güncelleyebilir
-- Bu politika, sadece onaylı kullanıcıların diğer kullanıcıların durumunu değiştirmesini sağlar
create policy "Sadece admin kullanıcı durumunu güncelleyebilir" on public.users_min
  for update using (
    exists (
      select 1 from public.users_min
      where phone = current_setting('request.jwt.claim.phone', true)
      and status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.users_min
      where phone = current_setting('request.jwt.claim.phone', true)
      and status = 'approved'
    )
  );

-- ==========================================
-- FAVORITES TABLOSU POLİTİKALARI
-- ==========================================

-- Kullanıcı kendi favorilerini görebilir
-- Bu politika, giriş yapmış kullanıcıların kendi favorilerini görmesini sağlar
create policy "Kullanıcı kendi favorilerini görebilir" on public.favorites
  for select using (
    user_id = auth.uid()
  );

-- Cihaz bazlı favorileri herkes görebilir (kayıtsız kullanıcılar için)
-- Bu politika, cihaz bazlı favorilerin görülmesini sağlar
create policy "Cihaz bazlı favorileri herkes görebilir" on public.favorites
  for select using (
    device_id is not null and user_id is null
  );

-- Kullanıcı favori ekleyebilir
-- Bu politika, giriş yapmış kullanıcıların favori ekleyebilmesini sağlar
create policy "Kullanıcı favori ekleyebilir" on public.favorites
  for insert with check (
    user_id = auth.uid()
  );

-- Cihaz bazlı favori ekleyebilir (kayıtsız kullanıcılar için)
-- Bu politika, cihaz bazlı favori eklenmesini sağlar
create policy "Cihaz bazlı favori ekleyebilir" on public.favorites
  for insert with check (
    device_id is not null and user_id is null
  );

-- Kullanıcı kendi favorisini silebilir
-- Bu politika, giriş yapmış kullanıcıların kendi favorilerini silebilmesini sağlar
create policy "Kullanıcı kendi favorisini silebilir" on public.favorites
  for delete using (
    user_id = auth.uid()
  );

-- Cihaz bazlı favori silinebilir (kayıtsız kullanıcılar için)
-- Bu politika, cihaz bazlı favorilerin silinebilmesini sağlar
create policy "Cihaz bazlı favori silinebilir" on public.favorites
  for delete using (
    device_id is not null and user_id is null
  );

-- ==========================================
-- İNDEKSLER
-- ==========================================

/*
İndeksler, veritabanı sorgularının performansını artırmak için kullanılır.
Sık kullanılan sorgu alanlarına göre indeksler oluşturulmuştur.
*/
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_neighborhood_idx on public.listings (neighborhood);
create index if not exists listings_property_type_idx on public.listings (property_type);
create index if not exists listings_is_for_idx on public.listings (is_for);
create index if not exists listings_price_tl_idx on public.listings (price_tl);
create index if not exists listings_owner_phone_idx on public.listings (owner_phone);
create index if not exists favorites_listing_id_idx on public.favorites (listing_id);
create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_device_id_idx on public.favorites (device_id);
create index if not exists users_min_phone_idx on public.users_min (phone);
create index if not exists users_min_status_idx on public.users_min (status);

-- ==========================================
-- STORAGE YAPILANDIRMASI
-- ==========================================

/*
Supabase Storage, dosya yükleme ve indirme işlemleri için kullanılır.
İlan görselleri için özel bir bucket oluşturulmuştur.
*/
create schema if not exists storage;

-- listings.images bucket'ını oluştur
insert into storage.buckets (id, name, public)
values ('listings.images', 'listings.images', true)
on conflict (id) do nothing;

-- Storage objeleri için RLS'yi etkinleştir
alter table storage.objects enable row level security;

-- Storage politikaları
create policy "Herkes ilan görseli yükleyebilir" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'listings.images');

create policy "Herkes ilan görsellerini görebilir" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'listings.images');

create policy "İlan sahibi kendi görsellerini silebilir" on storage.objects
  for delete to anon, authenticated
  using (
    bucket_id = 'listings.images' 
    and owner = auth.uid()
  );

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
-- TRİGGER'LAR
-- ==========================================

/*
Trigger'lar, belirli olaylar gerçekleştiğinde otomatik olarak çalışan fonksiyonlardır.
Bu projede, yeni eklenen ilanların otomatik olarak "pending" durumuna gelmesi için kullanılır.
*/
create or replace function set_default_status()
returns trigger as $$
begin
  if new.status is null then
    new.status := 'pending';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_set_default_status
  before insert on public.listings
  for each row
  execute function set_default_status();