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

        const rawIds = productIdsStr.split(',').filter(id => id.length > 0)
        // Ensure only valid UUIDs are passed to Prisma to prevent crash (e.g., 'ups-universal' or composite IDs)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        const productIds = rawIds.filter(id => uuidRegex.test(id))

        if (productIds.length === 0) {
            // If no valid UUIDs in cart, trigger fallback directly
            const fallbackRelations = await db.productRelation.findMany({
                include: { relatedProduct: true },
                orderBy: { priority: 'desc' },
                take: 4
            })
            // If relations are empty, just get 4 random products
            if (fallbackRelations.length === 0) {
                const randomProducts = await db.product.findMany({ take: 4 })
                return NextResponse.json({ suggestions: randomProducts, count: randomProducts.length })
            }
            const suggestions = fallbackRelations.map(rel => rel.relatedProduct)
            return NextResponse.json({ suggestions, count: suggestions.length })
        }

        // Query productRelation for the given productIds
        const relations = await db.productRelation.findMany({
            where: {
                productId: { in: productIds }
            },
            include: {
                relatedProduct: true
            },
            orderBy: [
                { relationType: 'asc' }, // CROSS_SELL < UPSELL < ACCESSORY
                { priority: 'desc' }
            ]
        })

        // Logic:
        // 1. Merge suggestion pools
        // 2. Deduplicate
        // 3. Filter out products already in the cart
        // 4. Limit to 6 results

        const suggestionsMap = new Map()
        const cartProducts = await db.product.findMany({
            where: { id: { in: productIds } },
            select: { category: true }
        })
        const cartCategories = cartProducts.map(p => p.category.toLowerCase())

        relations.forEach(rel => {
            const relId = rel.relatedProductId
            if (productIds.includes(relId)) return
            if (!suggestionsMap.has(relId)) {
                suggestionsMap.set(relId, rel.relatedProduct)
            }
        })

        let uniqueSuggestions = Array.from(suggestionsMap.values())

        // Explicit Category Upsell (If missing Chair / Desk)
        const categoriesToCheck = ['chair', 'desk', 'monitor']
        for (const cat of categoriesToCheck) {
            const hasCat = cartCategories.some(c => c.includes(cat))
            const suggestedHasCat = uniqueSuggestions.some(p => p.category.toLowerCase().includes(cat))

            if (!hasCat && !suggestedHasCat) {
                const explicitItem = await db.product.findFirst({
                    where: {
                        category: { contains: cat, mode: 'insensitive' },
                        id: { notIn: productIds }
                    },
                    orderBy: { monthlyPrice: 'desc' }
                })
                if (explicitItem) {
                    uniqueSuggestions.unshift(explicitItem)
                }
            }
        }

        uniqueSuggestions = uniqueSuggestions.slice(0, 6)

        if (uniqueSuggestions.length === 0) {
            const fallbackRelations = await db.productRelation.findMany({
                include: { relatedProduct: true },
                orderBy: { priority: 'desc' },
                take: 4
            })

            fallbackRelations.forEach((rel: any) => {
                if (!productIds.includes(rel.relatedProductId) && !suggestionsMap.has(rel.relatedProductId)) {
                    suggestionsMap.set(rel.relatedProductId, rel.relatedProduct)
                }
            })
            uniqueSuggestions = Array.from(suggestionsMap.values()).slice(0, 4)
        }

        if (uniqueSuggestions.length === 0) {
            const randomProducts = await db.product.findMany({
                where: {
                    id: { notIn: productIds }
                },
                take: 4
            })
            uniqueSuggestions = randomProducts
        }



        const mappedSuggestions = uniqueSuggestions.map((p: any) => ({
            ...p,
            price: Number(p.monthlyPrice || p.price || 0)
        }))

        return NextResponse.json({
            suggestions: mappedSuggestions,
            count: mappedSuggestions.length
        })
    } catch (error) {
        console.error('Product suggestions error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
