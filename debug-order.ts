import { db } from './src/lib/db'

async function debug() {
    try {
        console.log("Triggering test checkout on DB transaction simulation Node flawless safely...")
        // Mimic the tx from orders/route
        await db.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
                    status: 'AWAITING_PAYMENT',
                    subtotal: 1000,
                    tax: 0,
                    deliveryFee: 100000,
                    totalAmount: 101000,
                    paymentMethod: 'WISE',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    duration: 30,
                    userId: null,
                    deliveryAddress: 'Test Address'
                }
            })
            console.log("Order created:", newOrder.id)
            
            const anyTx = tx as any
            await anyTx.orderItem.create({
                data: {
                    orderId: newOrder.id,
                    nameSnapshot: 'Test Item',
                    price: 1000,
                    quantity: 1,
                    rentalStart: new Date(),
                    rentalEnd: new Date()
                }
            })
            console.log("OrderItem created items.")

            const newInvoice = await tx.invoice.create({
                data: {
                    invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
                    orderId: newOrder.id,
                    status: 'PENDING',
                    subtotal: 1000,
                    tax: 0,
                    deliveryFee: 100000,
                    total: 101000,
                    currency: 'IDR',
                    paymentMethod: 'WISE',
                    deliveryAddress: 'Test Address',
                    userId: null,
                    guestName: 'Test Name',
                    guestEmail: 'test@example.com',
                    guestWhatsapp: '12345',
                    guestAddress: 'Test Address',
                    lineItems: []
                }
            })
            console.log("Invoice created:", newInvoice.id)
        })
        console.log("Transaction SUCCESS Node flawless safely!")
    } catch (e: any) {
        console.error("FAIL:", e.message, e)
    }
}

debug()
