import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rentalPackage = await db.rentalPackage.findUnique({
      where: { id },
      include: {
        rentalPackageItems: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!rentalPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    const formattedPackage = {
      ...rentalPackage,
      price: Number(rentalPackage.price),
      items: rentalPackage.rentalPackageItems.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity || 0,
        product: item.product
      }))
    }

    return NextResponse.json({ package: formattedPackage })
  } catch (error) {
    console.error('Error fetching package:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const { name, description, price, duration, imageUrl, items } = data

    // Use a transaction to ensure atomicity
    const rentalPackage = await db.$transaction(async (tx) => {
      // 1. Delete existing items
      await tx.rentalPackageItem.deleteMany({
        where: { rentalPackageId: id },
      })

      // 2. Update package and recreate items
      return await tx.rentalPackage.update({
        where: { id },
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

    return NextResponse.json({ package: formattedPackage })
  } catch (error) {
    console.error('Error updating package:', error)
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.rentalPackage.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Package deleted' })
  } catch (error) {
    console.error('Error deleting package:', error)
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
  }
}
