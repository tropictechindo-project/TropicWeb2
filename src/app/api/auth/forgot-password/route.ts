import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateResetToken } from '@/lib/auth/utils'
import { sendResetPasswordEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        const user = await db.user.findUnique({
            where: { email },
        })

        // For security, don't reveal if user exists or not
        if (!user) {
            return NextResponse.json({ message: 'If an account exists with this email, a reset link has been sent.' })
        }

        const token = generateResetToken()
        const expires = new Date(Date.now() + 3600000) // 1 hour from now

        await db.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: token,
                resetPasswordExpires: expires,
            },
        })

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`

        await sendResetPasswordEmail(email, resetLink)

        return NextResponse.json({ message: 'If an account exists with this email, a reset link has been sent.' })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
