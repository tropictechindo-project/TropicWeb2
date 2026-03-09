import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/auth-helper'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/ai/worker-chat
// Worker AI Assistant — context-aware responses for logistics and delivery tasks
export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (auth.role !== 'WORKER' && auth.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { message, context } = await req.json()
        if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

        // Build a real-time context report for the worker
        const [assignedDeliveries, pendingPickups, workerStats] = await Promise.all([
            db.delivery.findMany({
                where: {
                    claimedByWorkerId: auth.userId,
                    status: { in: ['CLAIMED', 'OUT_FOR_DELIVERY'] }
                },
                include: { invoice: true }
            }),
            db.delivery.count({
                where: { status: 'QUEUED' }
            }),
            db.delivery.count({
                where: {
                    claimedByWorkerId: auth.userId,
                    status: 'COMPLETED',
                    updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                }
            })
        ])

        const systemContext = `
You are the TropicTech Worker AI Assistant. You help field workers manage deliveries and logistics.
Your current status:
- Assigned tasks: ${assignedDeliveries.length} active deliveries
${assignedDeliveries.map(d => `  • ${d.invoice?.invoiceNumber || 'N/A'} — ${d.status} — ${d.invoice?.deliveryAddress || 'No Address'}`).join('\n')}
- Available in queue: ${pendingPickups} tasks waiting for assignment
- Completed today: ${workerStats} deliveries

Be brief, helpful, and supportive. Focus on routes, ETAs, and task completion.
`.trim()

        let response = ''
        try {
            const baseUrl = req.nextUrl.origin
            const aiRes = await fetch(`${baseUrl}/api/ai/master`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: req.headers.get('Authorization') || '' },
                body: JSON.stringify({
                    message: message,
                    history: [],
                    customSystemPrompt: systemContext
                })
            })
            if (aiRes.ok) {
                const aiData = await aiRes.json()
                response = aiData.response || aiData.content || ''
            }
        } catch { }

        if (!response) {
            response = `I'm currently operating in offline mode. You have ${assignedDeliveries.length} active tasks and ${pendingPickups} tasks waiting in the queue. Complete your current deliveries to see more.`
        }

        return NextResponse.json({ response })

    } catch (error: any) {
        console.error('[WORKER_AI] Error:', error)
        return NextResponse.json({ response: 'Connection issue. Please check your signal.' }, { status: 200 })
    }
}
