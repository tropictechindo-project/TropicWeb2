import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        const user = await db.user.findFirst({
            where: { email },
        })

        if (!user) {
            // Return success even if bad email for security (prevents email enumeration)
            return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
        }

        const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback?next=/auth/reset-password`

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo,
        })

        if (error) {
            console.error('Supabase reset password error:', error)
            return NextResponse.json(
                { error: 'Failed to send reset instructions.' },
                { status: 500 }
            )
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
