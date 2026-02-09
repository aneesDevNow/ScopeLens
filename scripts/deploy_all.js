#!/usr/bin/env node
// Deploy all ScopeLens apps via Dokploy API

const API_URL = 'http://95.217.38.155:3000';
const API_KEY = 'macbooklswXLWvMNfZDzssBHCYtqdGREpsKWiOHtcQCVuSHILglMeSTOnxcQqIqFSuTaZqd';

const SUPABASE_URL = 'https://scopelens-supabase.membercore.dev';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.SyUoeSlLj1rzQKPfOA1UjZQa2qnNx67Uc0xjjjP0m2E';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0';
const COOKIE_KEY = 'sl_enc_k3y_bf087e5f926dd6c329a3a5301545dca3';

const services = [
    {
        name: 'admin',
        composeId: 'kGZK7zE--bQvxZ0WBVgI_',
        env: [
            `NEXT_PUBLIC_SITE_URL=https://admin.scopelens.ai`,
            `NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`,
            `NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`,
            `SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}`,
            `COOKIE_ENCRYPTION_KEY=${COOKIE_KEY}`,
        ].join('\n')
    },
    {
        name: 'user (dashboard)',
        composeId: '8vn7O8r800nOwlrXFRLii',
        env: [
            `NEXT_PUBLIC_SITE_URL=https://app.scopelens.ai`,
            `NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`,
            `NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`,
            `SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}`,
            `COOKIE_ENCRYPTION_KEY=${COOKIE_KEY}`,
            `S3_ENDPOINT=https://s3.eu-central-2.wasabisys.com`,
            `S3_ACCESS_KEY=21G1OUZVAPSM9HJHRR3Y`,
            `S3_SECRET_KEY=LmS6ChZcfR9FEBKPBHXUiuozeVbppgkgAjF55sLi`,
            `S3_BUCKET_FOLDER_DOCUMENTS=documents`,
            `S3_BUCKET_FOLDER_REPORTS=reports`,
            `S3_BUCKET_NAME=scopelens`,
        ].join('\n')
    },
    {
        name: 'reseller',
        composeId: 'NfQnXnD_zKqa1Y6kCOr5l',
        env: [
            `NEXT_PUBLIC_SITE_URL=https://reseller.scopelens.ai`,
            `NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`,
            `NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`,
            `SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}`,
            `COOKIE_ENCRYPTION_KEY=${COOKIE_KEY}`,
        ].join('\n')
    },
    {
        name: 'landing-page',
        composeId: 'DbaiUmH_6G5jwMD6c9cXy',
        env: [
            `NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`,
            `NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`,
            `RESELLER_DASHBOARD=https://reseller.scopelens.ai`,
        ].join('\n')
    },
];

async function apiCall(endpoint, body) {
    const res = await fetch(`${API_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    return { status: res.status, body: text };
}

async function setEnvAndDeploy(service) {
    console.log(`\n=== ${service.name} ===`);

    // Step 1: Set environment variables
    console.log(`  Setting env vars...`);
    const envResult = await apiCall('compose.update', {
        composeId: service.composeId,
        env: service.env,
    });
    console.log(`  Env update: ${envResult.status} ${envResult.body.substring(0, 100)}`);

    // Step 2: Deploy
    console.log(`  Triggering deploy...`);
    const deployResult = await apiCall('compose.deploy', {
        composeId: service.composeId,
    });
    console.log(`  Deploy: ${deployResult.status} ${deployResult.body.substring(0, 100)}`);

    return { name: service.name, envStatus: envResult.status, deployStatus: deployResult.status };
}

async function main() {
    console.log('🚀 Deploying all ScopeLens apps...\n');

    // Run sequentially to avoid overloading the server
    const results = [];
    for (const service of services) {
        try {
            const r = await setEnvAndDeploy(service);
            results.push(r);
        } catch (err) {
            console.error(`  ❌ Error with ${service.name}: ${err.message}`);
            results.push({ name: service.name, error: err.message });
        }
    }

    console.log('\n\n📊 Summary:');
    console.table(results);
}

main().catch(console.error);
