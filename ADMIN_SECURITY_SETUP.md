# 🔐 Admin Güvenlik Sistemi Kurulum Kılavuzu

## 📋 Genel Bakış

Bu sistem, Supabase Auth kullanarak güvenli bir admin paneli oluşturur:
- ✅ Profiles tablosu ile role yönetimi
- ✅ RLS (Row Level Security) ile veri güvenliği
- ✅ Otomatik profile oluşturma
- ✅ Real-time admin kontrolü
- ✅ Production-ready kod

## 🚀 Kurulum Adımları

### 1. Supabase SQL Kurulumu

Supabase Dashboard → SQL Editor'da şu dosyayı çalıştır:

```bash
supabase-auth-security-setup.sql
```

Bu dosya:
- `profiles` tablosunu oluşturur
- RLS policies ekler
- Otomatik profile oluşturma trigger'ı kurar
- Admin kullanıcısı oluşturur
- Helper functions ekler

### 2. Frontend Entegrasyonu

Admin sayfanıza güvenlik kontrolü ekleyin:

```typescript
import { enforceAdminAccess, setupAdminRoleWatcher } from '../lib/adminSecurity'

useEffect(() => {
  // Admin erişim kontrolü
  enforceAdminAccess('/')
  
  // Real-time role watcher
  const cleanup = setupAdminRoleWatcher((role) => {
    if (role !== 'admin') {
      console.warn('⚠️ Admin rolü kaldırıldı!')
    }
  })
  
  return cleanup
}, [])
```

### 3. Test

Test SQL dosyasını çalıştırın:

```bash
admin-security-test.sql
```

## 🔒 Güvenlik Özellikleri

### 1. Profiles Tablosu
- Her kullanıcı için otomatik profile
- Role: 'user' veya 'admin'
- RLS ile korumalı

### 2. RLS Policies
- Kullanıcı sadece kendi profilini görebilir
- Admin tüm profilleri görebilir
- Role değiştirme engellendi

### 3. Admin Kontrolü
- Sayfa yüklendiğinde kontrol
- Her 30 saniyede bir kontrol
- Role değişirse otomatik çıkış

### 4. Otomatik Profile
- Yeni kayıt → otomatik profile
- Default role: 'user'
- Trigger ile çalışır

## 📱 Kullanım Örnekleri

### Admin Kontrolü
```typescript
import { isUserAdmin } from '../lib/adminSecurity'

const isAdmin = await isUserAdmin()
if (isAdmin) {
  // Admin işlemleri
}
```

### Profile Getir
```typescript
import { getUserProfile } from '../lib/adminSecurity'

const profile = await getUserProfile()
console.log(profile?.role) // 'user' veya 'admin'
```

### React Hook
```typescript
import { useAuth } from '../hooks/useAuth'

function MyComponent() {
  const { user, profile, isAdmin, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!isAdmin) return <div>Yetkisiz erişim!</div>
  
  return <div>Admin Panel</div>
}
```

## 🧪 Test Senaryoları

### 1. Normal Kullanıcı
1. Kayıt ol
2. Giriş yap
3. `/admin` sayfasına git
4. **Beklenen:** Otomatik çıkış + ana sayfaya yönlendirme

### 2. Admin Kullanıcı
1. Admin olarak giriş yap
2. `/admin` sayfasına git
3. **Beklenen:** Admin paneline erişim

### 3. Role Değişikliği
1. Admin olarak giriş yap
2. Admin panelinde kal
3. Başka bir sekmede role'ü 'user' yap
4. **Beklenen:** 30 saniye içinde otomatik çıkış

## 🔧 Troubleshooting

### Sorun: "profiles table does not exist"
**Çözüm:** `supabase-auth-security-setup.sql` dosyasını çalıştır

### Sorun: "permission denied for table profiles"
**Çözüm:** RLS policies doğru kurulmamış, SQL dosyasını tekrar çalıştır

### Sorun: "Admin değilken admin paneline erişebiliyorum"
**Çözüm:** 
1. Browser cache'i temizle
2. `enforceAdminAccess()` çağrısının useEffect'te olduğundan emin ol
3. Console'da hata var mı kontrol et

## 📊 Veritabanı Şeması

```sql
profiles
├── id (uuid, PK, FK → auth.users.id)
├── full_name (text)
├── role (text, 'user' | 'admin')
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

## 🎯 Sonraki Adımlar

1. ✅ SQL dosyasını çalıştır
2. ✅ Admin kullanıcısı oluştur
3. ✅ Frontend entegrasyonu yap
4. ✅ Test et
5. ✅ Production'a deploy et

## 🆘 Destek

Sorun yaşıyorsan:
1. `admin-security-test.sql` çalıştır
2. Console loglarını kontrol et
3. Supabase Dashboard → Logs kontrol et

---

**Güvenlik Notu:** Bu sistem production-ready'dir ama ek güvenlik katmanları ekleyebilirsin:
- IP whitelist
- 2FA
- Rate limiting
- Audit logging