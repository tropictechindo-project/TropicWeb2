import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { TrackingClient } from "./TrackingClient"

export const metadata = {
    title: 'Track Your Delivery | TropicTech',
    description: 'Track the real-time status of your TropicTech rental delivery or pickup.',
}

export default async function TrackingPage({ params }: { params: Promise<{ trackingCode: string }> }) {
    const { trackingCode } = await params

    if (!trackingCode) {
        notFound()
    }

    // Attempt to locate the delivery by the public tracking code
    const delivery = await db.delivery.findUnique({
        where: { trackingCode },
        include: {
            invoice: true,
            claimedByWorker: {
                select: { fullName: true, phoneNumber: true }
            },
            vehicle: true,
            items: {
                include: {
                    rentalItem: {
                        include: {
                            variant: {
                                include: { product: true }
                            }
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

    return (
        <div className="min-h-screen bg-muted/20 py-12 px-4 md:px-8">
            <TrackingClient delivery={delivery} />
        </div>
    )
}
