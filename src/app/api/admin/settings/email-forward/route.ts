import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const setting = await db.siteSetting.findUnique({
            where: { key: 'FORWARD_EMAILS' }
        })

        const emails = setting && setting.value ? (setting.value as any).emails || [] : []
        return NextResponse.json({ emails })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { emails } = body

        if (!Array.isArray(emails)) {
            return NextResponse.json({ error: 'Invalid emails array' }, { status: 400 })
        }

        if (emails.length > 10) {
            return NextResponse.json({ error: 'Maximum 10 emails allowed' }, { status: 400 })
        }

        const setting = await db.siteSetting.upsert({
            where: { key: 'FORWARD_EMAILS' },
            update: { value: { emails } },
            create: {
                key: 'FORWARD_EMAILS',
                value: { emails },
                section: 'EMAIL_AUTOMATION'
            }
        })

        return NextResponse.json({ success: true, emails: (setting.value as any).emails })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
