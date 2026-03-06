import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ groupId: string }> }
) {
    try {
        const { groupId } = await props.params
        const user = await verifyAuth(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { action } = await request.json()

        if (action === 'MARK_READ') {
            await (db as any).chatGroupMember.update({
                where: {
                    groupId_userId: {
                        groupId,
                        userId: user.id
                    }
                },
                data: {
                    lastReadAt: new Date()
                }
            })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('Group patch error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
