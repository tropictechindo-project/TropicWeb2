-- SUPABASE SECURITY HARDENING SCRIPT
-- This script enables Row Level Security (RLS) on all tables and ensures that 
-- sensitive data (like users) is not exposed via the public PostgREST API.

-- 1. Enable RLS on all tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rental_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Clean up overly permissive legacy policies (identified in screenshots)
DROP POLICY IF EXISTS "Enable insert for invoices" ON public.invoices;
DROP POLICY IF EXISTS "Enable insert for orders" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for rental_items" ON public.rental_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- 3. Protective Policies
-- By enabling RLS without creating "SELECT" policies for the 'anon' role,
-- we effectively hide these tables from the public API.
-- Prisma uses a direct connection (bypass RLS), so it will NOT be affected.

-- If you want specifically to ALLOW public viewing of products/packages but nothing else:
/*
CREATE POLICY "Allow public read access for products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access for packages" ON public.packages FOR SELECT USING (true);
*/

-- 4. Storage Security (If you have buckets)
-- Ensure buckets are not publicly listable unless necessary.
-- This can be done via the Supabase Storage UI, but RLS on tables is the priority here.

-- Security hardening applied. Please check the Security Advisor in your dashboard.
