import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const productsDir = path.join(process.cwd(), 'public/ProductsReal')

async function updateProducts() {
    try {
        console.log("Starting product image update...")

        // Rename specific products first
        // User requested:
        // 360 Laptop Stand -> Laptop Stand (already resolved/missing)
        // Smart Power Board -> Smart Power Strip (DB has "Smart Power Board (Worldwide Support)")
        // Atatchable Desk Lamp -> Atatchable Lamp (DB has "Attachable Desk Lamp")
        const renames = [
            { old: '360 Laptop Stand', new: 'Laptop Stand' },
            { old: 'Smart Power Board (Worldwide Support)', new: 'Smart Power Strip' },
            { old: 'Smart Power Board', new: 'Smart Power Strip' },
            { old: 'Attachable Desk Lamp', new: 'Atatchable Lamp' },
            { old: 'Atatchable Desk Lamp', new: 'Atatchable Lamp' },
        ]

        for (const r of renames) {
            const result = await prisma.product.updateMany({
                where: { name: r.old },
                data: { name: r.new }
            })
            if (result.count > 0) {
                console.log(`Renamed "${r.old}" to "${r.new}" (updated ${result.count} records)`)
            }
        }

        // Folder to Exact DB Name Map
        const exactMap: Record<string, string> = {
            "27_ 4k Monitor": "27\" 4K Monitor",
            "27_ Monitor": "27\" HD Monitor",
            "29_ Monitor": "29\" UltraWide Monitor",
            "34_ Monitor (Flat)": "34\" UltraWide Monitor",
            "34_ Monitor Curved": "34\" 4K Curved Monitor",
            "Monitor Clamp": "Monitor Bracket",
            // The ones we just renamed:
            "Smart Power Strip": "Smart Power Strip",
            "Atatchable Lamp": "Atatchable Lamp",
            "Laptop Stand": "Laptop Stand"
        }

        // List all product folders in public/ProductsReal
        const productFolders = fs.readdirSync(productsDir)
            .filter(f => fs.statSync(path.join(productsDir, f)).isDirectory())

        const allProducts = await prisma.product.findMany()

        for (const folder of productFolders) {
            const folderPath = path.join(productsDir, folder)
            const files = fs.readdirSync(folderPath)
                .filter(f => f.match(/\.(png|jpg|jpeg|webp|gif)$/i))
                .map(f => `/ProductsReal/${folder}/${f}`)

            if (files.length === 0) continue

            const productName = folder
            const targetDbName = exactMap[folder] || productName

            // Try exact case-sensitive match
            let match = allProducts.find(p => p.name === targetDbName)

            // Try case-insensitive match
            if (!match) {
                match = allProducts.find(p => p.name.toLowerCase() === targetDbName.toLowerCase())
            }

            // Try ignoring extra spaces or symbols
            if (!match) {
                const normalizedFolder = targetDbName.toLowerCase().replace(/[^a-z0-9]/g, '')
                match = allProducts.find(p => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedFolder)
            }

            if (match) {
                await prisma.product.update({
                    where: { id: match.id },
                    data: {
                        images: files,
                        imageUrl: files[0] // Set primary image
                    }
                })
                console.log(`[SUCCESS] Mapped ${files.length} images to product: "${match.name}" (Folder: "${folder}")`)
            } else {
                console.log(`[WARNING] Could not find matching product in DB for folder: "${folder}"`)
            }
        }

        console.log("Database update complete!")
        console.log("AVAILABLE PRODUCTS IN DB:")
        console.log(allProducts.map(p => p.name).join(', '))
    } catch (error) {
        console.error("Error updating products:", error)
    } finally {
        await prisma.$disconnect()
    }
}

updateProducts()
