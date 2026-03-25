'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Percent, Calendar, Landmark } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ItemBreakdown {
    id: string
    name: string
    serialCode: string
    totalEarned: number
    monthlyRevenue: number
    installment: number
    netCashflow: number
    purchasePrice?: number
    installmentRemaining?: number
}

interface RoiStats {
    total_units: number
    tracked_units: number
    coverage_percentage: number
    total_earned: number
    monthly_revenue: number
    total_installment: number
    net_cashflow: number
    itemsBreakdown?: ItemBreakdown[]
}

export function RoiSummaryPanel({ roi }: { roi: RoiStats }) {
    const [openMetric, setOpenMetric] = useState<string | null>(null)

    if (!roi) return null

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
    }

    const getMetricTitle = (metric: string) => {
        switch (metric) {
            case 'totalEarned': return 'Total Revenue Accumulation'
            case 'monthlyRevenue': return 'Monthly Performance'
            case 'installment': return 'Fixed Costs / Installments'
            case 'netCashflow': return 'Net Yield (Cashflow)'
            default: return 'Asset Detailed Reports'
        }
    }

    const getMetricColor = (metric: string) => {
        switch (metric) {
            case 'totalEarned': return 'text-emerald-600'
            case 'monthlyRevenue': return 'text-blue-600'
            case 'installment': return 'text-red-600'
            case 'netCashflow': return 'text-orange-600'
            default: return 'text-foreground'
        }
    }

    const sortedItems = roi.itemsBreakdown 
        ? [...roi.itemsBreakdown].sort((a: any, b: any) => (b[openMetric || 'totalEarned'] || 0) - (a[openMetric || 'totalEarned'] || 0))
        : []

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-black tracking-tight uppercase text-orange-600">Tracked Asset ROI</h3>
                    <p className="text-xs text-muted-foreground italic font-medium">Click on cards to view deep-dive equipment reports & projections</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-orange-500/30 text-orange-600 bg-orange-500/5">
                    {roi.coverage_percentage.toFixed(0)}% Unit Coverage
                </Badge>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {/* Total Earned Card */}
                <Card 
                    className="bg-card/50 backdrop-blur-md border border-emerald-500/10 hover:border-emerald-500/30 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] group"
                    onClick={() => setOpenMetric('totalEarned')}
                >
                    <CardContent className="p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-emerald-600 transition-colors">
                            <Landmark className="h-3.5 w-3.5" />
                            <span className="text-[10px] uppercase font-black tracking-wider">Total Earned</span>
                        </div>
                        <p className="text-xl font-black text-emerald-600">{formatCurrency(roi.total_earned)}</p>
                    </CardContent>
                </Card>

                {/* Monthly Revenue Card */}
                <Card 
                    className="bg-card/50 backdrop-blur-md border border-blue-500/10 hover:border-blue-500/30 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] group"
                    onClick={() => setOpenMetric('monthlyRevenue')}
                >
                    <CardContent className="p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-blue-600 transition-colors">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-[10px] uppercase font-black tracking-wider">Monthly Rev</span>
                        </div>
                        <p className="text-xl font-black text-blue-600">{formatCurrency(roi.monthly_revenue)}</p>
                    </CardContent>
                </Card>

                {/* Installments Card */}
                <Card 
                    className="bg-card/50 backdrop-blur-md border border-red-500/10 hover:border-red-500/30 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] group"
                    onClick={() => setOpenMetric('installment')}
                >
                    <CardContent className="p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-red-600 transition-colors">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span className="text-[10px] uppercase font-black tracking-wider">Installments</span>
                        </div>
                        <p className="text-xl font-black text-red-600">{formatCurrency(roi.total_installment)}</p>
                    </CardContent>
                </Card>

                {/* Net Cashflow Card */}
                <Card 
                    className="bg-card/50 backdrop-blur-md border border-orange-500/10 hover:border-orange-500/30 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] group"
                    onClick={() => setOpenMetric('netCashflow')}
                >
                    <CardContent className="p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-orange-600 transition-colors">
                            <Percent className="h-3.5 w-3.5" />
                            <span className="text-[10px] uppercase font-black tracking-wider">Monthly Yield</span>
                        </div>
                        <p className={`text-xl font-black ${roi.net_cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(roi.net_cashflow)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Granular Item Breakdown Dialog */}
            <Dialog open={openMetric !== null} onOpenChange={(open) => !open && setOpenMetric(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-orange-500/20">
                    <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <span className={getMetricColor(openMetric || '')}>{openMetric ? getMetricTitle(openMetric) : "Breakdown"}</span>
                                    <Badge className="bg-orange-600 text-white border-none text-[10px] font-black">{roi.itemsBreakdown?.length || 0} ASSETS</Badge>
                                </DialogTitle>
                                <DialogDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    Full financial transparency for each tracked equipment unit
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="bg-orange-500/5 px-6 py-2 border-b flex items-center justify-between text-[10px] font-black uppercase tracking-tighter text-orange-700">
                        <span>Equipment Hierarchy</span>
                        <div className="flex gap-4">
                            <span>Total ROI Coverage: {roi.coverage_percentage.toFixed(1)}%</span>
                            <span>System Status: Real-time</span>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6 pt-2">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b-2">
                                        <TableHead className="w-[30%] text-[10px] font-black uppercase text-foreground">Item Specification</TableHead>
                                        <TableHead className="w-[15%] text-[10px] font-black uppercase text-foreground text-center">ROI Progress</TableHead>
                                        <TableHead className="w-[15%] text-[10px] font-black uppercase text-foreground text-right">Purchase</TableHead>
                                        <TableHead className="w-[20%] text-[10px] font-black uppercase text-foreground text-right">Remaining Install.</TableHead>
                                        <TableHead className="w-[20%] text-[10px] font-black uppercase text-foreground text-right">Metric Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedItems.map((item: any) => {
                                        const value = item[openMetric || 'totalEarned'] || 0
                                        const roiProgress = item.purchasePrice > 0 
                                            ? Math.min(100, (item.totalEarned / item.purchasePrice) * 100)
                                            : 0
                                        
                                        return (
                                            <TableRow key={item.id} className="hover:bg-orange-500/5 group transition-colors border-b border-orange-500/5">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-foreground uppercase tracking-tight">{item.name}</span>
                                                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{item.serialCode || "NO-SERIAL-TAG"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full transition-all duration-500 ${roiProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${roiProgress}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-[9px] font-black ${roiProgress >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                            {roiProgress.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-xs font-bold text-muted-foreground">{formatCurrency(item.purchasePrice || 0)}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={`text-xs font-bold ${item.installmentRemaining > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {item.installmentRemaining > 0 ? formatCurrency(item.installmentRemaining) : "PAID OFF"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-sm font-black ${value >= 0 ? getMetricColor(openMetric || '') : 'text-red-600'}`}>
                                                            {formatCurrency(value)}
                                                        </span>
                                                        <span className="text-[9px] font-medium text-muted-foreground italic">
                                                            {openMetric === 'netCashflow' && (value > 0 ? "Profitable" : "Deficit")}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {sortedItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="p-3 bg-muted rounded-full">
                                                        <Landmark className="h-6 w-6 text-muted-foreground/50" />
                                                    </div>
                                                    <p>Strategic asset data currently unavailable</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                    <div className="p-4 bg-muted/20 border-t flex justify-end">
                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-muted-foreground/20">
                            Closing report verified by system
                        </Badge>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

