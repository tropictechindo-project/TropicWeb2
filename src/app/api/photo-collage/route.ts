import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const images = await db.photoCollage.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
        })

        return NextResponse.json({ success: true, images })
    } catch (error) {
        console.error('Failed to get collage images', error)
        return NextResponse.json({ success: false, error: 'Failed to get images' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { images } = body

        if (!images || !Array.isArray(images)) {
            return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 })
        }

        // Get highest current display order
        const maxOrder = await db.photoCollage.findFirst({
            orderBy: { displayOrder: 'desc' }
        })

        let currentOrder = maxOrder ? maxOrder.displayOrder + 1 : 0

        // Create new entries
        const createPromises = images.map((url: string) => {
            currentOrder++
            return db.photoCollage.create({
                data: {
                    imageUrl: url,
                    displayOrder: currentOrder,
                    isActive: true
                }
            })
        })

        await Promise.all(createPromises)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to save collage images:', error)
        return NextResponse.json({ success: false, error: 'Failed to save images' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
        }

        await db.photoCollage.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete collage image:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete image' }, { status: 500 })
    }
}
