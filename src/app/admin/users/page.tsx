import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

import { UsersClient } from "@/components/admin/users/UsersClient"

export default async function AdminUsersPage() {
    const users = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            orders: {
                include: {
                    rentalItems: {
                        include: {
                            variant: { include: { product: true } },
                            rentalPackage: true
                        }
                    }
                }
            }
        }
    })

    return (
        <div className="space-y-8 p-1">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tight uppercase">User Management</h1>
                <p className="text-muted-foreground">Registered user database and rental monitoring</p>
            </div>

            <UsersClient users={users} />
        </div>
    )
}
