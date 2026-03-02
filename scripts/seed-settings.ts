const { PrismaClient } = require('../src/generated/client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

const settings = [
    { key: 'special_offers_title', value: 'Exclusive Monthly Deals' },
    { key: 'special_offers_description', value: 'Premium workstation bundles at special prices for our community.' },
    { key: 'services_title', value: 'Our Premium Services' },
    { key: 'services_text', value: 'From high-performance hardware to seamless delivery in Bali.' }
];

async function seedSettings() {
    console.log('👷 Seeding Site Settings...');

    for (const setting of settings) {
        await prisma.siteSetting.upsert({
            where: { key: setting.key },
            update: setting,
            create: setting
        });
        console.log(`  ✅ Seeded: ${setting.key}`);
    }

    console.log('🏁 Site Settings Seeding Complete!');
}

seedSettings()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
