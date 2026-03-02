import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const notificationsCreated: any[] = []

        // Calculate the date 3 days from now (start and end of that day)
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + 3)
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

        // 1. 3-Day Return Reminders
        const endingOrders = await db.order.findMany({
            where: {
                status: 'IN_PROGRESS',
                endDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            select: { id: true, userId: true, orderNumber: true }
        })

        for (const order of endingOrders) {
            // Check if we already notified them (to prevent duplicates if cron runs multiple times)
            const exists = await db.spiNotification.findFirst({
                where: {
                    userId: order.userId,
                    type: 'RETURN_REMINDER_3_DAYS',
                    title: `Return Reminder: ${order.orderNumber}`
                }
            })

            if (!exists) {
                const spi = await db.spiNotification.create({
                    data: {
                        userId: order.userId,
                        role: 'USER',
                        type: 'RETURN_REMINDER_3_DAYS',
                        title: `Return Reminder: ${order.orderNumber}`,
                        message: `Your rental period ends in exactly 3 days. Please ensure your gear is ready for pickup or contact us to extend!`,
                        link: '/dashboard/user' // Directs user to their dashboard
                    }
                })
                notificationsCreated.push({ type: 'RETURN_REMINDER_3_DAYS', userId: order.userId })
            }
        }

        // 2. Visa Upsell (Send to anyone with an order that just started today)
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const newOrders = await db.order.findMany({
            where: {
                status: 'IN_PROGRESS',
                startDate: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            select: { id: true, userId: true }
        })

        for (const order of newOrders) {
            const exists = await db.spiNotification.findFirst({
                where: {
                    userId: order.userId,
                    type: 'VISA_UPSELL'
                }
            })

            if (!exists) {
                await db.spiNotification.create({
                    data: {
                        userId: order.userId,
                        role: 'USER',
                        type: 'VISA_UPSELL',
                        title: 'Extend Your Bali Stay!',
                        message: 'Loving the island life? We offer fast & reliable Indonesian Visa extensions. Tap to learn more.',
                        link: 'https://tropictech.online/services'
                    }
                })
                notificationsCreated.push({ type: 'VISA_UPSELL', userId: order.userId })
            }
        }

        // Log job success
        await db.systemJobLog.create({
            data: {
                jobName: 'USER_REMINDERS_CRON',
                status: 'SUCCESS',
                message: `Created ${notificationsCreated.length} SPI user notifications.`
            }
        })

        return NextResponse.json({ success: true, notificationsCreated })
    } catch (error: any) {
        console.error('User reminders error:', error)

        await db.systemJobLog.create({
            data: {
                jobName: 'USER_REMINDERS_CRON',
                status: 'FAILED',
                message: error.message
            }
        })

        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
