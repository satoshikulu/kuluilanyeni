# Admin Kullanıcısı Kurulum Rehberi

## Yöntem 1: Supabase Dashboard'tan Admin Oluştur

1. **Supabase Dashboard'a git:** https://supabase.com/dashboard
2. **Authentication > Users** sekmesine git
3. **"Add user"** butonuna tıkla
4. **Admin bilgilerini gir:**
   ```
   Email: admin@kuluilani.com
   Password: [güçlü şifre]
   ```
5. **"Create user"** butonuna tıkla
6. **Oluşturulan kullanıcıya tıkla**
7. **"Raw User Meta Data" kısmına şunu ekle:**
   ```json
   {
     "role": "admin",
     "full_name": "Admin Kullanıcı"
   }
   ```
8. **"Update user"** butonuna tıkla

## Yöntem 2: SQL ile Admin Oluştur

Supabase SQL Editor'da şu komutu çalıştır:

```sql
-- 1. Önce profiles tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- 2. Admin kullanıcısının ID'sini bul (Authentication > Users'tan)
-- Sonra bu komutu çalıştır (ID'yi değiştir):
INSERT INTO public.profiles (id, full_name, role, status)
VALUES (
    '[ADMIN_USER_ID]', -- Buraya gerçek admin user ID'sini yaz
    'Admin Kullanıcı',
    'admin',
    'approved'
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'approved';
```

## Test Et

1. Admin login sayfasına git: `/admin/login`
2. Admin email ve şifre ile giriş yap
3. Admin paneline yönlendirilmelisin

## Sorun Giderme

Eğer hala "Kullanıcı kaydı bulunamadı" hatası alıyorsan:

1. **Profiles tablosu var mı kontrol et:**
   ```sql
   SELECT * FROM public.profiles WHERE role = 'admin';
   ```

2. **Admin user metadata'sını kontrol et:**
   - Supabase Dashboard > Authentication > Users
   - Admin kullanıcısına tıkla
   - "Raw User Meta Data" kısmında `"role": "admin"` var mı?

3. **RLS politikalarını kontrol et:**
   ```sql
   -- Geçici olarak RLS'yi kapat (test için)
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   ```