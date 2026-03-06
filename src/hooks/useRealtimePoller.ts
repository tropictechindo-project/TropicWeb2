import { useEffect, useRef } from 'react'

/**
 * A custom hook that polls a callback function at a specified interval.
 * It is visibility-aware (doesn't poll when the tab is hidden) and 
 * triggers an immediate refresh when the tab becomes visible again.
 * 
 * @param callback The function to call on each tick
 * @param intervalMs Interval in milliseconds (default: 30000)
 * @param active Whether the poller is currently active
 */
export function useRealtimePoller(callback: () => void, intervalMs: number = 30000, active: boolean = true) {
    const savedCallback = useRef(callback)

    // Remember the latest callback
    useEffect(() => {
        savedCallback.current = callback
    }, [callback])

    useEffect(() => {
        if (!active) return

        const tick = () => {
            if (document.visibilityState === 'visible') {
                savedCallback.current()
            }
        }

        // Set up the interval
        const id = setInterval(tick, intervalMs)

        // Handle visibility change: refresh immediately when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                tick()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            clearInterval(id)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [intervalMs, active])
}
