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

// Routes OPERATOR cannot access (secret/main admin settings)
const OPERATOR_BLOCKED_PATHS = [
    '/api/admin/users',
    '/api/admin/site-settings',
]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    const isAdminPath = pathname.startsWith('/api/admin')
    const isWorkerPath = pathname.startsWith('/api/worker')
    const isCheckoutPath = pathname === '/api/orders' && request.method === 'POST'
    const isDashboardPath = pathname.startsWith('/dashboard')

    if (!isAdminPath && !isWorkerPath && !isCheckoutPath && !isDashboardPath) {
        return NextResponse.next()
    }

    // Guest checkout — no token required
    if (isCheckoutPath) {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
        if (!token) return NextResponse.next() // Allow guests through
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : request.cookies.get('token')?.value

    if (!token) {
        if (isDashboardPath) return NextResponse.redirect(new URL('/', request.url))
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        const jwtPayload = payload as unknown as JWTPayload

        const { role } = jwtPayload
        const isAdmin = role === 'ADMIN'
        const isOperator = role === 'OPERATOR'
        const isWorker = role === 'WORKER'

        // Admin API routes — allow ADMIN and OPERATOR (with restrictions)
        if (isAdminPath) {
            if (!isAdmin && !isOperator) {
                if (pathname.startsWith('/api/admin/deliveries') && isWorker) return NextResponse.next()
                return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
            }
            if (isOperator) {
                const blocked = OPERATOR_BLOCKED_PATHS.some(p => pathname.startsWith(p))
                if (blocked) return NextResponse.json({ error: 'Operators cannot access this resource' }, { status: 403 })
            }
        }

        // Worker API routes
        if (isWorkerPath && !isWorker && !isAdmin && !isOperator) {
            return NextResponse.json({ error: 'Worker access required' }, { status: 403 })
        }

        return NextResponse.next()
    } catch (error) {
        if (isCheckoutPath) return NextResponse.next() // Allow guests with expired/no token
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
