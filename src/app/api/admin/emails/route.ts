import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

export const dynamic = 'force-dynamic'

// GET /api/admin/emails
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Verify Admin Access
        const user = await db.user.findUnique({ where: { id: payload.userId } })
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const anyDb = db as any;
        const emails = await anyDb.emailAudit.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit to last 100 for safety
        })

        return NextResponse.json(emails)

    } catch (error: any) {
        console.error('[EMAIL_AUDIT_GET] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 })
    }
}
