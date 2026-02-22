import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, description, category, monthlyPrice, stock, imageUrl } = body

        const product = await db.$transaction(async (tx) => {
            const newProduct = await tx.product.create({
                data: {
                    name,
                    description,
                    category,
                    monthlyPrice,
                    imageUrl,
                },
            })

            const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ITM')
            const timestamp = Date.now().toString().substring(8)
            const random = Math.floor(Math.random() * 1000)
            const sku = `${prefix}-${timestamp}-${random}-STD`

            await tx.productVariant.create({
                data: {
                    productId: newProduct.id,
                    color: 'STANDARD',
                    sku,
                    stockQuantity: stock || 0,
                    reservedQuantity: 0
                }
            })

            return newProduct
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
