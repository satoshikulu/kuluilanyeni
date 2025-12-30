-- ============================================
-- OneSignal Kullanıcı Senkronizasyonu
-- ============================================
-- Yeni kullanıcı kaydında otomatik OneSignal kullanıcısı oluşturur

-- 1. OneSignal senkronizasyon tablosu
CREATE TABLE IF NOT EXISTS public.onesignal_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users_min(id) ON DELETE CASCADE,
    onesignal_external_id TEXT NOT NULL,
    onesignal_user_id TEXT,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'failed')),
    sync_error TEXT,
    last_sync_at TIMESTAMPTZ,
    
    -- Bir kullanıcı için tek OneSignal kaydı
    UNIQUE(user_id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_onesignal_users_user_id ON public.onesignal_users(user_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_users_external_id ON public.onesignal_users(onesignal_external_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_users_sync_status ON public.onesignal_users(sync_status);

-- RLS Politikaları
ALTER TABLE public.onesignal_users ENABLE ROW LEVEL SECURITY;

-- Policy'leri önce sil, sonra yeniden oluştur
DROP POLICY IF EXISTS "onesignal_users_select_policy" ON public.onesignal_users;
DROP POLICY IF EXISTS "onesignal_users_insert_policy" ON public.onesignal_users;
DROP POLICY IF EXISTS "onesignal_users_update_policy" ON public.onesignal_users;

-- Herkes okuyabilir (admin için)
CREATE POLICY "onesignal_users_select_policy" ON public.onesignal_users
    FOR SELECT USING (true);

-- Sistem fonksiyonları ekleyebilir/güncelleyebilir
CREATE POLICY "onesignal_users_insert_policy" ON public.onesignal_users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "onesignal_users_update_policy" ON public.onesignal_users
    FOR UPDATE USING (true);

-- ============================================

-- 2. OneSignal kullanıcı oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_onesignal_user_sync()
RETURNS TRIGGER AS $$
DECLARE
    function_url TEXT;
    payload JSON;
    response_status INTEGER;
    response_body TEXT;
BEGIN
    -- Sadece onaylanan kullanıcılar için OneSignal kullanıcısı oluştur
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- OneSignal senkronizasyon kaydı oluştur
        INSERT INTO public.onesignal_users (
            user_id,
            onesignal_external_id,
            sync_status
        ) VALUES (
            NEW.id,
            NEW.id::TEXT,
            'pending'
        ) ON CONFLICT (user_id) DO UPDATE SET
            sync_status = 'pending',
            sync_error = NULL,
            last_sync_at = now();

        -- Edge Function URL'i (production'da değiştir)
        function_url := 'https://tjoivjohhjoedtwzuopr.supabase.co/functions/v1/create-onesignal-user';
        
        -- Payload hazırla
        payload := json_build_object(
            'user_id', NEW.id::TEXT,
            'full_name', NEW.full_name,
            'phone', NEW.phone
        );

        -- Edge Function'ı çağır (asenkron)
        PERFORM net.http_post(
            url := function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := payload::jsonb
        );

        -- Log için
        RAISE NOTICE 'OneSignal user creation triggered for user: %', NEW.id;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================

-- 3. Trigger oluştur
DROP TRIGGER IF EXISTS trigger_create_onesignal_user ON public.users_min;

CREATE TRIGGER trigger_create_onesignal_user
    AFTER INSERT OR UPDATE ON public.users_min
    FOR EACH ROW
    EXECUTE FUNCTION create_onesignal_user_sync();

-- ============================================

-- 4. Mevcut onaylı kullanıcıları OneSignal'a senkronize et
-- (Bu sadece bir kez çalıştırılmalı)
INSERT INTO public.onesignal_users (user_id, onesignal_external_id, sync_status)
SELECT 
    id,
    id::TEXT,
    'pending'
FROM public.users_min 
WHERE status = 'approved'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================

-- 5. OneSignal senkronizasyon durumunu güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_onesignal_sync_status(
    p_user_id UUID,
    p_status TEXT,
    p_onesignal_user_id TEXT DEFAULT NULL,
    p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.onesignal_users 
    SET 
        sync_status = p_status,
        onesignal_user_id = COALESCE(p_onesignal_user_id, onesignal_user_id),
        sync_error = p_error,
        last_sync_at = now()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================

-- NOTLAR:
-- 1. Bu migration'ı Supabase'de çalıştırın
-- 2. Edge Function URL'ini production ortamına göre güncelleyin
-- 3. Service role key'i environment variable olarak ayarlayın
-- 4. Trigger sadece 'approved' kullanıcılar için çalışır
-- 5. Asenkron çalışır, performansı etkilemez
-- 6. Hata durumları loglanır

-- ============================================