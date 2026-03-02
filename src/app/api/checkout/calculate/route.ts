import { NextRequest, NextResponse } from 'next/server'
import { calculateETA } from '@/lib/google-maps'
import { calculateInvoiceTotals } from '@/lib/invoice-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { subtotal, latitude, longitude } = await request.json()

        if (subtotal === undefined) {
            return NextResponse.json({ error: 'Subtotal is required' }, { status: 400 })
        }

        let distanceKm = 0
        if (latitude && longitude) {
            const warehouse = {
                lat: Number(process.env.MAP_DEFAULT_CENTER_LAT || -8.65),
                lng: Number(process.env.MAP_DEFAULT_CENTER_LNG || 115.216)
            }
            const mapsRes = await calculateETA(warehouse, { lat: parseFloat(latitude), lng: parseFloat(longitude) })
            if ('distance_meters' in mapsRes && mapsRes.distance_meters) {
                distanceKm = mapsRes.distance_meters / 1000
            }
        }

        const totals = calculateInvoiceTotals(subtotal, distanceKm)

        return NextResponse.json({
            ...totals,
            formattedSubtotal: totals.subtotal.toLocaleString('id-ID'),
            formattedTax: totals.tax.toLocaleString('id-ID'),
            formattedDeliveryFee: totals.deliveryFee.toLocaleString('id-ID'),
            formattedTotal: totals.total.toLocaleString('id-ID')
        })

    } catch (error: any) {
        console.error('Checkout calculation error:', error)
        return NextResponse.json({ error: 'Failed to calculate totals' }, { status: 500 })
    }
}
