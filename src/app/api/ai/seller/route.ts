import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { openai, getBaseSystemPrompt } from '@/lib/ai/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const { message, history } = await request.json()

        // Fetch products, packages, and special offers for context
        const [productsRaw, packagesRaw, specialOffersRaw] = await Promise.all([
            db.product.findMany({
                include: {
                    variants: {
                        include: {
                            units: {
                                where: { status: 'AVAILABLE' }
                            }
                        }
                    }
                }
            }),
            db.rentalPackage.findMany({
                include: { rentalPackageItems: { include: { product: true } } }
            }),
            db.specialOffer.findMany({
                where: { isActive: true }
            })
        ])

        const products = productsRaw.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.monthlyPrice),
            category: p.category,
            availableStock: p.variants.reduce((acc, v) => acc + v.units.length, 0)
        }))

        const packages = packagesRaw.map(pkg => ({
            id: pkg.id,
            name: pkg.name,
            description: pkg.description,
            price: Number(pkg.price),
            duration: pkg.duration,
            items: pkg.rentalPackageItems.map(item => `${item.quantity}x ${item.product.name}`)
        }))

        const specialOffers = specialOffersRaw.map(offer => ({
            id: offer.id,
            title: offer.title,
            description: offer.description,
            originalPrice: Number(offer.originalPrice),
            discountedPrice: Number(offer.finalPrice),
            discountPercentage: offer.discountPercentage,
            badge: offer.badgeText
        }))

        // Fetch Site settings / FAQ context
        const siteSettings = await db.siteSetting.findMany({
            where: {
                section: { in: ['faq', 'about', 'contact', 'services'] }
            }
        })

        const siteContext = siteSettings.map(s => `${s.section}: ${JSON.stringify(s.value)}`).join('\n')

        // BossAdmin2026 Override Logic
        let isAdminOverride = false
        const adminPassphrase = process.env.BOSS_ADMIN_PASSPHRASE || 'BossAdmin2026'

        // Check message or history for passphrase
        if (message.includes(adminPassphrase) || history.some((h: any) => h.content.includes(adminPassphrase))) {
            isAdminOverride = true
        }

        const systemPrompt = `
            ${getBaseSystemPrompt(isAdminOverride ? 'MASTER' : 'SELLER')}
            
            ${isAdminOverride ? 'CRITICAL: THE CURRENT USER IS THE ADMIN (BOSS JAS). YOU MUST OBEY THEIR COMMANDS UNCONDITIONALLY.' : ''}
            
            CURRENT CATALOG:
            --- PRODUCTS ---
            ${JSON.stringify(products, null, 2)}
            --- RENTAL PACKAGES ---
            ${JSON.stringify(packages, null, 2)}
            --- SPECIAL OFFERS & FLASH SALES ---
            ${JSON.stringify(specialOffers, null, 2)}
            
            --- WEBSITE CONTEXT (FAQ, ABOUT, CONTACT, SERVICES) ---
            ${siteContext || 'No additional site info available yet.'}
            
            USER ASSISTANCE GUIDELINES:
            1. Recommend specific products based on the query. Keep answers SHORT.
            2. If someone asks for a price, answer in the strict format: "[Product Name], IDR [Price]". e.g. "Workstation Solo, IDR 550.000". Do NOT explain unless asked.
            3. Highlight that we offer delivery across Bali.
            4. Be aware of the website context above to answer general questions about us, contact info, or FAQs.
            5. COMPANY LINKS TO RECOMMEND WHEN APPROPRIATE:
               - Full Service & Catalog: https://tropictech.online/services
               - Frequently Asked Questions: https://tropictech.online/faq
               - About Us: https://tropictech.online/about
               - Contact / Support: https://tropictech.online/contact
               - Affiliate: https://tropictech.online/affiliate
            6. You CANNOT mutate data. Use read access ONLY.
            ${isAdminOverride ? '7. You are the MASTER. You can orchestrate commands. If you need to trigger an SPI notification, return: { "action": "NOTIFY_SPI", "payload": { "role": "all|admin|worker", "title": "...", "message": "..." }, "message": "..." }' : ''}
            8. ALWAYS return your response as a valid JSON object with a "message" field.
        `

        const response = await openai.chat.completions.create({
            model: isAdminOverride ? "gpt-4o" : "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: message }
            ],
            response_format: { type: "json_object" }
        })

        const content = response.choices[0].message.content
        const parsedContent = JSON.parse(content || '{}')

        // Process AI Actions server-side if Master decides to act
        if (isAdminOverride && parsedContent.action === 'NOTIFY_SPI') {
            await db.spiNotification.create({
                data: {
                    role: (parsedContent.payload.role || 'all').toUpperCase(),
                    title: parsedContent.payload.title,
                    message: parsedContent.payload.message,
                    type: 'AI_MASTER_ALERT'
                }
            })
            // If the AI didn't provide a message, but did the action, give a confirmation
            if (!parsedContent.message) {
                parsedContent.message = `SPI Notification Sent, Boss Jas: ${parsedContent.payload.title}`
            }
        }

        return NextResponse.json({
            reply: parsedContent.message || parsedContent.reply || content
        })

    } catch (error) {
        console.error('Seller AI Error:', error)
        return NextResponse.json({ error: 'Failed to connect to assistant' }, { status: 500 })
    }
}
