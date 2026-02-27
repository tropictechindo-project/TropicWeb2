import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json()

        if (!token) {
            return NextResponse.json(
                { error: 'Verification token is required' },
                { status: 400 }
            )
        }

        const user = await db.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { gt: new Date() },
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired verification token' },
                { status: 400 }
            )
        }

        await db.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        })

        return NextResponse.json({ message: 'Email verified successfully' })
    } catch (error) {
        console.error('Email verification error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
