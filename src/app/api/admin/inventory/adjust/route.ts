import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { verifyToken } from '@/lib/auth/utils'

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        let adminId: string | undefined
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const payload = await verifyToken(token)
            if (payload) adminId = payload.userId
        }

        const body = await request.json()
        const { productId, total, rented, broken } = body

        if (!productId) {
            return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
        }

        const product = await db.product.findUnique({
            where: { id: productId },
            include: {
                productUnits: true
            }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        const currentUnits = product.productUnits
        const currentTotal = currentUnits.length

        await db.$transaction(async (tx) => {
            // 1. Adjust Total Units
            if (total !== undefined && total !== currentTotal) {
                if (total > currentTotal) {
                    // Add units
                    const countToAdd = total - currentTotal
                    const prefix = product.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ITM')
                    const timestamp = Date.now().toString().substring(8)

                    for (let i = 0; i < countToAdd; i++) {
                        const code = `${prefix}-${timestamp}-${Math.floor(Math.random() * 10000)}`
                        await tx.productUnit.create({
                            data: {
                                productId,
                                unitCode: code,
                                status: 'AVAILABLE',
                                purchaseDate: new Date()
                            }
                        })
                    }
                } else {
                    // Remove units (only AVAILABLE ones)
                    const countToRemove = currentTotal - total
                    const availableUnits = currentUnits.filter(u => u.status === 'AVAILABLE')
                    const unitsToDelete = availableUnits.slice(0, countToRemove)

                    await tx.productUnit.deleteMany({
                        where: {
                            id: { in: unitsToDelete.map(u => u.id) }
                        }
                    })
                }
            }

            // Refetch or adjust local count for subsequent steps
            let updatedUnits = await tx.productUnit.findMany({ where: { productId } })

            // 2. Adjust Rented Status (IN_USE)
            if (rented !== undefined) {
                const rentedUnits = updatedUnits.filter(u => u.status === 'IN_USE')
                if (rented > rentedUnits.length) {
                    // Mark some AVAILABLE as IN_USE
                    const needed = rented - rentedUnits.length
                    const availableUnits = updatedUnits.filter(u => u.status === 'AVAILABLE')
                    const toMarkRented = availableUnits.slice(0, needed)

                    await tx.productUnit.updateMany({
                        where: { id: { in: toMarkRented.map(u => u.id) } },
                        data: { status: 'IN_USE' }
                    })
                } else if (rented < rentedUnits.length) {
                    // Mark some IN_USE as AVAILABLE
                    const excess = rentedUnits.length - rented
                    const toMarkAvailable = rentedUnits.slice(0, excess)

                    await tx.productUnit.updateMany({
                        where: { id: { in: toMarkAvailable.map(u => u.id) } },
                        data: { status: 'AVAILABLE' }
                    })
                }
            }

            // Refetch again for Broken adjustment
            updatedUnits = await tx.productUnit.findMany({ where: { productId } })

            // 3. Adjust Broken Status (DAMAGED)
            if (broken !== undefined) {
                const brokenUnits = updatedUnits.filter(u => u.status === 'DAMAGED')
                if (broken > brokenUnits.length) {
                    // Mark some AVAILABLE as DAMAGED
                    const needed = broken - brokenUnits.length
                    const availableUnits = updatedUnits.filter(u => u.status === 'AVAILABLE')
                    const toMarkBroken = availableUnits.slice(0, needed)

                    await tx.productUnit.updateMany({
                        where: { id: { in: toMarkBroken.map(u => u.id) } },
                        data: { status: 'DAMAGED' }
                    })
                } else if (broken < brokenUnits.length) {
                    // Mark some DAMAGED as AVAILABLE
                    const excess = brokenUnits.length - broken
                    const toMarkAvailable = brokenUnits.slice(0, excess)

                    await tx.productUnit.updateMany({
                        where: { id: { in: toMarkAvailable.map(u => u.id) } },
                        data: { status: 'AVAILABLE' }
                    })
                }
            }

            // Final Sync: Update the product's cache stock field (available count)
            const finalAvailable = await tx.productUnit.count({
                where: { productId, status: 'AVAILABLE' }
            })

            await tx.product.update({
                where: { id: productId },
                data: { stock: finalAvailable }
            })
        })

        await logActivity({
            userId: adminId,
            action: 'RECONCILE_INVENTORY',
            entity: 'PRODUCT',
            details: `Reconciled stock for ${product.name}. Total: ${total}, Rented: ${rented}, Broken: ${broken}`
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Inventory Adjustment Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
