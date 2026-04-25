import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function RoiSkeleton() {
    return (
        <Card className="border-primary/10 bg-muted/5">
            <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48 opacity-50" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-3 w-16 opacity-50" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ))}
                </div>
                <Skeleton className="h-[200px] w-full rounded-xl" />
            </CardContent>
        </Card>
    )
}

export function ChartsSkeleton() {
    return (
        <Card className="border-border/50">
            <CardHeader>
                <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="h-[300px] w-full flex items-end gap-2 px-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton 
                            key={i} 
                            className="flex-1 rounded-t-lg" 
                            style={{ height: `${20 + Math.random() * 60}%` }} 
                        />
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                </div>
            </CardContent>
        </Card>
    )
}

export function StatCardsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-24 mb-1" />
                        <Skeleton className="h-3 w-32 opacity-50" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
