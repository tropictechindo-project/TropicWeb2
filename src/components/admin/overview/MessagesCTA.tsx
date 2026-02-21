'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export function MessagesCTA() {
    const router = useRouter()

    return (
        <Card
            className="hover:shadow-md transition-shadow cursor-pointer border-primary/20 bg-primary/5"
            onClick={() => router.push('/admin/messages')}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Message Center</CardTitle>
                <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-primary">Chat</div>
                <p className="text-xs text-muted-foreground">Manage user conversations</p>
            </CardContent>
        </Card>
    )
}
