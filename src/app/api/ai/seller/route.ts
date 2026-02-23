import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { openai, getBaseSystemPrompt } from '@/lib/ai/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { message, history } = await request.json()

        // Fetch products and variants for context with stock counts
        const productsRaw = await db.product.findMany({
            include: {
                variants: {
                    include: {
                        units: {
                            where: { status: 'AVAILABLE' }
                        }
                    }
                }
            }
        })

        const products = productsRaw.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.monthlyPrice),
            category: p.category,
            availableStock: p.variants.reduce((acc, v) => acc + v.units.length, 0)
        }))

        const systemPrompt = `
            ${getBaseSystemPrompt('SELLER')}
            
            CURRENT CATALOG:
            ${JSON.stringify(products, null, 2)}
            
            USER ASSISTANCE GUIDELINES:
            1. Recommend specific products based on the query.
            2. If looking for a setup, suggest a "bundle" approach.
            3. Highlight that we offer delivery across Bali.
            4. You CANNOT mutate data. Use read access ONLY.
            5. Return your response as a JSON object with a "message" field.
        `

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: message }
            ],
            response_format: { type: "json_object" }
        })

        const content = response.choices[0].message.content
        const parsedContent = JSON.parse(content || '{}')

        return NextResponse.json({
            reply: parsedContent.message || parsedContent.reply || content
        })

    } catch (error) {
        console.error('Seller AI Error:', error)
        return NextResponse.json({ error: 'Failed to connect to assistant' }, { status: 500 })
    }
}
