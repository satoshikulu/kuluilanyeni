-- Fix OneSignal trigger to work with 'users' table instead of 'users_min'

-- 1. Clear existing OneSignal records that don't exist in 'users' table
DELETE FROM public.onesignal_users 
WHERE user_id NOT IN (SELECT id FROM public.users);

-- 2. Update onesignal_users table to reference 'users' table
ALTER TABLE public.onesignal_users 
DROP CONSTRAINT IF EXISTS onesignal_users_user_id_fkey;

ALTER TABLE public.onesignal_users 
ADD CONSTRAINT onesignal_users_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. Drop old trigger
DROP TRIGGER IF EXISTS trigger_create_onesignal_user ON public.users_min;

-- 4. Create new trigger for 'users' table
DROP TRIGGER IF EXISTS trigger_create_onesignal_user ON public.users;

CREATE TRIGGER trigger_create_onesignal_user
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION create_onesignal_user_sync();

-- 5. Insert approved users from 'users' table
INSERT INTO public.onesignal_users (user_id, onesignal_external_id, sync_status)
SELECT 
    id,
    id::TEXT,
    'pending'
FROM public.users 
WHERE status = 'approved'
ON CONFLICT (user_id) DO NOTHING;