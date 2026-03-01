import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const offer = await db.specialOffer.findUnique({
            where: { id },
        })

        if (!offer) {
            return NextResponse.json({ error: 'Special offer not found' }, { status: 404 })
        }

        return NextResponse.json({
            offer: {
                ...offer,
                originalPrice: Number(offer.originalPrice),
                finalPrice: Number(offer.finalPrice)
            }
        })
    } catch (error) {
        console.error('Error fetching special offer:', error)
        return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const data = await request.json()
        const { title, description, badgeText, discountPercentage, originalPrice, finalPrice, images, isActive } = data

        const offer = await db.specialOffer.update({
            where: { id },
            data: {
                title,
                description,
                badgeText,
                discountPercentage: parseInt(discountPercentage) || 0,
                originalPrice: parseFloat(originalPrice),
                finalPrice: parseFloat(finalPrice),
                images: images || [],
                isActive: isActive !== undefined ? isActive : true
            },
        })

        return NextResponse.json({
            success: true, offer: {
                ...offer,
                originalPrice: Number(offer.originalPrice),
                finalPrice: Number(offer.finalPrice)
            }
        })
    } catch (error) {
        console.error('Error updating special offer:', error)
        return NextResponse.json({ success: false, error: 'Failed to update offer' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await db.specialOffer.delete({
            where: { id },
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting special offer:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete offer' }, { status: 500 })
    }
}
