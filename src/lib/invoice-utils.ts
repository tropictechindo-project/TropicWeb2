import { db } from '@/lib/db'
import { calculateETA } from '@/lib/google-maps'

/**
 * Calculate invoice totals with 2% tax (excluding delivery fee)
 * Delivery Fee: IDR 10.000 per KM, with a minimum of IDR 100.000
 */
export function calculateInvoiceTotals(
    subtotal: number,
    distanceKm: number = 0,
    deliveryFeeOverride?: number,
    discountPercentage: number = 0
) {
    const taxRate = 0.02 // 2%

    // Delivery Fee: IDR 100.000 per 10 KM, Minimum IDR 100.000
    const calculatedDeliveryFee = Math.max(100000, Math.ceil(distanceKm / 10) * 100000)
    const finalDeliveryFee = deliveryFeeOverride !== undefined ? deliveryFeeOverride : calculatedDeliveryFee

    const discountAmount = subtotal * (discountPercentage / 100)
    const subtotalAfterDiscount = subtotal - discountAmount
    const tax = subtotalAfterDiscount * taxRate
    const total = subtotalAfterDiscount + tax + finalDeliveryFee

    return {
        subtotal,
        discountPercentage,
        discountAmount,
        tax,
        taxRate,
        deliveryFee: finalDeliveryFee,
        distanceKm,
        total
    }
}

/**
 * Generate shareable token for public invoice links
 */
export function generateShareableToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let token = ''
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
}

/**
 * Create or update invoice for an order
 */
export async function createInvoiceForOrder(orderId: string, deliveryFeeOverride?: number, discountPercentage: number = 0) {
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            rentalItems: {
                include: {
                    variant: { include: { product: true } },
                    rentalPackage: true
                }
            }
        }
    })

    if (!order) {
        throw new Error('Order not found')
    }

    // Calculate distance if coordinates are available
    let distanceKm = 0
    const lat = (order as any).locationLatitude
    const lng = (order as any).locationLongitude

    if (lat && lng) {
        const warehouse = {
            lat: Number(process.env.MAP_DEFAULT_CENTER_LAT || -8.65),
            lng: Number(process.env.MAP_DEFAULT_CENTER_LNG || 115.216)
        }
        const mapsRes = await calculateETA(warehouse, { lat, lng })
        if ('distance_meters' in mapsRes && mapsRes.distance_meters) {
            distanceKm = mapsRes.distance_meters / 1000
        }
    }

    // Calculate totals
    const { subtotal, tax, taxRate, deliveryFee, total, discountAmount, discountPercentage: finalDiscountPct } = calculateInvoiceTotals(
        parseFloat(order.subtotal.toString()),
        distanceKm,
        deliveryFeeOverride,
        discountPercentage
    )

    // Check if invoice already exists
    const existingInvoice = await db.invoice.findFirst({
        where: { orderId }
    })

    if (existingInvoice) {
        // Update existing invoice
        return await db.invoice.update({
            where: { id: existingInvoice.id },
            data: {
                subtotal,
                discountPercentage: finalDiscountPct,
                discountAmount,
                tax,
                taxRate,
                deliveryFee,
                deliveryFeeOverride,
                total
            }
        })
    }

    // Generate invoice number
    const invoiceCount = await db.invoice.count()
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`

    // Create new invoice
    return await db.invoice.create({
        data: {
            invoiceNumber,
            orderId,
            userId: order.userId,
            subtotal,
            discountPercentage: finalDiscountPct,
            discountAmount,
            tax,
            taxRate,
            deliveryFee,
            deliveryFeeOverride,
            total,
            currency: order.currency || 'IDR',
            shareableToken: generateShareableToken(),
            status: 'SENT'
        }
    })
}

/**
 * Get invoice recipient emails (user, workers, admin)
 */
export async function getInvoiceRecipients(invoice: any) {
    const recipients: string[] = []

    // Add user email if exists
    if (invoice.user?.email) {
        recipients.push(invoice.user.email)
    } else if (invoice.guestEmail) {
        recipients.push(invoice.guestEmail)
    }

    // Add all active workers
    const workers = await db.user.findMany({
        where: {
            role: 'WORKER',
            isActive: true
        },
        select: { email: true }
    })
    recipients.push(...workers.map(w => w.email))

    // Add team emails from env
    const teamEmails = process.env.SMTP_TEAM_EMAILS?.split(',') || ['contact@tropictech.online']
    recipients.push(...teamEmails)

    // Remove duplicates
    return Array.from(new Set(recipients))
}
