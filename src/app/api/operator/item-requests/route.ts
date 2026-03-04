import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

        const requests = await db.itemRequest.findMany({
            where: {
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        whatsapp: true,
                        baliAddress: true
                    }
                },
                rentalItem: {
                    include: {
                        unit: true,
                        variant: {
                            include: {
                                product: true
                            }
                        },
                        rentalPackage: {
                            include: {
                                rentalPackageItems: {
                                    include: { product: true }
                                }
                            }
                        },
                        order: {
                            select: {
                                id: true,
                                orderNumber: true,
                                status: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        return NextResponse.json({ requests })

    } catch (error) {
        console.error('Fetch Item Requests Error:', error)
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }
}
