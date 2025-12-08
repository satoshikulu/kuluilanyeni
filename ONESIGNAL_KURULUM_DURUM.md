# OneSignal Kurulum Durumu

## ✅ Tamamlanan Adımlar

### 1. OneSignal App Oluşturuldu
- **App ID:** `b6fe2840-fc48-4fe3-90fa-0de6ee5274e9` ✅
- **Platform:** Web Push ✅
- **Site URL:** https://kuluilanyeni.netlify.app ✅

### 2. Frontend Entegrasyonu Tamamlandı
- ✅ `index.html` - OneSignal SDK eklendi
- ✅ `public/OneSignalSDKWorker.js` - Service worker oluşturuldu
- ✅ `public/OneSignalSDKUpdaterWorker.js` - Updater worker oluşturuldu
- ✅ `.env` - App ID güncellendi

## ⏳ Bekleyen Adımlar

### 3. REST API Key Gerekiyor!

OneSignal Dashboard'dan REST API Key almanız gerekiyor:

#### Seçenek A: REST API Key (Önerilen)
1. OneSignal Dashboard > **Settings** > **Keys & IDs**
2. Sayfanın **en üstünde** "REST API Key" bölümünü arayın
3. Format: `NGE...`, `MWE...`, `ZGU...` ile başlar
4. Key'i kopyalayın

#### Seçenek B: Yeni API Key Oluştur
1. **Settings** > **Keys & IDs**
2. **API Keys** bölümünde **Create API Key**
3. **Name:** "Notification Sender"
4. **Permissions:**
   - ✅ **Create notifications** (MUTLAKA!)
   - ✅ View notifications
5. **IP Allowlist:** ❌ **Disabled** (Devre dışı!)
6. **Create** → Key'i kopyalayın

#### Seçenek C: User Auth Key
1. **Settings** > **Keys & IDs**
2. "User Auth Key" bölümünü bulun
3. Key'i kopyalayın

---

## 🎯 Sonraki Adımlar

### REST API Key'i aldıktan sonra:

1. **Test Edelim:**
```bash
# Test scripti oluşturacağım
node test-onesignal-final.js
```

2. **Supabase'e Ekleyelim:**
```bash
npx supabase secrets set ONESIGNAL_APP_ID=b6fe2840-fc48-4fe3-90fa-0de6ee5274e9 --project-ref tjoivjohhjoedtwzuopr
npx supabase secrets set ONESIGNAL_REST_API_KEY=<REST_API_KEY> --project-ref tjoivjohhjoedtwzuopr
```

3. **Edge Function Deploy:**
```bash
npx supabase functions deploy send-notification --project-ref tjoivjohhjoedtwzuopr
```

4. **Production Test:**
```bash
node test-onesignal-docker.js
```

---

## 📝 Beklenen Bilgi

**Lütfen bana gönderin:**
- REST API Key (veya User Auth Key)
- Key formatı (NGE..., os_v2_..., vs.)

Key'i aldıktan sonra hemen test edeceğiz! 🚀
