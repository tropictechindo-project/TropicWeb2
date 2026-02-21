import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Public invoice view by shareable token
 * Accessible without authentication
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const invoice = await db.invoice.findUnique({
            where: { shareableToken: params.token },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                        whatsapp: true,
                        baliAddress: true
                    }
                },
                order: {
                    include: {
                        rentalItems: {
                            include: {
                                product: true,
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
                        }
                    }
                }
            }
        })

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        return NextResponse.json(invoice)
    } catch (error) {
        console.error('Get public invoice error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch invoice' },
            { status: 500 }
        )
    }
}
