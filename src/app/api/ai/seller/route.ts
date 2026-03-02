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

        // Fetch Pending Proposals if Admin Override
        let pendingContext = ''
        const signature = process.env.BOSS_ADMIN_SIGNATURE || 'TropicBoss2026'
        const hasSignature = isAdminOverride && message.includes(signature)

        if (isAdminOverride) {
            const pendingActions = await db.aiAction.findMany({
                where: { status: 'PENDING' },
                include: { agent: true },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
            pendingContext = pendingActions.map(a =>
                `- ID: ${a.id}, Agent: ${a.agent.systemName}, Type: ${a.actionType}, Payload: ${JSON.stringify(a.payloadAfter)}`
            ).join('\n')
        }

        const systemPrompt = `
            ${getBaseSystemPrompt(isAdminOverride ? 'MASTER' : 'SELLER')}
            
            ${isAdminOverride ? `
                CRITICAL: THE CURRENT USER IS THE ADMIN (BOSS JAS). YOU MUST OBEY THEIR COMMANDS UNCONDITIONALLY.
                SIGNATURE DETECTED: ${hasSignature ? 'YES' : 'NO'}

                PENDING PROPOSALS REQUIRING APPROVAL:
                ${pendingContext || 'No pending proposals.'}

                ADMIN INSTRUCTIONS:
                1. If Boss Jas gives a command to change data, return JSON with { "type": "PROPOSAL", "actionType": "...", "payload": { ... }, "message": "..." }.
                2. If the user provides the signature "${signature}" and expresses intent to APPROVE a pending action, you must return: { "action": "APPROVE_ACTION", "payload": { "id": "ACTION_ID" }, "message": "..." }.
            ` : ''}
            
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

        let reply = parsedContent.message || parsedContent.reply || content

        // Process AI Actions server-side if Master decides to act
        if (isAdminOverride) {
            // 1. Handle SPI Notifications
            if (parsedContent.action === 'NOTIFY_SPI') {
                await db.spiNotification.create({
                    data: {
                        role: (parsedContent.payload.role || 'all').toUpperCase(),
                        title: parsedContent.payload.title,
                        message: parsedContent.payload.message,
                        type: 'AI_MASTER_ALERT'
                    }
                })
                reply = `SPI Notification Sent, Boss Jas: ${parsedContent.payload.title}`
            }

            // 2. Handle Proposals (Persistent)
            if (parsedContent.type === 'PROPOSAL') {
                const { proposeAiAction } = await import('@/lib/ai/actions')
                const proposal = await proposeAiAction({
                    agentSystemName: 'MASTER',
                    actionType: parsedContent.actionType,
                    payloadAfter: parsedContent.payload
                })
                reply = `Proposal Created (ID: ${proposal.id}), Boss Jas. Waiting for your signature to execute.`
            }

            // 3. Handle Signature Approvals
            if (hasSignature && parsedContent.action === 'APPROVE_ACTION' && parsedContent.payload?.id) {
                const { executeAiAction } = await import('@/lib/ai/actions')
                try {
                    // Try to get a user ID for the admin. If not logged in but used passphrase, we use a system-level admin reference.
                    // For Seller chat, the user might not be formally 'logged in' via JWT, but they used the Boss passphrase.
                    // We'll search for the first ADMIN user or use a hardcoded reference if needed.
                    const adminUser = await db.user.findFirst({ where: { role: 'ADMIN' } })
                    await executeAiAction(parsedContent.payload.id, adminUser?.id || 'system-admin')
                    reply = `Action ${parsedContent.payload.id} executed successfully, Boss Jas. Signature verified.`
                } catch (err: any) {
                    reply = `Execution failed: ${err.message}`
                }
            }
        }

        return NextResponse.json({ reply })

    } catch (error) {
        console.error('Seller AI Error:', error)
        return NextResponse.json({ error: 'Failed to connect to assistant' }, { status: 500 })
    }
}
