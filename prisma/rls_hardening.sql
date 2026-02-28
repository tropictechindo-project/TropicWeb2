-- Supabase RLS Hardening Migration
-- Resolving "Policy Always True" warnings for orders, invoices, and rental_items

-- Enable RLS on the tables
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rental_items" ENABLE ROW LEVEL SECURITY;

-- 1. Orders RLS Policies
DROP POLICY IF EXISTS "Orders Always True" ON "public"."orders";
DROP POLICY IF EXISTS "Enable all access for admins" ON "public"."orders";
DROP POLICY IF EXISTS "Users can view their own orders" ON "public"."orders";
DROP POLICY IF EXISTS "Users can insert their own orders" ON "public"."orders";

-- Admin Policy (Full Access)
CREATE POLICY "Admin Full Access" ON "public"."orders"
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
);

-- User View Policy
CREATE POLICY "User View Own Orders" ON "public"."orders"
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- User Insert Policy
CREATE POLICY "User Insert Own Orders" ON "public"."orders"
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- 2. Invoices RLS Policies
DROP POLICY IF EXISTS "Invoices Always True" ON "public"."invoices";
DROP POLICY IF EXISTS "Admin view all invoices" ON "public"."invoices";
DROP POLICY IF EXISTS "User view own invoices" ON "public"."invoices";

-- Admin Policy
CREATE POLICY "Admin Full Access Invoices" ON "public"."invoices"
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
);

-- User View Policy
CREATE POLICY "User View Own Invoices" ON "public"."invoices"
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Public/Guest access (Invoices might be accessible via shared tokens)
DROP POLICY IF EXISTS "Public view invoice via token" ON "public"."invoices";
CREATE POLICY "Public view invoice via token" ON "public"."invoices"
FOR SELECT
TO anon, authenticated
USING (
  shareable_token IS NOT NULL
);

-- 3. Rental Items RLS Policies
DROP POLICY IF EXISTS "Rental Items Always True" ON "public"."rental_items";

-- Admin Policy
CREATE POLICY "Admin Full Access Rental Items" ON "public"."rental_items"
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
);

-- User View Policy (Linked via Orders)
CREATE POLICY "User View Own Rental Items" ON "public"."rental_items"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = rental_items.order_id
    AND orders.user_id = auth.uid()
  )
);
