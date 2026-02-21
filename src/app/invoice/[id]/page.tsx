import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { InvoicePublicClient } from "./PublicClient"

export default async function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const invoice = await db.invoice.findUnique({
        where: { id },
        include: {
            user: true,
            order: {
                include: {
                    rentalItems: {
                        include: {
                            product: true,
                            rentalPackage: true
                        }
                    }
                }
            }
        }
    })

    if (!invoice) notFound()

    const formattedInvoice = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.createdAt?.toISOString() || new Date().toISOString(),
        customerName: invoice.user?.fullName || invoice.guestName || "Customer",
        customerEmail: invoice.user?.email || invoice.guestEmail || "",
        customerWhatsApp: invoice.user?.whatsapp || invoice.guestWhatsapp,
        total: Number(invoice.total),
        status: invoice.status,
        orderNumber: invoice.order?.orderNumber || "MANUAL",
        startDate: invoice.order?.startDate?.toISOString() || invoice.createdAt?.toISOString(),
        endDate: invoice.order?.endDate?.toISOString() || invoice.createdAt?.toISOString(),
        items: invoice.order?.rentalItems.map(item => ({
            name: item.product?.name || item.rentalPackage?.name || "Service Item",
            quantity: item.quantity || 1,
            unitPrice: Number(item.product?.monthlyPrice || item.rentalPackage?.price || invoice.total),
            totalPrice: Number(invoice.total)
        })) || [
                {
                    name: "Manual Service / Rental",
                    quantity: 1,
                    unitPrice: Number(invoice.total),
                    totalPrice: Number(invoice.total)
                }
            ]
    }

    return <InvoicePublicClient invoice={formattedInvoice as any} />
}
