import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth/utils'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json()

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            )
        }

        // Initialize Supabase SSR client with cookies to properly read the session
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

        // Supabase Auth handles verifying the link token and establishing a temporary session
        // We just need to get that active user session
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user || !user.email) {
            return NextResponse.json(
                { error: 'Invalid or expired reset session. Please request a new link.' },
                { status: 401 }
            )
        }

        // Update the password in Supabase
        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
            console.error('Supabase update password error:', updateError)
            return NextResponse.json(
                { error: updateError.message || 'Failed to update password in authentication provider.' },
                { status: 500 }
            )
        }

        // Synchronize our Prisma database with the new password
        const hashedPassword = await hashPassword(password)

        await db.user.updateMany({
            where: { email: user.email }, // Update using email since Prisma ID = Supabase ID might have edge cases from old accounts
            data: {
                password: hashedPassword,
                resetPasswordToken: null, // Clear these out just in case they were left behind by old flow
                resetPasswordExpires: null,
            },
        })

        // Clear the temporary session now that password is reset
        await supabase.auth.signOut()

        return NextResponse.json({ message: 'Password has been reset successfully.' })
    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
