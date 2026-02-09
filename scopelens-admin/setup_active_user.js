const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scopelens-supabase.membercore.dev';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.SyUoeSlLj1rzQKPfOA1UjZQa2qnNx67Uc0xjjjP0m2E';

// Admin client for DB setup
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    try {
        const timestamp = Date.now();
        const email = `ui_test_${timestamp}@example.com`;
        const password = 'password123';

        console.log(`\n=== Setting up UI Test User ===`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        // 1. Create User
        const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) throw new Error(`Create User Failed: ${createError.message}`);
        const userId = createData.user.id;
        console.log(`User created: ${userId}`);

        // 2. Get Plan
        const { data: plans } = await adminClient.from('plans').select('id, name').limit(1);
        if (!plans || plans.length === 0) throw new Error("No plans found in DB.");
        const planId = plans[0].id; // Likely Free or Professional

        // 3. Add Active Subscription
        const { error: subError } = await adminClient.from('subscriptions').insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
            scans_used: 0
        });

        if (subError) throw new Error(`Insert Subscription Failed: ${subError.message}`);
        console.log(`Active Subscription added (Plan: ${plans[0].name}).`);
        console.log(`\nREADY FOR UI TESTING.`);

    } catch (e) {
        console.error("\nSetup Failed:", e);
    }
}

run();
