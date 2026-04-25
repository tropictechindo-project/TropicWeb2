-- ========================================================
-- DATABASE PERFORMANCE HARDENING (INDEXES)
-- Optimized for Admin Dashboard Aggregations & Analytics
-- ========================================================

-- 1. Order Items Optimization
-- Crucial for ROI calculations and financial reporting
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS "idx_order_items_inventory_unit_id" ON public.order_items (inventory_unit_id);
CREATE INDEX IF NOT EXISTS "idx_order_items_created_at" ON public.order_items (created_at);

-- 2. Inventory Units Optimization
-- Crucial for stock management and unit tracking
CREATE INDEX IF NOT EXISTS "idx_inventory_units_product_id" ON public.inventory_units (product_id);
CREATE INDEX IF NOT EXISTS "idx_inventory_units_status" ON public.inventory_units (status);

-- 3. Activity Logs Optimization
-- Prevents slow dashboard loading when history grows
CREATE INDEX IF NOT EXISTS "idx_activity_logs_created_at" ON public.activity_logs (created_at);
CREATE INDEX IF NOT EXISTS "idx_activity_logs_user_id" ON public.activity_logs (user_id);

-- ========================================================
-- VERIFICATION:
-- 1. Run this script in the Supabase SQL Editor.
-- 2. Monitor the Admin Dashboard load speed.
-- ========================================================
