const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scopelens-supabase.membercore.dev';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' }
});

async function run() {
    console.log('=== Migrating scans_per_month → scans_per_day ===\n');

    // Step 1: Rename column via PostgREST SQL (not directly possible)
    // We need to use the pg_net extension or raw SQL endpoint
    // Since PostgREST doesn't support DDL, let's try the /pg endpoint

    // Actually, let's use fetch to call the SQL endpoint directly
    const sqlStatements = [
        // Rename column
        `ALTER TABLE public.plans RENAME COLUMN scans_per_month TO scans_per_day;`,
    ];

    for (const sql of sqlStatements) {
        console.log(`Executing: ${sql.substring(0, 80)}...`);
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        // This won't work for DDL, but let's try pg endpoint
    }

    // Alternative: Use the Supabase pg-meta endpoint for DDL
    const ddlRes = await fetch(`${SUPABASE_URL}/pg/query`, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: `ALTER TABLE public.plans RENAME COLUMN scans_per_month TO scans_per_day;`
        })
    });
    console.log('DDL Response status:', ddlRes.status);
    const ddlBody = await ddlRes.text();
    console.log('DDL Response:', ddlBody);

    // Step 2: Update features JSONB for each plan
    console.log('\nUpdating features JSONB...');
    const { data: plans } = await supabase.from('plans').select('id, name, features');

    if (plans) {
        for (const plan of plans) {
            const features = plan.features;
            const newFeatures = {};
            for (const [key, value] of Object.entries(features)) {
                const newKey = key
                    .replace(/per month/gi, 'per day')
                    .replace(/per month/gi, 'per day');
                newFeatures[newKey] = value;
            }

            const changed = JSON.stringify(features) !== JSON.stringify(newFeatures);
            if (changed) {
                const { error } = await supabase
                    .from('plans')
                    .update({ features: newFeatures })
                    .eq('id', plan.id);
                console.log(`  ${plan.name}: ${error ? 'FAILED - ' + error.message : 'Updated'}`);
            } else {
                console.log(`  ${plan.name}: No changes needed`);
            }
        }
    }

    // Verify
    console.log('\nVerifying...');
    const { data: updated } = await supabase.from('plans').select('name, scans_per_day, features');
    if (updated) {
        for (const p of updated) {
            console.log(`  ${p.name}: ${p.scans_per_day} scans/day, features:`, Object.keys(p.features).join(', '));
        }
    } else {
        // Column might not be renamed yet, try old name
        const { data: old } = await supabase.from('plans').select('name, scans_per_month, features');
        if (old) {
            console.log('  Column still named scans_per_month. DDL rename may have failed.');
            for (const p of old) {
                console.log(`  ${p.name}: ${p.scans_per_month} scans/month`);
            }
        }
    }

    console.log('\nDone.');
}

run().catch(console.error);
