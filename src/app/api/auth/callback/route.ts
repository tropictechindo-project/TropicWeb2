import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken, generateUsername, hashPassword, generatePassword } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

        if (sessionError) {
            console.error('Session error:', sessionError.message)
            return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_failed`)
        }

        const { user: supabaseUser } = sessionData

        if (!supabaseUser || !supabaseUser.email) {
            return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_email`)
        }

        // Check if user exists in Prisma
        let user = await db.user.findUnique({
            where: { email: supabaseUser.email },
        })

        if (!user) {
            // New user via Google
            // We still need WhatsApp and Bali Address which are mandatory for business logic
            // Redirect to complete-profile page with some state
            // We can use a temporary cookie or pass email in query param (less secure but easier for this implementation)

            const email = encodeURIComponent(supabaseUser.email)
            const fullName = encodeURIComponent(supabaseUser.user_metadata?.full_name || '')

            return NextResponse.redirect(`${requestUrl.origin}/auth/complete-profile?email=${email}&name=${fullName}&provider=google`)
        }

        // Existing user - generate app JWT
        const token = await generateToken({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        })

        // Set cookie or redirect with token in a safe way
        // For this app, it seems we use localStorage for tokens, so we might need a bridge page or redirect with token in hash

        const response = NextResponse.redirect(`${requestUrl.origin}/dashboard/${user.role === 'ADMIN' ? 'admin' : user.role === 'WORKER' ? 'worker' : 'user'}`)

        // We can't easily set localStorage from a redirect response
        // Using a "bridge" param to let the client know to save the token if we pass it in query (careful with security)
        // Or just redirect to a page that saves it.

        return NextResponse.redirect(`${requestUrl.origin}/auth/login?bridge_token=${token}`)
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`)
}
