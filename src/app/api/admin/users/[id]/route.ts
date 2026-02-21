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
        const { isActive, role } = body

        const user = await db.user.update({
            where: { id },
            data: {
                isActive: isActive !== undefined ? isActive : undefined,
                role: role !== undefined ? role : undefined
            }
        })

        await logActivity({
            userId: adminId,
            action: isActive !== undefined ? 'TOGGLE_USER_STATUS' : 'UPDATE_USER_ROLE',
            entity: 'USER',
            details: `${isActive !== undefined ? (isActive ? 'Activated' : 'Deactivated') : 'Updated role for'} user ${user.username}`
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("[USER_PATCH]", error)
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

        const user = await db.user.findUnique({
            where: { id },
            include: { orders: true }
        })

        if (!user) return new NextResponse("Not Found", { status: 404 })

        const hasActiveOrders = user.orders.some(o => o.status === 'ACTIVE')
        if (hasActiveOrders) {
            return new NextResponse("Cannot delete user with active rentals", { status: 400 })
        }

        const deletedUsername = user.username
        await db.user.delete({ where: { id } })

        await logActivity({
            userId: adminId,
            action: 'DELETE_USER',
            entity: 'USER',
            details: `Deleted user ${deletedUsername}`
        })

        return new NextResponse("Deleted", { status: 200 })
    } catch (error) {
        console.error("[USER_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
