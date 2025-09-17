-- UUID üreteci için gerekli eklenti
create extension if not exists pgcrypto;

-- listings table (pending approval)
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
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
  images jsonb default '[]'::jsonb
);

-- simple admin approvals table (optional for tracking)
create table if not exists public.admin_approvals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  target_type text not null, -- listing | user
  target_id uuid not null,
  decision text default 'pending', -- pending | approved | rejected
  decided_at timestamp with time zone
);

-- RLS ve politikalar
alter table public.listings enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'listings' and policyname = 'allow_insert_anonymous'
  ) then
    create policy allow_insert_anonymous on public.listings
      for insert
      to anon, authenticated
      with check (true);
  end if;
end $$;

-- favorites table (device-based favorites; can later be extended to user_id based)
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  device_id text not null,
  -- optional user binding for future auth integration
  user_id uuid,
  unique (listing_id, device_id)
);

alter table public.favorites enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'favorites' and policyname = 'favorites_insert_any'
  ) then
    create policy favorites_insert_any on public.favorites
      for insert to anon, authenticated with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'favorites' and policyname = 'favorites_select_any'
  ) then
    create policy favorites_select_any on public.favorites
      for select to anon, authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'favorites' and policyname = 'favorites_delete_any'
  ) then
    create policy favorites_delete_any on public.favorites
      for delete to anon, authenticated using (true);
  end if;
end $$;

-- helpful indexes
create index if not exists favorites_listing_id_idx on public.favorites (listing_id);
create index if not exists favorites_device_id_idx on public.favorites (device_id);

-- (Opsiyonel ama faydalı) SELECT ve UPDATE politikaları
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'listings' and policyname = 'allow_select_anonymous'
  ) then
    create policy allow_select_anonymous on public.listings
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

-- Geçici: admin auth eklenene kadar istemciden status güncellemesine izin ver
-- NOT: Canlıya çıkmadan önce bu politikayı daraltın veya rol bazlı yapın!
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'listings' and policyname = 'allow_update_status_temp'
  ) then
    create policy allow_update_status_temp on public.listings
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;

-- users table (minimal auth: name+phone, admin approval)
create table if not exists public.users_min (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  full_name text not null,
  phone text not null unique,
  status text not null default 'pending' -- pending | approved | rejected
);

alter table public.users_min enable row level security;

-- anyone can insert a user request
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users_min' and policyname = 'users_insert_anon'
  ) then
    create policy users_insert_anon on public.users_min
      for insert to anon, authenticated with check (true);
  end if;
end $$;

-- anyone can read their own approval status by phone equality not enforced here; keep open SELECT for simplicity
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users_min' and policyname = 'users_select_all'
  ) then
    create policy users_select_all on public.users_min
      for select to anon, authenticated using (true);
  end if;
end $$;

-- temp: allow status update (to be restricted later)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users_min' and policyname = 'users_update_status_temp'
  ) then
    create policy users_update_status_temp on public.users_min
      for update to anon, authenticated using (true) with check (true);
  end if;
end $$;
