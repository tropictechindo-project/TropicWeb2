import { NextRequest } from 'next/server'
import { verifyToken } from './utils'

/**
 * Verify authentication from request headers
 */
export async function verifyAuth(request: NextRequest) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('verifyAuth: No or invalid Authorization header:', authHeader)
        return null
    }

    const token = authHeader.substring(7)
    console.log('auth-helper: Received token:', token.substring(0, 10) + '...')
    const payload = await verifyToken(token)

    if (!payload) {
        console.log('verifyAuth: Token verification failed')
        return null
    }

    return {
        id: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role
    }
}
