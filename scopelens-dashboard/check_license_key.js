const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scopelens-supabase.membercore.dev';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkKey() {
    const keyToFind = 'SL-XQMGS-C4WVG-E2JMA-B36F7';
    console.log(`Checking for key: ${keyToFind}...`);

    const { data, error } = await supabase
        .from('license_keys')
        .select('*')
        .eq('key_code', keyToFind);

    if (error) {
        console.error('Error fetching key:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Key Found:', data[0]);
    } else {
        console.log('Key NOT FOUND.');

        // List recent keys to see what IS there
        console.log('Fetching recent 5 keys...');
        const { data: recent, error: recentError } = await supabase
            .from('license_keys')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) {
            console.error('Error fetching recent keys:', recentError);
        } else {
            console.log('Recent Keys:', recent);
        }
    }
}

checkKey();
