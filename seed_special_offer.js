const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Seeding dummy Special Offer for Nyepi...")

    const offer = await prisma.specialOffer.create({
        data: {
            title: "Premium Nomad Workstation",
            description: "Experience the ultimate remote work setup. This bundle includes our ergonomic Herman Miller Aeron, a 32-inch 4K Dell UltraSharp monitor, and a fully adjustable standing desk.",
            badgeText: "NYEPI EXCLUSIVE",
            discountPercentage: 25,
            originalPrice: 2000000,
            finalPrice: 1500000,
            images: ['/LogoTropicTech.webp'],
            isActive: true
        }
    })

    console.log("Successfully created Special Offer:", offer)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
