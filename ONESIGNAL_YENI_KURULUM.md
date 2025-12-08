# OneSignal Yeni Kurulum - Adım Adım Rehber

## 🎯 Hedef
OneSignal'i sıfırdan kurup, Supabase Edge Function ile entegre etmek.

## 📋 Adım 1: OneSignal App Oluştur

### 1.1 OneSignal Dashboard
1. https://dashboard.onesignal.com/ adresine git
2. Yeni hesabınızla giriş yap
3. **New App/Website** butonuna tıkla

### 1.2 App Ayarları
- **App Name:** Kulu İlan (veya istediğiniz isim)
- **Platform:** Web Push
- **Configuration:**
  - **Site URL:** `https://kuluilanyeni.netlify.app`
  - **Auto Resubscribe:** Enabled (Önerilir)
  - **Default Notification Icon:** Logo URL'nizi ekleyin

### 1.3 Tamamla
- **Save** butonuna tıklayın
- App oluşturuldu! ✅

## 📋 Adım 2: App ID'yi Al

1. OneSignal Dashboard > **Settings** > **Keys & IDs**
2. **OneSignal App ID** bölümünü bulun
3. App ID'yi kopyalayın (Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

**Bana gönderin:** App ID'yi buraya yapıştırın, test için kullanacağız.

## 📋 Adım 3: REST API Key Al

### ⚠️ ÖNEMLİ: Doğru Key'i Alın!

OneSignal'de **iki farklı key sistemi** var. Biz **REST API Key** kullanacağız.

### 3.1 REST API Key Nerede?
1. OneSignal Dashboard > **Settings** > **Keys & IDs**
2. Sayfanın **en üstünde** "REST API Key" bölümü olmalı
3. Format: Genellikle `NGE...`, `MWE...`, `ZGU...` ile başlar

### 3.2 Eğer REST API Key Yoksa
Yeni OneSignal hesaplarında REST API Key olmayabilir. Bu durumda:

**Seçenek A: User Auth Key Kullan**
1. Aynı sayfada "User Auth Key" bölümünü bulun
2. Key'i kopyalayın
3. Bu key notification göndermek için yeterli

**Seçenek B: Yeni API Key Oluştur**
1. **Settings** > **Keys & IDs**
2. **API Keys** bölümünde **Create API Key** butonuna tıklayın
3. **Key Name:** "Notification Sender"
4. **Permissions:**
   - ✅ **Create notifications** (MUTLAKA SEÇİN!)
   - ✅ View notifications
5. **IP Allowlist:** **Disabled** (Devre dışı bırakın!)
6. **Create** butonuna tıklayın
7. Key'i kopyalayın (Sadece bir kez gösterilir!)

**Bana gönderin:** Hangi key'i aldığınızı ve key'in ilk 20 karakterini gönderin.

## 📋 Adım 4: Test Edelim

Key'leri aldıktan sonra hemen test edeceğiz:

```bash
# Test scripti çalıştıracağız
node test-onesignal-final.js
```

## 📋 Adım 5: Supabase'e Ekle

Test başarılı olursa:

```bash
# Secrets ekle
npx supabase secrets set ONESIGNAL_APP_ID=<APP_ID> --project-ref tjoivjohhjoedtwzuopr
npx supabase secrets set ONESIGNAL_REST_API_KEY=<REST_API_KEY> --project-ref tjoivjohhjoedtwzuopr

# Edge function deploy et
npx supabase functions deploy send-notification --project-ref tjoivjohhjoedtwzuopr
```

## 📋 Adım 6: Production Test

```bash
# Production'da test et
node test-onesignal-docker.js
```

---

## 🎯 Şu An Neredeyiz?

- [ ] Adım 1: OneSignal App oluştur
- [ ] Adım 2: App ID al
- [ ] Adım 3: REST API Key al
- [ ] Adım 4: Local test
- [ ] Adım 5: Supabase'e ekle
- [ ] Adım 6: Production test

## 📝 Notlar

- App ID ve REST API Key'i aldıktan sonra bana gönderin
- Test scriptini hazırlayacağım
- Adım adım ilerleyeceğiz

**Hazır mısınız? App ID ve REST API Key'i bekliyorum!** 🚀
