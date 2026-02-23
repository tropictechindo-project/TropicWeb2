import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateUsername, generatePassword, generateToken } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            fullName,
            email,
            whatsapp,
            baliAddress,
            mapsAddressLink,
            provider
        } = body

        if (!fullName || !email || !whatsapp) {
            return NextResponse.json(
                { error: 'Full name, email, and WhatsApp are required' },
                { status: 400 }
            )
        }

        // Check if user already exists (it shouldn't if they were redirected here)
        const existingUser = await db.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists. Please login.' },
                { status: 400 }
            )
        }

        // Generate username and dummy password for OAuth users
        const username = generateUsername(fullName)
        const password = generatePassword() // Since they use OAuth, this password won't be used
        const hashedPassword = await hashPassword(password)

        // Create user
        const user = await db.user.create({
            data: {
                username,
                password: hashedPassword,
                email,
                fullName,
                whatsapp,
                baliAddress,
                mapsAddressLink,
                role: 'USER',
            },
        })

        // Generate token
        const token = await generateToken({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        })

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            }
        })
    } catch (error) {
        console.error('Complete profile error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
