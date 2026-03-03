import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateUsername, hashPassword, generateResetToken } from '@/lib/auth/utils'
import { createClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from '@/lib/email'

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
    const hashedPassword = await hashPassword(password)
    const verificationToken = generateResetToken()
    const verificationExpires = new Date(Date.now() + 3600000) // 1 hour

    const user = await db.user.create({
      data: {
        id: authData.user.id,
        username,
        password: hashedPassword,
        email,
        fullName,
        whatsapp,
        baliAddress,
        mapsAddressLink,
        role: 'USER',
        isVerified: !!mapsAddressLink,
        resetPasswordToken: verificationToken,
        resetPasswordExpires: verificationExpires,
      },
    })

    // 4. Send local verification email as fallback/primary
    const verificationLink = `${request.nextUrl.origin}/auth/verify-email?token=${verificationToken}`
    await sendVerificationEmail(email, verificationLink)

    // 5. Claim any guest invoices/orders created with this email before signup (v1.8.0)
    try {
      await db.invoice.updateMany({
        where: { guestEmail: email, userId: null },
        data: { userId: user.id }
      })
      // Also backfill orders linked to those invoices
      const claimedInvoices = await db.invoice.findMany({
        where: { userId: user.id, guestEmail: email },
        select: { orderId: true }
      })
      const orderIds = claimedInvoices.map(i => i.orderId).filter(Boolean) as string[]
      if (orderIds.length > 0) {
        await db.order.updateMany({
          where: { id: { in: orderIds }, userId: null },
          data: { userId: user.id }
        })
      }
    } catch (claimError) {
      console.warn('[SIGNUP] Failed to claim guest orders — non-critical:', claimError)
    }

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

