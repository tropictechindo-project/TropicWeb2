export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col pt-24 bg-background">
            {/* Instant Header Placeholder */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b flex items-center justify-between px-6 z-50">
                <div className="h-6 w-32 bg-muted animate-pulse rounded-lg" />
                <div className="flex gap-4">
                    <div className="h-6 w-16 bg-muted animate-pulse rounded-lg" />
                    <div className="h-6 w-16 bg-muted animate-pulse rounded-lg" />
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center">
                {/* Hero Skeleton */}
                <div className="max-w-3xl w-full text-center space-y-4 mb-12">
                    <div className="h-12 w-3/4 bg-muted animate-pulse rounded-xl mx-auto" />
                    <div className="h-6 w-1/2 bg-muted animate-pulse rounded-xl mx-auto" />
                    <div className="h-10 w-32 bg-muted animate-pulse rounded-xl mx-auto mt-6" />
                </div>

                {/* Grid Skeleton */}
                <div className="grid md:grid-cols-3 gap-6 w-full">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="border rounded-2xl p-6 bg-card space-y-4">
                            <div className="aspect-square w-full bg-muted animate-pulse rounded-xl" />
                            <div className="h-6 w-3/4 bg-muted animate-pulse rounded-lg" />
                            <div className="h-4 w-1/2 bg-muted animate-pulse rounded-lg" />
                            <div className="h-8 w-full bg-muted animate-pulse rounded-lg mt-4" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
