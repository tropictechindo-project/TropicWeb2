-- Add Test Users for Tropic Tech Dashboard
-- Created: 2026-02-09
-- Purpose: Add worker and user test accounts for dashboard access

-- Worker Account
-- Email: worker@testdomain.fun
-- Password: Worker2026
INSERT INTO users (username, password, email, full_name, whatsapp, role, is_active, is_verified)
VALUES (
    'worker_tropictech',
    '$2b$10$8JR0E5zoHedH.EBgOWF/2eCO2oXS7QZuoUyBOfpf/S2jJEEZi9mu6',
    'worker@testdomain.fun',
    'Tropic Tech Worker',
    '+62123456789',
    'WORKER',
    true,
    true
)
ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    is_verified = EXCLUDED.is_verified;

-- User Account
-- Email: user@testdomain.fun
-- Password: User2026
INSERT INTO users (username, password, email, full_name, whatsapp, role, is_active, is_verified)
VALUES (
    'user_tropictech',
    '$2b$10$8oztSfaI9Dec.ylVt8.hCOJ/O7I7jVxSezOKfDO3/ZO4lQQ5iXUcW',
    'user@testdomain.fun',
    'Tropic Tech User',
    '+62987654321',
    'USER',
    true,
    true
)
ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    is_verified = EXCLUDED.is_verified;
