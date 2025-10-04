-- ==========================================
-- KULU İLAN PROJESİ - GÜNCELLENMİŞ SUPABASE VERİTABANI ŞEMASI
-- ==========================================

-- UUID üreteci için gerekli eklenti
create extension if not exists pgcrypto;

-- ==========================================
-- TABLOLAR
-- ==========================================

-- listings table (ilanlar)
-- Herkes ilan ekleyebilir, admin onayı gerekir
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  approved_at timestamp with time zone,
  status text not null default 'pending', -- pending | approved | rejected
  title text not null,
  owner_name text not null,
  owner_phone text not null,
  neighborhood text,
  property_type text,
  rooms text,
  area_m2 integer,
  price_tl bigint,
  is_for text default 'satilik', -- satilik | kiralik
  description text,
  images jsonb default '[]'::jsonb,
  -- Ek alanlar
  address text,
  floor integer,
  total_floors integer,
  building_age integer,
  heating text,
  balcony boolean default false,
  furnished boolean default false,
  within_site boolean default false,
  dues numeric(10,2), -- aidat
  deposit numeric(15,2) -- depozito (kiralık için)
);

-- users_min table (kullanıcı başvuruları)
-- Üyeler kaydolabilir, admin onayı gerekir
create table if not exists public.users_min (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  full_name text not null,
  phone text not null unique,
  status text not null default 'pending', -- pending | approved | rejected
  email text
);

-- favorites table (favoriler)
-- Kullanıcı favori ilanları
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  device_id text, -- cihaz bazlı favoriler için
  unique (listing_id, user_id),
  unique (listing_id, device_id)
);

-- admin_approvals table (onaylar)
-- Admin onaylarını takip eder
create table if not exists public.admin_approvals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  target_type text not null, -- listing | user
  target_id uuid not null,
  decision text default 'pending', -- pending | approved | rejected
  decided_at timestamp with time zone,
  decided_by uuid references public.users_min(id),
  notes text
);

-- ==========================================
-- RLS (ROW LEVEL SECURITY) - SATIR SEVİYESİ GÜVENLİK
-- ==========================================

-- Tüm tablolarda RLS'yi etkinleştir
alter table public.listings enable row level security;
alter table public.users_min enable row level security;
alter table public.favorites enable row level security;
alter table public.admin_approvals enable row level security;

-- ==========================================
-- LİSTİNGS TABLOSU POLİTİKALARI
-- ==========================================

-- Herkes onaylanmış ilanları görebilir
create policy "Herkes onaylanmış ilanları görebilir" on public.listings
  for select using (status = 'approved');

-- Herkes ilan ekleyebilir (kayıt olmadan ilan verebilmek için)
create policy "Herkes ilan ekleyebilir" on public.listings
  for insert with check (true);

-- Sadece admin kullanıcılar ilan durumunu güncelleyebilir (onay/reddetme)
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
create policy "İlan sahibi kendi ilanını düzenleyebilir" on public.listings
  for update using (
    owner_phone = current_setting('request.jwt.claim.phone', true)
  )
  with check (
    owner_phone = current_setting('request.jwt.claim.phone', true)
  );

-- İlan sahibi kendi ilanını silebilir
create policy "İlan sahibi kendi ilanını silebilir" on public.listings
  for delete using (
    owner_phone = current_setting('request.jwt.claim.phone', true)
  );

-- ==========================================
-- USERS_MIN TABLOSU POLİTİKALARI
-- ==========================================

-- Herkes kullanıcı başvurusu yapabilir
create policy "Herkes kullanıcı başvurusu yapabilir" on public.users_min
  for insert with check (true);

-- Herkes kullanıcı listesini görebilir (giriş için gerekli)
create policy "Herkes kullanıcı listesini görebilir" on public.users_min
  for select using (true);

