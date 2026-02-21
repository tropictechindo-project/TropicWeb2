import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const logs = await db.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: {
                    select: {
                        username: true,
                        fullName: true,
                        role: true
                    }
                }
            }
        })
        return NextResponse.json({ logs })
    } catch (error) {
        console.error("[LOGS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
