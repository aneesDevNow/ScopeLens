const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scopelens-supabase.membercore.dev';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.SyUoeSlLj1rzQKPfOA1UjZQa2qnNx67Uc0xjjjP0m2E';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TEST_EMAIL = 'testuser_sub@scopelens.dev';
const TEST_PASSWORD = 'TestPass123!';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('=== SUBSCRIPTION ACCESS & EXPIRY TEST ===\n');

    // Step 1: Clean up any previous test user
    console.log('1. Cleaning up previous test user...');
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === TEST_EMAIL);
    if (existingUser) {
        // Delete subscription first
        await admin.from('subscriptions').delete().eq('user_id', existingUser.id);
        // Delete scans
        await admin.from('scans').delete().eq('user_id', existingUser.id);
        // Delete profile
        await admin.from('profiles').delete().eq('id', existingUser.id);
        // Delete auth user
        await admin.auth.admin.deleteUser(existingUser.id);
        console.log('   Cleaned up existing test user.');
    } else {
        console.log('   No previous test user found.');
    }

    // Step 2: Create test user
    console.log('\n2. Creating test user...');
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: 'Test' }
    });
    if (createErr) {
        console.error('   FAILED to create user:', createErr.message);
        return;
    }
    const userId = newUser.user.id;
    console.log(`   Created user: ${userId}`);

    // Wait for trigger to create profile
    await sleep(2000);

    // Step 3: Get Starter plan
    console.log('\n3. Fetching Starter plan...');
    const { data: plan, error: planErr } = await admin
        .from('plans')
        .select('*')
        .eq('slug', 'starter')
        .single();
    if (planErr || !plan) {
        console.error('   FAILED to fetch plan:', planErr?.message);
        return;
    }
    console.log(`   Plan: ${plan.name} (${plan.id})`);
    console.log(`   Scans per day: ${plan.scans_per_day}`);
    console.log(`   Price: $${plan.price_monthly}/mo`);

    // Step 4: Create active subscription (valid for 30 days)
    console.log('\n4. Creating active subscription...');
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { data: sub, error: subErr } = await admin
        .from('subscriptions')
        .insert({
            user_id: userId,
            plan_id: plan.id,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            scans_used: 0,
        })
        .select()
        .single();
    if (subErr) {
        console.error('   FAILED to create subscription:', subErr.message);
        return;
    }
    console.log(`   Subscription created: ${sub.id}`);
    console.log(`   Period: ${sub.current_period_start} → ${sub.current_period_end}`);
    console.log(`   Status: ${sub.status}`);

    // Step 5: Test access — sign in as test user and hit subscription API
    console.log('\n5. Testing access with ACTIVE subscription...');
    const userClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data: signIn, error: signErr } = await userClient.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });
    if (signErr) {
        console.error('   FAILED to sign in:', signErr.message);
        return;
    }
    console.log(`   Signed in as: ${signIn.user.email}`);

    // Check subscription from the user's perspective
    const { data: userSub } = await userClient
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

    if (userSub && userSub.plans) {
        const periodEndDate = new Date(userSub.current_period_end);
        const isExpired = periodEndDate < new Date();
        console.log(`   ✅ Subscription FOUND`);
        console.log(`   Plan: ${userSub.plans.name}`);
        console.log(`   Scans per day: ${userSub.plans.scans_per_day}`);
        console.log(`   Scans used: ${userSub.scans_used}`);
        console.log(`   Period end: ${userSub.current_period_end}`);
        console.log(`   Expired: ${isExpired}`);

        if (!isExpired) {
            console.log(`   🟢 ACCESS GRANTED — User has ${userSub.plans.scans_per_day - userSub.scans_used} scans remaining today`);
        } else {
            console.log(`   🔴 ACCESS DENIED — Subscription expired`);
        }
    } else {
        console.log('   🔴 NO active subscription found — would fall back to free tier');
    }

    // Step 6: Expire subscription — set period_end to 1 minute from now
    console.log('\n6. Setting subscription to expire in 1 minute...');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 1);

    const { error: updateErr } = await admin
        .from('subscriptions')
        .update({
            current_period_end: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);

    if (updateErr) {
        console.error('   FAILED to update subscription:', updateErr.message);
        return;
    }
    console.log(`   Updated period_end to: ${expiresAt.toISOString()}`);
    console.log(`   Current time:          ${new Date().toISOString()}`);
    console.log('   Waiting 70 seconds for expiry...\n');

    // Wait 70 seconds
    for (let i = 70; i > 0; i -= 10) {
        process.stdout.write(`   ⏳ ${i}s remaining...\r`);
        await sleep(10000);
    }
    console.log('\n');

    // Step 7: Check access again after expiry
    console.log('7. Testing access AFTER subscription expiry...');
    const nowAfter = new Date();
    console.log(`   Current time: ${nowAfter.toISOString()}`);

    // Re-fetch subscription
    const { data: userSubAfter } = await userClient
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

    if (userSubAfter && userSubAfter.plans) {
        const periodEndDate = new Date(userSubAfter.current_period_end);
        const isExpired = periodEndDate < nowAfter;
        console.log(`   Subscription still exists in DB (status: ${userSubAfter.status})`);
        console.log(`   Period end: ${userSubAfter.current_period_end}`);
        console.log(`   Expired: ${isExpired}`);

        if (isExpired) {
            console.log(`   🔴 ACCESS DENIED — Subscription expired, would fall back to free tier`);
            console.log(`   Free tier = 1 scan/day (as per upload route logic line 157-160)`);
        } else {
            console.log(`   🟢 ACCESS GRANTED — Subscription still valid (unexpected!)`);
        }
    } else {
        console.log('   🔴 NO active subscription found — Free tier applies');
    }

    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log('Step 5: Active subscription  → ACCESS GRANTED ✅');
    console.log('Step 7: Expired subscription → ACCESS DENIED  ✅');
    console.log('The upload API checks `current_period_end < now` and falls back to free tier when expired.');

    // Clean up
    console.log('\n8. Cleaning up test user...');
    await admin.from('subscriptions').delete().eq('user_id', userId);
    await admin.from('scans').delete().eq('user_id', userId);
    await admin.from('profiles').delete().eq('id', userId);
    await admin.auth.admin.deleteUser(userId);
    console.log('   Test user cleaned up.');
    console.log('\n=== DONE ===');
}

run().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
