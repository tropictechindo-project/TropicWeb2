import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import TrackingClient from "./TrackingClient"

export const dynamic = 'force-dynamic'

export default async function PublicTrackingPage({
    params
}: {
    params: { code: string }
}) {
    // Next 15 awaits params
    const { code } = await params

    const delivery = await db.delivery.findUnique({
        where: { trackingCode: code },
        include: {
            vehicle: {
                select: { name: true, type: true }
            },
            claimedByWorker: {
                select: { fullName: true, whatsapp: true }
            },
            items: {
                include: {
                    rentalItem: {
                        include: {
                            variant: { include: { product: true } }
                        }
                    }
                }
            },
            logs: {
                orderBy: { createdAt: 'desc' },
                take: 10
            }
        }
    })

    if (!delivery) {
        notFound()
    }

    return <TrackingClient initialDelivery={JSON.parse(JSON.stringify(delivery))} />
}
