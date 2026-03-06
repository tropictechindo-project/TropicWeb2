import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/auth/supabase-admin"
import { verifyAuth } from "@/lib/auth/auth-helper"
import sharp from "sharp"

export const dynamic = 'force-dynamic'

/**
 * POST /api/worker/upload-proof
 * Authenticated endpoint for workers to upload delivery proof photos
 */
export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req)

        if (!auth) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Allow WORKER and ADMIN
        if (auth.role !== 'WORKER' && auth.role !== 'ADMIN') {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 })
        }

        // Check file type (must be image)
        if (!file.type.startsWith('image/')) {
            return new NextResponse("Only images are allowed", { status: 400 })
        }

        const buffer = await file.arrayBuffer()

        // Convert to WebP using sharp in memory
        const optimizedBuffer = await sharp(Buffer.from(buffer))
            .webp({ quality: 80, effort: 6 })
            .toBuffer()

        const fileName = `${auth.userId}-${Date.now()}.webp`
        const filePath = `delivery-proofs/${fileName}`

        // Upload to 'Photos' bucket
        const { data, error } = await supabaseAdmin
            .storage
            .from('Photos')
            .upload(filePath, optimizedBuffer, {
                contentType: 'image/webp',
                upsert: true
            })

        if (error) {
            console.error('[WORKER_UPLOAD_PROOF] Storage error:', error)
            return new NextResponse(`Storage Error: ${error.message}`, { status: 500 })
        }

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('Photos')
            .getPublicUrl(filePath)

        return NextResponse.json({ url: publicUrl })

    } catch (error: any) {
        console.error("[WORKER_UPLOAD_PROOF] Error:", error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
