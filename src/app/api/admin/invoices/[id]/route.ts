import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { logActivity } from '@/lib/logger'
import { verifyToken } from '@/lib/auth/utils'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get('authorization')
        let adminId: string | undefined
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const payload = await verifyToken(token)
            if (payload) adminId = payload.userId
        }

        const { id } = await params
        const body = await req.json()
        const { status, total, guestName, guestEmail, guestWhatsapp, address } = body

        const invoice = await db.invoice.update({
            where: { id },
            data: {
                status,
                total: total !== undefined ? total : undefined,
                subtotal: total !== undefined ? total : undefined,
                guestName,
                guestEmail,
                guestWhatsapp,
                guestAddress: address
            }
        })

        await logActivity({
            userId: adminId,
            action: 'UPDATE_INVOICE',
            entity: 'INVOICE',
            details: `Updated invoice ${invoice.invoiceNumber}. New Status: ${status}`
        })

        return NextResponse.json(invoice)
    } catch (error) {
        console.error("[INVOICE_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get('authorization')
        let adminId: string | undefined
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const payload = await verifyToken(token)
            if (payload) adminId = payload.userId
        }

        const { id } = await params

        const invoice = await db.invoice.findUnique({
            where: { id },
            include: { order: true }
        })

        if (!invoice) return new NextResponse("Not Found", { status: 404 })

        const invoiceNumber = invoice.invoiceNumber
        await db.invoice.delete({ where: { id } })

        if (invoice.order && invoice.order.orderNumber.startsWith("MANUAL")) {
            await db.order.delete({ where: { id: invoice.orderId! } })
        }

        await logActivity({
            userId: adminId,
            action: 'DELETE_INVOICE',
            entity: 'INVOICE',
            details: `Deleted invoice ${invoiceNumber}`
        })

        return new NextResponse("Deleted", { status: 200 })
    } catch (error) {
        console.error("[INVOICE_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
