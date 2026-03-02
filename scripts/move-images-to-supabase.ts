const { PrismaClient: PrismaClientMigrate } = require('../src/generated/client');
const { createClient: createSupabaseMigrate } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const prismaMigrate = new PrismaClientMigrate();
const supabaseMigrate = createSupabaseMigrate(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service key for migration
);

const BUCKET = 'Photos';
const PUBLIC_DIR = path.join(process.cwd(), 'public');

/**
 * Recursively find a file in a directory
 */
function findFileRecursive(dir, fileName) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            const found = findFileRecursive(fullPath, fileName);
            if (found) return found;
        } else if (file.toLowerCase() === fileName.toLowerCase()) {
            return fullPath;
        }
    }
    return null;
}

async function uploadFile(localUrl) {
    // 1. Try direct path
    let absolutePath = path.join(PUBLIC_DIR, localUrl);
    if (!fs.existsSync(absolutePath)) {
        // 2. Try searching in products subfolders
        const fileName = path.basename(localUrl);
        const productsDir = path.join(PUBLIC_DIR, 'products');
        if (fs.existsSync(productsDir)) {
            absolutePath = findFileRecursive(productsDir, fileName);
        }
    }

    if (!absolutePath || !fs.existsSync(absolutePath)) {
        console.log(`  ❌ File NOT found for: ${localUrl}`);
        return null;
    }

    const fileName = path.basename(absolutePath);
    const fileBuffer = fs.readFileSync(absolutePath);
    const contentType = fileName.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

    // Upload to Supabase (upsert)
    const { data, error } = await supabaseMigrate.storage
        .from(BUCKET)
        .upload(fileName, fileBuffer, {
            contentType,
            upsert: true
        });

    if (error) {
        console.error(`  ❌ Error uploading ${fileName}:`, error.message);
        return null;
    }

    // Get Public URL
    const { data: { publicUrl } } = supabaseMigrate.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

    return publicUrl;
}

async function main() {
    console.log('🚀 Starting Advanced Image Migration to Supabase...');

    // 1. Migrate Products
    const products = await prismaMigrate.product.findMany();
    for (const product of products) {
        if (product.imageUrl && (product.imageUrl.startsWith('/') || !product.imageUrl.includes('supabase.co'))) {
            console.log(`📦 Migrating product image: ${product.name}`);
            const newUrl = await uploadFile(product.imageUrl);
            if (newUrl) {
                // Also update the 'images' array if it contains the same path
                const updatedImages = (product.images || []).map(img => (img === product.imageUrl) ? newUrl : img);

                await prismaMigrate.product.update({
                    where: { id: product.id },
                    data: {
                        imageUrl: newUrl,
                        images: updatedImages
                    }
                });
                console.log(`  ✅ Done: ${newUrl}`);
            }
        }
    }

    // 2. Migrate Packages
    const packages = await prismaMigrate.rentalPackage.findMany();
    for (const pkg of packages) {
        if (pkg.imageUrl && (pkg.imageUrl.startsWith('/') || !pkg.imageUrl.includes('supabase.co'))) {
            console.log(`📦 Migrating package image: ${pkg.name}`);
            const newUrl = await uploadFile(pkg.imageUrl);
            if (newUrl) {
                await prismaMigrate.rentalPackage.update({
                    where: { id: pkg.id },
                    data: { imageUrl: newUrl }
                });
                console.log(`  ✅ Done: ${newUrl}`);
            }
        }
    }

    // 3. Migrate Special Offers
    const offers = await prismaMigrate.specialOffer.findMany();
    for (const offer of offers) {
        const images = offer.images || [];
        let updated = false;
        const newImages = [];

        for (const img of images) {
            if (img.startsWith('/') || !img.includes('supabase.co')) {
                console.log(`📦 Migrating offer image for: ${offer.title}`);
                const newUrl = await uploadFile(img);
                if (newUrl) {
                    newImages.push(newUrl);
                    updated = true;
                } else {
                    newImages.push(img);
                }
            } else {
                newImages.push(img);
            }
        }

        if (updated) {
            await prismaMigrate.specialOffer.update({
                where: { id: offer.id },
                data: { images: newImages }
            });
            console.log(`  ✅ ${offer.title} images updated`);
        }
    }

    console.log('🏁 Migration complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prismaMigrate.$disconnect();
    });
