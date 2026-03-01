import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendGoogleReport } from '@/lib/reporting/googleReporter';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Optional Cron Secret Validation (Add CRON_SECRET to .env if used)
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
        }

        // Calculate Bali time bounds (UTC+8)
        const nowUTC = new Date();
        const baliTimeOffset = 8 * 60 * 60 * 1000;
        const baliTime = new Date(nowUTC.getTime() + baliTimeOffset);
        const dateStr = baliTime.toISOString().split('T')[0]; // e.g., "2026-03-01"

        const startOfDayUTC = new Date(`${dateStr}T00:00:00.000+08:00`);
        const endOfDayUTC = new Date(`${dateStr}T23:59:59.999+08:00`);

        // Find all orders that were confirmed paid today in Bali time
        const orders = await db.order.findMany({
            where: {
                paymentStatus: 'PAID',
                paymentConfirmedAt: {
                    gte: startOfDayUTC,
                    lt: endOfDayUTC
                }
            }
        });

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

        // Send Report to Google Sheets Webhook
        await sendGoogleReport('REVENUE', {
            date: dateStr,
            totalOrders,
            totalRevenue
        });

        return NextResponse.json({
            success: true,
            date: dateStr,
            totalOrders,
            totalRevenue
        });

    } catch (error) {
        console.error('[CRON] Daily Revenue Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
