'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Legend
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ChartsProps {
    userData: any[]
    revenueData: any[]
}

export function OverviewCharts({ userData, revenueData }: ChartsProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
            </CardHeader>
            <CardContent>
                {!mounted ? (
                    <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-xl" />
                ) : (
                    <Tabs defaultValue="revenue" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="revenue">Revenue</TabsTrigger>
                            <TabsTrigger value="users">Users</TabsTrigger>
                            <TabsTrigger value="transactions">Transactions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="revenue" className="min-h-[350px]">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={(value) => `Rp${value / 1000000}M`} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="total" stroke="#f97316" fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </TabsContent>

                        <TabsContent value="users" className="min-h-[350px]">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={userData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="registered" fill="#3b82f6" name="Registered" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="active" fill="#10b981" name="Active" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </TabsContent>

                        <TabsContent value="transactions" className="min-h-[350px]">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} name="Transactions" dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    )
}
