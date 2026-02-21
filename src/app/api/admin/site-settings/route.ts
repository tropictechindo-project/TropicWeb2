
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth/auth-helper"

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req)

        if (!auth) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        if (auth.role !== 'ADMIN') {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        const { key, value, section } = body

        if (!key) {
            return new NextResponse("Key is required", { status: 400 })
        }

        // Use raw query to bypass stale Prisma Client definition
        // The table exists (verified by db push), but the client instance in memory doesn't have the model property yet
        const valueJson = JSON.stringify(value)

        const result: any[] = await db.$queryRaw`
            INSERT INTO "site_settings" ("key", "value", "section", "updated_at")
            VALUES (${key}, ${valueJson}::jsonb, ${section}, NOW())
            ON CONFLICT ("key")
            DO UPDATE SET "value" = ${valueJson}::jsonb, "section" = ${section}, "updated_at" = NOW()
            RETURNING *
        `

        const setting = result[0]

        // Handle serialization of BigInt if any (unlikely here but good practice) or Dates
        // JSON.stringify handles Dates, but raw query result might need processing if we were strictly typing
        // For now, returning the raw result object is fine as NextResponse handles JSON conversion

        return NextResponse.json(setting)
    } catch (error: any) {
        console.error("[SITE_SETTINGS_POST] Error details:", {
            message: error.message,
            stack: error.stack,
            dbExists: !!db
        })
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
