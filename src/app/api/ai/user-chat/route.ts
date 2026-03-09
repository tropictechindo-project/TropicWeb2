import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/auth-helper'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/ai/user-chat
// Personal AI Assistant for the User Dashboard
export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { message, context } = await req.json()
        if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

        // Build a real-time context report for the user
        const [recentInvoices, activeDeliveries] = await Promise.all([
            db.invoice.findMany({
                where: { userId: auth.userId },
                orderBy: { createdAt: 'desc' },
                take: 3
            }),
            db.delivery.findMany({
                where: {
                    invoice: { userId: auth.userId },
                    status: { not: 'COMPLETED' }
                },
                include: { invoice: true }
            })
        ])

        const systemContext = `
You are the TropicTech Personal Assistant. You help customers track their orders and manage their workstations.
User Context:
- Recent Invoices: ${recentInvoices.map(i => `${i.invoiceNumber} (${i.status})`).join(', ') || 'None'}
- Active Deliveries: ${activeDeliveries.length} in progress
${activeDeliveries.map(d => `  • ${d.invoice?.invoiceNumber || 'N/A'}: ${d.status}`).join('\n')}

Be extremely polite, helpful, and premium in your tone. Focus on customer satisfaction and clear status updates.
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
            response = "I'm here to help! You can ask me about your order status, tracking your delivery, or any technical questions about our workstations."
        }

        return NextResponse.json({ response })

    } catch (error: any) {
        console.error('[USER_AI] Error:', error)
        return NextResponse.json({ response: 'I am momentarily unavailable. Please check back in a few minutes.' }, { status: 200 })
    }
}
