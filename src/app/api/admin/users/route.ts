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

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await db.user.create({
            // @ts-ignore - Workaround for potential IDE caching of Prisma types
            data: {
                username,
                email,
                password: hashedPassword,
                fullName: fullName || username,
                whatsapp: whatsapp || "",
                role: role || "USER",
                isActive: true
            } as any
        })

        await logActivity({
            userId: adminId,
            action: 'CREATE_USER',
            entity: 'USER',
            details: `Created user ${user.username} with role ${user.role}`
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("[USER_CREATE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
