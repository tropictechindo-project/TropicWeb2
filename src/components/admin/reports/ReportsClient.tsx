'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    Download,
    TrendingUp,
    Calendar,
    DollarSign,
    PieChart as PieChartIcon,
    ArrowUpRight,
    ArrowDownRight,
    ChevronDown,
    FileText,
    FileSpreadsheet,
    Percent,
    Truck
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts'
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ReportsClientProps {
    revenueByMonth: any[]
    categoryData: any[]
    outstandingInvoices: any[]
    paidInvoices: any[]
    financialSummary: {
        totalRevenue: number
        totalTax: number
        totalDelivery: number
        outstanding: number
        growth: number
        averageOrder: number
    }
}

export function ReportsClient({
    revenueByMonth,
    categoryData,
    outstandingInvoices,
    paidInvoices,
    financialSummary
}: ReportsClientProps) {
    const [period, setPeriod] = useState<string>("ALL")

    const getFilteredData = () => {
        if (period === "ALL") return paidInvoices
        const now = new Date()
        let cutoff = new Date()

        switch (period) {
            case "MONTH": cutoff.setMonth(now.getMonth() - 1); break
            case "QUARTER": cutoff.setMonth(now.getMonth() - 3); break
            case "HALF": cutoff.setMonth(now.getMonth() - 6); break
            case "YEAR": cutoff.setFullYear(now.getFullYear() - 1); break
        }

        return paidInvoices.filter(inv => new Date(inv.createdAt) >= cutoff)
    }

    const filteredInvoices = getFilteredData()
    const currentRevenue = filteredInvoices.reduce((acc, inv) => acc + inv.total, 0)
    const currentTax = filteredInvoices.reduce((acc, inv) => acc + inv.tax, 0)
    const currentDelivery = filteredInvoices.reduce((acc, inv) => acc + inv.deliveryFee, 0)

    const dynamicChartData = (() => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const now = new Date()
        const result: { name: string; total: number }[] = []

        let monthsBack = 12
        if (period === 'MONTH') monthsBack = 1
        else if (period === 'QUARTER') monthsBack = 3
        else if (period === 'HALF') monthsBack = 6
        else if (period === 'YEAR') monthsBack = 12
        else monthsBack = 12 // ALL shows last 12 months in chart

        for (let i = monthsBack - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const m = d.getMonth()
            const y = d.getFullYear()
            const label = monthNames[m]

            const total = filteredInvoices.reduce((acc, inv) => {
                const invDate = new Date(inv.createdAt)
                if (invDate.getMonth() === m && invDate.getFullYear() === y) {
                    return acc + inv.total
                }
                return acc
            }, 0)

            result.push({ name: label, total })
        }
        return result
    })()

    const handleDownloadPDF = (type: 'REVENUE' | 'TAX' | 'DELIVERY') => {
        const doc = new jsPDF() as any
        const title = `${type.charAt(0) + type.slice(1).toLowerCase()} Report - ${period}`
        doc.setFontSize(18)
        doc.text(title, 20, 20)
        doc.setFontSize(10)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 28)

        let headers = [['Invoice #', 'Date', 'Amount', 'Status']]
        let body = filteredInvoices.map(inv => [
            inv.invoiceNumber,
            new Date(inv.createdAt).toLocaleDateString(),
            `Rp ${inv.total.toLocaleString()}`,
            inv.status
        ])

        if (type === 'TAX') {
            headers = [['Invoice #', 'Date', 'Amount', 'Tax (2%)']]
            body = filteredInvoices.map(inv => [
                inv.invoiceNumber,
                new Date(inv.createdAt).toLocaleDateString(),
                `Rp ${inv.total.toLocaleString()}`,
                `Rp ${inv.tax.toLocaleString()}`
            ])
            doc.text(`Total Tax: Rp ${currentTax.toLocaleString()}`, 20, 38)
        } else if (type === 'DELIVERY') {
            headers = [['Invoice #', 'Date', 'Amount', 'Delivery Fee']]
            body = filteredInvoices.map(inv => [
                inv.invoiceNumber,
                new Date(inv.createdAt).toLocaleDateString(),
                `Rp ${inv.total.toLocaleString()}`,
                `Rp ${inv.deliveryFee.toLocaleString()}`
            ])
            doc.text(`Total Delivery: Rp ${currentDelivery.toLocaleString()}`, 20, 38)
        } else {
            doc.text(`Total Revenue: Rp ${currentRevenue.toLocaleString()}`, 20, 38)
        }

        const rowCount = body.length
        autoTable(doc, {
            startY: 45,
            head: headers,
            body: body,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] }
        })

        doc.save(`${type}_Report_${period}_${Date.now()}.pdf`)
    }

    const handleDownloadCSV = (type: 'REVENUE' | 'TAX' | 'DELIVERY') => {
        let headers = ["Invoice Number", "Date", "Total"]
        let rows = filteredInvoices.map(inv => [
            inv.invoiceNumber,
            new Date(inv.createdAt).toLocaleDateString(),
            inv.total
        ])

        if (type === 'TAX') {
            headers.push("Tax")
            rows = filteredInvoices.map(inv => [inv.invoiceNumber, new Date(inv.createdAt).toLocaleDateString(), inv.total, inv.tax])
        } else if (type === 'DELIVERY') {
            headers.push("Delivery Fee")
            rows = filteredInvoices.map(inv => [inv.invoiceNumber, new Date(inv.createdAt).toLocaleDateString(), inv.total, inv.deliveryFee])
        }

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `${type}_Report_${period}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/20 p-4 rounded-2xl border border-dashed">
                <Tabs value={period} onValueChange={setPeriod} className="w-full md:w-auto">
                    <TabsList className="bg-background shadow-sm border">
                        <TabsTrigger value="MONTH" className="text-[10px] font-black uppercase">Month</TabsTrigger>
                        <TabsTrigger value="QUARTER" className="text-[10px] font-black uppercase">Quarter</TabsTrigger>
                        <TabsTrigger value="HALF" className="text-[10px] font-black uppercase">Half Year</TabsTrigger>
                        <TabsTrigger value="YEAR" className="text-[10px] font-black uppercase">One Year</TabsTrigger>
                        <TabsTrigger value="ALL" className="text-[10px] font-black uppercase">All Time</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="default" className="font-black text-xs gap-2">
                                <Download className="h-4 w-4" /> EXPORT REPORTS <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => handleDownloadPDF('REVENUE')} className="gap-2 font-bold py-3">
                                <FileText className="h-4 w-4 text-blue-600" /> Revenue (PDF)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadCSV('REVENUE')} className="gap-2 font-bold py-3 border-b">
                                <FileSpreadsheet className="h-4 w-4 text-green-600" /> Revenue (CSV)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF('TAX')} className="gap-2 font-bold py-3">
                                <Percent className="h-4 w-4 text-orange-600" /> Tax report (PDF)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF('DELIVERY')} className="gap-2 font-bold py-3 border-t">
                                <Truck className="h-4 w-4 text-purple-600" /> Delivery costs (PDF)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary/5 border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-12 w-12" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Period Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">Rp {currentRevenue.toLocaleString('id-ID')}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">{period} PERFORMANCE</div>
                    </CardContent>
                </Card>
                <Card className="border-orange-500/20 bg-orange-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-orange-600/70">WHT Tax (2%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-orange-600">Rp {currentTax.toLocaleString('id-ID')}</div>
                        <div className="flex items-center text-[10px] text-orange-600/70 mt-1 font-bold uppercase underline" onClick={() => handleDownloadPDF('TAX')} style={{ cursor: 'pointer' }}>
                            <Download className="h-3 w-3 mr-1" /> Get Tax Clearance
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-purple-500/20 bg-purple-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-purple-600/70">Delivery Costs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-purple-600">Rp {currentDelivery.toLocaleString('id-ID')}</div>
                        <div className="text-[10px] text-purple-600/70 mt-1 font-bold uppercase">LOGISTICS EXPENSE</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Outstanding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">Rp {financialSummary.outstanding.toLocaleString('id-ID')}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">REVENUE AT RISK</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Revenue Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dynamicChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-[10px] font-bold" />
                                <YAxis tickFormatter={(val) => `Rp${val / 1000000}M`} axisLine={false} tickLine={false} className="text-[10px] font-bold" />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => `Rp ${val.toLocaleString()}`} />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Market Split</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" className="text-xs font-bold uppercase" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Detailed Transactions Log</CardTitle>
                        <span className="text-xs font-bold bg-muted p-1 px-3 rounded-full">{filteredInvoices.length} Entries</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/10">
                            <TableRow>
                                <TableHead className="text-[10px] uppercase font-black px-6">Invoice #</TableHead>
                                <TableHead className="text-[10px] uppercase font-black">Date</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-right">Revenue</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-right">Tax</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-right">Logistics</TableHead>
                                <TableHead className="text-[10px] uppercase font-black px-6 text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.map((inv) => (
                                <TableRow key={inv.id} className="hover:bg-muted/10 transition-colors">
                                    <TableCell className="font-mono font-bold px-6 py-4">{inv.invoiceNumber}</TableCell>
                                    <TableCell className="text-sm font-medium">{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right font-black">Rp {inv.total.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right text-orange-600 font-bold">Rp {inv.tax.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right text-purple-600 font-bold">Rp {inv.deliveryFee.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="px-6 text-center">
                                        <Badge variant="outline" className="text-[10px] font-black border-green-500/30 text-green-600 bg-green-500/5">
                                            {inv.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
