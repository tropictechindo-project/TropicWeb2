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
            amount, items, status,
            sendToCustomer, sendToWorkers, sendToCompany
        } = body

        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        const invoice = await db.invoice.create({
            // @ts-ignore - Workaround for potential IDE caching of Prisma types
            data: {
                invoiceNumber,
                userId: type === 'registered' ? userId : null,
                guestName: type === 'guest' ? guestName : null,
                guestEmail: type === 'guest' ? guestEmail : null,
                guestWhatsapp: type === 'guest' ? guestWhatsapp : null,
                guestAddress: guestAddress,
                total: amount,
                subtotal: amount,
                status: status || 'PAID',
                currency: 'IDR',
            } as any
        })

        // Handle Email Forwarding
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

        if (sendToCompany) {
            recipients.push('tropictechindo@gmail.com')
        }

        if (recipients.length > 0) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            await sendInvoiceEmail({
                to: recipients,
                invoiceNumber: invoice.invoiceNumber,
                customerName: type === 'registered' ? (await db.user.findUnique({ where: { id: userId } }))?.fullName || 'Customer' : guestName,
                amount: Number(invoice.total),
                invoiceLink: `${baseUrl}/invoice/${invoice.id}`
            })
        }

        await logActivity({
            userId: adminId,
            action: 'CREATE_INVOICE',
            entity: 'INVOICE',
            details: `Created invoice ${invoice.invoiceNumber} for ${type === 'registered' ? 'Registered User' : guestName} - Amount: ${amount}`
        })

        return NextResponse.json(invoice)
    } catch (error) {
        console.error("[INVOICE_CREATE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
