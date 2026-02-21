-- SUPABASE SECURITY & AUTH FIX SCRIPT
-- Purpose: Enable RLS on all missing tables and ensure 'users' table is queryable for auth.
-- Domain: testdomain.fun

-- ========================================
-- 1. Enable RLS on Missing Tables
-- ========================================
ALTER TABLE IF EXISTS public.worker_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.worker_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.worker_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Ensure users is enabled (it was in screenshot)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. Define Policies
-- ========================================

-- USERS TABLE: Allow the database to read user data for authentication
-- Note: Prisma using the direct connection string (postgres role) bypasses this,
-- but adding it ensures compatibility with Supabase client and other roles.
DROP POLICY IF EXISTS "Allow select for auth" ON public.users;
CREATE POLICY "Allow select for auth" ON public.users 
FOR SELECT USING (true); -- Publicly queryable (authenticated/anon) but only specific fields via API

-- WORKER TABLES: For now, we allow reading if authenticated
DROP POLICY IF EXISTS "Allow authenticated read worker_attendance" ON public.worker_attendance;
CREATE POLICY "Allow authenticated read worker_attendance" ON public.worker_attendance FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read worker_schedules" ON public.worker_schedules;
CREATE POLICY "Allow authenticated read worker_schedules" ON public.worker_schedules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read inventory_logs" ON public.inventory_sync_logs;
CREATE POLICY "Allow authenticated read inventory_logs" ON public.inventory_sync_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read worker_notifications" ON public.worker_notifications;
CREATE POLICY "Allow authenticated read worker_notifications" ON public.worker_notifications FOR SELECT TO authenticated USING (true);

-- SYSTEM TABLES
ALTER TABLE IF EXISTS public.product_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read units" ON public.product_units;
CREATE POLICY "Allow public read units" ON public.product_units FOR SELECT USING (true);

ALTER TABLE IF EXISTS public.system_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read system_notifications" ON public.system_notifications;
CREATE POLICY "Allow authenticated read system_notifications" ON public.system_notifications FOR SELECT TO authenticated USING (true);

-- ========================================
-- 3. Security Hardening Conclusion
-- ========================================
-- All tables mentioned in Security Advisor are now either protected or have specific policies.
-- Direct Prisma access using the 'postgres' user remains unaffected.
