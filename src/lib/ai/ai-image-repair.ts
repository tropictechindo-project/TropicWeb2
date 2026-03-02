import { db } from '../db'
import fs from 'fs'
import path from 'path'

/**
 * AI Image Repair Service
 * Scans Products, Packages, and Special Offers for broken image links.
 * Attempts to repair by searching subdirectories or using placeholders.
 */

const PUBLIC_PATH = path.join(process.cwd(), 'public')
const PLACEHOLDER = '/MyAi.webp'

async function checkLocalFile(filePath: string): Promise<boolean> {
    if (!filePath.startsWith('/')) return false
    const absolutePath = path.join(PUBLIC_PATH, filePath)
    return fs.existsSync(absolutePath)
}

async function checkRemoteUrl(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, { method: 'HEAD' })
        return res.ok
    } catch (e) {
        return false
    }
}

async function verifyImage(imageUrl: string | null | undefined): Promise<boolean> {
    if (!imageUrl) return false
    if (imageUrl.startsWith('http')) {
        return checkRemoteUrl(imageUrl)
    }
    return checkLocalFile(imageUrl)
}

function normalizeString(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function findFuzzyMatch(targetName: string, subfolder: string): Promise<string | null> {
    const dirPath = path.join(PUBLIC_PATH, 'products', subfolder)
    if (!fs.existsSync(dirPath)) return null

    const files = fs.readdirSync(dirPath)
    const normalizedTarget = normalizeString(targetName)

    // 1. Try containment
    for (const file of files) {
        const normalizedFile = normalizeString(file.replace('.webp', ''))
        if (normalizedFile.includes(normalizedTarget) || normalizedTarget.includes(normalizedFile)) {
            return `/products/${subfolder}/${file}`
        }
    }

    // 2. Try matching numbers (e.g., "27" in "27 HD Monitor" and "27 Monitor")
    const targetNumbers = targetName.match(/\d+/g)
    if (targetNumbers) {
        for (const file of files) {
            const fileNumbers = file.match(/\d+/g)
            if (fileNumbers && targetNumbers.some(n => fileNumbers.includes(n))) {
                // If it's a monitor and size matches, it's a good guess
                if (subfolder === 'Monitor' || subfolder === 'Others') {
                    return `/products/${subfolder}/${file}`
                }
            }
        }
    }

    return null
}

async function tryRepairProduct(product: any): Promise<{ fixedUrl: string | null, method: string | null }> {
    const currentUrl = product.imageUrl
    const filename = currentUrl && currentUrl !== PLACEHOLDER ? path.basename(currentUrl) : `${product.name}.webp`
    const category = product.category

    // 1. Try exact match in category subfolder
    const categoryPath = `/products/${category}/${filename}`
    if (await checkLocalFile(categoryPath)) {
        return { fixedUrl: categoryPath, method: 'EXACT_MATCH_CATEGORY' }
    }

    // 2. Try fuzzy match in category subfolder
    const fuzzyInCat = await findFuzzyMatch(product.name, category)
    if (fuzzyInCat) {
        return { fixedUrl: fuzzyInCat, method: 'FUZZY_MATCH_CATEGORY' }
    }

    // 3. Try common subfolders
    const categories = ['Desk', 'Monitor', 'Chair', 'Mouse and Keyboard', 'Others']
    for (const cat of categories) {
        if (cat === category) continue

        // Exact
        const altPath = `/products/${cat}/${filename}`
        if (await checkLocalFile(altPath)) {
            return { fixedUrl: altPath, method: `EXACT_MATCH_${cat}` }
        }

        // Fuzzy
        const fuzzyAlt = await findFuzzyMatch(product.name, cat)
        if (fuzzyAlt) {
            return { fixedUrl: fuzzyAlt, method: `FUZZY_MATCH_${cat}` }
        }
    }

    // 4. Check if it's already a placeholder, don't repeat update if so
    if (currentUrl === PLACEHOLDER) return { fixedUrl: null, method: null }

    return { fixedUrl: PLACEHOLDER, method: 'PLACEHOLDER_FALLBACK' }
}

export async function auditAndRepairImages() {
    const reports: string[] = []
    let repairsCount = 0

    // 1. Audit Products
    const products = await db.product.findMany()
    for (const product of products) {
        const currentUrl = product.imageUrl
        const isOk = await verifyImage(currentUrl)
        const isPlaceholder = currentUrl === PLACEHOLDER

        if (!isOk || isPlaceholder) {
            const { fixedUrl, method } = await tryRepairProduct(product)
            if (fixedUrl && fixedUrl !== currentUrl) {
                await db.product.update({
                    where: { id: product.id },
                    data: { imageUrl: fixedUrl }
                })
                repairsCount++
                reports.push(`[Product] Repaired "${product.name}" using ${method}: ${fixedUrl}`)
            }
        }
    }

    // 2. Audit Packages
    const packages = await db.rentalPackage.findMany()
    for (const pkg of packages) {
        const currentUrl = pkg.imageUrl
        const isOk = await verifyImage(currentUrl)
        const isPlaceholder = currentUrl === PLACEHOLDER

        if (!isOk || isPlaceholder) {
            // Packages repair logic could be added here
            if (!isPlaceholder && !isOk) {
                await db.rentalPackage.update({
                    where: { id: pkg.id },
                    data: { imageUrl: PLACEHOLDER }
                })
                repairsCount++
                reports.push(`[Package] Placeholder set for "${pkg.name}"`)
            }
        }
    }

    // 3. Audit Special Offers
    const offers = await db.specialOffer.findMany()
    for (const offer of offers) {
        const currentUrl = offer.images?.[0]
        const isOk = await verifyImage(currentUrl)
        const isPlaceholder = currentUrl === PLACEHOLDER

        if (!isOk || isPlaceholder) {
            if (!isPlaceholder && !isOk) {
                await db.specialOffer.update({
                    where: { id: offer.id },
                    data: { images: [PLACEHOLDER] }
                })
                repairsCount++
                reports.push(`[Offer] Placeholder set for "${offer.title}"`)
            }
        }
    }


    // Summary Report
    const summary = `AI Image Audit: Processed ${products.length} products, ${packages.length} packages, ${offers.length} offers. Total repairs/fixes: ${repairsCount}.`

    if (repairsCount > 0) {
        // Notify AI Master via SPI
        await db.spiNotification.create({
            data: {
                role: 'ADMIN',
                type: 'AI_MASTER_ALERT',
                title: 'Image Audit Report',
                message: `${summary} Check Audit logs for details.`,
            }
        })

        // Log to Activity Logs
        await db.activityLog.create({
            data: {
                action: 'AI_IMAGE_AUDIT',
                entity: 'System',
                details: reports.join('\n')
            }
        })
    }

    return { summary, reports }
}
