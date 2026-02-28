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

        // Convert to WebP using sharp in memory
        const optimizedBuffer = await sharp(Buffer.from(buffer))
            .webp({ quality: 80, effort: 6 }) // aggressive compression without killing quality
            .toBuffer()

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`
        const filePath = `optimized-products/${fileName}`

        const { data, error } = await supabase
            .storage
            .from('website-assets')
            .upload(filePath, optimizedBuffer, {
                contentType: 'image/webp',
                upsert: true
            })

        if (error) {
            console.error('Supabase storage error:', error)
            return new NextResponse(`Storage Error: ${error.message}`, { status: 500 })
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('website-assets')
            .getPublicUrl(filePath)

        return NextResponse.json({ url: publicUrl })

    } catch (error: any) {
        console.error("[UPLOAD_WEBP_POST] Error:", error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
