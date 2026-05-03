import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id

        // Delete all messages first due to foreign key constraints if not cascaded
        await db.aiChatMessage.deleteMany({
            where: { sessionId: id }
        })

        await db.aiChatSession.delete(({
            where: { id }
        }))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete AI Log Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete log' }, { status: 500 })
    }
}
