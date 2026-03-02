import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/logger'
import { verifyToken } from '@/lib/auth/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const users = await db.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                orders: {
                    select: { status: true }
                }
            }
        })
        return NextResponse.json({ users })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization')
        let adminId: string | undefined
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const payload = await verifyToken(token)
            if (payload) adminId = payload.userId
        }

        const body = await req.json()
        const { username, email, password, fullName, whatsapp, role } = body

        if (!username || !email || !password) {
            return new NextResponse("Missing fields", { status: 400 })
        }

        // 1. Sync to Supabase Auth first
        const { syncUserToSupabase } = await import('@/lib/auth/supabase-admin')
        const supabaseId = await syncUserToSupabase(email, password, {
            full_name: fullName || username,
            username: username
        })

        if (!supabaseId) {
            return NextResponse.json({
                error: 'Failed to sync user to Supabase Auth. Check SUPABASE_SERVICE_ROLE_KEY.'
            }, { status: 500 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const userData: any = {
            id: supabaseId, // Keep IDs in sync
            username,
            email,
            password: hashedPassword,
            plainPassword: password,
            fullName: fullName || username,
            whatsapp: whatsapp || "",
            role: role || "USER",
            isActive: true,
            isVerified: true // Admin created users are pre-verified
        }

        const user = await db.user.create({
            data: userData
        })

        await logActivity({
            userId: adminId,
            action: 'CREATE_USER',
            entity: 'USER',
            details: `Created user ${user.username} with role ${user.role} and synced to Supabase`
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("[USER_CREATE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