-- Sadece admin kullanıcı durumunu güncelleyebilir
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
create policy "Kullanıcı kendi favorilerini görebilir" on public.favorites
  for select using (
    user_id = auth.uid()
  );

-- Cihaz bazlı favorileri herkes görebilir (kayıtsız kullanıcılar için)
create policy "Cihaz bazlı favorileri herkes görebilir" on public.favorites
  for select using (
    device_id is not null and user_id is null
  );

-- Kullanıcı favori ekleyebilir
create policy "Kullanıcı favori ekleyebilir" on public.favorites
  for insert with check (
    user_id = auth.uid()
  );

-- Cihaz bazlı favori ekleyebilir (kayıtsız kullanıcılar için)
create policy "Cihaz bazlı favori ekleyebilir" on public.favorites
  for insert with check (
    device_id is not null and user_id is null
  );

-- Kullanıcı kendi favorisini silebilir
create policy "Kullanıcı kendi favorisini silebilir" on public.favorites
  for delete using (
    user_id = auth.uid()
  );

-- Cihaz bazlı favori silinebilir (kayıtsız kullanıcılar için)
create policy "Cihaz bazlı favori silinebilir" on public.favorites
  for delete using (
    device_id is not null and user_id is null
  );

-- ==========================================
-- ADMIN_APPROVALS TABLOSU POLİTİKALARI
-- ==========================================

-- Admin onaylarını herkes görebilir
create policy "Admin onaylarını herkes görebilir" on public.admin_approvals
  for select using (true);

-- Sadece admin onay ekleyebilir
create policy "Sadece admin onay ekleyebilir" on public.admin_approvals
  for insert with check (
    exists (
      select 1 from public.users_min
      where phone = current_setting('request.jwt.claim.phone', true)
      and status = 'approved'
    )
  );

-- Sadece admin onay güncelleyebilir
create policy "Sadece admin onay güncelleyebilir" on public.admin_approvals
  for update using (
    exists (
      select 1 from public.users_min
      where phone = current_setting('request.jwt.claim.phone', true)
      and status = 'approved'
    )
  );

-- ==========================================
-- İNDEKSLER
-- ==========================================

-- Performans için indeksler
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_neighborhood_idx on public.listings (neighborhood);
create index if not exists listings_property_type_idx on public.listings (property_type);
create index if not exists listings_is_for_idx on public.listings (is_for);
create index if not exists listings_price_tl_idx on public.listings (price_tl);
create index if not exists listings_owner_phone_idx on public.listings (owner_phone);
create index if not exists listings_created_at_idx on public.listings (created_at);
create index if not exists favorites_listing_id_idx on public.favorites (listing_id);
create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_device_id_idx on public.favorites (device_id);
create index if not exists users_min_phone_idx on public.users_min (phone);
create index if not exists users_min_status_idx on public.users_min (status);
create index if not exists admin_approvals_target_idx on public.admin_approvals (target_type, target_id);

-- ==========================================
-- STORAGE YAPILANDIRMASI
-- ==========================================

-- Storage şemasını oluştur (zaten varsa hata vermez)
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

-- Yeni bir ilan eklendiğinde admin onayı için otomatik olarak pending durumu
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

-- Yeni bir kullanıcı başvurusu eklendiğinde admin onayı için otomatik olarak pending durumu
create or replace function set_default_user_status()
returns trigger as $$
begin
  if new.status is null then
    new.status := 'pending';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_set_default_user_status
  before insert on public.users_min
  for each row
  execute function set_default_user_status();

-- Admin onay eklendiğinde ilgili kaydın durumunu güncelle
create or replace function update_approval_status()
returns trigger as $$
begin
  if new.target_type = 'listing' then
    update public.listings 
    set status = new.decision, approved_at = now()
    where id = new.target_id;
  elsif new.target_type = 'user' then
    update public.users_min 
    set status = new.decision
    where id = new.target_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_approval_status
  after insert or update on public.admin_approvals
  for each row
  execute function update_approval_status();