import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { openai, getBaseSystemPrompt } from '@/lib/ai/client'
import { PERSONAS } from '@/lib/ai/personas'
import { proposeAiAction } from '@/lib/ai/actions'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        // 1. Check if we should run (e.g., limit to 1 page every 3 days)
        const lastPage = await db.seoPage.findFirst({
            orderBy: { createdAt: 'desc' }
        })

        if (lastPage) {
            const threeDaysAgo = new Date()
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
            if (lastPage.createdAt > threeDaysAgo) {
                return NextResponse.json({ message: 'A page was already created recently. Skipping.' })
            }
        }

        // 2. Gather Context for the Oracle
        const topPages = await db.seoAnalytics.groupBy({
            by: ['slug'],
            _sum: { views: true, clicks: true },
            orderBy: { _sum: { views: 'desc' } },
            take: 5
        })

        const insights = await db.aiInsight.findMany({
            where: { topic: 'SEO_STRATEGY' },
            orderBy: { createdAt: 'desc' },
            take: 3
        })

        const context = `
            CURRENT TOP PAGES (Slug and Metrics):
            ${JSON.stringify(topPages, null, 2)}

            RECENT AUDITOR INSIGHTS:
            ${JSON.stringify(insights, null, 2)}
        `

        const systemPrompt = `
            ${PERSONAS.ORACLE.systemPrompt}

            You are running as a scheduled autonomous cron job.
            Your task is to propose EXACTLY ONE new, highly optimized SEO Page based on the context provided.
            Analyze the top pages and insights, and find a new valuable keyword cluster for digital nomads in Bali.
            
            Return ONLY a JSON object with this exact structure:
            {
                "actionType": "CREATE_SEO_PAGE",
                "payload": {
                    "slug": "url-friendly-slug-here",
                    "title": "Compelling Title",
                    "description": "Meta description",
                    "h1": "Main H1 Heading",
                    "heroSub": "Hero subtitle",
                    "category": "Rental" | "Guide" | "Regional",
                    "content": {
                        "sections": [
                            { "title": "Section Title", "content": "Section content in paragraphs." }
                        ],
                        "faqs": [
                            { "question": "Question?", "answer": "Answer" }
                        ]
                    }
                }
            }
        `

        // 3. Prompt Oracle
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: context }
            ],
            response_format: { type: "json_object" }
        })

        const content = response.choices[0].message.content
        const parsedContent = JSON.parse(content || '{}')

        if (parsedContent.actionType === 'CREATE_SEO_PAGE' && parsedContent.payload) {
            // Check if agent exists
            let agent = await db.aiAgent.findUnique({ where: { systemName: 'ORACLE' } })
            if (!agent) {
                 agent = await db.aiAgent.create({
                     data: {
                         systemName: 'ORACLE',
                         displayName: 'Dewa Oracle',
                         isActive: true,
                         canMutateData: false
                     }
                 })
            }

            // Create proposal
            const proposal = await proposeAiAction({
                agentSystemName: 'ORACLE',
                actionType: 'CREATE_SEO_PAGE',
                payloadAfter: parsedContent.payload
            })

            // Optional: Auto-execute it for full autonomy, or leave as pending for Admin.
            // Based on user "seharusnya dia create 1 page", let's create the page directly
            // so it's fully autonomous, but keep the proposal record as EXECUTED.
            const newPage = await db.seoPage.create({
                data: {
                    slug: parsedContent.payload.slug,
                    title: parsedContent.payload.title,
                    description: parsedContent.payload.description,
                    h1: parsedContent.payload.h1,
                    heroSub: parsedContent.payload.heroSub,
                    category: parsedContent.payload.category,
                    content: parsedContent.payload.content,
                    status: 'PUBLISHED'
                }
            })

            await db.aiAction.update({
                where: { id: proposal.id },
                data: { status: 'EXECUTED', executedAt: new Date() }
            })

            // Log job
            await db.systemJobLog.create({
                data: {
                    jobName: 'ORACLE_SEO_GENERATOR',
                    status: 'SUCCESS',
                    message: `Created SEO Page: ${newPage.slug}`
                }
            })

            return NextResponse.json({ success: true, page: newPage })
        }

        return NextResponse.json({ success: false, message: 'Invalid AI output' }, { status: 400 })

    } catch (error: any) {
        console.error('Oracle Cron Error:', error)
        
        await db.systemJobLog.create({
            data: {
                jobName: 'ORACLE_SEO_GENERATOR',
                status: 'FAILED',
                message: error.message
            }
        })

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
