import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Percent, Calendar, Landmark } from "lucide-react"

interface RoiStats {
    total_units: number
    tracked_units: number
    coverage_percentage: number
    total_earned: number
    monthly_revenue: number
    total_installment: number
    net_cashflow: number
}

export function RoiSummaryPanel({ roi }: { roi: RoiStats }) {
    if (!roi) return null

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-black tracking-tight uppercase text-orange-600">Tracked Asset ROI</h3>
                    <p className="text-xs text-muted-foreground italic font-medium">Read-only aggregations for assigned inventory units</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-orange-500/30 text-orange-600 bg-orange-500/5">
                    {roi.coverage_percentage.toFixed(0)}% Coverage
                </Badge>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="bg-card/50 backdrop-blur-sm border border-emerald-500/10 hover:border-emerald-500/20 transition-all shadow-sm">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Landmark className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-[10px] uppercase font-black tracking-wider">Total Earned</span>
                        </div>
                        <p className="text-lg font-black text-emerald-600">{formatCurrency(roi.total_earned)}</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border border-blue-500/10 hover:border-blue-500/20 transition-all shadow-sm">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-[10px] uppercase font-black tracking-wider">Monthly Rev</span>
                        </div>
                        <p className="text-lg font-black text-blue-600">{formatCurrency(roi.monthly_revenue)}</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border border-red-500/10 hover:border-red-500/20 transition-all shadow-sm">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-[10px] uppercase font-black tracking-wider">Installments</span>
                        </div>
                        <p className="text-lg font-black text-red-600">{formatCurrency(roi.total_installment)}</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border border-orange-500/10 hover:border-orange-500/20 transition-all shadow-sm">
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
        </div>
    )
}
