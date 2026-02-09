const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const SUPABASE_URL = 'https://scopelens-supabase.membercore.dev';
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

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function run() {
    try {
        const email = 'expiry_test_integration@example.com';
        const password = 'password123';

        console.log("1. Creating User...");
        let userId;

        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            const { data: listData } = await supabase.auth.admin.listUsers();
            const found = listData.users.find(u => u.email === email);
            if (found) {
                userId = found.id;
                console.log("User found (reusing):", userId);
                await supabase.auth.admin.updateUserById(userId, { password });
            } else {
                console.error("Create User Error:", createError);
                return;
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

        console.log(`\n!!! ACTION REQUIRED !!!`);
        console.log(`User ID: ${userId}`);
        console.log(`Please INSERT a valid subscription for this user ID via MCP/SQL now.`);
        console.log(`Waiting 30 seconds...`);

        await sleep(30000);

        console.log("4. Testing Upload (Should Succeed & Increment)...");
        const res1 = await uploadFile(token, 'test1.txt', 'Hello World');
        console.log("Upload 1 Result:", res1.status);
        if (res1.status !== 200) {
            console.log("Body:", res1.body);
        }

        console.log("\n!!! ACTION REQUIRED !!!");
        console.log(`Please EXPIRE the subscription (set current_period_end to yesterday) via MCP/SQL now.`);
        console.log(`Waiting 30 seconds...`);

        await sleep(30000);

        console.log("5. Testing Expiry (Should Fail/Limit)...");
        const res2 = await uploadFile(token, 'test2.txt', 'Expired upload');
        console.log("Upload 2 Result:", res2.status);

        console.log("\n!!! ACTION REQUIRED !!!");
        console.log(`Please RESET the subscription (start_date = 2 months ago, scans=100) via MCP/SQL now.`);
        console.log(`Waiting 30 seconds...`);

        await sleep(30000);

        console.log("6. Testing Lazy Reset...");
        const res3 = await uploadFile(token, 'test3.txt', 'Reset upload');
        console.log("Upload 3 Result:", res3.status);

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

run();
