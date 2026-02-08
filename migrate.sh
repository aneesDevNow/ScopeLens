#!/bin/bash
# Migration script for self-hosted Supabase
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0"
API="https://scopelens-supabase.membercore.dev/pg/query"

run_sql() {
  local desc="$1"
  local sql="$2"
  echo -n "  $desc... "
  result=$(curl -s --max-time 30 "$API" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -X POST \
    -d "{\"query\": $(echo "$sql" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}")
  if echo "$result" | grep -q '"error"'; then
    echo "ERROR: $result"
  else
    echo "OK"
  fi
}

echo "=== Creating Schema on Self-Hosted Supabase ==="

# 1. Tables
run_sql "scans" "CREATE TABLE IF NOT EXISTS public.scans (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid NOT NULL, file_name text NOT NULL, file_size integer, file_type text, ai_score numeric(5,2), word_count integer, paragraph_count integer, status text DEFAULT 'processing' CHECK (status IN ('pending', 'processing', 'completed', 'failed')), created_at timestamptz DEFAULT now(), completed_at timestamptz, file_path text, report_path text, zerogpt_result jsonb);"

run_sql "reports" "CREATE TABLE IF NOT EXISTS public.reports (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, scan_id uuid NOT NULL, user_id uuid NOT NULL, overall_score numeric(5,2), human_score numeric(5,2), paragraph_analysis jsonb DEFAULT '[]'::jsonb, detection_models jsonb DEFAULT '[]'::jsonb, created_at timestamptz DEFAULT now());"

run_sql "scan_queue" "CREATE TABLE IF NOT EXISTS public.scan_queue (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, scan_id uuid NOT NULL, input_text text NOT NULL, status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'processing', 'completed', 'failed')), account_id uuid, result jsonb, error text, created_at timestamptz DEFAULT now(), started_at timestamptz, completed_at timestamptz, retry_count integer DEFAULT 0);"

run_sql "zerogpt_accounts" "CREATE TABLE IF NOT EXISTS public.zerogpt_accounts (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, label text DEFAULT 'Account' NOT NULL, bearer_token text NOT NULL, is_active boolean DEFAULT true, max_concurrent integer DEFAULT 2, current_active integer DEFAULT 0, total_requests integer DEFAULT 0, failed_requests integer DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), max_retries integer DEFAULT 3);"

run_sql "site_settings" "CREATE TABLE IF NOT EXISTS public.site_settings (key text NOT NULL PRIMARY KEY, value text, updated_at timestamptz DEFAULT now());"

run_sql "support_tickets" "CREATE TABLE IF NOT EXISTS public.support_tickets (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid NOT NULL, subject text NOT NULL, message text NOT NULL, priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')), status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')), assigned_to uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());"

run_sql "licenses" "CREATE TABLE IF NOT EXISTS public.licenses (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, key text NOT NULL UNIQUE, plan_id uuid NOT NULL, max_users integer DEFAULT 100, duration_months integer DEFAULT 12, status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')), assigned_to uuid, expires_at timestamptz, created_by uuid, created_at timestamptz DEFAULT now());"

run_sql "license_keys" "CREATE TABLE IF NOT EXISTS public.license_keys (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, key_code text NOT NULL UNIQUE, plan_id uuid NOT NULL, duration_days integer DEFAULT 30 NOT NULL, status text DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'expired', 'revoked')), generated_by uuid NOT NULL, claimed_by uuid, reseller_id uuid, batch_id text, claimed_at timestamptz, expires_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());"

run_sql "resellers" "CREATE TABLE IF NOT EXISTS public.resellers (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid NOT NULL, company_name text, referral_code text NOT NULL UNIQUE, commission_rate numeric(5,2) DEFAULT 30.00, total_clients integer DEFAULT 0, total_revenue numeric(12,2) DEFAULT 0, total_commission numeric(12,2) DEFAULT 0, pending_payout numeric(12,2) DEFAULT 0, status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), credit_balance numeric(12,2) DEFAULT 0);"

run_sql "reseller_profiles" "CREATE TABLE IF NOT EXISTS public.reseller_profiles (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid NOT NULL UNIQUE, company_name text, credit_balance numeric(10,2) DEFAULT 0.00, total_purchased numeric(10,2) DEFAULT 0.00, total_spent numeric(10,2) DEFAULT 0.00, commission_earned numeric(10,2) DEFAULT 0.00, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());"

run_sql "reseller_clients" "CREATE TABLE IF NOT EXISTS public.reseller_clients (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, reseller_id uuid NOT NULL, client_user_id uuid, client_email text NOT NULL, client_name text NOT NULL, plan_id uuid NOT NULL, status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')), retail_price numeric(10,2) NOT NULL, reseller_cost numeric(10,2) NOT NULL, profit numeric(10,2) NOT NULL, billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')), activated_at timestamptz DEFAULT now(), expires_at timestamptz NOT NULL, last_renewed_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());"

