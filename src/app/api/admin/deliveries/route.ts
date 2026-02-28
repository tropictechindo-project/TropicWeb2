import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Get all deliveries (Delivery Queue)
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const invoiceId = searchParams.get('invoiceId')

        const where: any = {}
        if (status) where.status = status
        if (invoiceId) where.invoiceId = invoiceId

        const deliveries = await db.delivery.findMany({
            where,
            include: {
                invoice: {
                    select: {
                        invoiceNumber: true,
                        order: {
                            include: {
                                user: { select: { fullName: true, whatsapp: true } }
                            }
                        }
                    }
                },
                claimedByWorker: {
                    select: { fullName: true, whatsapp: true }
                },
                vehicle: true,
                items: {
                    include: {
                        rentalItem: {
                            include: {
                                variant: { include: { product: true } },
                                rentalPackage: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ deliveries })
    } catch (error) {
        console.error('Get deliveries error:', error)
        return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 })
    }
}

/**
 * Create a new Delivery (Admin pushing to Queue)
 */
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            invoiceId,
            deliveryMethod,
            items
        } = body

        if (!invoiceId) {
            return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 })
        }

        // Parse items (array of { rentalItemId, quantity })
        const parsedItems = items?.map((item: any) => ({
            rentalItemId: item.rentalItemId,
            quantity: item.quantity
        })) || []

        const delivery = await db.$transaction(async (tx) => {
            // Create the primary delivery record
            const newDelivery = await tx.delivery.create({
                data: {
                    invoiceId,
                    deliveryMethod: deliveryMethod || 'INTERNAL',
                    deliveryType: 'DROPOFF', // Default to dropoff if not specified
                    status: 'QUEUED', // Always starts queued
                    items: {
                        create: parsedItems
                    }
                },
                include: {
                    items: true
                }
            })

            return newDelivery
        })

        await logActivity({
            userId: 'admin', // Ideally extracted from token
            action: 'CREATE_DELIVERY',
            entity: 'DELIVERY',
            details: `Created delivery ${delivery.id} for Invoice ${invoiceId}`
        })

        return NextResponse.json({ success: true, delivery })
    } catch (error: any) {
        console.error('Create delivery error:', error)
        return NextResponse.json({ error: error.message || 'Failed to create delivery' }, { status: 500 })
    }
}
