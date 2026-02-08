-- Create zerogpt_accounts table
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

-- Create scan_queue table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scan_queue_status ON scan_queue(status);
CREATE INDEX IF NOT EXISTS idx_scan_queue_scan_id ON scan_queue(scan_id);
CREATE INDEX IF NOT EXISTS idx_zerogpt_accounts_active ON zerogpt_accounts(is_active);

-- Enable RLS
ALTER TABLE zerogpt_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_queue ENABLE ROW LEVEL SECURITY;

-- Policies: service role only (admin access)
CREATE POLICY "Service role full access on zerogpt_accounts" ON zerogpt_accounts
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on scan_queue" ON scan_queue
    FOR ALL USING (true) WITH CHECK (true);
