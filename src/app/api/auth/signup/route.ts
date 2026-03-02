import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateUsername, hashPassword } from '@/lib/auth/utils'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fallback to anon if service key not set for this project

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fullName,
      email,
      whatsapp,
      password,
      baliAddress,
      mapsAddressLink,
    } = body

    if (!fullName || !email || !whatsapp || !password) {
      return NextResponse.json(
        { error: 'Full name, email, WhatsApp, and password are required' },
        { status: 400 }
      )
    }

    // 1. Check if user exists in Prisma first to prevent duplicate signups if Supabase and Prisma get out of sync
    const existingUser = await db.user.findFirst({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // 2. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${request.nextUrl.origin}/auth/login?verified=true`,
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create Supabase user' },
        { status: 500 }
      )
    }

    // 3. Create user in Prisma
    const username = generateUsername(fullName)
    const hashedPassword = await hashPassword(password) // Still hash it just in case, though Supabase handles auth now

    const user = await db.user.create({
      data: {
        id: authData.user.id, // Keep Prisma ID in sync with Supabase ID
        username,
        password: hashedPassword,
        email,
        fullName,
        whatsapp,
        baliAddress,
        mapsAddressLink,
        role: 'USER',
        isVerified: false, // They must verify via the Supabase email
      },
    })

    return NextResponse.json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
