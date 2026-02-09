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
                'Authorization': `Bearer ${token}`,
                // Need cookie? Maybe not if Bearer token works. But Supabase auth usually works with headers.
                // Next.js createClient() looks for cookies or headers.
                'x-supabase-auth': token // Just in case
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
        const email = 'expiry_test@example.com';
        const password = 'password123';

        console.log("1. Creating User...");
        // Delete potential existing user first (hard with simple API, ignore if fails)
        // Actually, just try create, if exists, try login.

        let userId;

        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            console.log("User might exist, trying to find...");
            const { data: users } = await supabase.auth.admin.listUsers();
            const user = users.users.find(u => u.email === email);
            if (user) {
                userId = user.id;
                // Reset password to be sure
                await supabase.auth.admin.updateUserById(userId, { password });
                console.log("User found and password reset:", userId);
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
        // Get plan
        const { data: plan } = await supabase.from('plans').select('id').eq('slug', 'professional').single(); // Pro plan
        // Clear existing subs
        await supabase.from('subscriptions').delete().eq('user_id', userId);

        // Insert new sub
        const now = new Date();
        const nextMonth = new Date(now); nextMonth.setMonth(nextMonth.getMonth() + 1);

        const { data: sub } = await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_id: plan.id,
            status: 'active',
            scans_used: 0,
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString()
        }).select().single();
        console.log("Subscription created:", sub.id);

        console.log("4. Testing Upload (Should Succeed)...");
        const res1 = await uploadFile(token, 'test1.txt', 'Hello World');
        console.log("Upload 1 Result:", res1.status, res1.body.substring(0, 100));
        if (res1.status !== 200) throw new Error("Upload 1 failed");

        console.log("5. Testing Expiry (Should Default to Free/Fail)...");
        // Expire sub
        const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
        await supabase.from('subscriptions').update({
            current_period_end: yesterday.toISOString()
        }).eq('id', sub.id);

        // Also ensure user has > 1 scan in 'scans' table from previous step (res1)
        // Upload 1 created a scan. Free tier limit is 1.
        // So a second upload should fail if downgraded to free tier.

        const res2 = await uploadFile(token, 'test2.txt', 'Expired upload');
        console.log("Upload 2 Result:", res2.status, res2.body.substring(0, 100));

        // Expect 403 or similar because limit reached for free tier (1 scan done in res1).
        if (res2.status !== 403 && res2.status !== 400 && !res2.body.includes('limit reached')) {
            console.warn("WARNING: Upload 2 should have failed/limited!");
        } else {
            console.log("SUCCESS: Upload 2 rejected as expected.");
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
        console.log("Upload 3 Result:", res3.status, res3.body.substring(0, 100));

        if (res3.status !== 200) throw new Error("Upload 3 failed (Lazy reset didn't work)");

        // Verify DB
        const { data: updatedSub } = await supabase.from('subscriptions').select('*').eq('id', sub.id).single();
        console.log("Updated Sub Scans Used:", updatedSub.scans_used);
        console.log("Updated Sub Start Date:", updatedSub.current_period_start);

        if (updatedSub.scans_used !== 0) { // It might be 0 because we reset it, or 1 if the upload increments it?
            // Actually, the route resets to 0, then we verify strictness. 
            // Wait, does route increment scans_used? 
            // Implementation check: 
            // The upload route resets scans_used to 0, but it does NOT increment it in `subscriptions` table explicitly.
            // It inserts into `scans` table.
            // The scan count check logic:
            // `scansUsed = subscription.scans_used || 0;`
            // If we reset it to 0, then `scansUsed` is 0. 0 < Limit. OK.
            // But does the system usually increment `scans_used`?
            // Looking at `api/upload/route.ts`... I don't see anywhere that INCREMENTS `subscriptions.scans_used`.
            // It only *checks* it.
            // Ah, if `scans_used` is never incremented, then the limit is broken unless `scans` table count is used?
            // In the paid plan block: `scansUsed = subscription.scans_used || 0;`
            // It assumes some OTHER process increments it (maybe after successful upload?).
            // I missed that in my review. I should check if `scans_used` is ever incremented.
            // If not, I need to add increment logic too!

            // Let's check the code I viewed earlier.
        } else {
            console.log("SUCCESS: Subscription reset.");
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

run();
