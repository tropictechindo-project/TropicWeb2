import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { generateToken, generateUsername, hashPassword, generatePassword } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next')

    if (code) {
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
            // New user via Google: Auto-register to bypass confirmation loop.
            // Generate a secure random password since they login via SSO.
            const randomPassword = generatePassword(16);
            const hashedPassword = await hashPassword(randomPassword);

            // Extract Google Avatar if available
            const photoUrl = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null;

            user = await db.user.create({
                data: {
                    email: supabaseUser.email,
                    username: generateUsername(supabaseUser.email),
                    password: hashedPassword,
                    fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
                    role: 'USER',
                    isVerified: true, // Google emails are pre-verified
                    profileImage: photoUrl
                }
            });
        }
        const allowedAdminEmails = ['admin@tropictech.com', 'tropictechbali@gmail.com', 'damnbayu@gmail.com'];
        let sessionRole = user.role;

        if (sessionRole === 'ADMIN' && !allowedAdminEmails.includes(user.email)) {
            // For security, if an unauthorized email somehow got ADMIN role, 
            // we downgrade their session role to USER.
            sessionRole = 'USER';
        }

        // Existing user - generate app JWT
        const token = await generateToken({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: sessionRole, // Use the verified session role
        })

        // Set cookie or redirect with token in a safe way
        // For this app, it seems we use localStorage for tokens, so we might need a bridge page or redirect with token in hash

        const response = NextResponse.redirect(`${requestUrl.origin}/dashboard/${sessionRole === 'ADMIN' ? 'admin' : sessionRole === 'WORKER' ? 'worker' : 'user'}`)

        // We can't easily set localStorage from a redirect response
        // Using a "bridge" param to let the client know to save the token if we pass it in query (careful with security)
        // Or just redirect to a page that saves it.

        if (next) {
            return NextResponse.redirect(`${requestUrl.origin}${next}?bridge_token=${token}`)
        }

        return NextResponse.redirect(`${requestUrl.origin}/auth/login?bridge_token=${token}`)
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`)
}
