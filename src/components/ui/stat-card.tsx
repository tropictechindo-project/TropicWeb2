'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PopupDetail {
    label: string
    value: string | number
    badge?: {
        text: string
        variant?: 'default' | 'secondary' | 'destructive' | 'outline'
        className?: string
    }
}

interface StatCardProps {
    title: string
    value: string | number
    icon: React.ElementType
    color?: string
    bg?: string
    description?: string
    popupDetails?: PopupDetail[]
    trend?: {
        value: string
        positive: boolean
    }
    className?: string
    onClick?: () => void
    href?: string
}

export function StatCardWithPopup({
    title,
    value,
    icon: Icon,
    color = 'text-primary',
    bg = 'bg-primary/10',
    description,
    popupDetails,
    trend,
    className,
    onClick,
}: StatCardProps) {
    const [open, setOpen] = useState(false)

    const hasPopup = !!(description || (popupDetails && popupDetails.length > 0))

    const handleCardClick = () => {
        if (onClick) {
            onClick()
        } else if (hasPopup) {
            setOpen(true)
        }
    }

    return (
        <>
            <Card
                className={cn(
                    'relative overflow-hidden border-none shadow-sm bg-card/50 backdrop-blur-sm transition-all duration-200',
                    hasPopup && 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99]',
                    className
                )}
                onClick={handleCardClick}
            >
                {/* Info indicator — top right corner */}
                {hasPopup && (
                    <div className="absolute top-2 right-2 z-10">
                        <div className="h-4 w-4 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors">
                            <Info className="h-2.5 w-2.5 text-primary/60" />
                        </div>
                    </div>
                )}

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground pr-6">
                        {title}
                    </CardTitle>
                    <div className={cn('p-1.5 rounded-lg flex-shrink-0', bg)}>
                        <Icon className={cn('h-3.5 w-3.5', color)} />
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="text-xl font-black tracking-tight">{value}</div>
                    {trend && (
                        <p className={cn('text-[10px] font-bold mt-1', trend.positive ? 'text-green-500' : 'text-red-500')}>
                            {trend.positive ? '↑' : '↓'} {trend.value}
                        </p>
                    )}
                    {hasPopup && (
                        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-bold mt-2">
                            Tap for details
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Info Popup Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2.5 text-sm font-black uppercase tracking-tighter">
                            <div className={cn('p-2 rounded-xl', bg)}>
                                <Icon className={cn('h-4 w-4', color)} />
                            </div>
                            {title}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Main value display */}
                        <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/40">
                            <div className="text-3xl font-black tracking-tight">{value}</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">{title}</div>
                        </div>

                        {/* Description */}
                        {description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                        )}

                        {/* Breakdown details */}
                        {popupDetails && popupDetails.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Breakdown</p>
                                <div className="divide-y divide-border/40">
                                    {popupDetails.map((detail, i) => (
                                        <div key={i} className="flex items-center justify-between py-2.5">
                                            <span className="text-sm font-medium text-muted-foreground">{detail.label}</span>
                                            <div className="flex items-center gap-2">
                                                {detail.badge ? (
                                                    <Badge
                                                        variant={detail.badge.variant || 'secondary'}
                                                        className={cn('text-[10px] font-black uppercase tracking-wider', detail.badge.className)}
                                                    >
                                                        {detail.badge.text}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm font-black">{detail.value}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
