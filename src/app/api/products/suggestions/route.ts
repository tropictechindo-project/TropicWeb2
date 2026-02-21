import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products/suggestions?productIds=UUID1,UUID2
 * Returns unique related products based on the productIds provided in the cart.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productIdsStr = searchParams.get('productIds')

        if (!productIdsStr) {
            return NextResponse.json({ suggestions: [] })
        }

        const productIds = productIdsStr.split(',').filter(id => id.length > 0)

        // Query product_relations for the given productIds
        const relations = await (db as any).productRelation.findMany({
            where: {
                productId: { in: productIds }
            },
            include: {
                relatedProduct: true
            },
            orderBy: [
                { relationType: 'asc' }, // CROSS_SELL < UPSELL < ACCESSORY if mapped carefully
                { priority: 'desc' }
            ]
        })

        // Logic:
        // 1. Merge suggestion pools
        // 2. Deduplicate
        // 3. Filter out products already in the cart
        // 4. Limit to 6 results

        const suggestionsMap = new Map()

        relations.forEach(rel => {
            const relId = rel.relatedProductId

            // Skip if already in cart
            if (productIds.includes(relId)) return

            // If not in map, or this relation has higher priority (logic can be refined)
            if (!suggestionsMap.has(relId)) {
                suggestionsMap.set(relId, rel.relatedProduct)
            }
        })

        const uniqueSuggestions = Array.from(suggestionsMap.values()).slice(0, 6)

        return NextResponse.json({
            suggestions: uniqueSuggestions,
            count: uniqueSuggestions.length
        })
    } catch (error) {
        console.error('Product suggestions error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
