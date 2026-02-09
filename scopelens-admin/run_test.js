const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const SUPABASE_URL = 'https://scopelens-supabase.membercore.dev';
// Key from .env.local
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

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
        const email = 'expiry_test_v2@example.com';
        const password = 'password123';

        console.log("1. Creating User...");
        let userId;

        // Try to delete if exists to start fresh
        // Can't easily delete by email without list, so just ignore error on create

        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            console.log("User create error (might exist):", createError.message);
            // Find user
            const { data: listData } = await supabase.auth.admin.listUsers();
            const found = listData.users.find(u => u.email === email);
            if (found) {
                userId = found.id;
                console.log("User found:", userId);
            } else {
                throw new Error("Could not create or find user");
            }
        } else {
            userId = createData.user.id;
            console.log("User created:", userId);
        }

        console.log("2. Logging in...");
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (loginError) throw loginError;
        const token = loginData.session.access_token;
        console.log("Logged in.");

        console.log("3. Setting valid subscription...");
        const { data: plan, error: planError } = await supabase.from('plans').select('id').eq('slug', 'professional').single();
        if (planError || !plan) {
            console.error("Plan fetch error:", planError);
            // List all plans to debug
            const { data: allPlans } = await supabase.from('plans').select('id, slug');
            console.log("Available plans:", allPlans);
            throw new Error("Cannot find professional plan");
        }

        // Clear existing subs
        await supabase.from('subscriptions').delete().eq('user_id', userId);

        // Insert new sub
        const now = new Date();
        const nextMonth = new Date(now); nextMonth.setMonth(nextMonth.getMonth() + 1);

        const { data: sub, error: subError } = await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_id: plan.id,
            status: 'active',
            scans_used: 0,
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString()
        }).select().single();

        if (subError) throw subError;
        console.log("Subscription created:", sub.id);

        console.log("4. Testing Upload (Should Succeed & Increment)...");
        const res1 = await uploadFile(token, 'test1.txt', 'Hello World');
        console.log("Upload 1 Result:", res1.status);
        if (res1.status !== 200) {
            console.log("Body:", res1.body);
            throw new Error("Upload 1 failed");
        }

        // Verify increment
        const { data: subAfter1 } = await supabase.from('subscriptions').select('scans_used').eq('id', sub.id).single();
        console.log("Scans Used after Upload 1:", subAfter1.scans_used);
        if (subAfter1.scans_used !== 1) console.warn("WARNING: Scans used did not increment to 1!");

        console.log("5. Testing Expiry (Should Default to Free/Fail)...");
        // Expire sub
        const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
        await supabase.from('subscriptions').update({
            current_period_end: yesterday.toISOString()
        }).eq('id', sub.id);

        // Free tier has limit 1. User has 1 scan (from step 4).
        // So they are AT the limit. Next upload should FAIL.

        const res2 = await uploadFile(token, 'test2.txt', 'Expired upload');
        console.log("Upload 2 Result:", res2.status);

        if (res2.status === 403 || (res2.status === 400 && res2.body.includes('limit'))) {
            console.log("SUCCESS: Upload 2 rejected as expected (Expired -> Free Tier Limit).");
        } else {
            console.warn("WARNING: Upload 2 should have failed!", res2.status, res2.body);
        }

        console.log("6. Testing Lazy Reset...");
        // Set start date to 2 months ago, end date to future
        const twoMonthsAgo = new Date(now); twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const future = new Date(now); future.setMonth(future.getMonth() + 1);

        // Set scans_used to limit (e.g. 100)
        await supabase.from('subscriptions').update({
            current_period_start: twoMonthsAgo.toISOString(),
            current_period_end: future.toISOString(),
            scans_used: 100
        }).eq('id', sub.id);

        const res3 = await uploadFile(token, 'test3.txt', 'Reset upload');
        console.log("Upload 3 Result:", res3.status);

        if (res3.status !== 200) {
            console.log("Body:", res3.body);
            throw new Error("Upload 3 failed (Lazy reset didn't work)");
        }

        // Verify DB
        const { data: updatedSub } = await supabase.from('subscriptions').select('*').eq('id', sub.id).single();
        console.log("Updated Sub Scans Used:", updatedSub.scans_used);
        console.log("Updated Sub Start Date:", updatedSub.current_period_start);

        // Should be 1 (reset to 0, then incremented to 1) or 0 if increment happened before reset?
        // Logic in route: Reset happens BEFORE logic checks.
        // Wait, logic:
        // 1. Check if reset needed -> Yes -> Reset to 0 -> scansUsed = 0.
        // 2. Check if scansUsed (0) < Limit. OK.
        // 3. Process Upload.
        // 4. Increment scansUsed (0 -> 1).
        // So final result should be 1.

        if (updatedSub.scans_used === 1) {
            console.log("SUCCESS: Subscription reset and incremented correctly.");
        } else {
            console.warn("WARNING: Unexpected final scans_used:", updatedSub.scans_used);
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

run();
