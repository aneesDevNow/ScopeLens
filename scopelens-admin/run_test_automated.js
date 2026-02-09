const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const SUPABASE_URL = 'https://scopelens-supabase.membercore.dev';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.SyUoeSlLj1rzQKPfOA1UjZQa2qnNx67Uc0xjjjP0m2E';

// Admin client for DB setup (bypassing RLS via Service Role)
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// User client for Login (simulating frontend)
const userClient = createClient(SUPABASE_URL, ANON_KEY);

async function uploadFile(token, filename, content) {
    return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const body =
            `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: text/plain\r\n\r\n${content}\r\n--${boundary}--`;

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/upload',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(body),
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data });
            });
        });

        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

async function run() {
    try {
        const timestamp = Date.now();
        const email = `test_automated_${timestamp}@example.com`;
        const password = 'password123';

        console.log(`\n=== Starting Automated Test (User: ${email}) ===\n`);

        // 1. Create User
        console.log("1. Creating User...");
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) throw new Error(`Create User Failed: ${createError.message}`);
        const userId = createData.user.id;
        console.log(`   User created: ${userId}`);

        // 2. Login
        console.log("2. Logging in...");
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (loginError) throw new Error(`Login Failed: ${loginError.message}`);
        const token = loginData.session.access_token;
        console.log("   Logged in successfully.");

        // 3. Get Plan
        const { data: plans } = await supabase.from('plans').select('id, name').limit(1);
        if (!plans || plans.length === 0) throw new Error("No plans found in DB.");
        const planId = plans[0].id;
        console.log(`   Using Plan: ${plans[0].name} (${planId})`);

        // 4. Add Subscription
        console.log("3. Adding Active Subscription...");
        const { error: subError } = await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
            scans_used: 0
        });
        if (subError) throw new Error(`Insert Subscription Failed: ${subError.message}`);
        console.log("   Subscription added.");

        // 5. Test Upload (Active)
        console.log("4. Testing Upload (Expect SUCCESS)...");
        const res1 = await uploadFile(token, 'active_test.txt', 'Content for active sub');
        console.log(`   Result: ${res1.status}`);
        if (res1.status === 200) {
            console.log("   ✅ SUCCESS: Upload accepted.");
        } else {
            console.error("   ❌ FAILED: Upload rejected but should have passed.");
            console.error("   Body:", res1.body);
        }

        // 6. Expire Subscription
        console.log("5. Expiring Subscription (minus 1 minute)...");
        const expiredDate = new Date(Date.now() - 60 * 1000).toISOString();
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ current_period_end: expiredDate })
            .eq('user_id', userId);

        if (updateError) throw new Error(`Expire Subscription Failed: ${updateError.message}`);
        console.log(`   Subscription expired (end date: ${expiredDate}).`);

        // 7. Test Upload (Expired)
        console.log("6. Testing Upload (Expect FAILURE/403)...");
        const res2 = await uploadFile(token, 'expired_test.txt', 'Content for expired sub');
        console.log(`   Result: ${res2.status}`);
        if (res2.status === 403 || res2.status === 402) {
            console.log("   ✅ SUCCESS: Upload rejected as expected.");
        } else if (res2.status === 200) {
            console.log("   ❌ FAILED: Upload succeeded but should have been rejected.");
        } else {
            console.log(`   ❓ Unexpected Status: ${res2.status}`);
            console.log("   Body:", res2.body);
        }

        console.log("\n=== Test Complete ===");

    } catch (e) {
        console.error("\n❌ Test Failed with Error:", e);
    }
}

run();
