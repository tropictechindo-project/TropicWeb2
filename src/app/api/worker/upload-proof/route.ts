import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAuth } from "@/lib/auth/auth-helper"

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

        // Extract extension from original filename
        const originalName = file.name || 'delivery-proof.jpg'
        const extMatch = originalName.match(/\.([^.]+)$/)
        const ext = extMatch ? extMatch[1] : 'jpg'

        const fileName = `${auth.userId}-${Date.now()}.${ext}`
        const filePath = `delivery-proofs/${fileName}`

        // Upload to 'UploadFile' bucket (assuming it exists as used in admin routes)
        const { data, error } = await supabase
            .storage
            .from('UploadFile')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true
            })

        if (error) {
            console.error('[WORKER_UPLOAD_PROOF] Storage error:', error)
            return new NextResponse(`Storage Error: ${error.message}`, { status: 500 })
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('UploadFile')
            .getPublicUrl(filePath)

        return NextResponse.json({ url: publicUrl })

    } catch (error: any) {
        console.error("[WORKER_UPLOAD_PROOF] Error:", error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
