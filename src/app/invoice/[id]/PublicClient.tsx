'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Download,
    Home,
    AtSign,
    Globe,
    FileText,
    ExternalLink,
    ChevronLeft
} from "lucide-react"
import Link from "next/link"
import { generateInvoicePDF } from "@/lib/pdf/invoice"
import { toast } from "sonner"

interface InvoicePublicClientProps {
    invoice: any
}

export function InvoicePublicClient({ invoice }: InvoicePublicClientProps) {
    const handleDownload = () => {
        try {
            const pdf = generateInvoicePDF({
                invoiceNumber: invoice.invoiceNumber,
                invoiceDate: new Date(invoice.date).toLocaleDateString(),
                customerName: invoice.customerName,
                customerEmail: invoice.customerEmail,
                customerWhatsApp: invoice.customerWhatsApp,
                orderNumber: invoice.orderNumber?.substring(0, 8) || "MANUAL",
                startDate: new Date(invoice.startDate).toLocaleDateString(),
                endDate: new Date(invoice.endDate).toLocaleDateString(),
                currency: 'Rp',
                subtotal: invoice.total,
                tax: 0,
                total: invoice.total,
                items: invoice.items,
                isRegistered: !!invoice.userId
            } as any)
            pdf.save(`${invoice.invoiceNumber}.pdf`)
            toast.success("Invoice downloaded")
        } catch (error) {
            console.error(error)
            toast.error("Failed to generate PDF")
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4 pb-24">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <Link href="/">
                        <Button variant="ghost" className="font-bold gap-2 text-muted-foreground hover:text-primary transition-colors">
                            <ChevronLeft className="h-4 w-4" /> BACK TO HOME
                        </Button>
                    </Link>
                    <Button onClick={handleDownload} className="font-black gap-2 shadow-lg shadow-primary/20">
                        <Download className="h-4 w-4" /> DOWNLOAD PDF
                    </Button>
                </div>

                {/* Main Invoice Card */}
                <Card className="border-none shadow-2xl shadow-primary/5 overflow-hidden">
                    <CardHeader className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <FileText className="h-32 w-32" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight uppercase">Invoice</h1>
                                <p className="opacity-80 font-mono text-sm mt-1">{invoice.invoiceNumber}</p>
                            </div>
                            <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-4 py-1 text-xs font-black">
                                STATUS: {invoice.status}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="grid md:grid-cols-2 gap-8 p-8 border-b bg-card">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bill To</h3>
                                <div className="space-y-1">
                                    <p className="font-black text-xl">{invoice.customerName}</p>
                                    <p className="text-sm text-muted-foreground">{invoice.customerEmail}</p>
                                    {invoice.customerWhatsApp && (
                                        <p className="text-sm text-muted-foreground italic">WA: {invoice.customerWhatsApp}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4 md:text-right">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Invoice Details</h3>
                                <div className="space-y-1">
                                    <p className="text-sm flex md:justify-end gap-2">
                                        <span className="text-muted-foreground font-bold italic">Date:</span>
                                        <span className="font-black">{new Date(invoice.date).toLocaleDateString()}</span>
                                    </p>
                                    <p className="text-sm flex md:justify-end gap-2">
                                        <span className="text-muted-foreground font-bold italic">Due:</span>
                                        <span className="font-black">{new Date(invoice.date).toLocaleDateString()}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="p-8">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item Description</th>
                                        <th className="text-center py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qty</th>
                                        <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price</th>
                                        <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item: any, idx: number) => (
                                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="py-6 font-bold">{item.name}</td>
                                            <td className="py-6 text-center font-bold text-muted-foreground">{item.quantity}</td>
                                            <td className="py-6 text-right font-bold text-muted-foreground">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                                            <td className="py-6 text-right font-black">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Summary */}
                        <div className="bg-muted/50 p-8 flex flex-col items-end space-y-2 border-t">
                            <div className="flex justify-between w-full max-w-xs text-sm font-bold italic text-muted-foreground">
                                <span>Subtotal</span>
                                <span>Rp {invoice.total.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-xs text-2xl font-black py-4 border-t border-muted">
                                <span className="uppercase">Total Amount</span>
                                <span className="text-primary">Rp {invoice.total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Approval & Sign-off Section */}
                <div className="bg-muted/20 p-8 rounded-2xl border border-dashed border-muted flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Issued By Authority</p>
                        <p className="text-xl font-black text-primary">PT TROPIC TECH INTERNATIONAL</p>
                        <p className="text-xs font-bold text-muted-foreground italic">Authorized Workstation Rental Company</p>
                    </div>

                    <div className="space-y-1">
                        <div className="h-16 flex items-center justify-center">
                            {invoice.status === 'PAID' ? (
                                <Badge className="bg-green-600 hover:bg-green-600 text-white font-black px-6 py-2 uppercase tracking-tighter text-lg rotate-[-5deg] border-2 border-white shadow-xl">
                                    VERIFIED & PAID
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-muted-foreground/30 font-black px-6 py-2 uppercase tracking-tighter text-lg border-dashed">
                                    PENDING APPROVAL
                                </Badge>
                            )}
                        </div>
                        <div className="text-center">
                            <p className="font-black text-sm uppercase">Wahyudin Damopolii</p>
                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest">PIC APPROVAL</p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-[10px] text-muted-foreground/60 font-medium">
                        &copy; 2026 PT Tropic Tech International. Jl. Tunjungsari No.8, Bali.
                    </p>
                </div>
            </div>
        </div>
    )
}
