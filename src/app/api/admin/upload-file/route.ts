import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAuth } from "@/lib/auth/auth-helper"

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

        // Extract extension from original filename
        const originalName = file.name || 'file'
        const extMatch = originalName.match(/\.([^.]+)$/)
        const ext = extMatch ? extMatch[1] : 'pdf'

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        const filePath = `documents/${fileName}`

        const { data, error } = await supabase
            .storage
            .from('Upload File')
            .upload(filePath, buffer, {
                contentType: file.type || 'application/pdf',
                upsert: true
            })

        if (error) {
            console.error('Supabase storage error:', error)
            return new NextResponse(`Storage Error: ${error.message}`, { status: 500 })
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('Upload File')
            .getPublicUrl(filePath)

        return NextResponse.json({ url: publicUrl })

    } catch (error: any) {
        console.error("[UPLOAD_FILE_POST] Error:", error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
