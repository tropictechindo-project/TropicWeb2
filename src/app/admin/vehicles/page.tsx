import { db } from "@/lib/db"
export const dynamic = 'force-dynamic'
import { VehiclesClient } from "@/components/admin/vehicles/VehiclesClient"

export default async function AdminVehiclesPage() {
    // We will query vehicles and get their active delivery details if they are in use
    const vehicles = await db.vehicle.findMany({
        include: {
            deliveries: {
                where: {
                    status: {
                        in: ['CLAIMED', 'OUT_FOR_DELIVERY', 'PAUSED', 'DELAYED']
                    }
                },
                include: {
                    claimedByWorker: true
                },
                take: 1
            }
        },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Fleet & Vehicles</h2>
                    <p className="text-muted-foreground mt-1">Manage delivery vehicles, motorcycles, and status.</p>
                </div>
            </div>
            <VehiclesClient initialVehicles={JSON.parse(JSON.stringify(vehicles))} />
        </div>
    )
}
