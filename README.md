# Kulu İlan - Kulu Emlak Pazarı

Basit, hızlı ve anlaşılır yerel emlak platformu. Kullanıcılar sadece ad-soyad ve telefon ile kayıt olabilir, ilanlar admin onayından sonra yayına alınır.

## Özellikler

- **Basit Kayıt**: Sadece ad-soyad ve telefon ile hızlı üyelik
- **Admin Onay Sistemi**: Tüm kullanıcı ve ilanlar admin onayından geçer
- **İlan Yönetimi**: Satılık/kiralık ilanlar, mahalle filtreleme
- **Modern UI**: Tailwind CSS ile responsive tasarım
- **Supabase Backend**: PostgreSQL veritabanı ve gerçek zamanlı veri

## Teknolojiler

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Netlify (Frontend) + Supabase (Backend)

## Kurulum

1. **Projeyi klonlayın**
```bash
git clone <repo-url>
cd kulu-ilan
```

2. **Bağımlılıkları kurun**
```bash
npm install
```

3. **Ortam değişkenlerini ayarlayın**
`.env` dosyası oluşturun:
```bash
VITE_SUPABASE_URL=https://tjoivjohhjoedtwzuopr.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_PASS=your_admin_password
```

4. **Supabase şemasını kurun**
`SUPABASE_SCHEMA.sql` dosyasındaki SQL komutlarını Supabase SQL Editor'da çalıştırın.

5. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
```

## Deploy

### Netlify (Frontend)
1. GitHub'a push edin
2. Netlify'da "New site from Git" seçin
3. Repository'yi bağlayın
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Environment variables ekleyin (VITE_* değişkenleri)

### Supabase (Backend)
1. Supabase projesi oluşturun
2. SQL Editor'da `SUPABASE_SCHEMA.sql` çalıştırın
3. Project Settings'den URL ve anon key'i alın

## Kullanım

1. **Ana Sayfa**: Hero bölümü, "Satmak/Kiralamak istiyorum" butonları
2. **Üye Ol**: Ad-soyad + telefon ile kayıt
3. **İlan Ver**: Detaylı form, admin onayı bekler
4. **Admin Panel**: Kullanıcı ve ilan onayları (`/admin`)
5. **İlanlar**: Onaylanmış ilanları listele ve filtrele

## Mahalle Listesi

Proje Kulu ilçesinin 50 mahallesini destekler. Liste `src/constants/neighborhoods.ts` dosyasında tanımlıdır.

## Güvenlik

- Admin paneli şifre korumalı
- Tüm veriler Supabase RLS ile korunur
- Kullanıcı ve ilan onayları manuel kontrol edilir

## Geliştirme

```bash
# Dev sunucu
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## Lisans

Bu proje özel kullanım içindir.