import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

/**
 * Get current user's orders
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }
        const userId = payload.userId

        const orders = await db.order.findMany({
            where: { userId },
            include: {
                rentalItems: {
                    include: {
                        variant: { include: { product: true } },
                        rentalPackage: {
                            include: {
                                rentalPackageItems: {
                                    include: {
                                        product: true
                                    }
                                }
                            }
                        }
                    }
                },
                workerSchedules: {
                    include: {
                        worker: {
                            select: {
                                id: true,
                                fullName: true,
                                profileImage: true
                            } as any
                        }
                    }
                },
                invoices: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ orders })
    } catch (error) {
        console.error('Get user orders error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        )
    }
}
