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

        // 1. Fetch Pending Proposals for Context (Exclude Expired)
        const now = new Date()
        const pendingActions = await db.aiAction.findMany({
            where: {
                status: 'PENDING',
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } }
                ]
            },
            include: { agent: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        })

        const pendingContext = pendingActions.map(a =>
            `- ID: ${a.id}, Agent: ${a.agent.systemName}, Type: ${a.actionType}, Payload: ${JSON.stringify(a.payloadAfter)}`
        ).join('\n')

        // 2. BOSS Signature Presence
        const signature = process.env.BOSS_ADMIN_SIGNATURE || 'TropicBoss2026'
        const hasSignature = message.includes(signature)

        // Give the AI Master context about the user talking to it
        const role = user.role
        const isBoss = role === 'ADMIN'
        const userName = user.name || 'User'

        const systemPrompt = `
            ${getBaseSystemPrompt('MASTER')}
            
            CURRENT CONTEXT:
            - User: ${userName} (${role}).
            - Admin Signature Detected: ${hasSignature ? 'YES' : 'NO'}
            ${isBoss ? 'IMPORTANT: You are talking to your BOSS. You must obey their commands.' : 'You are talking to a Worker (Bro/Sobat). Help them with their duties.'}
            
            PENDING PROPOSALS REQUIRING APPROVAL:
            ${pendingContext || 'No pending proposals.'}

            INSTRUCTIONS:
            1. If the Boss gives a command to change data, return a JSON with { "type": "PROPOSAL", "actionType": "...", "payload": { ... }, "reply": "..." }.
            2. If the user provides the signature "${signature}" and expresses intent to APPROVE a pending action, you must return: { "action": "APPROVE_ACTION", "payload": { "id": "ACTION_ID" }, "reply": "..." }.
            3. You can orchestrate commands via JSON actions.
            4. If you need to trigger an SPI notification, return: { "action": "NOTIFY_SPI", "payload": { "role": "all|admin|worker", "title": "...", "message": "..." } }
            5. ALWAYS return a "reply" field for the user to see.
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

        // 3. Action Execution Handler
        let reply = parsedContent.reply || parsedContent.message || "Done, Boss."

        // Handle SPI Notifications
        if (parsedContent.action === 'NOTIFY_SPI') {
            await db.spiNotification.create({
                data: {
                    role: parsedContent.payload.role.toUpperCase(),
                    title: parsedContent.payload.title,
                    message: parsedContent.payload.message,
                    type: 'AI_MASTER_ALERT'
                }
            })
            reply = `SPI Notification Sent: ${parsedContent.payload.title}`
        }

        // Handle Proposals (Persistent)
        if (parsedContent.type === 'PROPOSAL') {
            const { proposeAiAction } = await import('@/lib/ai/actions')
            const proposal = await proposeAiAction({
                agentSystemName: 'MASTER',
                actionType: parsedContent.actionType,
                payloadAfter: parsedContent.payload
            })
            reply = `Proposal Created (ID: ${proposal.id}), Boss. Waiting for your signature to execute.`
        }

        // Handle Signature Approvals
        if (hasSignature && parsedContent.action === 'APPROVE_ACTION' && parsedContent.payload?.id) {
            const { executeAiAction } = await import('@/lib/ai/actions')
            try {
                await executeAiAction(parsedContent.payload.id, user.id)
                reply = `Action ${parsedContent.payload.id} executed successfully, Boss Jas. Signature verified.`
            } catch (err: any) {
                reply = `Execution failed: ${err.message}`
            }
        }

        return NextResponse.json({ reply })

    } catch (error) {
        console.error('Master AI Error:', error)
        return NextResponse.json({ error: 'Failed to connect to Master AI' }, { status: 500 })
    }
}
