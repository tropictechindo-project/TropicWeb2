import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // We still want it to revalidate every hour natively

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place'

export interface GoogleReview {
    name: string
    rating: number
    date: string
    comment: string
    photoUrl?: string
    isLocalGuide?: boolean
    reviewCount?: number
}

export interface PlaceData {
    rating: number
    reviewCount: number
    reviews: GoogleReview[]
}

function timeAgo(unixTimestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - unixTimestamp)
    const intervals: [number, string][] = [
        [60 * 60 * 24 * 365, 'year'],
        [60 * 60 * 24 * 30, 'month'],
        [60 * 60 * 24 * 7, 'week'],
        [60 * 60 * 24, 'day'],
        [60 * 60, 'hour'],
        [60, 'minute'],
    ]
    for (const [secs, label] of intervals) {
        const count = Math.floor(seconds / secs)
        if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`
    }
    return 'just now'
}

export async function GET() {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    const placeId = process.env.GOOGLE_PLACE_ID

    if (!apiKey || apiKey === 'your_google_places_api_key_here') {
        return NextResponse.json(
            { error: 'GOOGLE_PLACES_API_KEY not configured', fallback: true },
            { status: 503 }
        )
    }

    if (!placeId) {
        return NextResponse.json(
            { error: 'GOOGLE_PLACE_ID not configured', fallback: true },
            { status: 503 }
        )
    }

    try {
        const fields = 'rating,user_ratings_total,reviews'
        const url = `${PLACES_API_BASE}/details/json?place_id=${placeId}&fields=${fields}&reviews_sort=newest&key=${apiKey}&language=en`

        const res = await fetch(url, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        })

        if (!res.ok) {
            throw new Error(`Places API HTTP error: ${res.status}`)
        }

        const data = await res.json()

        if (data.status !== 'OK') {
            throw new Error(`Places API error: ${data.status} — ${data.error_message || ''}`)
        }

        const place = data.result
        const reviews: GoogleReview[] = (place.reviews || []).map((r: any) => ({
            name: r.author_name,
            rating: r.rating,
            date: timeAgo(r.time),
            comment: r.text,
            photoUrl: r.profile_photo_url,
            isLocalGuide: r.author_url?.includes('localguide') || false,
            reviewCount: r.user_ratings_total,
        }))

        const result: PlaceData = {
            rating: place.rating ?? 5,
            reviewCount: place.user_ratings_total ?? 0,
            reviews,
        }

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        })
    } catch (error: any) {
        console.error('[Google Places API] Error:', error.message)
        return NextResponse.json(
            { error: error.message, fallback: true },
            { status: 500 }
        )
    }
}
