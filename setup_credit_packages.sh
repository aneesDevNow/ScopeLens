#!/bin/bash
set -e

SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA1NjgxNTQsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.XaDlyxw1eJ8TRUILz2vyFGUnI0-QiQM3PDkN7yrgRe0"
API="https://scopelens-supabase.membercore.dev/pg/query"

echo "Creating credit_packages table..."
curl -s --max-time 15 "$API" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -X POST \
  -d '{"query": "CREATE TABLE IF NOT EXISTS public.credit_packages (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, credits INTEGER NOT NULL, bonus_credits INTEGER DEFAULT 0, price NUMERIC(10,2) NOT NULL, is_popular BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());"}'

echo ""
echo "Enabling RLS..."
curl -s --max-time 15 "$API" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -X POST \
  -d '{"query": "ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;"}'

echo ""
echo "Creating read policy..."
curl -s --max-time 15 "$API" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -X POST \
  -d '{"query": "DROP POLICY IF EXISTS credit_packages_read_all ON public.credit_packages; CREATE POLICY credit_packages_read_all ON public.credit_packages FOR SELECT USING (true);"}'

echo ""
echo "Creating admin write policy..."
curl -s --max-time 15 "$API" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -X POST \
  -d '{"query": "DROP POLICY IF EXISTS credit_packages_admin_all ON public.credit_packages; CREATE POLICY credit_packages_admin_all ON public.credit_packages FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = '"'"'admin'"'"'));"}'

echo ""
echo "Seeding data..."
# Truncate first to clear old data if any (and since PK conflict logic was flawed with bad UUIDs)
curl -s --max-time 15 "$API" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -X POST \
  -d '{"query": "TRUNCATE TABLE public.credit_packages;"}'

curl -s --max-time 15 "$API" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -X POST \
  -d '{"query": "INSERT INTO public.credit_packages (name, credits, bonus_credits, price, is_popular, sort_order) VALUES ('"'"'Starter'"'"', 25, 0, 25.00, false, 1), ('"'"'Basic'"'"', 50, 5, 50.00, false, 2), ('"'"'Standard'"'"', 100, 15, 100.00, true, 3), ('"'"'Pro'"'"', 250, 50, 250.00, false, 4), ('"'"'Enterprise'"'"', 500, 125, 500.00, false, 5);"}'

echo ""
echo "Checking result..."
curl -s --max-time 15 "$API" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -X POST \
  -d '{"query": "SELECT * FROM public.credit_packages;"}'
