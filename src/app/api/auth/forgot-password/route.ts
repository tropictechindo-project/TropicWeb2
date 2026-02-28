import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )

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
