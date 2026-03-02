import { NextResponse } from 'next/server'
import { auditAndRepairImages } from '@/lib/ai/ai-image-repair'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const result = await auditAndRepairImages()
        return NextResponse.json({
            success: true,
            ...result
        })
    } catch (error: any) {
        console.error('Image Audit Cron Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}

// Also support POST for manual triggers from admin dashboard
export async function POST() {
    return GET()
}
