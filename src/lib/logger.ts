import { db } from "./db"

export async function logActivity({
    userId,
    action,
    entity,
    details
}: {
    userId?: string
    action: string
    entity: string
    details?: string
}) {
    try {
        await db.activityLog.create({
            data: {
                userId,
                action,
                entity,
                details
            }
        })
    } catch (error) {
        console.error("Failed to log activity:", error)
    }
}
