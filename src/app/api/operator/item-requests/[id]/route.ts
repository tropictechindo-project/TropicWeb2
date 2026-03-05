import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { logActivity } from '@/lib/logger'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (!payload || !['ADMIN', 'OPERATOR'].includes(payload.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { status } = await request.json()

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const itemRequest = await db.itemRequest.findUnique({
            where: { id: params.id },
            include: {
                rentalItem: {
                    include: { order: true }
                }
            }
        })

        if (!itemRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        // If APPROVED and needs action, we could automatically create a Delivery.
        // For Swap/Return, it needs a PICKUP delivery job.
        // For Extension, we could just extend the `order.endDate`.

        let newDelivery = null;

        if (status === 'APPROVED') {
            if (itemRequest.type === 'SWAP' || itemRequest.type === 'RETURN') {
                // Auto-create a PICKUP delivery for the worker queue
                newDelivery = await db.delivery.create({
                    data: {
                        invoiceId: itemRequest.rentalItem.order.invoices?.[0]?.id || null, // Best effort link if no specific invoice logic. Better to link to order if schema allows, but schema links delivery to invoice. We'll search for an invoice.
                        status: 'QUEUED',
                        type: 'PICKUP',
                        scheduledDate: new Date(),
                        address: itemRequest.rentalItem.order.deliveryAddress || 'Address not specified',
                        contactName: itemRequest.rentalItem.order.contactName || 'User',
                        contactPhone: itemRequest.rentalItem.order.contactPhone || '',
                        notes: `[SYSTEM: ${itemRequest.type} REQUEST] Reason: ${itemRequest.reason || 'None provided'} - Item ID: ${itemRequest.rentalItemId}`
                    }
                })
            } else if (itemRequest.type === 'EXTENSION') {
                // Auto-extend order by 7 days for now (simple logic)
                const newEndDate = new Date(itemRequest.rentalItem.order.endDate)
                newEndDate.setDate(newEndDate.getDate() + 7)

                await db.order.update({
                    where: { id: itemRequest.rentalItem.orderId },
                    data: { endDate: newEndDate }
                })
            }
        }

        const updatedRequest = await db.itemRequest.update({
            where: { id: params.id },
            data: { status }
        })

        // Log the action with precise timestamp (implicit in logActivity/Prisma)
        await logActivity({
            userId: payload.userId,
            action: `ITEM_REQUEST_${status}`,
            entity: 'ITEM_REQUEST',
            details: `Request ${params.id} (${itemRequest.type}) was ${status.toLowerCase()} by ${payload.role}.`
        })

        return NextResponse.json({ success: true, request: updatedRequest, newDelivery })
    } catch (error) {
        console.error('Update Item Request Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
