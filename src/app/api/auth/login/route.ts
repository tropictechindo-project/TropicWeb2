import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth/utils'
import { createClient } from '@supabase/supabase-js'
import { logActivity } from '@/lib/logger'

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

          const res = NextResponse.json({
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
          res.cookies.set('token', token, { path: '/', httpOnly: false, maxAge: 60 * 60 * 24 * 7 })
          return res
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

      const newRes = NextResponse.json({
        token: await (await import('@/lib/auth/utils')).generateToken({
          userId: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role,
        }), user: newUser
      })
      const newToken = await (await import('@/lib/auth/utils')).generateToken({ userId: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role })
      newRes.cookies.set('token', newToken, { path: '/', httpOnly: false, maxAge: 60 * 60 * 24 * 7 })
      return newRes
    }

    // 3. Enforce local Prisma based email Verification
    // Since Supabase confirmation was bypassed during registration (to avoid their broken SMTP)
    // We explicitly check if the user verified the email locally.
    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Please verify your email address to log in.' },
        { status: 403 }
      )
    }

    // Generate our custom application token for session management
    const token = await generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    })

    // 4. Admin Logging & Concurrent Session Alert
    if (user.role === 'ADMIN') {
      await logActivity({
        userId: user.id,
        action: 'LOGIN',
        entity: 'ADMIN_SESSION',
        details: `Admin ${user.email} logged in at ${new Date().toISOString()}`
      })

      // Send SPI Notification to all Admins about this login
      try {
        await db.spiNotification.create({
          data: {
            role: 'ADMIN',
            type: 'SECURITY_ALERT',
            title: 'New Admin Login',
            message: `Admin ${user.email} has just logged into the system.`,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h
          }
        })
      } catch (err) {
        console.error("Failed to send concurrent login notification", err)
      }
    }

    const finalRes = NextResponse.json({ token, user })
    finalRes.cookies.set('token', token, { path: '/', httpOnly: false, maxAge: 60 * 60 * 24 * 7 })
    return finalRes
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
