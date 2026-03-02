import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { openai, getBaseSystemPrompt } from '@/lib/ai/client'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const issues: string[] = []

        // 1. Check for unresolved inventory conflicts
        const conflicts = await db.inventorySyncLog.count({
            where: { conflict: true, resolved: false }
        })

        // 2. Check for pending orders older than 24 hours
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)
        const staleOrders = await db.order.findMany({
            where: { status: 'PENDING', createdAt: { lt: oneDayAgo } },
            select: { id: true, createdAt: true }
        })

        // 3. Check Orders without Invoices
        // (Assuming completed or processing orders should have invoices)
        const ordersWithoutInvoices = await db.order.count({
            where: {
                status: { in: ['PROCESSING', 'COMPLETED'] },
                invoices: { none: {} }
            }
        })

        // Prepare context for AI Audit
        const auditContext = `
        CURRENT SYSTEM STATUS:
        - Unresolved Inventory Conflicts: ${conflicts}
        - Stale Pending Orders (>24h): ${staleOrders.length}
        - Processed Orders Missing Invoices: ${ordersWithoutInvoices}
        `

        const systemPrompt = `
        ${getBaseSystemPrompt('AUDIT')}

        You are performing a scheduled Smart Check.
        Analyze the CURRENT SYSTEM STATUS provided by the system.
        If there are ANY anomalies (conflicts > 0, stale orders > 0, or missing invoices > 0), you MUST trigger an SPI Notification to the ADMIN immediately to warn Boss Jas.
        If everything is 0, report that the system is healthy.

        Return your response in this EXACT JSON structure:
        {
            "status": "HEALTHY" | "WARNING" | "CRITICAL",
            "message": "A short, punchy summary of your findings addressing Boss Jas.",
            "action": "NOTIFY_SPI" | "NONE",
            "spiPayload": {
                "role": "ADMIN",
                "title": "AI Audit Report",
                "message": "The short notification message"
            }
        }
        `

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: auditContext }
            ],
            response_format: { type: "json_object" }
        })

        const content = response.choices[0].message.content
        const parsedContent = JSON.parse(content || '{}')

        // Log job
        await db.systemJobLog.create({
            data: {
                jobName: 'AI_AUDIT_SMART_CHECK',
                status: parsedContent.status === 'CRITICAL' ? 'FAILED' : 'SUCCESS',
                message: parsedContent.message || 'System health check completed.'
            }
        })

        // Create SPI Notification if AI requested it
        if (parsedContent.action === 'NOTIFY_SPI' && parsedContent.spiPayload) {
            await db.spiNotification.create({
                data: {
                    role: parsedContent.spiPayload.role,
                    title: parsedContent.spiPayload.title,
                    message: parsedContent.spiPayload.message,
                    type: parsedContent.status === 'CRITICAL' ? 'ERROR' : (parsedContent.status === 'WARNING' ? 'WARNING' : 'INFO')
                }
            })
        }

        return NextResponse.json({ success: true, ai_audit: parsedContent })
    } catch (error: any) {
        console.error('Smart check error:', error)
        await db.systemJobLog.create({
            data: {
                jobName: 'AI_AUDIT_SMART_CHECK',
                status: 'FAILED',
                message: error.message
            }
        })

        // Notify SPI as fallback
        await db.spiNotification.create({
            data: {
                role: 'ADMIN',
                title: 'Audit System Error',
                message: `AI Audit check failed: ${error.message}`,
                type: 'ERROR'
            }
        })

        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
