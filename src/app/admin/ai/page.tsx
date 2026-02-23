import { db } from "@/lib/db"
import { AiDashboardClient } from "@/components/admin/ai"

export const dynamic = 'force-dynamic'

export default async function AiAdminPage() {
    const agents = await db.aiAgent.findMany({
        include: { permissions: true },
        orderBy: { systemName: 'asc' }
    })

    const pendingActions = await db.aiAction.findMany({
        where: { status: 'PENDING' },
        include: { agent: true },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight uppercase font-black italic">AI <span className="text-primary italic">Ecosystem</span></h2>
                    <p className="text-muted-foreground text-sm font-medium">Mutation-safe artificial intelligence integrated with administrative control.</p>
                </div>
            </div>

            <AiDashboardClient
                initialAgents={agents}
                initialPendingActions={pendingActions}
            />
        </div>
    )
}

