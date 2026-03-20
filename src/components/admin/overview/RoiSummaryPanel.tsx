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
            case 'totalEarned': return 'Total Earned'
            case 'monthlyRevenue': return 'Monthly Revenue'
            case 'installment': return 'Installments Breakdown'
            case 'netCashflow': return 'Net Cashflow'
            default: return 'Details'
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
                    <p className="text-xs text-muted-foreground italic font-medium">Click on cards below to view granular item-by-item reports</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-orange-500/30 text-orange-600 bg-orange-500/5">
                    {roi.coverage_percentage.toFixed(0)}% Coverage
                </Badge>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {/* Total Earned Card */}
                <Card 
                    className="bg-card/50 backdrop-blur-sm border border-emerald-500/10 hover:border-emerald-500/30 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => setOpenMetric('totalEarned')}
                >
                    <CardContent className="p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Landmark className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-[10px] uppercase font-black tracking-wider">Total Earned</span>
                        </div>
                        <p className="text-lg font-black text-emerald-600">{formatCurrency(roi.total_earned)}</p>
                    </CardContent>
                </Card>

                {/* Monthly Revenue Card */}
                <Card 
                    className="bg-card/50 backdrop-blur-sm border border-blue-500/10 hover:border-blue-500/30 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => setOpenMetric('monthlyRevenue')}
                >
                    <CardContent className="p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-[10px] uppercase font-black tracking-wider">Monthly Rev</span>
                        </div>
                        <p className="text-lg font-black text-blue-600">{formatCurrency(roi.monthly_revenue)}</p>
                    </CardContent>
                </Card>

                {/* Installments Card */}
                <Card 
                    className="bg-card/50 backdrop-blur-sm border border-red-500/10 hover:border-red-500/30 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => setOpenMetric('installment')}
                >
                    <CardContent className="p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-[10px] uppercase font-black tracking-wider">Installments</span>
                        </div>
                        <p className="text-lg font-black text-red-600">{formatCurrency(roi.total_installment)}</p>
                    </CardContent>
                </Card>

                {/* Net Cashflow Card */}
                <Card 
                    className="bg-card/50 backdrop-blur-sm border border-orange-500/10 hover:border-orange-500/30 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => setOpenMetric('netCashflow')}
                >
                    <CardContent className="p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Percent className="h-3.5 w-3.5 text-orange-600" />
                            <span className="text-[10px] uppercase font-black tracking-wider">Net Cashflow</span>
                        </div>
                        <p className={`text-lg font-black ${roi.net_cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(roi.net_cashflow)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Granular Item Breakdown Dialog */}
            <Dialog open={openMetric !== null} onOpenChange={(open) => !open && setOpenMetric(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                    <DialogHeader className="pb-2 border-b">
                        <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
                            <span>{openMetric ? getMetricTitle(openMetric) : "Breakdown"}</span>
                            <Badge variant="secondary" className="text-xs">{roi.itemsBreakdown?.length || 0} items</Badge>
                        </DialogTitle>
                        <DialogDescription className="text-xs font-medium italic">
                            Sorted descending by itemized allocation
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 mt-2">
                        <div className="px-1">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[45%] text-[10px] font-black uppercase">Equipment Name</TableHead>
                                        <TableHead className="w-[30%] text-[10px] font-black uppercase">Serial Code</TableHead>
                                        <TableHead className="w-[25%] text-[10px] font-black uppercase text-right">Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedItems.map((item: any) => {
                                        const value = item[openMetric || 'totalEarned'] || 0
                                        return (
                                            <TableRow key={item.id} className="hover:bg-muted/30">
                                                <TableCell className="font-bold text-sm tracking-tight">{item.name}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs font-mono">{item.serialCode || "N/A"}</TableCell>
                                                <TableCell className={`text-right font-black ${value >= 0 ? getMetricColor(openMetric || '') : 'text-red-600'}`}>
                                                    {formatCurrency(value)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {sortedItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">No tracked unit data available</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    )
}
