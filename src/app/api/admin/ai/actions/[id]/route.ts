import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { executeAiAction } from '@/lib/ai/actions'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        const { status } = await request.json()

        if (status === 'APPROVED') {
            const result = await executeAiAction(id, payload.userId)
            return NextResponse.json({ result })
        }

        if (status === 'REJECTED') {
            const result = await db.$transaction(async (tx) => {
                const action = await tx.aiAction.update({
                    where: { id },
                    data: { status: 'REJECTED' },
                    include: { agent: true }
                })

                await tx.aiTrainingData.create({
                    data: {
                        agentId: action.agentId,
                        suggestion: JSON.stringify({ type: action.actionType, payload: action.payloadAfter }),
                        adminDecision: 'REJECTED'
                    }
                })

                return action
            })
            return NextResponse.json({ result })
        }

        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    } catch (error: any) {
        console.error('AI Action Update Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
