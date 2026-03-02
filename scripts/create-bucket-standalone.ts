const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPhotosBucket() {
    console.log('📦 Attempting to create/verify "Photos" bucket...');

    try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) throw listError;

        const exists = buckets.find(b => b.name === 'Photos');
        if (exists) {
            console.log('✅ "Photos" bucket already exists.');
        } else {
            const { data, error } = await supabase.storage.createBucket('Photos', {
                public: true
            });
            if (error) throw error;
            console.log('✅ "Photos" bucket created successfully.');
        }

        await supabase.storage.updateBucket('Photos', { public: true });
        console.log('✅ "Photos" bucket is now PUBLIC.');

    } catch (error) {
        console.error('❌ Error managing bucket:', error.message);
        process.exit(1);
    }
}

createPhotosBucket();
