
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // Clean up existing data
    await prisma.rentalItem.deleteMany()
    await prisma.rentalPackageItem.deleteMany()
    await prisma.rentalPackage.deleteMany()
    await prisma.product.deleteMany()

    // PRODUCTS
    // Using the data provided by the user
    const productsData = [
        // DESKS
        {
            id: 'desk-workstation-solo',
            name: 'Workstation Solo',
            description: 'Compact and efficient desk perfect for solo workers and small spaces.',
            price: 580000,
            category: 'Desk',
            image: '/products/Workstation Solo.webp',
            features: ['Compact Design', 'Sturdy Build', 'Easy Assembly', 'Portable'],
            inStock: true,
            specs: {
                dimensions: "140 x 70 cm",
                seatedHeight: "74cm",
                standingHeight: "118cm",
                maxLoad: "80kg",
                colours: ["Black", "White"]
            }
        },
        {
            id: 'desk-workstation-core',
            name: 'Workstation Core',
            description: 'Reliable core workstation desk for everyday productivity.',
            price: 680000,
            category: 'Desk',
            image: '/products/Workstation Core.webp',
            features: ['Spacious Surface', 'Durable Frame', 'Cable Management', 'Modern Design'],
            inStock: true,
        },
        {
            id: 'desk-workstation-plus',
            name: 'Workstation Plus',
            description: 'Enhanced workstation with additional features for professionals.',
            price: 750000,
            category: 'Desk',
            image: '/products/Workstation Plus.webp',
            features: ['Large Work Surface', 'Height Adjustable', 'Premium Materials', 'Ergonomic Design'],
            inStock: true,
            specs: {
                length: "160cm",
                width: "2.5cm",
                height: "70cm",
                colours: ["Oak", "Brown"]
            }
        },
        {
            id: 'desk-workstation-pro',
            name: 'Workstation Pro',
            description: 'Professional-grade desk for maximum productivity and comfort.',
            price: 850000,
            category: 'Desk',
            image: '/products/Workstation Pro.webp',
            features: ['Electric Height Adjustment', 'Memory Presets', 'Premium Finish', 'Heavy Duty'],
            inStock: true,
            specs: {
                length: "160cm",
                width: "2.5cm",
                height: "70cm",
                colours: ["Oak", "Brown"]
            }
        },

        // MONITORS
        {
            id: 'monitor-27-hd',
            name: '27" HD Monitor',
            description: 'Crystal clear 27-inch HD monitor for everyday work and entertainment.',
            price: 530000,
            category: 'Monitor',
            image: '/products/27" HD Monitor.webp',
            features: ['27" Full HD', 'IPS Display', 'Eye Care Technology', 'Slim Bezel'],
            inStock: true,
        },
        {
            id: 'monitor-29-ultrawide',
            name: '29" UltraWide Monitor',
            description: 'Ultra-wide monitor perfect for multitasking and productivity.',
            price: 690000,
            category: 'Monitor',
            image: '/products/29" UltraWide Monitor.webp',
            features: ['29" UltraWide', '2560x1080 Resolution', '21:9 Aspect Ratio', 'Split Screen'],
            inStock: true,
        },
        {
            id: 'monitor-34-ultrawide',
            name: '34" UltraWide Monitor',
            description: 'Large ultra-wide monitor for immersive work experience.',
            price: 850000,
            category: 'Monitor',
            image: '/products/34" UltraWide Monitor.webp',
            features: ['34" UltraWide', 'Curved Display', 'USB-C Connectivity', 'HDR Support'],
            inStock: true,
        },
        {
            id: 'monitor-27-4k',
            name: '27" 4K Monitor',
            description: 'Stunning 4K resolution monitor for professionals who demand clarity.',
            price: 850000,
            category: 'Monitor',
            image: '/products/27" 4K Monitor.webp',
            features: ['27" 4K UHD', '99% sRGB Color', 'USB-C with Power Delivery', 'Height Adjustable'],
            inStock: true,
            recommended: true,
        },
        {
            id: 'monitor-34-4k-curved',
            name: '34" 4K Curved Monitor',
            description: 'Premium curved 4K monitor for the ultimate viewing experience.',
            price: 1200000,
            category: 'Monitor',
            image: '/products/34" 4K Curved Monitor.webp',
            features: ['34" 4K Curved', '144Hz Refresh Rate', '1ms Response', 'HDR400'],
            inStock: true,
            recommended: true,
        },

        // CHAIRS
        {
            id: 'chair-ergonomic-basic',
            name: 'Ergonomic Chair Basic',
            description: 'Affordable ergonomic chair with essential comfort features.',
            price: 260000,
            category: 'Chair',
            image: '/products/Ergonomic Chair Basic.webp',
            features: ['Mesh Back', 'Lumbar Support', 'Adjustable Height', 'Swivel Base'],
            inStock: true,
            specs: {
                colours: ["Black"]
            }
        },
        {
            id: 'chair-ergonomic-lite',
            name: 'Ergonomic Chair Lite',
            description: 'Lightweight ergonomic chair with improved comfort.',
            price: 480000,
            category: 'Chair',
            image: '/products/Ergonomic Chair Lite.webp',
            features: ['Breathable Mesh', 'Armrests', 'Tilt Function', 'Durable Build'],
            inStock: true,
            specs: {
                colours: ["Grey", "Black"]
            }
        },
        {
            id: 'chair-ergonomic-plus',
            name: 'Ergonomic Chair Plus',
            description: 'Enhanced ergonomic chair with premium features.',
            price: 530000,
            category: 'Chair',
            image: '/products/Ergonomic Chair Plus.webp',
            features: ['3D Armrests', 'Adjustable Lumbar', 'Headrest', 'Premium Materials'],
            inStock: true,
            specs: {
                colours: ["Black"]
            }
        },
        {
            id: 'chair-ergonomic-pro',
            name: 'Ergonomic Chair Pro',
            description: 'Professional-grade ergonomic chair for all-day comfort.',
            price: 830000,
            category: 'Chair',
            image: '/products/Ergonomic Chair Pro.webp',
            features: ['4D Armrests', 'Dynamic Lumbar', 'Memory Foam', 'Aluminum Base'],
            inStock: true,
            specs: {
                colours: ["Black", "Grey"]
            }
        },

        // KEYBOARD & MOUSE
        {
            id: 'keyboard-logitech-combo',
            name: 'Logitech Combo',
            description: 'Reliable wireless keyboard and mouse combo for daily use.',
            price: 260000,
            category: 'Mouse and Keyboard',
            image: '/products/Logitech Combo.webp',
            features: ['Wireless 2.4GHz', 'Long Battery Life', 'Quiet Keys', 'Ergonomic Mouse'],
            inStock: true,
            specs: {
                colours: ["Black"]
            }
        },
        {
            id: 'keyboard-magic-combo',
            name: 'Magic Combo',
            description: 'Apple-style wireless keyboard and mouse combo.',
            price: 260000,
            category: 'Mouse and Keyboard',
            image: '/products/Magic Combo.webp',
            features: ['Bluetooth Connectivity', 'Rechargeable', 'Slim Design', 'Multi-Touch'],
            inStock: true,
            specs: {
                colours: ["White"]
            }
        },
        {
            id: 'keyboard-mx-master-combo',
            name: 'MX Master Combo',
            description: 'Professional-grade keyboard and mouse for power users.',
            price: 500000,
            category: 'Mouse and Keyboard',
            image: '/products/MX Master Combo.webp',
            features: ['MX Keys', 'MX Master 3S', 'Flow Technology', 'USB-C Charging'],
            inStock: true,
            specs: {
                colours: ["Graphite"]
            }
        },

        // ACCESSORIES (Others)
        {
            id: 'accessory-power-board',
            name: 'Smart Power Board (Worldwide Support)',
            description: 'Smart power strip with worldwide plug support and USB ports.',
            price: 160000,
            category: 'Others',
            image: '/products/Smart Power Board (Worldwide Support).webp',
            features: ['6 AC Outlets', '4 USB Ports', 'Surge Protection', 'Worldwide Plugs'],
            inStock: true,
        },
        {
            id: 'accessory-usb-hub',
            name: '8K USB HUB',
            description: 'High-speed USB hub with 8K display support.',
            price: 260000,
            category: 'Others',
            image: '/products/8K USB HUB.webp',
            features: ['8K Display Output', 'Multiple USB Ports', 'Ethernet Port', 'Power Delivery'],
            inStock: true,
        },
        {
            id: 'accessory-laptop-stand',
            name: '360 Laptop Stand',
            description: 'Adjustable laptop stand for improved ergonomics.',
            price: 260000,
            category: 'Others',
            image: '/products/360 Laptop Stand.webp',
            features: ['360° Rotation', 'Height Adjustable', 'Aluminum Build', 'Heat Dissipation'],
            inStock: true,
            specs: {
                material: "Aluminum",
                colours: ["Silver"]
            }
        },
        {
            id: 'accessory-monitor-bracket',
            name: 'Monitor Bracket',
            description: 'Sturdy monitor arm for flexible positioning.',
            price: 100000,
            category: 'Others',
            image: '/products/Monitor Bracket.webp',
            features: ['Full Motion', 'VESA Compatible', 'Cable Management', 'Easy Install'],
            inStock: true,
        },
        {
            id: 'accessory-desk-lamp',
            name: 'Attachable Desk Lamp',
            description: 'LED desk lamp with adjustable brightness and color temperature.',
            price: 150000,
            category: 'Others',
            image: '/products/Attachable Desk Lamp.webp',
            features: ['LED Light', 'Dimmable', 'USB Powered', 'Flexible Neck'],
            inStock: true,
        },
        {
            id: 'accessory-mouse-pad',
            name: 'Mouse Pad',
            description: 'Premium mouse pad for smooth tracking.',
            price: 30000,
            category: 'Others',
            image: '/products/Mouse Pad.webp',
            features: ['Large Surface', 'Non-Slip Base', 'Smooth Fabric', 'Durable'],
            inStock: true,
        },
        {
            id: 'accessory-test-desk',
            name: 'Test Products',
            description: 'A product for testing purposes.',
            price: 1000,
            category: 'Others',
            image: '/products/java.webp',
            features: ['Testing'],
            inStock: true,
        },
    ];

    const createdProducts: any = {};

    for (const p of productsData) {
        // Use provided image path from p.image
        const imageUrl = p.image || '/MyAi.webp';

        const specs = {
            ...(p as any).specs,
            features: (p as any).features
        };

        const product = await prisma.product.create({
            data: {
                name: p.name,
                description: p.description,
                monthlyPrice: p.price,
                category: p.category,
                imageUrl: imageUrl,
                images: [imageUrl], // Use single image for now or duplicate if needed for slider effect
                specs: specs,
            },
        })
        console.log(`Created product: ${product.name}`)
        createdProducts[p.name] = product;
        // Also map by ID for sure
        createdProducts[p.id] = product;
    }

    // PACKAGES
    const packagesData = [
        {
            id: 'package-startup',
            name: 'The Start-Up',
            description: 'Perfect for freelancers and solo entrepreneurs starting their remote work journey in Bali.',
            price: 2100000,
            image: '/packages/Rental Bali1.webp',
            items: [
                '27" HD Monitor',
                'Workstation Solo',
                'Magic Combo',
                'Ergonomic Chair Basic',
            ],
        },
        {
            id: 'package-nomad',
            name: 'The Digital Nomad',
            description: 'Ideal for digital nomads who need a productive workspace with flexibility.',
            price: 2520000,
            image: '/packages/Rental Bali2.webp',
            items: [
                '29" UltraWide Monitor',
                'Workstation Core',
                'Ergonomic Chair Lite',
            ],
        },
        {
            id: 'package-entrepreneur',
            name: "The Entrepreneur's Setup",
            description: 'Premium setup for serious entrepreneurs who demand the best workspace.',
            price: 3670000,
            image: '/packages/Rental Bali3.webp.webp',
            items: [
                '34" UltraWide Monitor',
                'Workstation Plus',
                '360 Laptop Stand',
                'Ergonomic Chair Plus',
            ],
        },
        {
            id: 'package-pro',
            name: 'The Pro Workspace',
            description: 'Ultimate dual-monitor setup for maximum productivity and efficiency.',
            price: 7990000,
            image: '/packages/Rental Bali4.webp',
            items: [
                '27" 4K Monitor',
                '27" 4K Monitor',
                'Workstation Pro',
                'MX Master Combo',
                'Ergonomic Chair Pro',
                '8K USB HUB',
            ],
        },
    ];

    for (const pkgData of packagesData) {
        const pkg = await prisma.rentalPackage.create({
            data: {
                name: pkgData.name,
                description: pkgData.description,
                price: pkgData.price,
                imageUrl: pkgData.image,
                images: [pkgData.image, pkgData.image, pkgData.image],
                duration: 30, // Default to monthly
            },
        })
        console.log(`Created package: ${pkg.name}`)

        const itemCounts: Record<string, number> = {};
        for (const itemName of pkgData.items) {
            itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
        }

        for (const [itemName, quantity] of Object.entries(itemCounts)) {
            const product = createdProducts[itemName];
            if (product) {
                await prisma.rentalPackageItem.create({
                    data: {
                        rentalPackageId: pkg.id,
                        productId: product.id,
                        quantity: quantity
                    }
                })
                console.log(`  - Added ${quantity}x ${itemName}`)
            } else {
                console.warn(`  ! Item not found: ${itemName}`)
            }
        }
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
