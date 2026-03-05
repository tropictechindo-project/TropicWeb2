import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { jwtVerify } from 'jose'

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1] || request.cookies.get('token')?.value

        if (token) {
            try {
                const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-me')
                const { payload } = await jwtVerify(token, secret)

                if (payload.role === 'ADMIN') {
                    await logActivity({
                        userId: payload.userId as string,
                        action: 'LOGOUT',
                        entity: 'ADMIN_SESSION',
                        details: `Admin ${payload.email} logged out at ${new Date().toISOString()}`
                    })
                }
            } catch (e) {
                // Token might be expired or invalid, skip logging but allow logout
            }
        }

        const response = NextResponse.json({ success: true })
        response.cookies.delete('token')
        return response
    } catch (error: any) {
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
    }
}
