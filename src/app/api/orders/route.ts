import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { sendInvoiceEmail } from '@/lib/email'
import { calculateETA } from '@/lib/google-maps'
import { calculateInvoiceTotals } from '@/lib/invoice-utils'

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
        const { items: cartItems, currency, paymentMethod, deliveryAddress, notes, guestInfo, latitude, longitude } = body

        if (!cartItems || !paymentMethod || !deliveryAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (!userId && !guestInfo) {
            return NextResponse.json({ error: 'Guest info required' }, { status: 400 })
        }

        // 1. Calculate Distance & Delivery Fee
        let distanceKm = 0
        if (latitude && longitude) {
            const warehouse = {
                lat: Number(process.env.MAP_DEFAULT_CENTER_LAT || -8.65),
                lng: Number(process.env.MAP_DEFAULT_CENTER_LNG || 115.216)
            }
            const mapsRes = await calculateETA(warehouse, { lat: parseFloat(latitude), lng: parseFloat(longitude) })
            if ('distance_meters' in mapsRes && mapsRes.distance_meters) {
                distanceKm = mapsRes.distance_meters / 1000
            }
        }

        const subtotalValue = cartItems.reduce((acc: number, item: any) => acc + (item.price || 0), 0)
        const { tax, deliveryFee, total } = calculateInvoiceTotals(subtotalValue, distanceKm)

        const date = new Date()
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
        const startDate = new Date()
        const endDate = new Date()
        // Use duration from the first item or default to 30
        const duration = cartItems[0]?.duration || 30
        endDate.setDate(startDate.getDate() + duration)

        // 2. Atomic Transaction
        const result = await db.$transaction(async (tx) => {
            // A. Process Items (Simplifying for now, assuming 1 main product or handling multiple)
            // For now, let's just handle the first item for unit assignment as per existing logic
            // In a real scenario, we'd loop through all items
            const productItem = cartItems[0]

            const variant = await tx.productVariant.findFirst({
                where: { productId: productItem.id },
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

            // B. Create Order
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    status: 'AWAITING_PAYMENT',
                    totalAmount: total,
                    subtotal: subtotalValue,
                    tax,
                    deliveryFee,
                    paymentMethod,
                    startDate,
                    endDate,
                    duration,
                    userId: userId as string,
                },
            })

            // C. Update Unit Status
            await tx.productUnit.update({
                where: { id: unit.id },
                data: {
                    status: 'RESERVED',
                    assignedOrderId: order.id
                }
            })

            // D. Create Rental Item
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
                    total: total,
                    subtotal: subtotalValue,
                    tax,
                    taxRate: 0.02,
                    deliveryFee,
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

            // F. Create Delivery (Global Job Assignment)
            const delivery = await tx.delivery.create({
                data: {
                    invoiceId: invoice.id,
                    deliveryMethod: 'INTERNAL',
                    deliveryType: 'DROPOFF',
                    status: 'QUEUED',
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null,
                }
            })

            // G. Create Background Job for 1-hour Claim Timeout
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

            return { order, invoice, delivery }
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
