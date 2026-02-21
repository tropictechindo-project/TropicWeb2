-- Advanced Order & Worker Management System - Database Migration
-- Created: 2026-02-09
-- Purpose: Add worker scheduling, attendance, inventory sync logging, and enhanced order/invoice tracking

-- ========================================
-- STEP 1: Create ENUM Types
-- ========================================

-- Schedule Status
CREATE TYPE schedule_status AS ENUM ('PENDING', 'ONGOING', 'FINISHED', 'DELAYED', 'CANCELLED');

-- Attendance Status
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'LEAVE');

-- Inventory Update Source
CREATE TYPE inventory_source AS ENUM ('ADMIN', 'WORKER');

-- Payment Status
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID', 'PARTIAL');

-- Delivery Status
CREATE TYPE delivery_status_enum AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'DELIVERED', 'FAILED');

-- ========================================
-- STEP 2: Create New Tables
-- ========================================

-- Worker Schedules (Job Assignments)
CREATE TABLE IF NOT EXISTS worker_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    status schedule_status DEFAULT 'PENDING',
    scheduled_date DATE NOT NULL,
    notes TEXT,
    worker_notes TEXT, -- Manual notes by worker
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker Attendance
CREATE TABLE IF NOT EXISTS worker_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status DEFAULT 'PRESENT',
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id, date)
);

-- Inventory Sync Logs
CREATE TABLE IF NOT EXISTS inventory_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    updated_by UUID NOT NULL REFERENCES users(id),
    source inventory_source NOT NULL,
    conflict BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker Notifications
CREATE TABLE IF NOT EXISTS worker_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_admin_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- JOB_ASSIGNED, INVENTORY_CONFLICT, ADMIN_MESSAGE, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 3: Alter Existing Tables
-- ========================================

-- Update Orders Table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Update Invoices Table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS delivery_fee_override DECIMAL(10,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0.02;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS shareable_token VARCHAR(255) UNIQUE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- ========================================
-- STEP 4: Create Indexes for Performance
-- ========================================

-- Worker Schedules Indexes
CREATE INDEX IF NOT EXISTS idx_worker_schedules_worker ON worker_schedules(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_schedules_order ON worker_schedules(order_id);
CREATE INDEX IF NOT EXISTS idx_worker_schedules_date ON worker_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_worker_schedules_status ON worker_schedules(status);

-- Worker Attendance Indexes
CREATE INDEX IF NOT EXISTS idx_worker_attendance_worker_date ON worker_attendance(worker_id, date);
CREATE INDEX IF NOT EXISTS idx_worker_attendance_date ON worker_attendance(date);

-- Inventory Sync Logs Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_sync_logs_product ON inventory_sync_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sync_logs_conflict ON inventory_sync_logs(conflict) WHERE conflict = TRUE;
CREATE INDEX IF NOT EXISTS idx_inventory_sync_logs_created ON inventory_sync_logs(created_at DESC);

-- Worker Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_worker_notifications_worker ON worker_notifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_notifications_unread ON worker_notifications(worker_id, is_read) WHERE is_read = FALSE;

-- Invoice Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_shareable_token ON invoices(shareable_token) WHERE shareable_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_email_sent ON invoices(email_sent);

-- Order Indexes
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);

-- ========================================
-- STEP 5: Generate Shareable Tokens for Existing Invoices
-- ========================================

UPDATE invoices 
SET shareable_token = encode(gen_random_bytes(16), 'hex')
WHERE shareable_token IS NULL;

COMMENT ON TABLE worker_schedules IS 'Job assignments for workers with status tracking';
COMMENT ON TABLE worker_attendance IS 'Daily attendance records for workers';
COMMENT ON TABLE inventory_sync_logs IS 'Tracks inventory updates and conflicts between admin and workers';
COMMENT ON TABLE worker_notifications IS 'Notifications sent to workers from admin or system';
