-- SUPABASE SECURITY ADVISOR RESOLUTION SCRIPT
-- Resolves "RLS Disabled in Public" errors for worker and system logs tables.

-- ========================================
-- 1. Enable Row Level Security (RLS)
-- ========================================

ALTER TABLE IF EXISTS public.worker_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.worker_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.worker_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. Define Row Level Security Policies
-- ========================================

-- WORKER_ATTENDANCE: Allow all authenticated users to read (for dashboard)
DROP POLICY IF EXISTS "Allow authenticated select worker_attendance" ON public.worker_attendance;
CREATE POLICY "Allow authenticated select worker_attendance" ON public.worker_attendance 
FOR SELECT TO authenticated USING (true);

-- WORKER_SCHEDULES: Allow all authenticated users to read
DROP POLICY IF EXISTS "Allow authenticated select worker_schedules" ON public.worker_schedules;
CREATE POLICY "Allow authenticated select worker_schedules" ON public.worker_schedules 
FOR SELECT TO authenticated USING (true);

-- INVENTORY_SYNC_LOGS: Allow all authenticated users to read
DROP POLICY IF EXISTS "Allow authenticated select inventory_sync_logs" ON public.inventory_sync_logs;
CREATE POLICY "Allow authenticated select inventory_sync_logs" ON public.inventory_sync_logs 
FOR SELECT TO authenticated USING (true);

-- WORKER_NOTIFICATIONS: Allow all authenticated users to read
DROP POLICY IF EXISTS "Allow authenticated select worker_notifications" ON public.worker_notifications;
CREATE POLICY "Allow authenticated select worker_notifications" ON public.worker_notifications 
FOR SELECT TO authenticated USING (true);

-- ACTIVITY_LOGS: Allow all authenticated users to read
DROP POLICY IF EXISTS "Allow authenticated select activity_logs" ON public.activity_logs;
CREATE POLICY "Allow authenticated select activity_logs" ON public.activity_logs 
FOR SELECT TO authenticated USING (true);

-- USERS: Ensure public/auth transparency for specific needs while keeping RLS active
DROP POLICY IF EXISTS "Allow select for auth" ON public.users;
CREATE POLICY "Allow select for auth" ON public.users 
FOR SELECT USING (true);

-- ========================================
-- 3. Verification
-- ========================================
-- These commands enable RLS and set basic read policies. 
-- Prisma access via the service_role or postgres role will continue to function normally.
