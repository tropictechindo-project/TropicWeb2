// Script to create test users for Tropic Tech dashboard
import bcrypt from 'bcryptjs'

async function generateHashedPasswords() {
    const workerPassword = 'Worker2026'
    const userPassword = 'User2026'

    const workerHash = await bcrypt.hash(workerPassword, 10)
    const userHash = await bcrypt.hash(userPassword, 10)

    console.log('-- SQL Script to Add Test Users --\n')

    console.log(`-- Worker Account (worker@testdomain.fun)`)
    console.log(`INSERT INTO users (username, password, email, full_name, whatsapp, role, is_active, is_verified)`)
    console.log(`VALUES ('worker_tropictech', '${workerHash}', 'worker@testdomain.fun', 'Tropic Tech Worker', '+62123456789', 'WORKER', true, true)`)
    console.log(`ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;\n`)

    console.log(`-- User Account (user@testdomain.fun)`)
    console.log(`INSERT INTO users (username, password, email, full_name, whatsapp, role, is_active, is_verified)`)
    console.log(`VALUES ('user_tropictech', '${userHash}', 'user@testdomain.fun', 'Tropic Tech User', '+62987654321', 'USER', true, true)`)
    console.log(`ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;\n`)

    console.log('-- Copy and run these SQL statements in your Supabase SQL Editor')
}

generateHashedPasswords().catch(console.error)
