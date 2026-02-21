import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const packages = await db.rentalPackage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        rentalPackageItems: {
          include: {
            product: true,
          },
        },
      },
    })
    const formattedPackages = packages.map(pkg => ({
      ...pkg,
      price: Number(pkg.price),
      items: pkg.rentalPackageItems.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity || 0,
        product: item.product // Keep for compatibility
      }))
    }))
    return NextResponse.json({ packages: formattedPackages })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { name, description, price, duration, imageUrl, items } = data

    const rentalPackage = await db.rentalPackage.create({
      data: {
        name,
        description,
        price,
        duration,
        imageUrl,
        rentalPackageItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        rentalPackageItems: true,
      },
    })

    const formattedPackage = {
      ...rentalPackage,
      price: Number(rentalPackage.price),
      items: rentalPackage.rentalPackageItems.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity || 0,
      }))
    }

    return NextResponse.json({ package: formattedPackage }, { status: 201 })
  } catch (error) {
    console.error('Error creating package:', error)
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
  }
}
