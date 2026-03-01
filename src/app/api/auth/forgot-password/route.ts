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

        if (!user) {
            // Return success even if bad email for security (prevents email enumeration)
            return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
        }

        // 1. Generate local reset token
        const resetToken = generateResetToken()
        const tokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

        // 2. Save token to Database
        await db.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: tokenExpiry
            }
        })

        // 3. Send professional email via lib/email.ts (Resend/SMTP)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`

        const emailSuccess = await sendResetPasswordEmail(user.email, resetLink)

        if (!emailSuccess) {
            console.error('Failed to send reset email via local transport')
            // Don't stop here, we still return the standard message to user
        }

        return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
