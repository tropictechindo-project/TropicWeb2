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
    const { code: rawCode } = await params

    // Sanitize the code: Remove prefixes like "INV:", "REF:", and clean whitespace
    const code = rawCode.replace(/^(INV:|REF:|ORDER:)\s*/i, '').trim()

    let delivery = await db.delivery.findUnique({
        where: { trackingCode: code },
        include: {
            vehicle: { select: { name: true, type: true } },
            claimedByWorker: { select: { fullName: true, whatsapp: true } },
            items: {
                include: {
                    rentalItem: {
                        include: {
                            variant: { include: { product: true } }
                        }
                    }
                }
            },
            logs: { orderBy: { createdAt: 'desc' }, take: 10 }
        }
    })

    // Fallback: If not found by tracking code, try searching by invoice number or order number
    if (!delivery) {
        delivery = await db.delivery.findFirst({
            where: {
                OR: [
                    { invoice: { invoiceNumber: code } },
                    { invoice: { order: { orderNumber: code } } }
                ]
            },
            include: {
                vehicle: { select: { name: true, type: true } },
                claimedByWorker: { select: { fullName: true, whatsapp: true } },
                items: {
                    include: {
                        rentalItem: {
                            include: {
                                variant: { include: { product: true } }
                            }
                        }
                    }
                },
                logs: { orderBy: { createdAt: 'desc' }, take: 10 }
            },
            orderBy: { createdAt: 'desc' } // Get the most recent one (usually the active delivery)
        })
    }

    if (!delivery) {
        notFound()
    }

    return <TrackingClient initialDelivery={JSON.parse(JSON.stringify(delivery))} />
}
