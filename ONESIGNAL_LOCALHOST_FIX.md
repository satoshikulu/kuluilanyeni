# 🔧 OneSignal Localhost Hatası Düzeltme

## Sorun
```
Error: Can only be used on: https://kuluilanyeni.netlify.app
```

Bu hata, OneSignal'in sadece production domain'inde çalışacak şekilde yapılandırılmış olmasından kaynaklanıyor.

## Çözüm: OneSignal Dashboard'da Localhost Ekle

### Adım 1: OneSignal Dashboard'a Git
1. [OneSignal Dashboard](https://dashboard.onesignal.com/) → Giriş yap
2. App'inizi seçin (Kulu İlan)

### Adım 2: Settings → Platforms → Web Push
1. Sol menüden **Settings** → **Platforms**
2. **Web Push** seçeneğine tıkla
3. **Configure** butonuna tıkla

### Adım 3: Site URL Ayarları
**Typical Site** bölümünde:

**Site URL**: `https://kuluilanyeni.netlify.app`

**Auto Resubscribe**: ✅ (Açık)

**Default Notification Icon**: (Varsa logo URL'i)

### Adım 4: Local Testing Ekle
Aşağı kaydırın ve **Local Testing** bölümünü bulun:

**Local Testing URL**: `http://localhost:3000`

✅ **Enable local testing** kutusunu işaretleyin

### Adım 5: Kaydet
**Save** butonuna tıklayın

## Alternatif Çözüm: Sadece Production'da Çalıştır

Eğer localhost'ta test etmek istemiyorsanız, OneSignal'i sadece production'da başlatabilirsiniz:

```typescript
// src/lib/oneSignal.ts içinde
export async function initOneSignal() {
  // Sadece production'da çalış
  if (window.location.hostname !== 'kuluilanyeni.netlify.app') {
    console.log('⚠️ OneSignal skipped: Not on production domain')
    return
  }
  
  // ... rest of the code
}
```

## Test Etme

### 1. Localhost'ta Test (Dashboard ayarı yaptıktan sonra)
```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` açın ve console'da şunu görmelisiniz:
```
✅ OneSignal initialized
```

### 2. Production'da Test
Netlify'a deploy edin ve `https://kuluilanyeni.netlify.app` adresinde test edin.

## Şu Anki Durum

Kod şu anda **her iki ortamda da** çalışacak şekilde yapılandırıldı:
- ✅ Production: `kuluilanyeni.netlify.app`
- ✅ Development: `localhost` veya `127.0.0.1`

Ancak OneSignal Dashboard'da localhost'u eklemezseniz, localhost'ta çalışmayacaktır.

## Önerilen Yaklaşım

**Development için**: OneSignal'i devre dışı bırakın, sadece UI testleri yapın
**Production için**: Gerçek bildirim testleri yapın

Bu şekilde development daha hızlı olur ve OneSignal quota'nızı gereksiz yere tüketmezsiniz.
