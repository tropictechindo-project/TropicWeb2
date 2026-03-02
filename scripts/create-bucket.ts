import { supabaseAdmin } from './src/lib/auth/supabase-admin'

async function createPhotosBucket() {
    console.log('📦 Attempting to create/verify "Photos" bucket...')

    try {
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
        if (listError) throw listError

        const exists = buckets.find(b => b.name === 'Photos')
        if (exists) {
            console.log('✅ "Photos" bucket already exists.')
        } else {
            const { data, error } = await supabaseAdmin.storage.createBucket('Photos', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
            })
            if (error) throw error
            console.log('✅ "Photos" bucket created successfully.')
        }

        // Ensure it's public (sometimes creation doesn't set it correctly in one go depending on Supabase version)
        await supabaseAdmin.storage.updateBucket('Photos', { public: true })
        console.log('✅ "Photos" bucket is now PUBLIC.')

    } catch (error: any) {
        console.error('❌ Error managing bucket:', error.message)
        process.exit(1)
    }
}

createPhotosBucket()
