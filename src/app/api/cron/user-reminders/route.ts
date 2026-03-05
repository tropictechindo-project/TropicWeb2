import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const notificationsCreated: any[] = []

        // 1. Dynamic Return Reminders (-3, -2, -1 Days) & Auto-Queuing
        const offsets = [3, 2, 1]

        for (const offset of offsets) {
            const targetDate = new Date()
            targetDate.setDate(targetDate.getDate() + offset)
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

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
                // Check if user was already notified for this specific offset
                const notifType = `RETURN_REMINDER_${offset}_DAYS`
                const exists = await db.spiNotification.findFirst({
                    where: {
                        userId: order.userId,
                        type: notifType,
                        title: `Return Reminder: ${order.orderNumber}`
                    }
                })

                if (!exists) {
                    await db.spiNotification.create({
                        data: {
                            userId: order.userId,
                            role: 'USER',
                            type: notifType,
                            title: `Return Reminder: ${order.orderNumber}`,
                            message: `Your rental period ends in exactly ${offset} day(s). Please ensure your gear is ready for pickup or contact us to extend!`,
                            link: '/dashboard/user'
                        }
                    })
                    notificationsCreated.push({ type: notifType, userId: order.userId })
                }

                // UNFREEZE PICKUPS precisely on the -1 Day milestone
                if (offset === 1) {
                    const pausedPickups = await db.delivery.findMany({
                        where: {
                            invoice: { orderId: order.id },
                            deliveryType: 'PICKUP',
                            status: 'PAUSED'
                        },
                        include: { invoice: true }
                    })

                    for (const pickup of pausedPickups) {
                        await db.delivery.update({
                            where: { id: pickup.id },
                            data: { status: 'QUEUED' }
                        })

                        const pickupTime = pickup.scheduledFor ? new Date(pickup.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ASAP'
                        const pickupDate = pickup.scheduledFor ? new Date(pickup.scheduledFor).toLocaleDateString() : 'Tomorrow'

                        // Alert workers, operators, and admins
                        const rolesToNotify = ['WORKER', 'OPERATOR', 'ADMIN']
                        for (const role of rolesToNotify) {
                            await db.spiNotification.create({
                                data: {
                                    role,
                                    type: 'DELIVERY_UPDATE',
                                    title: 'Incoming Pickup Alert',
                                    message: `Scheduled pickup (Invoice: ${pickup.invoice?.invoiceNumber || 'Manual'}) is active for ${pickupDate} at ${pickupTime}. Gear readiness check required.`,
                                    link: role === 'WORKER' ? '/dashboard/worker' : '/admin/deliveries',
                                }
                            })
                        }
                        notificationsCreated.push({ type: 'PICKUP_UNFROZEN', deliveryId: pickup.id })
                    }
                }
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

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
