import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

export const dynamic = 'force-dynamic'

/**
 * Get deliveries for worker (Queued or Mobile Claimed)
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (!payload || payload.role !== 'WORKER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const workerId = payload.userId

        const { searchParams } = new URL(request.url)
        const view = searchParams.get('view') || 'my_claims' // 'pool' or 'my_claims'

        let where: any = {}

        if (view === 'pool') {
            // Unclaimed orders pending
            where = {
                status: 'QUEUED',
                deliveryMethod: 'INTERNAL',
                claimedByWorkerId: null
            }
        } else {
            // Worker's claimed orders
            where = {
                claimedByWorkerId: workerId,
                status: {
                    in: ['CLAIMED', 'OUT_FOR_DELIVERY', 'PAUSED', 'DELAYED', 'COMPLETED']
                }
            }
        }

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
            orderBy: view === 'pool' ? { createdAt: 'asc' } : { updatedAt: 'desc' }
        })

        return NextResponse.json({ deliveries })
    } catch (error) {
        console.error('Get worker deliveries error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
