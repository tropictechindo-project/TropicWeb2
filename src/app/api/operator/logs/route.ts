import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

export const dynamic = 'force-dynamic'

// GET /api/operator/logs
// Returns recent activity logs for the operator dashboard, filtered to operator-relevant actions.
export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAuth(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (auth.role !== 'OPERATOR' && auth.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = req.nextUrl
        const limit = parseInt(searchParams.get('limit') || '50')
        const entity = searchParams.get('entity') || undefined  // filter by entity type
        const from = searchParams.get('from') || undefined  // ISO date filter

        const logs = await db.activityLog.findMany({
            where: {
                ...(entity ? { entity } : {}),
                ...(from ? { createdAt: { gte: new Date(from) } } : {}),
            },
            include: {
                user: { select: { fullName: true, email: true, role: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        })

        return NextResponse.json(logs)
    } catch (error: any) {
        console.error('[OPERATOR_LOGS_GET]', error)
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }
}
