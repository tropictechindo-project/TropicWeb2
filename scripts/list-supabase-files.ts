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

async function listFiles() {
    try {
        const { data, error } = await supabase.storage.from('Photos').list('', { limit: 100 });
        if (error) throw error;
        console.log('📦 Files in "Photos" bucket:');
        data.forEach(file => {
            console.log(`- "${file.name}"`);
        });
    } catch (error) {
        console.error('❌ Error listing files:', error.message);
    }
}

listFiles();
