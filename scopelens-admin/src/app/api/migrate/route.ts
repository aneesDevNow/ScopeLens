import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        // Use raw postgres connection via supabase management API
        // Since we can't run raw SQL via the JS client, we use the /pg endpoint
        const sqlStatements = [
            `CREATE TABLE IF NOT EXISTS zerogpt_accounts (
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
            )`,
            `CREATE TABLE IF NOT EXISTS scan_queue (
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
            )`,
            `CREATE INDEX IF NOT EXISTS idx_scan_queue_status ON scan_queue(status)`,
            `CREATE INDEX IF NOT EXISTS idx_scan_queue_scan_id ON scan_queue(scan_id)`,
            `CREATE INDEX IF NOT EXISTS idx_zerogpt_accounts_active ON zerogpt_accounts(is_active)`,
        ];

        // Execute via Supabase SQL API (using the pg-meta endpoint)
        const results = [];
        for (const sql of sqlStatements) {
            const res = await fetch(`${supabaseUrl}/pg/query`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${serviceRoleKey}`,
                    "apikey": serviceRoleKey,
                },
                body: JSON.stringify({ query: sql }),
            });
            const data = await res.text();
            results.push({ sql: sql.substring(0, 60) + "...", status: res.status, response: data });
        }

        return NextResponse.json({ results });

    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
