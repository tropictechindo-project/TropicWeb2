import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/auth-helper'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/ai/operator-chat
// Operator AI Assistant — context-aware responses for operational queries
export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req)
        if (!auth) return new NextResponse('Unauthorized', { status: 401 })
        if (auth.role !== 'OPERATOR' && auth.role !== 'ADMIN') {
            return new NextResponse('Forbidden', { status: 403 })
        }

        const { message, context } = await req.json()
        if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

        // Build a real-time context report for the AI
        const [pendingCount, queuedDeliveries, outOfStockCount, recentOrders] = await Promise.all([
            db.invoice.count({ where: { status: 'PENDING' } }),
            db.delivery.count({ where: { status: 'QUEUED' } }),
            db.productVariant.count({
                where: { units: { none: { status: 'AVAILABLE' } } }
            }),
            db.order.findMany({
                where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { fullName: true } } }
            })
        ])

        const systemContext = `
You are the TropicTech Operator AI Assistant. You help operators manage operations efficiently.
Current dashboard context:
- Pending payments: ${pendingCount} invoices awaiting confirmation
- Queued deliveries: ${queuedDeliveries} ready to be dispatched
- Out-of-stock variants: ${outOfStockCount}
- Recent orders (last 24h): ${recentOrders.length}
${recentOrders.map(o => `  • ${o.orderNumber} — ${o.user?.fullName || 'Guest'} — ${o.status}`).join('\n')}

You must be concise, professional, and action-oriented. Suggest specific next steps.
If asked about something outside your context, say so clearly.
`.trim()

        // Use the Master AI agent endpoint if available, otherwise provide smart rule-based responses
        let response = ''

        try {
            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY
            if (!apiKey) throw new Error('No AI key configured')

            // Try to call existing AI infrastructure (if available)
            const aiRes = await fetch('/api/ai/master', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: req.headers.get('Authorization') || '' },
                body: JSON.stringify({ messages: [{ role: 'user', content: message }], systemPrompt: systemContext })
            })
            if (aiRes.ok) {
                const aiData = await aiRes.json()
                response = aiData.response || aiData.content || ''
            }
        } catch { }

        // Smart fallback responses if AI API not configured
        if (!response) {
            const msg = message.toLowerCase()
            if (msg.includes('pending') || msg.includes('payment')) {
                response = `📊 You currently have **${pendingCount} pending invoices** waiting for payment confirmation. To process them, go to the Invoices tab and click "Mark Paid" after verifying the bank transfer or payment proof.`
            } else if (msg.includes('delivery') || msg.includes('dispatch')) {
                response = `🚚 There are **${queuedDeliveries} deliveries queued** waiting for a worker to claim. If they remain unclaimed for 1 hour, the system will send an alert. You can manually assign a worker from the Deliveries tab.`
            } else if (msg.includes('stock') || msg.includes('inventory')) {
                response = `📦 Currently **${outOfStockCount} product variants** have zero available units. Go to the Inventory tab to see which specific products need restocking or maintenance units returned.`
            } else if (msg.includes('urgent') || msg.includes('attention') || msg.includes('summary')) {
                const urgentItems = []
                if (pendingCount > 0) urgentItems.push(`${pendingCount} pending payments to confirm`)
                if (queuedDeliveries > 0) urgentItems.push(`${queuedDeliveries} queued deliveries waiting workers`)
                if (outOfStockCount > 0) urgentItems.push(`${outOfStockCount} out-of-stock variants`)
                response = urgentItems.length > 0
                    ? `⚡ **Urgent items:**\n${urgentItems.map(i => `• ${i}`).join('\n')}\n\nStart with confirming payments to trigger delivery creation.`
                    : '✅ Everything looks good! No urgent issues detected right now.'
            } else {
                response = `I can help you with:\n• **Pending payments** — confirming invoices and triggering order flow\n• **Delivery status** — tracking and dispatching\n• **Inventory** — stock levels and unit status\n• **Urgent summaries** — what needs attention now\n\nWhat would you like to know?`
            }
        }

        return NextResponse.json({ response })

    } catch (error: any) {
        console.error('[OPERATOR_AI] Error:', error)
        return NextResponse.json({ response: 'I had trouble processing that. Please try again.' }, { status: 200 })
    }
}
