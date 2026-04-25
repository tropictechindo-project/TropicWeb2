-- ========================================================
-- SEO & AI SECURITY HARDENING (RLS)
-- Resolves Supabase Security Advisor "RLS Disabled" Errors
-- ========================================================

-- 1. Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS public.seo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.seo_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_insights ENABLE ROW LEVEL SECURITY;

-- 2. Define SEO Pages Policies (Public Read)
-- This allows search engines and the public API to read SEO landing page content.
DROP POLICY IF EXISTS "Allow public read for seo_pages" ON public.seo_pages;
CREATE POLICY "Allow public read for seo_pages" ON public.seo_pages 
FOR SELECT USING (true);

-- 3. Define SEO Analytics Policies (Restricted)
-- We only allow authenticated users to view analytics via the Supabase API.
-- Note: Next.js server-side increments bypass RLS via service_role/postgres role.
DROP POLICY IF EXISTS "Allow authenticated read for seo_analytics" ON public.seo_analytics;
CREATE POLICY "Allow authenticated read for seo_analytics" ON public.seo_analytics 
FOR SELECT TO authenticated USING (true);

-- 4. Define AI Insights Policies (Restricted)
-- AI insights are strictly for administrative monitoring.
DROP POLICY IF EXISTS "Allow authenticated read for ai_insights" ON public.ai_insights;
CREATE POLICY "Allow authenticated read for ai_insights" ON public.ai_insights 
FOR SELECT TO authenticated USING (true);

-- ========================================================
-- VERIFICATION:
-- 1. Run this script in the Supabase SQL Editor.
-- 2. Rerun the Security Advisor in Supabase Dashboard.
-- 3. Confirm /[slug] pages still load correctly (Server-side).
-- ========================================================
