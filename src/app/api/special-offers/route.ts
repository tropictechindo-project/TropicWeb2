import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET all active special offers
export async function GET() {
    try {
        const offers = await db.specialOffer.findMany({
            orderBy: { createdAt: 'desc' },
            where: {
                isActive: true
            }
        })

        const formatted = offers.map(o => ({
            ...o,
            originalPrice: Number(o.originalPrice),
            finalPrice: Number(o.finalPrice)
        }))

        return NextResponse.json({ success: true, offers: formatted })
    } catch (error) {
        console.error('Error fetching special offers:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 })
    }
}

// POST create a new special offer
export async function POST(req: NextRequest) {
    try {
        const data = await req.json()
        const { title, description, badgeText, discountPercentage, originalPrice, finalPrice, images, isActive } = data

        const offer = await db.specialOffer.create({
            data: {
                title,
                description,
                badgeText,
                discountPercentage: parseInt(discountPercentage) || 0,
                originalPrice: parseFloat(originalPrice),
                finalPrice: parseFloat(finalPrice),
                images: images || [],
                isActive: isActive !== undefined ? isActive : true
            }
        })

        return NextResponse.json({
            success: true, offer: {
                ...offer,
                originalPrice: Number(offer.originalPrice),
                finalPrice: Number(offer.finalPrice)
            }
        })
    } catch (error) {
        console.error('Error creating special offer:', error)
        return NextResponse.json({ success: false, error: 'Failed to create' }, { status: 500 })
    }
}
