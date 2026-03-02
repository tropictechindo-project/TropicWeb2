import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { sendInvoiceEmail } from "@/lib/email"
import { logActivity } from "@/lib/logger"
import { verifyToken } from "@/lib/auth/utils"

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization')
        let adminId: string | undefined
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const payload = await verifyToken(token)
            if (payload) adminId = payload.userId
        }

        const body = await req.json()
        const {
            type, userId, guestName, guestEmail, guestWhatsapp, guestAddress,
            amount, items: itemName, status,
            sendToCustomer, sendToWorkers, sendToCompany,
            activateOrderFlow, sendSpiNotifications
        } = body

        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        const orderNumber = `ORD-MANUAL-${Date.now().toString().slice(-6)}`

        const result = await db.$transaction(async (tx) => {
            let orderId: string | undefined

            // 1. Create Order if requested
            if (activateOrderFlow) {
                const startDate = new Date()
                const endDate = new Date()
                endDate.setDate(startDate.getDate() + 30) // Default 30 days for manual

                const order = await tx.order.create({
                    data: {
                        orderNumber,
                        status: status === 'PAID' ? 'PAID' : 'AWAITING_PAYMENT',
                        totalAmount: amount,
                        subtotal: amount,
                        paymentMethod: 'MANUAL_INVOICE',
                        startDate,
                        endDate,
                        duration: 30,
                        userId: type === 'registered' ? userId : (adminId || userId), // Use admin as fallback if guest
                    }
                })
                orderId = order.id

                // Add a generic rental item
                await tx.rentalItem.create({
                    data: {
                        orderId: order.id,
                        quantity: 1,
                        // Note: Variant or Package would need selection for full inventory sync
                    }
                })
            }

            // 2. Create Invoice
            const invoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    orderId: orderId,
                    userId: type === 'registered' ? userId : null,
                    guestName: type === 'guest' ? guestName : null,
                    guestEmail: type === 'guest' ? guestEmail : null,
                    guestWhatsapp: type === 'guest' ? guestWhatsapp : null,
                    guestAddress: guestAddress,
                    total: amount,
                    subtotal: amount,
                    status: status || 'PAID',
                    currency: 'IDR',
                }
            })

            // 3. Create Delivery if order flow is active
            let deliveryId: string | undefined
            if (activateOrderFlow) {
                const delivery = await tx.delivery.create({
                    data: {
                        invoiceId: invoice.id,
                        deliveryMethod: 'INTERNAL',
                        deliveryType: 'DROPOFF',
                        status: 'QUEUED',
                    }
                })
                deliveryId = delivery.id

                // Create Background Job for 1-hour Claim Timeout
                const runAt = new Date()
                runAt.setHours(runAt.getHours() + 1)
                await tx.jobQueue.create({
                    data: {
                        type: 'CHECK_DELIVERY_CLAIM',
                        payload: { deliveryId: delivery.id },
                        runAt,
                        status: 'PENDING'
                    }
                })
            }

            // 4. Trigger Real-time Notifications (SPI)
            if (sendSpiNotifications) {
                // To Workers
                await tx.spiNotification.create({
                    data: {
                        role: 'WORKER',
                        type: 'ORDER_CREATED',
                        title: 'New Manual Assignment',
                        message: `Manual order ${orderNumber} created. Check delivery queue.`,
                        link: '/dashboard/worker',
                    }
                })

                // To User if registered
                if (type === 'registered' && userId) {
                    await tx.spiNotification.create({
                        data: {
                            userId: userId,
                            role: 'USER',
                            type: 'ORDER_CREATED',
                            title: 'Invoice Generated',
                            message: `Your invoice ${invoiceNumber} is ready.`,
                            link: '/dashboard/user',
                        }
                    })
                }
            }

            return { invoice, orderId, deliveryId }
        })

        // 5. Handle Email Forwarding (Non-blocking)
        const recipients: string[] = []
        if (sendToCustomer) {
            const customerEmail = type === 'registered'
                ? (await db.user.findUnique({ where: { id: userId } }))?.email
                : guestEmail
            if (customerEmail) recipients.push(customerEmail)
        }
        if (sendToWorkers) {
            const workers = await db.user.findMany({
                where: { role: 'WORKER' },
                select: { email: true }
            })
            workers.forEach(w => recipients.push(w.email))
        }
        if (sendToCompany) recipients.push('contact@tropictech.online')

        if (recipients.length > 0) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            sendInvoiceEmail({
                to: recipients,
                invoiceNumber: result.invoice.invoiceNumber,
                customerName: type === 'registered' ? (await db.user.findUnique({ where: { id: userId } }))?.fullName || 'Customer' : guestName,
                amount: Number(result.invoice.total),
                invoiceLink: `${baseUrl}/invoice/${result.invoice.id}`
            }).catch(e => console.error("Email Error:", e))
        }

        await logActivity({
            userId: adminId,
            action: 'CREATE_INVOICE_MANUAL',
            entity: 'INVOICE',
            details: `Created manual invoice ${result.invoice.invoiceNumber} (Order: ${activateOrderFlow ? 'Yes' : 'No'})`
        })

        return NextResponse.json(result.invoice)
    } catch (error) {
        console.error("[INVOICE_CREATE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
