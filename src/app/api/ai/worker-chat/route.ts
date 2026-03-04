import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/auth-helper'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/ai/worker-chat
// Worker AI Assistant — context-aware responses for delivery jobs
export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (auth.role !== 'WORKER' && auth.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { message } = await req.json()
        if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

        // Build a real-time context report for the AI based on the worker's own assignments
        const [activeCount, completedTodayCount, poolCount] = await Promise.all([
            // deliveries assigned to this worker that are not yet complete
            db.delivery.count({
                where: {
                    workerId: auth.userId,
                    status: { in: ['ASSIGNED', 'OUT_FOR_DELIVERY'] }
                }
            }),
            // deliveries completed today
            db.delivery.count({
                where: {
                    workerId: auth.userId,
                    status: 'COMPLETED',
                    updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                }
            }),
            // generic pool jobs available to grab
            db.delivery.count({
                where: { status: 'QUEUED' }
            }),
        ])

        const systemContext = `
You are the TropicTech Worker AI Assistant. You help delivery personnel stay safe, efficient, and oriented.
Current dashboard context for this worker:
- Active assignments: ${activeCount} deliveries in progress
- Completed today: ${completedTodayCount} successful drops/pickups
- Unclaimed deliveries in the global pool: ${poolCount}

You must be concise, encouraging, and action-oriented. Reply politely to the worker. If asked about maps, suggest clicking "Live Track" on the delivery.
`.trim()

        // Use the Master AI agent endpoint if available, otherwise provide smart rule-based responses
        let response = ''

        try {
            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY
            if (!apiKey) throw new Error('No AI key configured')

            // Try to call existing AI infrastructure (if available)
            const aiRes = await fetch(new URL('/api/ai/master', req.url).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: req.headers.get('Authorization') || '' },
                body: JSON.stringify({ messages: [{ role: 'user', content: message }], systemPrompt: systemContext })
            })
            if (aiRes.ok) {
                const aiData = await aiRes.json()
                response = aiData.response || aiData.content || ''
            }
        } catch (e) { console.error('AI integration unavailable, fallback active') }

        // Smart fallback responses if AI API not configured
        if (!response) {
            const msg = message.toLowerCase()
            if (msg.includes('active') || msg.includes('my job') || msg.includes('assigned')) {
                response = `🚚 You currently have **${activeCount} active assignments**. Check the Active Jobs tab to start delivery, log your coordinates, and upload proof of completion.`
            } else if (msg.includes('pool') || msg.includes('available') || msg.includes('new job')) {
                response = `📦 There are currently **${poolCount} unclaimed queued deliveries** in the global pool. Head over to the Delivery Pool tab to claim one!`
            } else if (msg.includes('done') || msg.includes('today') || msg.includes('completed')) {
                response = `✅ Great job! You have completed **${completedTodayCount} deliveries today**. Keep up the pace, drive safe, and remember to submit attendance when finished.`
            } else if (msg.includes('urgent') || msg.includes('attention') || msg.includes('summary')) {
                const urgentItems: string[] = []
                if (activeCount > 0) urgentItems.push(`Complete your ${activeCount} pending assignments.`)
                if (poolCount > 0) urgentItems.push(`${poolCount} unassigned jobs waiting in the pool.`)
                response = urgentItems.length > 0
                    ? `⚡ **Urgent tasks:**\n${urgentItems.map(i => `• ${i}`).join('\n')}\n\nDrive safe and check your Maps!`
                    : '✅ You have no active assignments. Claim a job from the pool to get started.'
            } else {
                response = `Hello! I'm your Worker AI. I can check your:\n• **Active Jobs** — what you're delivering now\n• **Completed Stats** — drops finished today\n• **Delivery Pool** — unassigned operations waiting\n\nWhat do you need help with?`
            }
        }

        return NextResponse.json({ response })

    } catch (error: any) {
        console.error('[WORKER_AI] Error:', error)
        return NextResponse.json({ response: 'I had trouble checking the systems. Please try again or refresh.' }, { status: 200 })
    }
}