run_sql "reseller_transactions" "CREATE TABLE IF NOT EXISTS public.reseller_transactions (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, reseller_id uuid NOT NULL, type text NOT NULL CHECK (type IN ('credit_purchase', 'client_activation', 'client_renewal', 'refund', 'adjustment')), amount numeric(10,2) NOT NULL, balance_after numeric(10,2) NOT NULL, description text, reference_id uuid, created_by uuid, created_at timestamptz DEFAULT now());"

run_sql "referrals" "CREATE TABLE IF NOT EXISTS public.referrals (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, reseller_id uuid NOT NULL, referred_user_id uuid NOT NULL, subscription_id uuid, revenue_generated numeric(10,2) DEFAULT 0, commission_earned numeric(10,2) DEFAULT 0, created_at timestamptz DEFAULT now());"

run_sql "api_keys" "CREATE TABLE IF NOT EXISTS public.api_keys (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, reseller_id uuid NOT NULL, key_hash text NOT NULL, key_prefix text NOT NULL, name text DEFAULT 'Default Key' NOT NULL, scopes text[] DEFAULT ARRAY['scan:create', 'scan:read'], rate_limit_per_minute integer DEFAULT 60, rate_limit_per_day integer DEFAULT 1000, is_active boolean DEFAULT true, last_used_at timestamptz, expires_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());"

run_sql "key_usage_logs" "CREATE TABLE IF NOT EXISTS public.key_usage_logs (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, api_key_id uuid NOT NULL, endpoint text NOT NULL, method text DEFAULT 'POST' NOT NULL, status_code integer DEFAULT 200 NOT NULL, response_time_ms integer, ip_address inet, user_agent text, created_at timestamptz DEFAULT now());"

# 2. Indexes
echo ""
echo "=== Creating Indexes ==="
run_sql "idx_api_keys_key_hash" "CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys USING btree (key_hash);"
run_sql "idx_api_keys_reseller_id" "CREATE INDEX IF NOT EXISTS idx_api_keys_reseller_id ON public.api_keys USING btree (reseller_id);"
run_sql "idx_key_usage_logs_api_key_id" "CREATE INDEX IF NOT EXISTS idx_key_usage_logs_api_key_id ON public.key_usage_logs USING btree (api_key_id);"
run_sql "idx_key_usage_logs_created_at" "CREATE INDEX IF NOT EXISTS idx_key_usage_logs_created_at ON public.key_usage_logs USING btree (created_at);"
run_sql "idx_license_keys_key_code" "CREATE INDEX IF NOT EXISTS idx_license_keys_key_code ON public.license_keys USING btree (key_code);"

# 3. Trigger for auto-creating profile on auth.users insert
echo ""
echo "=== Creating Trigger ==="
run_sql "on_auth_user_created trigger" "CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();"

# 4. Seed plans
echo ""
echo "=== Seeding Plans ==="
run_sql "Free plan" "INSERT INTO public.plans (name, slug, price_monthly, price_yearly, scans_per_month, features, reseller_price_monthly, reseller_price_yearly, reseller_discount_percent) VALUES ('Free', 'free', 0, 0, 1, '{\"PDF & DOCX support\": true, \"1 AI scan per month\": true, \"Standard report summary\": true, \"Basic plagiarism detection\": true}', 0, 0, 20) ON CONFLICT (name) DO NOTHING;"

run_sql "Starter plan" "INSERT INTO public.plans (name, slug, price_monthly, price_yearly, scans_per_month, features, reseller_price_monthly, reseller_price_yearly, reseller_discount_percent) VALUES ('Starter', 'starter', 12, 114, 15, '{\"Email support\": true, \"15 AI scans per month\": true, \"Detailed originality reports\": true, \"Advanced plagiarism detection\": true, \"Multi-format support (PDF, DOCX, TXT)\": true}', 8.40, 79.80, 30) ON CONFLICT (name) DO NOTHING;"

run_sql "Professional plan" "INSERT INTO public.plans (name, slug, price_monthly, price_yearly, scans_per_month, features, reseller_price_monthly, reseller_price_yearly, reseller_discount_percent) VALUES ('Professional', 'professional', 17, 161, 25, '{\"25 AI scans per month\": true, \"Deep content analysis\": true, \"Priority email support\": true, \"Export detailed PDF reports\": true, \"Sentence-level AI highlighting\": true}', 11.90, 112.70, 30) ON CONFLICT (name) DO NOTHING;"

run_sql "Institution plan" "INSERT INTO public.plans (name, slug, price_monthly, price_yearly, scans_per_month, features, reseller_price_monthly, reseller_price_yearly, reseller_discount_percent) VALUES ('Institution', 'institution', 59, 559, 100, '{\"100 AI scans per month\": true, \"Dedicated account manager\": true, \"Bulk upload & batch processing\": true, \"Full content integrity analysis\": true}', 41.30, 391.30, 30) ON CONFLICT (name) DO NOTHING;"

