import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

interface JWTPayload {
    userId: string
    username: string
    email: string
    role: string
    isVerified: boolean
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Define Protected Paths
    const isAdminPath = pathname.startsWith('/api/admin')
    const isWorkerPath = pathname.startsWith('/api/worker')
    const isCheckoutPath = pathname === '/api/orders' && request.method === 'POST'
    const isDashboardPath = pathname.startsWith('/dashboard')

    if (!isAdminPath && !isWorkerPath && !isCheckoutPath && !isDashboardPath) {
        return NextResponse.next()
    }

    // 2. Extract Token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : request.cookies.get('token')?.value

    if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        const jwtPayload = payload as unknown as JWTPayload

        // 3. Role Validation
        if (isAdminPath && jwtPayload.role !== 'ADMIN') {
            // Allow workers to see deliveries for their operations
            const isDeliveriesApi = pathname.startsWith('/api/admin/deliveries')
            if (isDeliveriesApi && jwtPayload.role === 'WORKER') {
                return NextResponse.next()
            }
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        if (isWorkerPath && jwtPayload.role !== 'WORKER' && jwtPayload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Worker access required' }, { status: 403 })
        }

        // 4. Special Check: Checkout (Must be verified)
        if (isCheckoutPath && !jwtPayload.isVerified) {
            return NextResponse.json({
                error: 'Account verification required before checkout. Please complete your profile.'
            }, { status: 403 })
        }

        return NextResponse.next()
    } catch (error) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
}

export const config = {
    matcher: [
        '/api/admin/:path*',
        '/api/worker/:path*',
        '/api/orders',
        '/dashboard/:path*',
    ],
}
