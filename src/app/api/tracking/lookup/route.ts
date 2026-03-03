import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/tracking/lookup?invoiceNumber=INV-XXXXXX&email=guest@email.com
// Public endpoint — no auth required. Returns tracking code for a delivery.
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const invoiceNumber = searchParams.get('invoiceNumber')
    const email = searchParams.get('email') || ''

    if (!invoiceNumber) {
        return NextResponse.json({ error: 'Invoice number is required' }, { status: 400 })
    }

    const invoice = await db.invoice.findUnique({
        where: { invoiceNumber },
        include: {
            deliveries: { orderBy: { createdAt: 'desc' }, take: 1 },
            user: { select: { email: true } }
        }
    })

    if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found. Please check the invoice number.' }, { status: 404 })
    }

    // Verify the requester matches the invoice (loose check — email OR no email provided)
    const customerEmail = invoice.user?.email || invoice.guestEmail || ''
    if (email && customerEmail && email.toLowerCase() !== customerEmail.toLowerCase()) {
        return NextResponse.json({ error: 'Email does not match our records for this invoice.' }, { status: 403 })
    }

    const delivery = invoice.deliveries[0]

    return NextResponse.json({
        invoiceNumber: invoice.invoiceNumber,
        invoiceStatus: invoice.status,
        trackingCode: delivery?.trackingCode || null,
        deliveryStatus: delivery?.status || 'NOT_DISPATCHED',
        hasDelivery: !!delivery,
    })
}
