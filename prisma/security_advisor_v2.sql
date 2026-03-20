-- SUPABASE SECURITY ADVISOR FIX (v2.6.1)
-- Date: 2026-03-20
-- Purpose: Enable Row Level Security (RLS) and define basic policies for tables flagged in Security Advisor.

-- 1. Enable RLS on Flagged Tables
ALTER TABLE IF EXISTS public.email_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_units ENABLE ROW LEVEL SECURITY;

-- 2. Define "Allow Authenticated Select" Policies
-- This ensures that the tables are PROTECTED from public access, 
-- while still being available to the application's authenticated users/admins.

-- EMAIL AUDITS
DROP POLICY IF EXISTS "Allow authenticated select on email_audits" ON public.email_audits;
CREATE POLICY "Allow authenticated select on email_audits" 
ON public.email_audits FOR SELECT 
TO authenticated 
USING (true);

-- ORDER ITEMS
DROP POLICY IF EXISTS "Allow authenticated select on order_items" ON public.order_items;
CREATE POLICY "Allow authenticated select on order_items" 
ON public.order_items FOR SELECT 
TO authenticated 
USING (true);

-- INVENTORY UNITS
DROP POLICY IF EXISTS "Allow authenticated select on inventory_units" ON public.inventory_units;
CREATE POLICY "Allow authenticated select on inventory_units" 
ON public.inventory_units FOR SELECT 
TO authenticated 
USING (true);

-- 3. Verification Note
-- After running this, the Supabase Security Advisor warnings for these tables will disappear.
-- Prisma access via the 'postgres' role (Backend) is unaffected by RLS.
