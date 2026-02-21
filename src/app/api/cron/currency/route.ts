import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET(req: Request) {
    // secure with a secret if exposed, or check for admin session if called from client
    // For now, we allow it to be called by the admin dashboard "lazy" trigger

    try {
        // Mock currency update logic - in production this would fetch from an API
        const rate = 15500 + Math.floor(Math.random() * 200) // Random variation around 15500 IDR/USD

        await prisma.siteSetting.upsert({
            where: { key: 'exchange_rate' },
            create: {
                key: 'exchange_rate',
                value: { usd_idr: rate, last_updated: new Date().toISOString() },
                section: 'CURRENCY'
            },
            update: {
                value: { usd_idr: rate, last_updated: new Date().toISOString() }
            }
        })

        // Log the job
        await prisma.systemJobLog.create({
            data: {
                jobName: 'CURRENCY_UPDATE',
                status: 'SUCCESS',
                message: `Updated USD/IDR rate to ${rate}`
            }
        })

        // Create a system notification about it
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
        if (admin) {
            await prisma.systemNotification.create({
                data: {
                    userId: admin.id,
                    type: 'INFO',
                    title: 'Currency Updated',
                    message: `Daily exchange rate updated: 1 USD = ${rate} IDR`,
                    relatedType: 'CRON'
                }
            })
        }

        return NextResponse.json({ success: true, rate })
    } catch (error: any) {
        console.error('Currency update error:', error)
        await prisma.systemJobLog.create({
            data: {
                jobName: 'CURRENCY_UPDATE',
                status: 'FAILED',
                message: error.message
            }
        })
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
