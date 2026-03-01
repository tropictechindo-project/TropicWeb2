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
        const { isActive, role, fullName, email, whatsapp, username, password } = body

        const updateData: any = {}
        if (isActive !== undefined) updateData.isActive = isActive
        if (role !== undefined) updateData.role = role
        if (fullName !== undefined) updateData.fullName = fullName
        if (email !== undefined) updateData.email = email
        if (whatsapp !== undefined) updateData.whatsapp = whatsapp
        if (username !== undefined) updateData.username = username

        if (password) {
            const bcrypt = await import('bcryptjs')
            updateData.password = await bcrypt.hash(password, 10)
            updateData.plainPassword = password // Store plaintext for admin visibility
        }

        const user = await db.user.update({
            where: { id },
            data: updateData
        })

        await logActivity({
            userId: adminId,
            action: 'UPDATE_USER',
            entity: 'USER',
            details: `Updated user profile for ${user.username}`
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
