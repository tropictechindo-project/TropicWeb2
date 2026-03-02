import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/utils'
import { db } from '@/lib/db'
import { openai, getBaseSystemPrompt } from '@/lib/ai/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        let user: { id: string, role: string, name?: string } | null = null

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const payload = await verifyToken(token)
            if (payload) {
                user = {
                    id: payload.userId,
                    role: payload.role,
                    name: payload.email
                }
            }
        }

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { message, history } = await request.json()

        // Give the AI Master context about the user talking to it
        const role = user.role
        const isBoss = role === 'ADMIN'
        const userName = user.name || 'User'

        const systemPrompt = `
            ${getBaseSystemPrompt('MASTER')}
            
            CURRENT CONTEXT:
            You are talking to: ${userName} (${role}).
            ${isBoss ? 'IMPORTANT: You are talking to your BOSS. You must obey their commands.' : 'You are talking to a Worker (Bro/Sobat). Help them with their duties.'}
            
            1. You can orchestrate commands to other agents via returning specific JSON actions.
            2. If you need to trigger an SPI notification, return: { "action": "NOTIFY_SPI", "payload": { "role": "all|admin|worker", "title": "...", "message": "..." } }
            3. Answer questions directly, keeping the 'Boss' or 'Bro' tone.
        `

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: message }
            ],
            response_format: { type: "json_object" }
        })

        const content = response.choices[0].message.content
        const parsedContent = JSON.parse(content || '{}')

        // Process AI Actions server-side immediately if Master decides to act
        if (parsedContent.action === 'NOTIFY_SPI') {
            await db.spiNotification.create({
                data: {
                    role: parsedContent.payload.role.toUpperCase(),
                    title: parsedContent.payload.title,
                    message: parsedContent.payload.message,
                    type: 'AI_MASTER_ALERT'
                }
            })
            // Override output for admin readabillity
            parsedContent.reply = `SPI Notification Sent: ${parsedContent.payload.title}`
        }

        return NextResponse.json({
            reply: parsedContent.reply || parsedContent.message || "Done, Boss."
        })

    } catch (error) {
        console.error('Master AI Error:', error)
        return NextResponse.json({ error: 'Failed to connect to Master AI' }, { status: 500 })
    }
}
