import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/utils'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        whatsapp: true,
        baliAddress: true,
        profileImage: true,
        identityFile: true,
        identityType: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { fullName, whatsapp, baliAddress, profileImage, identityFile, identityType } = body

    const updatedUser = await db.user.update({
      where: { id: payload.userId },
      data: {
        ...(fullName && { fullName }),
        ...(whatsapp && { whatsapp }),
        ...(baliAddress && { baliAddress }),
        ...(profileImage && { profileImage }),
        ...(identityFile && { identityFile }),
        ...(identityType && { identityType }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        whatsapp: true,
        baliAddress: true,
        profileImage: true,
        identityFile: true,
        identityType: true,
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
