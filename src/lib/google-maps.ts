import { env } from './env'

interface LatLng {
    lat: number
    lng: number
}

interface ETA_Response {
    travel_duration_seconds: number
    estimated_arrival_time: Date
    distance_meters?: number
}

interface MapsError {
    error: string
    details?: any
}

const SERVER_KEY = env.GOOGLE_MAPS_API_KEY
if (!SERVER_KEY && process.env.NODE_ENV !== 'test') {
    console.warn("⚠️ GOOGLE_MAPS_API_KEY is missing. Maps API calls will fail.")
}

/**
 * calculateETA - Uses Distance Matrix API to get travel duration
 */
export async function calculateETA(origin: LatLng, destination: LatLng): Promise<ETA_Response | MapsError> {
    try {
        const orgStr = `${origin.lat},${origin.lng}`
        const destStr = `${destination.lat},${destination.lng}`

        // We use the distance matrix API directly via REST to avoid huge node_modules dependency and to easily manage free tier
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${orgStr}&destinations=${destStr}&key=${SERVER_KEY}`

        const response = await fetch(url, { next: { revalidate: 0 } })
        if (!response.ok) {
            throw new Error(`Distance Matrix API HTTP error: ${response.status}`)
        }

        const data = await response.json()

        if (data.status !== 'OK') {
            console.error('Google Maps Distance Matrix Error:', data)
            return { error: 'Failed to calculate ETA', details: data.status }
        }

        const element = data.rows?.[0]?.elements?.[0]
        if (!element || element.status !== 'OK') {
            return { error: 'Route not found or zero results' }
        }

        const durationSeconds = element.duration.value
        const distanceMeters = element.distance.value

        const estimatedArrivalTime = new Date(Date.now() + durationSeconds * 1000)

        return {
            travel_duration_seconds: durationSeconds,
            estimated_arrival_time: estimatedArrivalTime,
            distance_meters: distanceMeters
        }
    } catch (error: any) {
        console.error('calculateETA error:', error)
        return { error: 'Network or internal error', details: error?.message }
    }
}

/**
 * getRoutePolyline - Uses Directions API to get polyline
 */
export async function getRoutePolyline(origin: LatLng, destination: LatLng): Promise<{ polyline: string } | MapsError> {
    try {
        const orgStr = `${origin.lat},${origin.lng}`
        const destStr = `${destination.lat},${destination.lng}`

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${orgStr}&destination=${destStr}&key=${SERVER_KEY}`

        const response = await fetch(url, { next: { revalidate: 0 } })
        if (!response.ok) {
            throw new Error(`Directions API HTTP error: ${response.status}`)
        }

        const data = await response.json()

        if (data.status !== 'OK') {
            console.error('Google Maps Directions Error:', data)
            return { error: 'Failed to get directions', details: data.status }
        }

        const route = data.routes?.[0]
        if (!route || !route.overview_polyline?.points) {
            return { error: 'No polyline found in response' }
        }

        return { polyline: route.overview_polyline.points }
    } catch (error: any) {
        console.error('getRoutePolyline error:', error)
        return { error: 'Network or internal error', details: error?.message }
    }
}

/**
 * geocodeAddress - Uses Geocoding API to get lat/lng from string
 */
export async function geocodeAddress(address: string): Promise<LatLng | MapsError> {
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${SERVER_KEY}`

        const response = await fetch(url, { next: { revalidate: 0 } })
        if (!response.ok) {
            throw new Error(`Geocoding API HTTP error: ${response.status}`)
        }

        const data = await response.json()

        if (data.status !== 'OK') {
            console.error('Google Maps Geocoding Error:', data)
            return { error: 'Failed to geocode address', details: data.status }
        }

        const location = data.results?.[0]?.geometry?.location
        if (!location) {
            return { error: 'No location geometry found' }
        }

        return {
            lat: location.lat,
            lng: location.lng
        }
    } catch (error: any) {
        console.error('geocodeAddress error:', error)
        return { error: 'Network or internal error', details: error?.message }
    }
}
