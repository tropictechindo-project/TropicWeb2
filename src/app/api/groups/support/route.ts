import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

export async function POST(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Check if support group already exists for this user
        const existingGroup = await (db as any).chatGroup.findFirst({
            where: {
                type: 'USER_SUPPORT',
                members: {
                    some: {
                        userId: user.id
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                role: true
                            }
                        }
                    }
                }
            }
        })

        // 2. Find ALL Workers explicitly for both existing and new groups
        const workers = await (db as any).user.findMany({
            where: { role: 'WORKER' }
        })

        if (existingGroup) {
            // Check if workers are missing from this group
            const existingMemberIds = existingGroup.members.map((m: any) => m.userId)
            const missingWorkers = workers.filter((w: any) => !existingMemberIds.includes(w.id))

            if (missingWorkers.length > 0) {
                // Add missing workers
                await (db as any).chatGroupMember.createMany({
                    data: missingWorkers.map((w: any) => ({
                        groupId: existingGroup.id,
                        userId: w.id,
                        role: 'MEMBER'
                    })),
                    skipDuplicates: true
                })
            }

            // Refetch the group to get the updated members list
            const updatedGroup = await (db as any).chatGroup.findUnique({
                where: { id: existingGroup.id },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    profileImage: true,
                                    role: true
                                }
                            }
                        }
                    }
                }
            })

            return NextResponse.json({ success: true, group: updatedGroup })
        }

        // 3. Find ALL staff members (Admin & Operator) to assign
        const staff = await (db as any).user.findMany({
            where: {
                role: { in: ['ADMIN', 'OPERATOR'] },
                isActive: true
            }
        })

        const [fullUser] = await Promise.all([
            (db as any).user.findUnique({
                where: { id: user.id }
            })
        ])

        if (staff.length === 0) {
            return NextResponse.json({ error: 'No support agents available' }, { status: 404 })
        }

        // Prepare member data: User + All Staff + All Workers
        // Deduplicate members to prevent unique constraint violations
        const uniqueMemberIds = new Set<string>()
        const distinctMembersToCreate: { userId: string, role: string }[] = []

        // Helper to add member if not exists
        const addMember = (id: string, role: string) => {
            if (!uniqueMemberIds.has(id)) {
                uniqueMemberIds.add(id)
                distinctMembersToCreate.push({ userId: id, role })
            }
        }

        // Add User (Member)
        addMember(user.id, 'MEMBER')

        // Add Staff (ADMIN role for staff in group)
        staff.forEach((s: any) => {
            if (s.id === user.id) {
                const index = distinctMembersToCreate.findIndex(m => m.userId === user.id)
                if (index !== -1) distinctMembersToCreate[index].role = 'ADMIN'
            } else {
                addMember(s.id, 'ADMIN')
            }
        })

        // Add Workers
        if (workers && workers.length > 0) {
            workers.forEach((worker: any) => {
                if (!uniqueMemberIds.has(worker.id)) {
                    addMember(worker.id, 'MEMBER')
                }
            })
        }

        const group = await (db as any).chatGroup.create({
            data: {
                name: `Support - ${fullUser?.fullName || 'User'}`,
                type: 'USER_SUPPORT',
                members: {
                    create: distinctMembersToCreate
                },
                messages: {
                    create: {
                        senderId: staff[0].id, // Default to first staff member for welcome message
                        content: `Hello ${fullUser?.fullName || 'there'}, welcome to Tropic Tech support! Our team of experts (Admin, Operators & Workers) is here to help.`
                    }
                }
            }
        })

        return NextResponse.json({ success: true, group })

    } catch (error) {
        console.error('Support group init error DETAIL:', error)
        if (error instanceof Error) {
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
        }
        return NextResponse.json({ error: 'Failed to initialize support chat', details: String(error) }, { status: 500 })
    }
}
