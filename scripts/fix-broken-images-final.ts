const { PrismaClient } = require('../src/generated/client');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'Photos';
const PRODUCTS_DIR = path.join(process.cwd(), 'public', 'products');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.webp') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

async function uploadFile(absolutePath) {
    const fileName = path.basename(absolutePath);
    const fileBuffer = fs.readFileSync(absolutePath);
    const contentType = fileName.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

    console.log(`  📤 Uploading ${fileName}...`);
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, fileBuffer, {
            contentType,
            upsert: true
        });

    if (error) {
        console.error(`  ❌ Error uploading ${fileName}:`, error.message);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

    return publicUrl;
}

async function main() {
    console.log('🚀 Starting Final Image Restoration...');

    if (!fs.existsSync(PRODUCTS_DIR)) {
        console.error('❌ Products directory not found:', PRODUCTS_DIR);
        return;
    }

    const allLocalFiles = getAllFiles(PRODUCTS_DIR);
    console.log(`Found ${allLocalFiles.length} local images.`);

    const urlMap = new Map(); // fileName -> publicUrl

    for (const filePath of allLocalFiles) {
        const publicUrl = await uploadFile(filePath);
        if (publicUrl) {
            urlMap.set(path.basename(filePath).toLowerCase(), publicUrl);
        }
    }

    console.log('🔄 Updating Database Records (No Dummy Data added)...');

    // 1. Products
    const products = await prisma.product.findMany();
    for (const product of products) {
        const fileName = product.imageUrl ? path.basename(product.imageUrl).toLowerCase() : `${product.name.toLowerCase()}.webp`;
        // Also try matching by product name if fileName failed
        let bestUrl = urlMap.get(fileName);

        if (!bestUrl) {
            // Fuzzy match by product name
            const searchName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const [fName, url] of urlMap.entries()) {
                const normalizedFile = fName.replace('.webp', '').replace(/[^a-z0-9]/g, '');
                if (normalizedFile.includes(searchName) || searchName.includes(normalizedFile)) {
                    bestUrl = url;
                    break;
                }
            }
        }

        if (bestUrl) {
            console.log(`  ✅ Updating Product: ${product.name} -> ${bestUrl}`);
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    imageUrl: bestUrl,
                    images: product.images.length > 0 ? [bestUrl] : []
                }
            });
        } else {
            console.log(`  ⚠️ Could not find image for Product: ${product.name}`);
        }
    }

    // 2. Rental Packages
    const packages = await prisma.rentalPackage.findMany();
    for (const pkg of packages) {
        const fileName = pkg.imageUrl ? path.basename(pkg.imageUrl).toLowerCase() : `${pkg.name.toLowerCase()}.webp`;
        let bestUrl = urlMap.get(fileName);

        if (!bestUrl) {
            const searchName = pkg.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const [fName, url] of urlMap.entries()) {
                const normalizedFile = fName.replace('.webp', '').replace(/[^a-z0-9]/g, '');
                if (normalizedFile.includes(searchName) || searchName.includes(normalizedFile)) {
                    bestUrl = url;
                    break;
                }
            }
        }

        if (bestUrl) {
            console.log(`  ✅ Updating Package: ${pkg.name} -> ${bestUrl}`);
            await prisma.rentalPackage.update({
                where: { id: pkg.id },
                data: { imageUrl: bestUrl }
            });
        }
    }

    // 3. Special Offers
    const offers = await prisma.specialOffer.findMany();
    for (const offer of offers) {
        const fileName = offer.images && offer.images[0] ? path.basename(offer.images[0]).toLowerCase() : null;
        let bestUrl = fileName ? urlMap.get(fileName) : null;

        if (!bestUrl) {
            const searchName = offer.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const [fName, url] of urlMap.entries()) {
                const normalizedFile = fName.replace('.webp', '').replace(/[^a-z0-9]/g, '');
                if (normalizedFile.includes(searchName) || searchName.includes(normalizedFile)) {
                    bestUrl = url;
                    break;
                }
            }
        }

        if (bestUrl) {
            console.log(`  ✅ Updating Special Offer: ${offer.title} -> ${bestUrl}`);
            await prisma.specialOffer.update({
                where: { id: offer.id },
                data: { images: [bestUrl] }
            });
        }
    }

    console.log('🏁 Final Image Restoration Complete!');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
