import { NextRequest } from 'next/server'
import { verifyToken } from './utils'

/**
 * Verify authentication from request — checks Authorization header first, then cookie.
 */
export async function verifyAuth(request: NextRequest) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')

    let token: string | undefined

    // 1. Try Authorization: Bearer header
    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
    }

    // 2. Fallback: try token cookie (for server-side rendered pages and cookie-based sessions)
    if (!token) {
        token = request.cookies.get('token')?.value
    }

    if (!token) return null

    const payload = await verifyToken(token)
    if (!payload) return null

    return {
        userId: payload.userId,
        id: payload.userId, // alias for compatibility
        username: payload.username,
        email: payload.email,
        role: payload.role,
    }
}
