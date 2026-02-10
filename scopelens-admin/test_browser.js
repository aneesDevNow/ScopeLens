const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scopelens-supabase.membercore.dev';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TEST_EMAIL = 'testpaid@scopelens.dev';
const TEST_PASSWORD = 'TestPaid123!';

async function setup() {
    const action = process.argv[2]; // 'create', 'expire', or 'cleanup'

    if (action === 'create') {
        console.log('=== CREATING TEST USER WITH PAID PLAN ===\n');

        // Clean up first
        const { data: existingUsers } = await admin.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(u => u.email === TEST_EMAIL);
        if (existing) {
            await admin.from('subscriptions').delete().eq('user_id', existing.id);
            await admin.from('scans').delete().eq('user_id', existing.id);
            await admin.from('profiles').delete().eq('id', existing.id);
            await admin.auth.admin.deleteUser(existing.id);
            console.log('Cleaned up previous test user.');
        }

        // Create user
        const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            email_confirm: true,
            user_metadata: { first_name: 'TestPaid' }
        });
        if (createErr) { console.error('FAILED:', createErr.message); return; }
        const userId = newUser.user.id;
        console.log(`User created: ${userId}`);
        console.log(`Email: ${TEST_EMAIL}`);
        console.log(`Password: ${TEST_PASSWORD}`);

        // Wait for profile trigger
        await new Promise(r => setTimeout(r, 2000));

        // Get Starter plan
        const { data: plan } = await admin.from('plans').select('*').eq('slug', 'starter').single();
        console.log(`\nPlan: ${plan.name} (${plan.scans_per_day} scans/day)`);

        // Create subscription
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30);

        const { data: sub, error: subErr } = await admin.from('subscriptions').insert({
            user_id: userId,
            plan_id: plan.id,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            scans_used: 0,
        }).select().single();

        if (subErr) { console.error('Sub FAILED:', subErr.message); return; }
        console.log(`Subscription: ${sub.id}`);
        console.log(`Valid until: ${sub.current_period_end}`);
        console.log('\n✅ Ready! Login at http://localhost:3001 with:');
        console.log(`   Email: ${TEST_EMAIL}`);
        console.log(`   Password: ${TEST_PASSWORD}`);

    } else if (action === 'expire') {
        console.log('=== EXPIRING SUBSCRIPTION ===\n');

        const { data: existingUsers } = await admin.auth.admin.listUsers();
        const user = existingUsers?.users?.find(u => u.email === TEST_EMAIL);
        if (!user) { console.log('No test user found!'); return; }

        // Set period_end to 1 minute from now
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 1);

        const { error } = await admin.from('subscriptions')
            .update({ current_period_end: expiresAt.toISOString(), updated_at: new Date().toISOString() })
            .eq('user_id', user.id);

        if (error) { console.error('FAILED:', error.message); return; }
        console.log(`Subscription expires at: ${expiresAt.toISOString()}`);
        console.log(`Current time:            ${new Date().toISOString()}`);
        console.log('\n⏰ Wait 1 minute, then refresh the dashboard to see the change.');

    } else if (action === 'cleanup') {
        console.log('=== CLEANING UP ===\n');
        const { data: existingUsers } = await admin.auth.admin.listUsers();
        const user = existingUsers?.users?.find(u => u.email === TEST_EMAIL);
        if (user) {
            await admin.from('subscriptions').delete().eq('user_id', user.id);
            await admin.from('scans').delete().eq('user_id', user.id);
            await admin.from('profiles').delete().eq('id', user.id);
            await admin.auth.admin.deleteUser(user.id);
            console.log('Test user deleted.');
        } else {
            console.log('No test user found.');
        }
    } else {
        console.log('Usage: node test_browser.js [create|expire|cleanup]');
    }
}

setup().catch(e => { console.error(e); process.exit(1); });
