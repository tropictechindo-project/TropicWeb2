import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { generateInvoicePDF } from '@/lib/pdf/invoice'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            rentalItems: {
              include: {
                product: true,
                rentalPackage: true,
              }
            },
          },
        },
        user: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check if user owns this invoice or is admin
    if (invoice.userId !== payload.userId && payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate PDF
    const pdf = generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: (invoice.createdAt || new Date()).toLocaleDateString(),
      customerName: invoice.user?.fullName || 'Guest',
      customerEmail: invoice.user?.email || '',
      customerWhatsApp: invoice.user?.whatsapp,
      items: (invoice.order?.rentalItems || []).map((item) => {
        const name = item.product?.name || item.rentalPackage?.name || 'Item';
        const price = Number(item.product?.monthlyPrice || item.rentalPackage?.price || 0);
        const quantity = item.quantity || 0;
        return {
          name,
          quantity,
          unitPrice: price,
          totalPrice: price * quantity,
        };
      }),
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      total: Number(invoice.total),
      currency: invoice.currency || 'IDR',
      orderNumber: invoice.order?.orderNumber || '',
      startDate: (invoice.order?.startDate || new Date()).toLocaleDateString(),
      endDate: (invoice.order?.endDate || new Date()).toLocaleDateString(),
    })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Note: pdfUrl is not in schema, skipping update
    /*
    await db.invoice.update({
      where: { id: params.id },
      data: { pdfUrl: `/api/invoices/${params.id}/download` },
    })
    */

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
