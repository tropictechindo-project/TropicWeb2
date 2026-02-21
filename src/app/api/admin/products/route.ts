import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, description, category, monthlyPrice, stock, imageUrl } = body

        const product = await db.product.create({
            data: {
                name,
                description,
                category,
                monthlyPrice,
                stock,
                imageUrl,
            },
        })

        return NextResponse.json({ product })
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        )
    }
}
