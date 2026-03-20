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

    // Fallback 2: If no delivery at all, check if invoice exists to show Pre-Dispatch mockup
    if (!delivery) {
        const invoice = await db.invoice.findUnique({
            where: { invoiceNumber: code },
            include: {
                order: {
                    include: {
                        rentalItems: {
                            include: {
                                variant: { include: { product: true } }
                            }
                        }
                    }
                }
            }
        })

        if (invoice) {
            const mockDelivery = {
                id: `mock-${invoice.id}`,
                trackingCode: invoice.invoiceNumber,
                status: 'QUEUED', // Status text: "Preparing for Dispatch"
                latitude: -8.65,
                longitude: 115.216,
                lastLocationUpdate: invoice.createdAt || new Date(),
                updatedAt: invoice.createdAt || new Date(),
                items: invoice.order?.rentalItems.map(item => ({
                    productName: item.variant?.product?.name || "Equipment Rental",
                    quantity: item.quantity
                })) || [],
                logs: [{ eventType: 'ORDER_CONFIRMED', newValue: { notes: 'Order placed, awaiting dispatch.' }, createdAt: invoice.createdAt }],
                vehicle: null,
                claimedByWorker: null
            }
            return <TrackingClient initialDelivery={JSON.parse(JSON.stringify(mockDelivery))} />
        }
    }

    if (!delivery) {
        notFound()
    }

    return <TrackingClient initialDelivery={JSON.parse(JSON.stringify(delivery))} />
}
