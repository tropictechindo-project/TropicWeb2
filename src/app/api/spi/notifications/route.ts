import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/utils'
import { db } from '@/lib/db'

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization')
        let user: { id: string, role: string, name?: string } | null = null

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const payload = await verifyToken(token)
            if (payload) {
                user = {
                    id: payload.userId,
                    role: payload.role,
                    name: payload.email
                }
            }
        }

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Clean up expired notifications first 
        await db.spiNotification.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        })

        // Fetch up to 3 unread notifications for this user or their role
        const notifications = await db.spiNotification.findMany({
            where: {
                isRead: false,
                OR: [
                    { userId: user.id },
                    { role: user.role },
                    { role: 'ALL' }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 3
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error('Error fetching SPI notifications:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
