const { PrismaClient } = require('../src/generated/client'); // Use custom client path
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

const offers = [
    {
        title: 'Work from Bali Special',
        description: 'The ultimate Nyepi productivity setup. Ergonomic chair, 32" 4K Monitor, and high-speed mesh Wi-Fi.',
        badgeText: 'NYEPI SPECIAL',
        discountPercentage: 25,
        originalPrice: 2500000,
        finalPrice: 1875000,
        images: ['/products/Workstation Pro.webp'], // Will be migrated after
        isActive: true
    },
    {
        title: 'Startup Sprint Pack',
        description: 'Get your whole team up and running in 24 hours. Includes 5 workstation setups with a 15% discount.',
        badgeText: 'POPULAR',
        discountPercentage: 15,
        originalPrice: 12000000,
        finalPrice: 10200000,
        images: ['/products/Workstation Core.webp'],
        isActive: true
    },
    {
        title: 'Home Office Upgrade',
        description: 'Upgrade your home setup with our premium dual-monitor arm and high-back ergonomic chair.',
        badgeText: 'BEST VALUE',
        discountPercentage: 20,
        originalPrice: 1500000,
        finalPrice: 1200000,
        images: ['/products/Monitor Bracket.webp'],
        isActive: true
    }
];

async function seedSpecialOffers() {
    console.log('👷 Seeding Special Offers...');

    for (const offer of offers) {
        const existing = await prisma.specialOffer.findFirst({
            where: { title: offer.title }
        });

        if (existing) {
            await prisma.specialOffer.update({
                where: { id: existing.id },
                data: offer
            });
            console.log(`  ✅ Updated: ${offer.title}`);
        } else {
            await prisma.specialOffer.create({
                data: offer
            });
            console.log(`  ✅ Created: ${offer.title}`);
        }
    }

    console.log('🏁 Special Offers Seeding Complete!');
}

seedSpecialOffers()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
