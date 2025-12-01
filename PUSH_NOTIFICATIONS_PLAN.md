# 🔔 Push Bildirimleri - Uygulama Planı

## 📋 Genel Bakış

Push bildirimleri, kullanıcıların önemli olaylardan haberdar olmasını sağlar. PWA altyapısı hazır, sadece push notification servisi eklememiz gerekiyor.

## 🎯 Kullanım Senaryoları (Öncelik Sırasına Göre)

### 1. İlan Onay Bildirimi ⭐⭐⭐ (Kritik)
**Ne zaman:** Admin bir ilanı onayladığında
**Kime:** İlanı veren kullanıcı
**Mesaj:** "🎉 İlanınız onaylandı! Artık yayında."

### 2. İlan Red Bildirimi ⭐⭐
**Ne zaman:** Admin bir ilanı reddettiğinde
**Kime:** İlanı veren kullanıcı
**Mesaj:** "❌ İlanınız reddedildi. Detaylar için ilanlarım sayfasını ziyaret edin."

### 3. Yeni İlan Bildirimi ⭐⭐
**Ne zaman:** İlgilenilen mahallede yeni ilan
**Kime:** O mahalleyi takip eden kullanıcılar
**Mesaj:** "🏠 Cumhuriyet Mahallesi'nde yeni ilan: 3+1 Satılık Daire"

### 4. Fırsat İlanı Bildirimi ⭐
**Ne zaman:** Yeni fırsat ilanı eklendiğinde
**Kime:** Tüm kullanıcılar (veya tercih edenler)
**Mesaj:** "🔥 Yeni fırsat ilan! %20 indirimli"

### 5. Favori İlan Güncelleme ⭐
**Ne zaman:** Favorilerdeki ilan güncellendi
**Kime:** İlanı favorilerine ekleyen kullanıcılar
**Mesaj:** "💰 Favori ilanınızın fiyatı düştü!"

## 🏗️ Teknik Mimari

### Backend: Supabase + Firebase Cloud Messaging (FCM)

```
┌─────────────┐
│   Browser   │
│   (PWA)     │
└──────┬──────┘
       │ 1. Subscribe
       ▼
┌─────────────┐
│  Service    │
│  Worker     │
└──────┬──────┘
       │ 2. Get Token
       ▼
┌─────────────┐
│  Supabase   │
│  Database   │ ← 3. Save Token
└──────┬──────┘
       │
       │ 4. Trigger Event
       ▼
┌─────────────┐
│  Supabase   │
│  Function   │
└──────┬──────┘
       │ 5. Send Push
       ▼
┌─────────────┐
│   Firebase  │
│     FCM     │
└──────┬──────┘
       │ 6. Deliver
       ▼
┌─────────────┐
│   Browser   │
│   (PWA)     │
└─────────────┘
```

## 📦 Gerekli Paketler

