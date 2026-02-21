import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

/**
 * POST: Initialize default groups (run once or on-demand)
 * Creates "Tropic Tech Daily" worker group and user support groups
 */
export async function POST(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        // Check if Tropic Tech Daily already exists
        const existingWorkerGroup = await (db as any).chatGroup.findFirst({
            where: {
                type: 'WORKER_GROUP',
                name: 'Tropic Tech Daily'
            }
        })

        let workerGroup
        if (!existingWorkerGroup) {
            // Get all admins and workers
            const workersAndAdmins = await (db as any).user.findMany({
                where: {
                    OR: [
                        { role: 'WORKER' },
                        { role: 'ADMIN' }
                    ]
                },
                select: {
                    id: true
                }
            })

            // Create Tropic Tech Daily group
            workerGroup = await (db as any).chatGroup.create({
                data: {
                    name: 'Tropic Tech Daily',
                    type: 'WORKER_GROUP',
                    members: {
                        create: workersAndAdmins.map((u: any) => ({
                            userId: u.id,
                            role: 'MEMBER'
                        }))
                    }
                }
            })
        }

        // Get all users without a support group
        const regularUsers = await (db as any).user.findMany({
            where: {
                role: 'USER'
            },
            select: {
                id: true,
                fullName: true
            }
        })

        // Get all workers and admins for support groups
        const supportStaff = await (db as any).user.findMany({
            where: {
                OR: [
                    { role: 'WORKER' },
                    { role: 'ADMIN' }
                ]
            },
            select: {
                id: true
            }
        })

        const createdSupportGroups = []
        for (const regularUser of regularUsers) {
            // Check if user already has a support group
            const existingGroup = await (db as any).chatGroup.findFirst({
                where: {
                    type: 'USER_SUPPORT',
                    members: {
                        some: {
                            userId: regularUser.id
                        }
                    }
                }
            })

            if (!existingGroup) {
                const supportGroup = await (db as any).chatGroup.create({
                    data: {
                        name: `${regularUser.fullName} - Support`,
                        type: 'USER_SUPPORT',
                        members: {
                            create: [
                                { userId: regularUser.id, role: 'MEMBER' },
                                ...supportStaff.map((staff: any) => ({
                                    userId: staff.id,
                                    role: 'MEMBER'
                                }))
                            ]
                        }
                    }
                })
                createdSupportGroups.push(supportGroup)
            }
        }

        return NextResponse.json({
            success: true,
            workerGroup: existingWorkerGroup || workerGroup,
            supportGroupsCreated: createdSupportGroups.length
        })
    } catch (error) {
        console.error('Initialize groups error:', error)
        return NextResponse.json({ error: 'Failed to initialize groups' }, { status: 500 })
    }
}
