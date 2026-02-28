import { db } from "@/lib/db"
export const dynamic = 'force-dynamic'
import { DeliveriesClient } from "@/components/admin/deliveries/DeliveriesClient"

export default async function AdminDeliveriesPage() {
    const deliveries = await db.delivery.findMany({
        include: {
            invoice: {
                select: {
                    invoiceNumber: true,
                    order: {
                        include: { user: { select: { fullName: true, whatsapp: true } } }
                    }
                }
            },
            claimedByWorker: { select: { fullName: true, whatsapp: true } },
            vehicle: true,
            items: {
                include: {
                    rentalItem: {
                        include: {
                            variant: { include: { product: true } },
                            rentalPackage: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Delivery Queue</h2>
                    <p className="text-muted-foreground mt-1">Manage dispatch, track couriers, and override statuses.</p>
                </div>
            </div>
            {/* Need to pass as JSON parse to prevent date serialization errors from Server React Component to Client */}
            <DeliveriesClient initialDeliveries={JSON.parse(JSON.stringify(deliveries))} />
        </div>
    )
}
