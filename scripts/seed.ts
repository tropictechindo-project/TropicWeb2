import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth/utils'

async function seed() {
  try {
    // Create default admin account
    const adminPassword = await hashPassword('Bayu123')
    const admin = await db.user.upsert({
      where: { email: 'tropictechindo@gmail.com' },
      update: {},
      create: {
        username: 'admin',
        password: adminPassword,
        email: 'tropictechindo@gmail.com',
        fullName: 'Tropic Tech Admin',
        whatsapp: '+6282266574860',
        role: 'ADMIN',
      },
    })

    console.log('✅ Created admin account:', admin.username)

    // Create sample products - Desks
    const desk1 = await db.product.create({
      data: {
        name: 'Standing Desk',
        description: 'Adjustable height standing desk with cable management. Perfect for digital nomads who want to alternate between sitting and standing.',
        category: 'Desks',
        imageUrl: '',
        monthlyPrice: 500000,
        stock: 15,
      },
    })

    const desk2 = await db.product.create({
      data: {
        name: 'Executive Desk',
        description: 'Spacious executive desk with drawers. Ideal for serious work sessions.',
        category: 'Desks',
        imageUrl: '',
        monthlyPrice: 400000,
        stock: 20,
      },
    })

    const desk3 = await db.product.create({
      data: {
        name: 'Compact Desk',
        description: 'Space-saving compact desk perfect for small workspaces.',
        category: 'Desks',
        imageUrl: '',
        monthlyPrice: 300000,
        stock: 25,
      },
    })

    console.log('✅ Created desks')

    // Create sample products - Monitors
    const monitor1 = await db.product.create({
      data: {
        name: '27" 4K Monitor',
        description: 'Ultra HD display with perfect color accuracy. Great for designers and developers.',
        category: 'Monitors',
        imageUrl: '',
        monthlyPrice: 400000,
        stock: 20,
      },
    })

    const monitor2 = await db.product.create({
      data: {
        name: '24" Full HD Monitor',
        description: 'Crystal clear 1080p display for everyday productivity.',
        category: 'Monitors',
        imageUrl: '',
        monthlyPrice: 250000,
        stock: 30,
      },
    })

    const monitor3 = await db.product.create({
      data: {
        name: '32" Curved Monitor',
        description: 'Immersive curved display for an enhanced viewing experience.',
        category: 'Monitors',
        imageUrl: '',
        monthlyPrice: 500000,
        stock: 10,
      },
    })

    console.log('✅ Created monitors')

    // Create sample products - Chairs
    const chair1 = await db.product.create({
      data: {
        name: 'Ergonomic Office Chair',
        description: 'Fully adjustable ergonomic chair with lumbar support. Work in comfort all day.',
        category: 'Chairs',
        imageUrl: '',
        monthlyPrice: 300000,
        stock: 25,
      },
    })

    const chair2 = await db.product.create({
      data: {
        name: 'Mesh Chair',
        description: 'Breathable mesh chair with modern design. Stay cool while you work.',
        category: 'Chairs',
        imageUrl: '',
        monthlyPrice: 250000,
        stock: 30,
      },
    })

    const chair3 = await db.product.create({
      data: {
        name: 'Executive Leather Chair',
        description: 'Premium leather chair for the ultimate comfort experience.',
        category: 'Chairs',
        imageUrl: '',
        monthlyPrice: 400000,
        stock: 10,
      },
    })

    console.log('✅ Created chairs')

    // Create sample products - Keyboard & Mouse
    const keyboard1 = await db.product.create({
      data: {
        name: 'Mechanical Keyboard',
        description: 'Clicky mechanical keyboard for responsive typing.',
        category: 'Keyboard & Mouse',
        imageUrl: '',
        monthlyPrice: 100000,
        stock: 40,
      },
    })

    const keyboard2 = await db.product.create({
      data: {
        name: 'Wireless Keyboard & Mouse Set',
        description: 'Wireless combo with reliable performance.',
        category: 'Keyboard & Mouse',
        imageUrl: '',
        monthlyPrice: 80000,
        stock: 35,
      },
    })

    const mouse1 = await db.product.create({
      data: {
        name: 'Ergonomic Mouse',
        description: 'Designed to reduce strain during long work sessions.',
        category: 'Keyboard & Mouse',
        imageUrl: '',
        monthlyPrice: 50000,
        stock: 50,
      },
    })

    console.log('✅ Created keyboards and mice')

    // Create sample products - Accessories
    const laptopStand = await db.product.create({
      data: {
        name: 'Adjustable Laptop Stand',
        description: 'Ergonomic laptop stand for better posture and cooling.',
        category: 'Accessories',
        imageUrl: '',
        monthlyPrice: 75000,
        stock: 30,
      },
    })

    const webcam = await db.product.create({
      data: {
        name: 'HD Webcam',
        description: 'High definition webcam for video conferences and meetings.',
        category: 'Accessories',
        imageUrl: '',
        monthlyPrice: 100000,
        stock: 25,
      },
    })

    const headset = await db.product.create({
      data: {
        name: 'Noise Cancelling Headset',
        description: 'Premium headset with active noise cancellation.',
        category: 'Accessories',
        imageUrl: '',
        monthlyPrice: 120000,
        stock: 20,
      },
    })

    const deskLamp = await db.product.create({
      data: {
        name: 'LED Desk Lamp',
        description: 'Adjustable LED lamp with multiple brightness levels.',
        category: 'Accessories',
        imageUrl: '',
        monthlyPrice: 50000,
        stock: 35,
      },
    })

    console.log('✅ Created accessories')

    // Create sample packages
    const starterPackage = await db.package.create({
      data: {
        name: 'Starter Package',
        description: 'Everything you need to get started working remotely in Bali.',
        imageUrl: '',
        price: 700000,
        duration: 30,
        items: {
          create: [
            { productId: desk1.id, quantity: 1 },
            { productId: chair1.id, quantity: 1 },
            { productId: monitor1.id, quantity: 1 },
          ],
        },
      },
    })

    const professionalPackage = await db.package.create({
      data: {
        name: 'Professional Package',
        description: 'Complete professional workstation setup for power users.',
        imageUrl: '',
        price: 1200000,
        duration: 30,
        items: {
          create: [
            { productId: desk2.id, quantity: 1 },
            { productId: chair3.id, quantity: 1 },
            { productId: monitor3.id, quantity: 1 },
            { productId: keyboard1.id, quantity: 1 },
            { productId: mouse1.id, quantity: 1 },
          ],
        },
      },
    })

    const digitalNomadPackage = await db.package.create({
      data: {
        name: 'Digital Nomad Package',
        description: 'Ultimate setup for the traveling professional.',
        imageUrl: '',
        price: 2000000,
        duration: 30,
        items: {
          create: [
            { productId: desk1.id, quantity: 1 },
            { productId: chair1.id, quantity: 1 },
            { productId: monitor1.id, quantity: 2 },
            { productId: keyboard2.id, quantity: 1 },
            { productId: laptopStand.id, quantity: 1 },
            { productId: webcam.id, quantity: 1 },
            { productId: headset.id, quantity: 1 },
            { productId: deskLamp.id, quantity: 1 },
          ],
        },
      },
    })

    console.log('✅ Created packages')
    console.log('✅ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

seed()
  .then(() => {
    console.log('Seed completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
