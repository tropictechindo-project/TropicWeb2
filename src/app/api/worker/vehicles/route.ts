import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (!payload || payload.role !== 'WORKER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const vehicles = await db.vehicle.findMany({
            where: { status: 'AVAILABLE' },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json({ vehicles })
    } catch (error) {
        console.error('Get available vehicles error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
