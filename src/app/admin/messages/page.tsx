import { Card, CardContent } from '@/components/ui/card'
import { UnifiedMessagingHub } from '@/components/chat/UnifiedMessagingHub'

export default function AdminMessagesPage() {
    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Message Center</h1>
                    <p className="text-muted-foreground mt-1">Manage communications with users and workers</p>
                </div>
            </div>

            <Card className="h-[calc(100vh-250px)] flex flex-col overflow-hidden rounded-2xl border-primary/10 shadow-xl shadow-primary/5">
                <CardContent className="p-6 flex-1 overflow-hidden">
                    <UnifiedMessagingHub />
                </CardContent>
            </Card>
        </div>
    )
}
