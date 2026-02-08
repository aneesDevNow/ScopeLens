// Run with: node run-migration.mjs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sonwwaslaqzbtmpxxrhr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbnd3YXNsYXF6YnRtcHh4cmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA1NjEzOCwiZXhwIjoyMDg1NjMyMTM4fQ.wtsb0nYMHHt65OCkF9OAJZRh8nQQYhZcghf8kZcAAjQ';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Test: try to insert into zerogpt_accounts to see if table exists
const { error } = await supabase.from('zerogpt_accounts').select('id').limit(1);
if (error) {
    console.log('Tables do not exist yet. Error:', error.message);
    console.log('\nPlease run this SQL in the Supabase Dashboard SQL Editor:');
    console.log('Go to: https://supabase.com/dashboard/project/sonwwaslaqzbtmpxxrhr/sql/new');
    console.log('\n--- SQL START ---');
    console.log(`
CREATE TABLE IF NOT EXISTS zerogpt_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL DEFAULT 'Account',
    bearer_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_concurrent INTEGER DEFAULT 2,
    current_active INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scan_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'processing', 'completed', 'failed')),
    account_id UUID REFERENCES zerogpt_accounts(id) ON DELETE SET NULL,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scan_queue_status ON scan_queue(status);
CREATE INDEX IF NOT EXISTS idx_scan_queue_scan_id ON scan_queue(scan_id);
CREATE INDEX IF NOT EXISTS idx_zerogpt_accounts_active ON zerogpt_accounts(is_active);

ALTER TABLE zerogpt_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on zerogpt_accounts" ON zerogpt_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on scan_queue" ON scan_queue FOR ALL USING (true) WITH CHECK (true);
    `);
    console.log('--- SQL END ---');
} else {
    console.log('✅ zerogpt_accounts table exists');
    const { error: err2 } = await supabase.from('scan_queue').select('id').limit(1);
    if (err2) {
        console.log('❌ scan_queue table does not exist:', err2.message);
    } else {
        console.log('✅ scan_queue table exists');
        console.log('All tables ready!');
    }
}
