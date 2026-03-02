import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth/utils'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    let supabaseUser = authData.user

    if (authError || !supabaseUser) {
      // Fallback: Check Prisma for manual/admin users
      const prismaUser = await db.user.findFirst({
        where: {
          OR: [
            { email },
            { username: email },
          ],
        },
      })

      if (prismaUser && prismaUser.password) {
        const bcrypt = await import('bcryptjs')
        const isMatch = await bcrypt.compare(password, prismaUser.password)
        if (isMatch) {
          // Verify success! Generate token manually
          const token = await generateToken({
            userId: prismaUser.id,
            username: prismaUser.username,
            email: prismaUser.email,
            role: prismaUser.role,
          })

          return NextResponse.json({
            token,
            user: {
              id: prismaUser.id,
              username: prismaUser.username,
              email: prismaUser.email,
              fullName: prismaUser.fullName,
              role: prismaUser.role,
              isVerified: prismaUser.isVerified
            }
          })
        }
      }

      // If both fail:
      if (authError?.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Please verify your email address to log in.' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // 2. Get user metadata and role from our Prisma DB
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true,
      }
    })

    if (!user) {
      // 2b. Auto-sync if user exists in Supabase but not Prisma
      const username = supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || `user_${supabaseUser.id.substring(0, 5)}`
      const fullName = supabaseUser.user_metadata?.full_name || username

      const newUser = await db.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          username,
          fullName,
          whatsapp: '+628000000000', // Default
          role: 'USER',
          isVerified: true, // If they can login, they are verified
          password: await (await import('@/lib/auth/utils')).hashPassword(password) // Sync password hash
        }
      })

      return NextResponse.json({
        token: await (await import('@/lib/auth/utils')).generateToken({
          userId: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        }),
        user: newUser
      })
    }

    // 3. Optional: Sync isVerified if Supabase auth succeeded
    // Since Supabase requires email confirmation (if enabled in their dashboard),
    // a successful login means they are verified.
    if (!user.isVerified) {
      await db.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      })
      user.isVerified = true;
    }

    // Generate our custom application token for session management
    const token = await generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      token,
      user
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
