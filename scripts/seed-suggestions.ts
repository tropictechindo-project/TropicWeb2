import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany({ take: 10 })

    if (products.length < 2) {
        console.log('Not enough products to seed relations.')
        return
    }

    console.log(`Seeding relations for ${products.length} products...`)

    // Create some sample relations
    // Product 0 -> Product 1 (CROSS_SELL)
    await prisma.productRelation.upsert({
        where: {
            productId_relatedProductId: {
                productId: products[0].id,
                relatedProductId: products[1].id
            }
        },
        update: {},
        create: {
            productId: products[0].id,
            relatedProductId: products[1].id,
            relationType: 'CROSS_SELL',
            priority: 10
        }
    })

    if (products[2]) {
        // Product 0 -> Product 2 (ACCESSORY)
        await prisma.productRelation.upsert({
            where: {
                productId_relatedProductId: {
                    productId: products[0].id,
                    relatedProductId: products[2].id
                }
            },
            update: {},
            create: {
                productId: products[0].id,
                relatedProductId: products[2].id,
                relationType: 'ACCESSORY',
                priority: 5
            }
        })

        // Product 1 -> Product 2 (CROSS_SELL)
        await prisma.productRelation.upsert({
            where: {
                productId_relatedProductId: {
                    productId: products[1].id,
                    relatedProductId: products[2].id
                }
            },
            update: {},
            create: {
                productId: products[1].id,
                relatedProductId: products[2].id,
                relationType: 'CROSS_SELL',
                priority: 15
            }
        })
    }

    console.log('Seeding complete.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
