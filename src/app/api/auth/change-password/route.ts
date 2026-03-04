import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const { currentPassword, newPassword } = await req.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 })
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 })
        }

        const user = await db.user.findUnique({
            where: { id: payload.userId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password)

        if (!isMatch) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await db.user.update({
            where: { id: payload.userId },
            data: {
                password: hashedPassword,
                plainPassword: newPassword // Assuming we want to keep plain_password updated like the rest of the app does
            }
        })

        return NextResponse.json({ success: true, message: 'Password changed successfully' })

    } catch (error) {
        console.error('Password change error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
