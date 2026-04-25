import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/utils'
import { openai, getBaseSystemPrompt } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { message, agentName, history } = await request.json()

        const systemPrompt = await getBaseSystemPrompt(agentName)

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: message }
            ],
            response_format: { type: "json_object" }
        })

        const content = response.choices[0].message.content
        const parsedContent = JSON.parse(content || '{}')

        const reply = parsedContent.message || 
                      parsedContent.response || 
                      parsedContent.reply || 
                      parsedContent.text || 
                      parsedContent.content || 
                      content
        
        return NextResponse.json({
            reply: typeof reply === 'object' ? JSON.stringify(reply) : String(reply),
            proposal: parsedContent.type === 'PROPOSAL' ? parsedContent : null
        })

    } catch (error: any) {
        console.error('AI Chat Error:', error)
        return NextResponse.json({
            error: error.message || 'AI processing failed',
            details: error.response?.data || error.stack
        }, { status: 500 })
    }
}
