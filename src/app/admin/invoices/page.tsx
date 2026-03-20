import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

import { InvoicesClient } from "@/components/admin/invoices/InvoicesClient"

export default async function AdminInvoicesPage() {
    const invoices = await db.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: true,
            order: {
                include: {
                    rentalItems: {
                        include: {
                            variant: { include: { product: true } },
                            rentalPackage: true
                        }
                    }
                }
            }
        }
    })

    const users = await db.user.findMany({
        orderBy: { fullName: 'asc' }
    })

    const products = await db.product.findMany({
        select: { id: true, name: true, monthlyPrice: true },
        orderBy: { name: 'asc' }
    })

    const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        monthlyPrice: Number(p.monthlyPrice)
    }))

    const formattedInvoices = invoices.map(inv => ({


        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt?.toISOString() || new Date().toISOString(),
        customerName: inv.user?.fullName || inv.guestName || "Unknown",
        customerEmail: inv.user?.email || inv.guestEmail || "No Email",
        customerWhatsApp: inv.user?.whatsapp || inv.guestWhatsapp,
        total: Number(inv.total),
        status: inv.status,
        orderNumber: inv.order?.orderNumber || "MANUAL",
        startDate: inv.order?.startDate?.toISOString() || inv.createdAt?.toISOString() || new Date().toISOString(),
        endDate: inv.order?.endDate?.toISOString() || new Date().toISOString(),
        deliveryAddress: inv.order?.deliveryAddress || inv.guestAddress || '',
        paymentMethod: inv.order?.paymentMethod || inv.paymentMethod || 'MANUAL',
        subtotal: Number(inv.subtotal),
        tax: Number(inv.tax),
        deliveryFee: Number(inv.deliveryFee),
        userId: inv.userId,

        items: inv.order?.rentalItems && inv.order.rentalItems.length > 0
            ? inv.order.rentalItems.map(item => ({
                name: item.variant?.product?.name || item.rentalPackage?.name || "Service Item",
                quantity: item.quantity || 1,
                unitPrice: Number(item.variant?.monthlyPrice || item.variant?.product?.monthlyPrice || item.rentalPackage?.price || inv.total),
                totalPrice: Number(item.variant?.monthlyPrice || item.variant?.product?.monthlyPrice || item.rentalPackage?.price || inv.total) * (item.quantity || 1)
            }))
            : ((inv as any).lineItems ? ((inv as any).lineItems as any[]).map(item => ({
                name: item.name,
                quantity: item.quantity || 1,
                unitPrice: Number(item.price),
                totalPrice: Number(item.price) * (item.quantity || 1)
            })) : [
                    {
                        name: "Manual Service / Rental",
                        quantity: 1,
                        unitPrice: Number(inv.total),
                        totalPrice: Number(inv.total)
                    }
                ])
    }))

    return (
        <div className="space-y-8 p-1">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tight uppercase">Invoice Management</h1>
                <p className="text-muted-foreground">Automated and manual invoice generation with PDF support</p>
            </div>

            <InvoicesClient 
                initialInvoices={formattedInvoices as any} 
                users={users} 
                products={formattedProducts as any} 
            />
        </div>
    )
}


