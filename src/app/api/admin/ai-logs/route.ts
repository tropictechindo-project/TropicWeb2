import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')

        if (sessionId) {
            const messages = await db.aiChatMessage.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'asc' }
            })
            return NextResponse.json({ success: true, messages })
        }

        const sessions = await db.aiChatSession.findMany({
            include: {
                _count: { select: { messages: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return NextResponse.json({ success: true, sessions })

    } catch (error) {
        console.error('Fetch AI Logs Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 })
    }
}
