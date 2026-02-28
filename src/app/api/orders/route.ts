import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { sendInvoiceEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization')
        const idempotencyKey = request.headers.get('Idempotency-Key')
        let userId: string | undefined

        // 1. Idempotency Check
        if (idempotencyKey) {
            const existing = await db.idempotencyKey.findUnique({
                where: { key: idempotencyKey }
            })
            if (existing && existing.response) {
                return NextResponse.json(existing.response)
            }
        }

        if (authHeader) {
            const token = authHeader.split(' ')[1]
            const payload = await verifyToken(token)
            if (payload) userId = payload.userId
        }

        const body = await request.json()
        const { item, currency, paymentMethod, deliveryAddress, notes, guestInfo } = body

        if (!item || !paymentMethod || !deliveryAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (!userId && !guestInfo) {
            return NextResponse.json({ error: 'Guest info required' }, { status: 400 })
        }

        const date = new Date()
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(startDate.getDate() + (item.duration || 30))

        // 2. Atomic Transaction
        const result = await db.$transaction(async (tx) => {
            // A. Find & Lock Available Units
            const variant = await tx.productVariant.findFirst({
                where: { productId: item.id },
                include: {
                    units: {
                        where: { status: 'AVAILABLE' },
                        take: 1
                    }
                }
            })

            if (!variant) throw new Error('Product not found')
            if (variant.units.length < 1) {
                throw new Error('Insufficient stock')
            }

            const unit = variant.units[0]

            // B. Create Order First (To get ID for unit assignment)
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    status: 'AWAITING_PAYMENT',
                    totalAmount: item.price,
                    subtotal: item.price,
                    paymentMethod,
                    startDate,
                    endDate,
                    duration: item.duration || 30,
                    userId: userId as string,
                },
            })

            // C. Update Unit Status & Assign Order
            await tx.productUnit.update({
                where: { id: unit.id },
                data: {
                    status: 'RESERVED',
                    assignedOrderId: order.id
                }
            })

            // D. Create Rental Item linked to Unit
            await tx.rentalItem.create({
                data: {
                    orderId: order.id,
                    variantId: variant.id,
                    unitId: unit.id,
                    quantity: 1
                }
            })

            // E. Log Unit History
            await tx.unitHistory.create({
                data: {
                    unitId: unit.id,
                    oldStatus: 'AVAILABLE',
                    newStatus: 'RESERVED',
                    details: `System reservation for order ${orderNumber}`,
                    userId: userId
                }
            })

            // D. Create Invoice
            const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
            const invoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    orderId: order.id,
                    userId: userId,
                    guestName: guestInfo?.fullName,
                    guestEmail: guestInfo?.email,
                    guestWhatsapp: guestInfo?.whatsapp,
                    guestAddress: deliveryAddress,
                    total: item.price,
                    subtotal: item.price,
                    status: 'PENDING',
                    currency: currency || 'IDR'
                }
            })

            // E. Store Idempotency Key
            if (idempotencyKey) {
                await tx.idempotencyKey.create({
                    data: {
                        key: idempotencyKey,
                        response: { order, invoice }
                    }
                })
            }

            return { order, invoice }
        })

        // 3. Async Background Tasks (Email) - Non-blocking
        // Ideally pushing to JobQueue, but keeping existing logic for now
        // wrapped in timeout to not block response
        setTimeout(async () => {
            try {
                const recipients: string[] = []
                const customerEmail = userId ? (await db.user.findUnique({ where: { id: userId } }))?.email : guestInfo?.email
                if (customerEmail) recipients.push(customerEmail)
                recipients.push('contact@tropictech.online')

                // Get workers
                const workers = await db.user.findMany({
                    where: { role: 'WORKER' },
                    select: { email: true }
                })
                workers.forEach(w => recipients.push(w.email))

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                await sendInvoiceEmail({
                    to: recipients,
                    invoiceNumber: result.invoice.invoiceNumber,
                    customerName: guestInfo?.fullName || 'Valued Customer',
                    amount: Number(result.invoice.total),
                    invoiceLink: `${baseUrl}/invoice/${result.invoice.id}`
                })
            } catch (emailError) {
                console.error('Failed to send automation email:', emailError)
            }
        }, 0)

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('Error creating order:', error)
        if (error.message === 'Insufficient stock') {
            return NextResponse.json({ error: 'Product is out of stock' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}
