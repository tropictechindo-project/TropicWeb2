'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileDown, Printer, Share2, Calendar, User, Package } from 'lucide-react'
import { toast } from 'sonner'

export default function PublicInvoicePage() {
    const params = useParams()
    const token = params.token as string
    const [invoice, setInvoice] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInvoice()
    }, [token])

    const fetchInvoice = async () => {
        try {
            const res = await fetch(`/api/invoices/public/${token}`)
            if (res.ok) {
                const data = await res.json()
                setInvoice(data)
            } else {
                toast.error('Invoice not found')
            }
        } catch (error) {
            toast.error('Failed to load invoice')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleShare = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url)
        toast.success('Invoice link copied to clipboard')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
                    <p className="text-muted-foreground">This invoice link may be invalid or expired.</p>
                </div>
            </div>
        )
    }

    const customerName = invoice.user?.fullName || invoice.guestName || 'Customer'
    const customerEmail = invoice.user?.email || invoice.guestEmail
    const customerAddress = invoice.user?.baliAddress || invoice.guestAddress

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Action Buttons - Hide on print */}
                <div className="mb-6 flex justify-end gap-2 print:hidden">
                    <Button variant="outline" onClick={handleShare} className="gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                        <Printer className="w-4 h-4" />
                        Print
                    </Button>
                    <Button onClick={handlePrint} className="gap-2">
                        <FileDown className="w-4 h-4" />
                        Download PDF
                    </Button>
                </div>

                {/* Invoice Card */}
                <Card className="p-8 md:p-12 shadow-2xl">
                    {/* Header */}
                    <div className="border-b-4 border-primary pb-8 mb-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-bold text-primary mb-2">INVOICE</h1>
                                <p className="text-xl text-muted-foreground">{invoice.invoiceNumber}</p>
                                <Badge variant="outline" className="mt-2">
                                    {invoice.status}
                                </Badge>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-bold">Tropic Tech</h2>
                                <p className="text-sm text-muted-foreground">Premium Workstation Rentals</p>
                                <p className="text-sm text-muted-foreground mt-2">tropictechindo@gmail.com</p>
                                <p className="text-sm text-muted-foreground">Bali, Indonesia</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Invoice Details */}
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                BILL TO
                            </h3>
                            <p className="font-bold text-lg">{customerName}</p>
                            {customerEmail && <p className="text-sm text-muted-foreground">{customerEmail}</p>}
                            {customerAddress && <p className="text-sm text-muted-foreground mt-1">{customerAddress}</p>}
                        </div>
                        <div className="text-right">
                            <div className="space-y-2">
                                <div className="flex justify-end items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Invoice Date:</span>
                                    <span className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                                </div>
                                {invoice.order && (
                                    <div className="flex justify-end items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Order Number:</span>
                                        <span className="font-medium">{invoice.order.orderNumber}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    {invoice.order?.rentalItems && invoice.order.rentalItems.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-semibold text-sm text-muted-foreground mb-4 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                RENTAL ITEMS
                            </h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="text-left p-4 font-semibold">Item</th>
                                            <th className="text-right p-4 font-semibold">Duration</th>
                                            <th className="text-right p-4 font-semibold">Price</th>
                                            <th className="text-right p-4 font-semibold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.order.rentalItems.map((item: any) => (
                                            <tr key={item.id} className="border-t">
                                                <td className="p-4">
                                                    <p className="font-medium">{item.product?.name || item.rentalPackage?.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className="text-right p-4">{item.duration} days</td>
                                                <td className="text-right p-4">IDR {parseFloat(item.price).toLocaleString()}</td>
                                                <td className="text-right p-4 font-semibold">
                                                    IDR {parseFloat(item.totalPrice).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Totals */}
                    <div className="border-t-2 pt-6">
                        <div className="flex justify-end">
                            <div className="w-full md:w-1/2 space-y-3">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal:</span>
                                    <span>IDR {parseFloat(invoice.subtotal).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Tax (2%):</span>
                                    <span>IDR {parseFloat(invoice.tax).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Delivery Fee:</span>
                                    <span>IDR {parseFloat(invoice.deliveryFee).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-bold text-primary border-t-2 pt-3">
                                    <span>TOTAL:</span>
                                    <span>IDR {parseFloat(invoice.total).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                        <p className="mb-2">Thank you for your business!</p>
                        <p>For questions about this invoice, please contact tropictechindo@gmail.com</p>
                    </div>
                </Card>
            </div>

            <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
        </div>
    )
}
