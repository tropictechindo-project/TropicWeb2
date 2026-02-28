export const env = {
    // Google Maps
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,

    // Map Config
    MAP_DEFAULT_CENTER_LAT: Number(process.env.MAP_DEFAULT_CENTER_LAT || -8.650000),
    MAP_DEFAULT_CENTER_LNG: Number(process.env.MAP_DEFAULT_CENTER_LNG || 115.216667),
    MAP_DEFAULT_ZOOM: Number(process.env.MAP_DEFAULT_ZOOM || 12),

    // Delivery Settings
    DELIVERY_LOCATION_UPDATE_INTERVAL: Number(process.env.DELIVERY_LOCATION_UPDATE_INTERVAL || 60000),
    DELIVERY_PUBLIC_REFRESH_INTERVAL: Number(process.env.DELIVERY_PUBLIC_REFRESH_INTERVAL || 60000),
    DELIVERY_CLAIM_TIMEOUT_MINUTES: Number(process.env.DELIVERY_CLAIM_TIMEOUT_MINUTES || 60),
    DELIVERY_LONG_RUNNING_HOURS: Number(process.env.DELIVERY_LONG_RUNNING_HOURS || 6),
    DELIVERY_ETA_OVERRIDE_LIMIT: Number(process.env.DELIVERY_ETA_OVERRIDE_LIMIT || 3),
    DELIVERY_EDIT_WINDOW_HOURS: Number(process.env.DELIVERY_EDIT_WINDOW_HOURS || 12),
}

const validateEnv = () => {
    const missingKeys: string[] = []

    if (!env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        missingKeys.push('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
    }

    if (!env.GOOGLE_MAPS_API_KEY) {
        missingKeys.push('GOOGLE_MAPS_API_KEY')
    }

    if (isNaN(env.MAP_DEFAULT_CENTER_LAT) || isNaN(env.MAP_DEFAULT_CENTER_LNG)) {
        missingKeys.push('MAP_DEFAULT_CENTER_LAT / MAP_DEFAULT_CENTER_LNG (must be numeric)')
    }

    if (isNaN(env.DELIVERY_LOCATION_UPDATE_INTERVAL) ||
        isNaN(env.DELIVERY_PUBLIC_REFRESH_INTERVAL) ||
        isNaN(env.DELIVERY_CLAIM_TIMEOUT_MINUTES) ||
        isNaN(env.DELIVERY_LONG_RUNNING_HOURS) ||
        isNaN(env.DELIVERY_ETA_OVERRIDE_LIMIT) ||
        isNaN(env.DELIVERY_EDIT_WINDOW_HOURS)) {
        missingKeys.push('One of the DELIVERY numeric settings is invalid')
    }

    if (missingKeys.length > 0) {
        console.error(`❌ [ENV VALIDATION ERROR] Missing or invalid environment variables: \n${missingKeys.join('\n')}`)
        // Throw error if crucial variables are missing (in production only if needed, but the prompt says at startup)
        // we throw an error to prevent silent failure
        throw new Error(`Environment variables missing: ${missingKeys.join(', ')}`)
    }
}

// Run validation immediately
validateEnv()
