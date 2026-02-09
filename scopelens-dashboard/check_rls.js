
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scopelens-supabase.membercore.dev';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkPolicies() {
    console.log('Fetching policies for license_keys...');

    // We can't easily query pg_policies via supabase-js client directly without rpc or direct sql connection
    // But we can test access with an authenticated user simulation.

    // 1. Sign up/Switch to a test user
    const email = `policy_test_${Date.now()}@example.com`;
    const password = 'Password123!';

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error('Signup failed:', signUpError);
        return;
    }

    console.log(`Created test user: ${user.id}`);

    // 2. Create a fresh client as this user
    const { data: { session } } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    const userClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.SyUoeSlLj1rzQKPfOA1UjZQa2qnNx67Uc0xjjjP0m2E', {
        global: {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        }
    });

    // 3. Try to select the specific key
    const keyToFind = 'SL-XQMGS-C4WVG-E2JMA-B36F7';
    console.log(`Attempting to SELECT key ${keyToFind} as authenticated user...`);

    const { data, error } = await userClient
        .from('license_keys')
        .select('*')
        .eq('key_code', keyToFind);

    if (error) {
        console.error('SELECT Error (RLS likely blocking):', error);
    } else {
        console.log('SELECT Result:', data);
        if (data.length === 0) {
            console.log('Result is empty. RLS likely filtering it out or key not found.');
        } else {
            console.log('SUCCESS: User can see the key.');
        }
    }

    // Clean up user if possible (requires admin client)
    await supabase.auth.admin.deleteUser(user.id);
    console.log('Test user deleted.');
}

checkPolicies();
