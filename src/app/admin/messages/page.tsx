import { Card, CardContent } from '@/components/ui/card'
import { UnifiedMessagingHub } from '@/components/chat/UnifiedMessagingHub'
import { AiSellerLogs } from '@/components/admin/AiSellerLogs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Bot } from 'lucide-react'

export default function AdminMessagesPage() {
    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary tracking-tight uppercase italic">Neural Message Center</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Manage human and AI transmissions across the island.</p>
                </div>
            </div>

            <Tabs defaultValue="ai" className="w-full">
                <TabsList className="bg-zinc-200/50 border border-zinc-200 p-1.5 rounded-2xl mb-8 flex items-center gap-2 w-fit">
                    <TabsTrigger value="ai" className="rounded-xl px-8 py-2.5 text-zinc-500 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-lg transition-all flex items-center gap-2 border border-transparent data-[state=active]:border-zinc-100">
                        <Bot className="h-4 w-4" /> AI Seller Logs
                    </TabsTrigger>
                    <TabsTrigger value="human" className="rounded-xl px-8 py-2.5 text-zinc-500 font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-lg transition-all flex items-center gap-2 border border-transparent data-[state=active]:border-zinc-100">
                        <MessageSquare className="h-4 w-4" /> Human Interactions
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="outline-none">
                    <div className="h-[calc(100vh-280px)] overflow-hidden">
                        <AiSellerLogs />
                    </div>
                </TabsContent>

                <TabsContent value="human" className="outline-none">
                    <Card className="h-[calc(100vh-280px)] flex flex-col overflow-hidden rounded-[2.5rem] border-zinc-200 bg-white shadow-xl shadow-zinc-200/50">
                        <CardContent className="p-6 flex-1 overflow-hidden">
                            <UnifiedMessagingHub />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
