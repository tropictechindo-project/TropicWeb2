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
            console.error('Auth Callback: Session exchange failed:', sessionError.message)
            return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_failed&details=${encodeURIComponent(sessionError.message)}`)
        }

        const { user: supabaseUser } = sessionData

        if (!supabaseUser || !supabaseUser.email) {
            console.error('Auth Callback: No user or email in session data')
            return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_email`)
        }

        console.log('Auth Callback: Processing user:', supabaseUser.email)

        // Check if user exists in Prisma
        let user = await db.user.findUnique({
            where: { email: supabaseUser.email },
        })

        if (!user) {
            console.log('Auth Callback: Creating new user in Prisma for:', supabaseUser.email)
            // New user via Google: Auto-register to bypass confirmation loop.
            const randomPassword = generatePassword();
            const hashedPassword = await hashPassword(randomPassword);

            // Extract Google Avatar if available
            const photoUrl = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null;
            const fullName = supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0];

            try {
                user = await db.user.create({
                    data: {
                        id: supabaseUser.id, // Sync with Supabase ID
                        email: supabaseUser.email,
                        username: generateUsername(fullName),
                        password: hashedPassword,
                        fullName: fullName,
                        whatsapp: '+628000000000', // Default required field
                        role: 'USER',
                        isVerified: true, // Google emails are pre-verified
                        profileImage: photoUrl
                    }
                });
                console.log('Auth Callback: New user created with ID:', user.id)
            } catch (createError: any) {
                console.error('Auth Callback: User creation failed:', createError.message)
                return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=sync_failed`)
            }
        } else {
            console.log('Auth Callback: Existing user found in Prisma:', user.email)
            // Optional: Update profile image if it changed on Google
            const photoUrl = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null;
            if (photoUrl && photoUrl !== user.profileImage) {
                await db.user.update({
                    where: { id: user.id },
                    data: { profileImage: photoUrl }
                });
            }
        }

        const allowedAdminEmails = [
            'admin@tropictech.com',
            'tropictechbali@gmail.com',
            'damnbayu@gmail.com',
            'tropictechindo@gmail.com',
            'ceo@tropictech.online'
        ];

        let sessionRole = user.role;

        if (sessionRole === 'ADMIN' && !allowedAdminEmails.includes(user.email)) {
            console.warn('Auth Callback: Non-authorized admin login attempt:', user.email)
            sessionRole = 'USER';
        }

        // Generate app JWT
        const token = await generateToken({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: sessionRole,
        })

        // Determine destination: Redirect all to landing page as requested
        let destination = '/';

        if (next) {
            destination = next;
        }

        console.log('Auth Callback: Success, redirecting to:', destination)

        // Redirect with bridge_token to allow AuthContext to capture it
        return NextResponse.redirect(`${requestUrl.origin}${destination}${destination.includes('?') ? '&' : '?'}bridge_token=${token}`)
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`)
}
