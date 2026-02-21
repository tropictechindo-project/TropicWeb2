/**
 * Simple polling-based real-time updates
 * Polls server every 15 seconds for updates
 */

interface PollingConfig {
    interval?: number // milliseconds, default 15000 (15s)
    onUpdate?: (data: any) => void
    onError?: (error: Error) => void
}

export class RealtimePoller {
    private intervalId: NodeJS.Timeout | null = null
    private config: PollingConfig

    constructor(config: PollingConfig = {}) {
        this.config = {
            interval: config.interval || 15000, // 15 seconds default
            onUpdate: config.onUpdate,
            onError: config.onError
        }
    }

    /**
     * Start polling for worker schedule updates (for admin dashboard)
     */
    pollWorkerSchedules(token: string) {
        this.stop() // Stop any existing polling

        const poll = async () => {
            try {
                const res = await fetch('/api/admin/workers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    this.config.onUpdate?.(data)
                }
            } catch (error) {
                this.config.onError?.(error as Error)
            }
        }

        // Initial poll
        poll()

        // Set up interval
        this.intervalId = setInterval(poll, this.config.interval)
    }

    /**
     * Poll for worker's own schedules and notifications
     */
    pollWorkerData(token: string) {
        this.stop()

        const poll = async () => {
            try {
                const [schedulesRes, notificationsRes] = await Promise.all([
                    fetch('/api/worker/schedules', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('/api/worker/notifications', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ])

                if (schedulesRes.ok && notificationsRes.ok) {
                    const [schedules, notifications] = await Promise.all([
                        schedulesRes.json(),
                        notificationsRes.json()
                    ])
                    this.config.onUpdate?.({ schedules, notifications })
                }
            } catch (error) {
                this.config.onError?.(error as Error)
            }
        }

        poll()
        this.intervalId = setInterval(poll, this.config.interval)
    }

    /**
     * Poll for inventory conflicts (for both admin and worker)
     */
    pollInventoryConflicts(token: string) {
        this.stop()

        const poll = async () => {
            try {
                const res = await fetch('/api/inventory/conflicts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    this.config.onUpdate?.(data)
                }
            } catch (error) {
                this.config.onError?.(error as Error)
            }
        }

        poll()
        this.intervalId = setInterval(poll, this.config.interval)
    }

    /**
     * Poll for overall admin dashboard statistics
     */
    pollAdminData(token: string) {
        this.stop()

        const poll = async () => {
            try {
                const res = await fetch('/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    this.config.onUpdate?.({ adminStats: data })
                }
            } catch (error) {
                this.config.onError?.(error as Error)
            }
        }

        poll()
        this.intervalId = setInterval(poll, this.config.interval)
    }

    /**
     * Stop polling
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
        }
    }
}

// Export singleton instance for easy use
export const realtimePoller = new RealtimePoller()
