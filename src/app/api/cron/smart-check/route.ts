import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET(req: Request) {
    try {
        const issues: string[] = []

        // 1. Check for unresolved inventory conflicts
        const conflicts = await prisma.inventorySyncLog.count({
            where: { conflict: true, resolved: false }
        })
        if (conflicts > 0) {
            issues.push(`${conflicts} unresolved inventory conflicts.`)
        }

        // 2. Check for pending orders older than 2 days
        const twoDaysAgo = new Date()
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
        const staleOrders = await prisma.order.count({
            where: { status: 'PENDING', createdAt: { lt: twoDaysAgo } }
        })
        if (staleOrders > 0) {
            issues.push(`${staleOrders} orders pending for > 48h.`)
        }

        // 3. Database connection check (implicit by doing these queries)

        // Log job
        await prisma.systemJobLog.create({
            data: {
                jobName: 'SMART_CHECK',
                status: 'SUCCESS',
                message: issues.length > 0 ? issues.join(' ') : 'System healthy'
            }
        })

        // Create notification if issues found or just a daily health check ok
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })

        if (admin) {
            await prisma.systemNotification.create({
                data: {
                    // @ts-ignore
                    userId: admin.id,
                    entityId: '00000000-0000-0000-0000-000000000000', // Dummy UUID for mandatory field
                    entityType: 'SYSTEM',
                    type: issues.length > 0 ? 'WARNING' : 'SUCCESS',
                    title: 'System Smart Check',
                    message: issues.length > 0 ? `Issues detected: ${issues.join(' ')}` : 'All systems operational. Database healthy. No critical delays.',
                    relatedType: 'CRON'
                }
            })
        }

        return NextResponse.json({ success: true, issues })
    } catch (error: any) {
        console.error('Smart check error:', error)
        await prisma.systemJobLog.create({
            data: {
                jobName: 'SMART_CHECK',
                status: 'FAILED',
                message: error.message
            }
        })
        // Try to notify failure
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
        if (admin) {
            await prisma.systemNotification.create({
                data: {
                    // @ts-ignore
                    userId: admin.id,
                    type: 'ERROR',
                    title: 'Smart Check Failed',
                    message: `System check failed: ${error.message}`,
                    relatedType: 'CRON'
                }
            })
        }
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
