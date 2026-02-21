
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const prisma = new PrismaClient()

// Map folder names/keywords to Categories
const getCategory = (name: string): string => {
    const lower = name.toLowerCase()
    if (lower.includes('monitor')) return 'Monitor'
    if (lower.includes('chair')) return 'Chair'
    if (lower.includes('desk') || lower.includes('workstation')) return 'Desk'
    if (lower.includes('keyboard') || lower.includes('mouse') || lower.includes('combo')) return 'Mouse and Keyboard'
    return 'Others'
}

async function main() {
    const equipmentDir = path.join(process.cwd(), 'public/products/Equipment')
    const outputBaseDir = path.join(process.cwd(), 'public/products')

    if (!fs.existsSync(equipmentDir)) {
        console.error('Equipment directory not found:', equipmentDir)
        return
    }

    const items = fs.readdirSync(equipmentDir)

    for (const item of items) {
        if (item === '.DS_Store') continue

        const itemPath = path.join(equipmentDir, item)
        const stats = fs.statSync(itemPath)

        if (stats.isDirectory()) {
            // It's a product folder, e.g. "Workstation Solo"
            const productName = item.replace(/_/g, ' ').trim() // Basic cleanup
            const category = getCategory(productName)

            // Find valid image in folder
            const files = fs.readdirSync(itemPath).filter(f => !f.startsWith('.') && (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp')))

            if (files.length > 0) {
                const imageFile = files[0]
                const imagePath = path.join(itemPath, imageFile)

                // Create category folder if not exists
                const categoryDir = path.join(outputBaseDir, category)
                if (!fs.existsSync(categoryDir)) {
                    fs.mkdirSync(categoryDir, { recursive: true })
                }

                const outputFileName = `${productName}.webp`
                const outputFilePath = path.join(categoryDir, outputFileName)
                const publicUrl = `/products/${category}/${outputFileName}`

                console.log(`Processing: ${productName} -> ${category}`)

                try {
                    // Convert to WebP
                    await sharp(imagePath)
                        .webp({ quality: 80 })
                        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }) // Optimize size
                        .toFile(outputFilePath)

                    // Update or Create DB
                    const existingProduct = await prisma.product.findFirst({
                        where: {
                            name: {
                                equals: productName,
                                mode: 'insensitive' // Case insensitive matching
                            }
                        }
                    })

                    if (existingProduct) {
                        await prisma.product.update({
                            where: { id: existingProduct.id },
                            data: {
                                imageUrl: publicUrl,
                                images: [publicUrl], // Update gallery too
                                category: category // Ensure category is correct
                            }
                        })
                        console.log(`Updated product: ${productName}`)
                    } else {
                        await prisma.product.create({
                            data: {
                                name: productName,
                                description: `High quality ${productName} available for rent.`,
                                monthlyPrice: 0, // Zero pricing as requested
                                category: category,
                                imageUrl: publicUrl,
                                images: [publicUrl],
                                stock: 10 // Default stock
                            }
                        })
                        console.log(`Created new product: ${productName}`)
                    }

                } catch (error) {
                    console.error(`Failed to process ${productName}:`, error)
                }
            } else {
                console.warn(`No image found in ${item}`)
            }
        }
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
