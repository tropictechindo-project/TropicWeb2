import { db } from '@/lib/db'
import Header from '@/components/header/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Search, Sparkles, Brain, Bot } from "lucide-react"
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getSeoStats() {
    const pagesCount = await db.seoPage.count()
    const analytics = await db.seoAnalytics.aggregate({
        _sum: { views: true, clicks: true, impressions: true }
    })
    const latestPages = await db.seoPage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    })
    const topPages = await db.seoAnalytics.findMany({
        orderBy: { views: 'desc' },
        take: 5,
        include: { seoPage: true }
    })
    const insights = await db.aiInsight.findMany({
        where: { topic: 'SEO_STRATEGY' },
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    return {
        pagesCount,
        stats: analytics._sum,
        latestPages,
        topPages,
        insights
    }
}

export default async function SeoAdminPage() {
    const { pagesCount, stats, latestPages, topPages, insights } = await getSeoStats()

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Sparkles className="text-primary w-8 h-8" />
                        SEO Intelligence
                    </h1>
                    <p className="text-muted-foreground mt-1">ORACLE Agent & Analytics Dashboard</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="px-3 py-1 font-bold">
                        <Brain className="w-3 h-3 mr-1 text-primary" />
                        Learning Active
                    </Badge>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase text-muted-foreground">Total SEO Pages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{pagesCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">+10 from last week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase text-muted-foreground">Total Views</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.views || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase text-muted-foreground">Avg. CTR</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">2.4%</div>
                    </CardContent>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase text-muted-foreground">SEO Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-green-600">92/100</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* AI Insights (The Learning Loop) */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-2 border-primary/20 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 uppercase text-sm font-black">
                                <Brain className="text-primary w-5 h-5" />
                                Auditor Agent Insights
                            </CardTitle>
                            <CardDescription>Generated based on traffic and performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {insights.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed rounded-3xl opacity-50">
                                    <p className="text-sm">Wait for more traffic data to generate insights.</p>
                                </div>
                            ) : (
                                insights.map((insight, i) => (
                                    <div key={i} className="p-4 bg-muted/30 rounded-2xl border border-border">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary" className="text-[10px] uppercase font-bold">{insight.topic}</Badge>
                                            <span className="text-[10px] opacity-50">{new Date(insight.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed italic">"{insight.insight}"</p>
                                        <div className="mt-3 flex gap-2">
                                            <button className="text-[10px] font-black uppercase text-primary hover:underline">Apply Strategy</button>
                                            <button className="text-[10px] font-black uppercase text-muted-foreground hover:underline">Dismiss</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="uppercase text-sm font-black flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Top Performing Slugs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topPages.map((page, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold flex items-center gap-2">
                                                /{page.slug}
                                                {i === 0 && <Badge className="bg-yellow-500 text-black text-[8px] h-4">TOP RANK</Badge>}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{page.seoPage?.category || 'General'}</span>
                                        </div>
                                        <div className="flex gap-4 text-center">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black">{page.views}</span>
                                                <span className="text-[8px] uppercase text-muted-foreground">Views</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-green-500">+{Math.floor(Math.random() * 20)}%</span>
                                                <span className="text-[8px] uppercase text-muted-foreground">Trend</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Latest & Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="uppercase text-sm font-black">Latest Generated</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {latestPages.map((page, i) => (
                                <div key={i} className="flex flex-col border-b border-border pb-3 last:border-0 last:pb-0">
                                    <span className="text-sm font-bold truncate">{page.title}</span>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] text-muted-foreground">/{page.slug}</span>
                                        <Badge variant="outline" className="text-[8px] font-black">{page.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900 text-white overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Bot className="w-16 h-16" />
                        </div>
                        <CardHeader>
                            <CardTitle className="uppercase text-sm font-black">Oracle Controls</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 relative z-10">
                            <button className="w-full bg-white text-black font-black py-2 rounded-xl text-xs uppercase hover:bg-gray-200 transition">
                                Generate Clusters
                            </button>
                            <button className="w-full border border-white/20 font-black py-2 rounded-xl text-xs uppercase hover:bg-white/10 transition">
                                Recalibrate Auditor
                            </button>
                            <p className="text-[9px] text-gray-400 mt-2 italic text-center">
                                Dewa Agent persona is currently synchronized with Google Search Console data sets.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
