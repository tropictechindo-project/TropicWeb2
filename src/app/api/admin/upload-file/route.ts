import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAuth } from "@/lib/auth/auth-helper"
import sharp from "sharp"

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req)

        if (!auth) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        if (auth.role !== 'ADMIN') {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 })
        }

        const buffer = await file.arrayBuffer()
        let uploadBuffer: Buffer = Buffer.from(buffer)
        let contentType = file.type || 'application/pdf'
        let ext = file.name.split('.').pop() || 'pdf'

        // Conditionally convert to WebP if it's an image to save space
        if (contentType.startsWith('image/')) {
            uploadBuffer = await sharp(uploadBuffer)
                .webp({ quality: 80, effort: 6 })
                .toBuffer()
            contentType = 'image/webp'
            ext = 'webp'
        }

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        const filePath = `documents/${fileName}`

        const { data, error } = await supabase
            .storage
            .from('UploadFile')
            .upload(filePath, uploadBuffer, {
                contentType: contentType,
                upsert: true
            })

        if (error) {
            console.error('[API_UPLOAD_FILE] Supabase storage error:', error)
            return new NextResponse(`Storage Error: ${error.message}. Ensure bucket 'UploadFile' exists.`, { status: 500 })
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('UploadFile')
            .getPublicUrl(filePath)

        return NextResponse.json({ url: publicUrl })

    } catch (error: any) {
        console.error("[UPLOAD_FILE_POST] Error:", error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
