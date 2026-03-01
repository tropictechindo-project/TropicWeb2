/**
 * @file src/lib/reporting/googleReporter.ts
 * INTERNAL SERVER USE ONLY - Fire and Forget Webhook Dispatcher
 */

export type ReportEventType = 'ORDER' | 'DELIVERY' | 'INVENTORY' | 'ATTENDANCE' | 'REVENUE';

export async function sendGoogleReport(eventType: ReportEventType, data: any): Promise<void> {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK;
    const secret = process.env.GOOGLE_SHEET_SECRET;

    if (!webhookUrl || !secret) {
        console.warn(`[REPORTING_SKIPPED] Missing Google Sheet env vars. Event: ${eventType}`);
        return;
    }

    try {
        // Fire-and-forget logic: We deliberately DO NOT await this internally if we don't want to block, 
        // but wrapping inside a try-catch allows us to await it without breaking the parent transaction.
        const payload = JSON.stringify({
            secret,
            eventType,
            data,
        });

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        });

        if (!response.ok) {
            console.error(`[REPORTING_ERROR] Google Apps Script responded with status: ${response.status}`);
        }
    } catch (error) {
        // We catch and log. We NEVER throw. We do not want a reporting failure to rollback a customer payment.
        console.error(`[REPORTING_ERROR] Network failure pushing to Google Sheets for ${eventType}:`, error);
    }
}
