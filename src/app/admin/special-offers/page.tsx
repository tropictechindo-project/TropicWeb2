import { Metadata } from "next"
import { SpecialOffersClient } from "@/components/admin/special-offers/SpecialOffersClient"
import { db } from "@/lib/db"

export const metadata: Metadata = {
    title: "Special Offers Management | Tropic Tech Admin",
    description: "Manage flash sales and promotional packages",
}

export const dynamic = 'force-dynamic'

export default async function AdminSpecialOffersPage() {
    // Fetch all offers, including inactive
    const offers = await db.specialOffer.findMany({
        orderBy: { createdAt: 'desc' }
    })

    const formattedOffers = offers.map(o => ({
        ...o,
        originalPrice: Number(o.originalPrice),
        finalPrice: Number(o.finalPrice),
        createdAt: o.createdAt.toISOString()
    }))

    const settingsRaw = await db.siteSetting.findMany({
        where: {
            key: { in: ['special_offers_title', 'special_offers_description'] }
        }
    })
    const settings = settingsRaw.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc
    }, {} as any)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Special Offers</h1>
                <p className="text-muted-foreground">
                    Configure flash sales, discount packages, and homepage promotions. Highly visible elements are restricted to 3 active slots.
                </p>
            </div>

            <SpecialOffersClient initialOffers={formattedOffers} initialSettings={settings} />
        </div>
    )
}
