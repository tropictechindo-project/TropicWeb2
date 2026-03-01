import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth/utils'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const { password, token } = await request.json()

        if (!password || !token) {
            return NextResponse.json(
                { error: 'Password and token are required' },
                { status: 400 }
            )
        }

        // 1. Find user by reset token and ensure not expired
        const user = await db.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date()
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired reset token. Please request a new link.' },
                { status: 401 }
            )
        }

        // 2. Sync with Supabase Auth (since we share credentials)
        // We use the service role key to forcefully update the user's password in Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: password }
        )

        if (updateError) {
            console.error('Supabase admin update password error:', updateError)
            // We proceed anyway to update our local DB, but log it
        }

        // 3. Update the password in our Prisma database
        const hashedPassword = await hashPassword(password)

        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
                isVerified: true // If they can reset password, they are effectively verified
            },
        })

        return NextResponse.json({ message: 'Password has been reset successfully.' })
    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