\`\`\`bash
npm install firebase
\`\`\`

## 🔧 Uygulama Adımları

### Adım 1: Firebase Projesi Oluştur

1. [Firebase Console](https://console.firebase.google.com/) → Yeni Proje
2. Project Settings → Cloud Messaging
3. Web Push certificates → Generate key pair
4. Server key ve VAPID key'i kaydet

### Adım 2: Supabase'de Token Tablosu

\`\`\`sql
-- Push notification tokens tablosu
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Index
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
\`\`\`

### Adım 3: Frontend - Push Subscription

\`\`\`typescript
// src/lib/pushNotifications.ts
import { supabase } from './supabaseClient'

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY'

export async function subscribeToPush(userId: string) {
  try {
    // Service Worker'ı al
    const registration = await navigator.serviceWorker.ready
    
    // Push subscription oluştur
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })
    
    // Supabase'e kaydet
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscription.toJSON(),
        last_used_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    console.log('✅ Push subscription saved')
    return true
  } catch (error) {
    console.error('❌ Push subscription failed:', error)
    return false
  }
}

export async function unsubscribeFromPush(userId: string) {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      await subscription.unsubscribe()
    }
    
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
    
    console.log('✅ Push unsubscribed')
    return true
  } catch (error) {
    console.error('❌ Push unsubscribe failed:', error)
    return false
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
\`\`\`

### Adım 4: Push Notification Component

\`\`\`typescript
// src/components/PushNotificationPrompt.tsx
import { useState, useEffect } from 'react'
import { subscribeToPush } from '../lib/pushNotifications'
import { getCurrentUser } from '../lib/simpleAuth'

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [permission, setPermission] = useState(Notification.permission)
  
  useEffect(() => {
    // Kullanıcı giriş yaptıysa ve bildirim izni verilmediyse göster
    const user = getCurrentUser()
    if (user && permission === 'default') {
      // 3 saniye sonra göster
      setTimeout(() => setShowPrompt(true), 3000)
    }
  }, [permission])
  
  const handleEnable = async () => {
    const user = getCurrentUser()
    if (!user) return
    
    const result = await Notification.requestPermission()
    setPermission(result)
    
    if (result === 'granted') {
      await subscribeToPush(user.id)
      setShowPrompt(false)
    }
  }
  
  if (!showPrompt || permission !== 'default') return null
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
            <span className="text-3xl">🔔</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Bildirimleri Aç</h3>
            <p className="text-sm text-green-100 mb-3">
              İlanınız onaylandığında hemen haberdar olun!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                className="flex-1 bg-white text-green-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-50"
              >
                Bildirimleri Aç
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-white/10 hover:bg-white/20"
              >
                Daha Sonra
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
\`\`\`

### Adım 5: Supabase Edge Function (Backend)

\`\`\`typescript
// supabase/functions/send-push-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')!

serve(async (req) => {
  try {
    const { userId, title, body, data } = await req.json()
    
    // Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Kullanıcının push subscription'ını al
    const { data: subscription, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single()
    
    if (error || !subscription) {
      return new Response(JSON.stringify({ error: 'No subscription found' }), {
        status: 404
      })
    }
    
    // FCM'e push notification gönder
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': \`key=\${FCM_SERVER_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: subscription.subscription.endpoint,
        notification: {
          title,
          body,
          icon: '/icon-192x192.jpg',
          badge: '/icon-192x192.jpg',
          data
        }
      })
    })
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
})
\`\`\`

### Adım 6: Admin'den Bildirim Gönder

\`\`\`typescript
// Admin ilan onayladığında
async function approveListingWithNotification(listingId: string, userId: string) {
  // İlanı onayla
  await approveListing(listingId)
  
  // Push notification gönder
  await supabase.functions.invoke('send-push-notification', {
    body: {
      userId,
      title: '🎉 İlanınız Onaylandı!',
      body: 'İlanınız yayına alındı ve artık herkes görebilir.',
      data: {
        type: 'listing_approved',
        listingId
      }
    }
  })
}
\`\`\`

## 🎨 Bildirim Ayarları Sayfası

Kullanıcıların hangi bildirimleri almak istediğini seçmesi için:

\`\`\`typescript
// src/pages/NotificationSettingsPage.tsx
export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    listingApproved: true,
    listingRejected: true,
    newListings: false,
    opportunityListings: false,
    favoriteUpdates: false
  })
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Bildirim Ayarları</h1>
      
      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <div className="font-semibold">İlan Onaylandı</div>
            <div className="text-sm text-gray-600">İlanınız onaylandığında bildirim al</div>
          </div>
          <input
            type="checkbox"
            checked={settings.listingApproved}
            onChange={(e) => setSettings({...settings, listingApproved: e.target.checked})}
            className="w-5 h-5"
          />
        </label>
        
        {/* Diğer ayarlar... */}
      </div>
    </div>
  )
}
\`\`\`

## 💰 Maliyet Analizi

### Firebase FCM (Ücretsiz)
- ✅ Aylık 10 milyon mesaj ücretsiz
- ✅ Sizin için yeterli (binlerce kullanıcı için bile)

### Alternatif: OneSignal (Daha Kolay)
- ✅ 10,000 kullanıcıya kadar ücretsiz
- ✅ Daha kolay kurulum
- ✅ Dashboard ile yönetim
- ❌ Vendor lock-in

## 📊 Önerim

### Başlangıç İçin (Şimdi)
1. **Sadece ilan onay bildirimi** ile başlayın
2. **OneSignal** kullanın (daha kolay)
3. Test edin, kullanıcı geri bildirimi alın

### Gelişmiş (Sonra)
1. Bildirim ayarları sayfası ekleyin
2. Yeni ilan bildirimleri
3. Fırsat ilanları bildirimleri
4. Firebase FCM'e geçiş (daha fazla kontrol)

## 🚀 Hızlı Başlangıç (OneSignal ile)

\`\`\`bash
# 1. OneSignal hesabı oluştur
https://onesignal.com/

# 2. Web Push yapılandır
# 3. App ID'yi al

# 4. Paketi kur
npm install react-onesignal

# 5. Initialize et
import OneSignal from 'react-onesignal'

OneSignal.init({
  appId: 'YOUR_APP_ID',
  allowLocalhostAsSecureOrigin: true
})

# 6. Kullanıcıyı subscribe et
OneSignal.showSlidedownPrompt()
\`\`\`

## ✅ Sonuç

**Önerim:** 
1. Önce **OneSignal** ile başlayın (2-3 saat kurulum)
2. Sadece **ilan onay bildirimi** ekleyin
3. Kullanıcı geri bildirimine göre genişletin

**Neden OneSignal?**
- ✅ Çok kolay kurulum
- ✅ Dashboard'dan test edebilirsiniz
- ✅ Ücretsiz plan yeterli
- ✅ Dokümantasyon mükemmel

İsterseniz şimdi OneSignal kurulumunu yapabilirim! 🚀
