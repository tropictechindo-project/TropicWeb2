import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { sendInvoiceEmail } from '@/lib/email'
import { calculateETA } from '@/lib/google-maps'
import { calculateInvoiceTotals } from '@/lib/invoice-utils'

export const dynamic = 'force-dynamic'

// POST /api/orders
// v1.8.0: Invoice-first flow. Creates an INVOICE (not an Order).
// The Order is only created when payment is confirmed via PATCH /api/invoices/[id]/confirm-payment.
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization')
        const idempotencyKey = request.headers.get('Idempotency-Key')
        let userId: string | undefined

        // 1. Idempotency Check
        if (idempotencyKey) {
            const existing = await db.idempotencyKey.findUnique({ where: { key: idempotencyKey } })
            if (existing && existing.response) {
                return NextResponse.json(existing.response)
            }
        }

        // 2. Identify user (optional for guests)
        if (authHeader) {
            const token = authHeader.split(' ')[1]
            const payload = await verifyToken(token)
            if (payload) userId = payload.userId
        }

        const body = await request.json()
        const {
            items: cartItems,
            currency,
            paymentMethod,
            deliveryAddress,
            notes,
            guestInfo,   // { fullName, email, whatsapp } – required if no userId
            latitude,
            longitude
        } = body

        if (!cartItems || cartItems.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
        }
        if (!paymentMethod || !deliveryAddress) {
            return NextResponse.json({ error: 'Missing required fields: paymentMethod, deliveryAddress' }, { status: 400 })
        }
        if (!userId && !guestInfo?.email) {
            return NextResponse.json({ error: 'Guest info (name, email, whatsapp) is required for guest checkout' }, { status: 400 })
        }

        // 3. Calculate Distance & Delivery Fee
        let distanceKm = 0
        if (latitude && longitude) {
            try {
                const warehouse = {
                    lat: Number(process.env.MAP_DEFAULT_CENTER_LAT || -8.65),
                    lng: Number(process.env.MAP_DEFAULT_CENTER_LNG || 115.216)
                }
                const mapsRes = await calculateETA(warehouse, { lat: parseFloat(latitude), lng: parseFloat(longitude) })
                if ('distance_meters' in mapsRes && mapsRes.distance_meters) {
                    distanceKm = mapsRes.distance_meters / 1000
                }
            } catch (e) {
                console.warn('[ORDERS] Maps API unavailable, using base delivery fee.')
            }
        }

        const subtotalValue = cartItems.reduce((acc: number, item: any) => acc + ((item.price || 0) * (item.quantity || 1)), 0)
        const { tax, deliveryFee, total } = calculateInvoiceTotals(subtotalValue, distanceKm)

        const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`

        // 4. Create Invoice (pending payment — no Order yet)
        const invoice = await db.$transaction(async (tx) => {
            const newInvoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    status: 'PENDING',
                    subtotal: subtotalValue,
                    tax,
                    deliveryFee,
                    total,
                    currency: currency || 'IDR',
                    paymentMethod: paymentMethod,
                    deliveryAddress: deliveryAddress,
                    locationLatitude: latitude ? parseFloat(latitude) : null,
                    locationLongitude: longitude ? parseFloat(longitude) : null,
                    userId: userId || null,
                    guestName: guestInfo?.fullName || null,
                    guestEmail: guestInfo?.email || null,
                    guestWhatsapp: guestInfo?.whatsapp || null,
                    guestAddress: deliveryAddress,
                    lineItems: cartItems, // Store all cart items for later stock reservation
                }
            })

            // Store idempotency key referencing the invoice
            if (idempotencyKey) {
                await tx.idempotencyKey.create({
                    data: { key: idempotencyKey, response: { invoiceId: newInvoice.id, invoiceNumber } }
                })
            }

            // Create SPI notifications for Admin & Operator
            await tx.notification.createMany({
                data: [
                    {
                        title: 'New Order Received',
                        message: `Invoice ${invoiceNumber} created. Awaiting payment of ${currency || 'IDR'} ${total}.`,
                        type: 'INFO',
                        role: 'ADMIN',
                        link: `/admin/orders`,
                    },
                    {
                        title: 'New Order Received',
                        message: `Invoice ${invoiceNumber} created. Awaiting payment of ${currency || 'IDR'} ${total}.`,
                        type: 'INFO',
                        role: 'OPERATOR',
                        link: `/admin/orders`,
                    }
                ]
            })

            return newInvoice
        })

        // 5. Send confirmation email (non-blocking)
        setTimeout(async () => {
            try {
                const recipients: string[] = []
                const customerEmail = userId
                    ? (await db.user.findUnique({ where: { id: userId } }))?.email
                    : guestInfo?.email
                if (customerEmail) recipients.push(customerEmail)
                recipients.push('contact@tropictech.online')

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                await sendInvoiceEmail({
                    to: recipients,
                    invoiceNumber: invoice.invoiceNumber,
                    customerName: guestInfo?.fullName || 'Valued Customer',
                    amount: Number(invoice.total),
                    invoiceLink: `${baseUrl}/invoice/${invoice.id}`
                })
            } catch (emailError) {
                console.error('[ORDERS] Failed to send invoice email:', emailError)
            }
        }, 0)

        return NextResponse.json({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: 'PENDING',
            total: Number(invoice.total),
            message: 'Invoice created. Please complete payment to confirm your order.'
        })

    } catch (error: any) {
        console.error('[ORDERS_POST] Error:', error)
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }
}
