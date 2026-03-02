import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'

/**
 * Get individual worker details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const worker = await db.user.findUnique({
            where: { id, role: 'WORKER' },
            include: {
                claimedDeliveries: {
                    include: {
                        invoice: {
                            select: {
                                invoiceNumber: true,
                                total: true,
                                createdAt: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                workerAttendance: {
                    orderBy: {
                        date: 'desc'
                    },
                    take: 90 // Last 3 months
                },
                activityLogs: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 50
                }
            }
        })

        if (!worker) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
        }

        return NextResponse.json({ worker })
    } catch (error) {
        console.error('Get worker details error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch worker details' },
            { status: 500 }
        )
    }
}

/**
 * Update worker details (admin only)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const data = await request.json()
        const { fullName, email, whatsapp, isActive, password } = data

        // Update Prisma
        const worker = await db.user.update({
            where: { id, role: 'WORKER' },
            data: {
                fullName,
                email,
                whatsapp,
                isActive
            }
        })

        // 1. Sync to Supabase Auth
        const { supabaseAdmin } = await import('@/lib/auth/supabase-admin')

        const updateData: any = {
            email: email,
            user_metadata: {
                full_name: fullName,
                role: 'WORKER'
            }
        }

        if (password) {
            updateData.password = password
        }

        const { error: syncError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData)

        if (syncError) {
            console.error('Supabase Auth sync error:', syncError)
            // We don't fail the whole request if sync fails, but we should log it
        }

        await logActivity({
            userId: 'admin-id', // Replace with actual admin ID
            action: 'UPDATE_WORKER',
            entity: 'USER',
            details: `Updated worker ${worker.fullName}`
        })

        return NextResponse.json({ success: true, worker })
    } catch (error) {
        console.error('Update worker error:', error)
        return NextResponse.json(
            { error: 'Failed to update worker' },
            { status: 500 }
        )
    }
}

/**
 * Delete worker account
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // 1. Find user to get details before deletion
        const worker = await db.user.findUnique({
            where: { id, role: 'WORKER' }
        })

        if (!worker) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
        }

        // 2. Delete from Supabase Auth
        const { supabaseAdmin } = await import('@/lib/auth/supabase-admin')
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

        if (authError) {
            console.error('Failed to delete from Supabase Auth:', authError)
            // If user doesn't exist in Supabase, we might still want to delete from Prisma
        }

        // 3. Delete from Prisma (Cascade handles related records)
        await db.user.delete({
            where: { id }
        })

        await logActivity({
            userId: 'admin-id',
            action: 'DELETE_WORKER',
            entity: 'USER',
            details: `Deleted worker ${worker.fullName} (${worker.email})`
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete worker error:', error)
        return NextResponse.json(
            { error: 'Failed to delete worker' },
            { status: 500 }
        )
    }
}
