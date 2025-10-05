# Netlify Deploy - Environment Variables

## Canlı Sitede "Failed to fetch" Hatası Çözümü

### 1. Netlify Dashboard'a Giriş
https://app.netlify.com/ → Projenizi seçin

### 2. Environment Variables Ekleyin
**Site settings** → **Environment variables** (veya **Build & deploy** → **Environment**)

Aşağıdaki 3 değişkeni ekleyin:

```
VITE_SUPABASE_URL=https://tjoivjohhjoedtwzuopr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqb2l2am9oaGpvZWR0d3p1b3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NTM5NTksImV4cCI6MjA3NTAyOTk1OX0.S-eAwtJaP8sxhK7lFRQ2Bvf8JduufHaOQuaTkEku5G0
VITE_ADMIN_PASS=Sevimbebe4242.
```

### 3. Yeniden Deploy Edin

**Yöntem 1 - Netlify UI'den:**
- Site overview → **Deploys** → **Trigger deploy** → **Deploy site**

**Yöntem 2 - Git Push (Önerilen):**
```bash
git commit --allow-empty -m "trigger rebuild with env vars"
git push origin main
```

### 4. Deploy Tamamlandıktan Sonra Test Edin
- Site yeniden build olacak (2-3 dakika)
- Environment variables artık build'de mevcut olacak
- "Failed to fetch" hatası düzelecek

### Doğrulama
Siteyi açın ve tarayıcı konsolunda şunu kontrol edin:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
```
Eğer `undefined` dönüyorsa, environment variables henüz eklenmemiş demektir.

### Notlar
- ⚠️ Environment variables ekledikten sonra **mutlaka yeniden deploy** etmelisiniz
- ✅ VITE_ prefix'i olan değişkenler client-side'da kullanılabilir
- ✅ Anon key güvenlidir, public'tir (Supabase RLS koruması var)
