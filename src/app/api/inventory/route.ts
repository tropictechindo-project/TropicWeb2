
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { productId, quantity, purchaseDate } = body
        const count = parseInt(quantity)

        if (!productId || count < 1) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const product = await db.product.findUnique({ where: { id: productId } })
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

        // Generate Units
        const prefix = product.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ITM')
        const timestamp = Date.now().toString().substring(8) // last 5 digits

        // Use a transaction to create units and update stock cache
        await db.$transaction(async (tx) => {
            for (let i = 0; i < count; i++) {
                const code = `${prefix}-${timestamp}-${Math.floor(Math.random() * 10000)}`
                await tx.productUnit.create({
                    data: {
                        productId,
                        unitCode: code,
                        status: 'AVAILABLE',
                        purchaseDate: new Date(purchaseDate || new Date())
                    }
                })
            }

            // Sync Cache
            const availableCount = await tx.productUnit.count({
                where: { productId, status: 'AVAILABLE' }
            })

            await tx.product.update({
                where: { id: productId },
                data: { stock: availableCount }
            })
        })

        return NextResponse.json({ success: true, count })
    } catch (error) {
        console.error('Inventory Generate Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