# 5. Create admin user via Auth API
echo ""
echo "=== Creating Admin User ==="
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.SyUoeSlLj1rzQKPfOA1UjZQa2qnNx67Uc0xjjjP0m2E"
AUTH_API="https://scopelens-supabase.membercore.dev/auth/v1"

# Create admin user via admin API
admin_result=$(curl -s "$AUTH_API/admin/users" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "email": "technicalanees@gmail.com",
    "password": "Admin1234!",
    "email_confirm": true,
    "user_metadata": {"first_name": "Admin"}
  }')

admin_id=$(echo "$admin_result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
echo "  Admin user created: $admin_id"

# Set admin role in profiles
if [ -n "$admin_id" ] && [ "$admin_id" != "" ]; then
  run_sql "Set admin role" "UPDATE public.profiles SET role = 'admin', first_name = 'Admin' WHERE id = '$admin_id';"
fi

# 6. Insert ZeroGPT token
echo ""
echo "=== Adding ZeroGPT Token ==="
run_sql "ZeroGPT account" "INSERT INTO public.zerogpt_accounts (label, bearer_token, is_active, max_concurrent, max_retries) VALUES ('Main Account', 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE4NTY1MzYiLCJyb2xlIjoiMyIsInNhbGF0YV9lbmdpbmUiOiIyLjciLCJjb3N0X3Blcl90aG91c2FuZCI6IjAuMDY5IiwibnVtYmVyX29mX2NoYXJhY3RlcnMiOiI1MDAwMDAiLCJudW1iZXJfb2ZfZmlsZXMiOiIxNTAiLCJleHAiOjIwODE1MTU0MDh9.Bszh7flifi5n73AH6LRd5Bqc2PJnKsNb3hINSp-LGGTHyPB25y83mIxxlUd-ZF3Zuyzgx5T9Tsj-s-3C4KmKoCdzNbnNxnPLuNMmpT1m7CxK84B8TJe6ndUDP0MHCewWx8QIDOw2d3YuYB0iSzIGjLn6vRfVNVhq_XX4LqKEBQo', true, 3, 3);"

# 7. Enable RLS
echo ""
echo "=== Enabling RLS ==="
for tbl in profiles plans subscriptions scans reports scan_queue zerogpt_accounts site_settings support_tickets licenses license_keys resellers reseller_profiles reseller_clients reseller_transactions referrals api_keys key_usage_logs; do
  run_sql "RLS on $tbl" "ALTER TABLE public.$tbl ENABLE ROW LEVEL SECURITY;"
done

# 8. RLS Policies
echo ""
echo "=== Creating RLS Policies ==="
run_sql "profiles read own" "CREATE POLICY \"Users can read own profile\" ON public.profiles FOR SELECT USING (auth.uid() = id);"
run_sql "profiles update own" "CREATE POLICY \"Users can update own profile\" ON public.profiles FOR UPDATE USING (auth.uid() = id);"
run_sql "profiles service insert" "CREATE POLICY \"Service role can manage profiles\" ON public.profiles FOR ALL USING (auth.role() = 'service_role');"
run_sql "plans read all" "CREATE POLICY \"Anyone can read plans\" ON public.plans FOR SELECT USING (true);"
run_sql "plans admin manage" "CREATE POLICY \"Service role can manage plans\" ON public.plans FOR ALL USING (auth.role() = 'service_role');"
run_sql "scans read own" "CREATE POLICY \"Users can read own scans\" ON public.scans FOR SELECT USING (auth.uid() = user_id);"
run_sql "scans insert own" "CREATE POLICY \"Users can insert own scans\" ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);"
run_sql "scans service manage" "CREATE POLICY \"Service role can manage scans\" ON public.scans FOR ALL USING (auth.role() = 'service_role');"
run_sql "scan_queue service" "CREATE POLICY \"Service role can manage scan_queue\" ON public.scan_queue FOR ALL USING (auth.role() = 'service_role');"
run_sql "zerogpt service" "CREATE POLICY \"Service role can manage zerogpt\" ON public.zerogpt_accounts FOR ALL USING (auth.role() = 'service_role');"
run_sql "site_settings read" "CREATE POLICY \"Anyone can read settings\" ON public.site_settings FOR SELECT USING (true);"
run_sql "site_settings service" "CREATE POLICY \"Service role can manage settings\" ON public.site_settings FOR ALL USING (auth.role() = 'service_role');"
run_sql "subscriptions read own" "CREATE POLICY \"Users can read own subs\" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);"
run_sql "subscriptions service" "CREATE POLICY \"Service role can manage subs\" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');"

echo ""
echo "=== Verifying ==="
run_sql "List tables" "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

echo ""
echo "=== DONE ==="
