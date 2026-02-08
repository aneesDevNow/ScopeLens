# ScopeLens — Project Context

## Overview
ScopeLens is an AI-powered academic integrity platform that scans documents (DOCX, TXT) for AI-generated content. It consists of **four Next.js 16 portals** sharing a single **Supabase** backend (Postgres + Auth + Storage).

---

## Architecture

```
scopelens-landing/    → Public marketing site       (port 3000)
scopelens-dashboard/  → User dashboard              (port 3001)
scopelens-admin/      → Admin management panel      (port 3002)
scopelens-reseller/   → Reseller partner portal     (port 3003)
```

All four portals are **independent Next.js 16.1.6** apps with their own `node_modules`. They share the same Supabase project.

### Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth (email/password) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage (file uploads, reports) |
| AI Detection | ZeroGPT API (via `zerogpt_accounts` rotation) |

---

## Environment Variables

All portals require `.env.local`:

| Variable | Landing | Dashboard | Admin | Reseller | Purpose |
|---|:---:|:---:|:---:|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ | ✅ | Public anon key (RLS-bound) |
| `SUPABASE_SERVICE_ROLE_KEY` | — | ✅ | ✅ | ✅ | Bypass RLS for privileged ops |
| `COOKIE_ENCRYPTION_KEY` | — | ✅ | ✅ | ✅ | Cross-portal auth handoff |

---

## Running Locally

```bash
# Landing (port 3000)
cd scopelens-landing && npm run dev

# Dashboard (port 3001)
cd scopelens-dashboard && npm run dev

# Admin (port 3002)
cd scopelens-admin && npm run dev

# Reseller (port 3003)
cd scopelens-reseller && npm run dev
```

---

## Database Schema (18 tables)

### Core
| Table | Purpose |
|---|---|
| `profiles` | User profiles (id, email, first_name, last_name, institution, role, avatar_url, two_factor_enabled, report_logo) |
| `plans` | Subscription plans (Free, Starter, Professional, Institution) |
| `subscriptions` | User-to-plan mapping with scan limits, billing periods |
| `scans` | Individual document scan results |
| `scan_queue` | Async processing queue for file scans |
| `reports` | Generated PDF scan reports |

### AI Detection
| Table | Purpose |
|---|---|
| `zerogpt_accounts` | Pool of ZeroGPT API keys for round-robin detection |

### License & Key System
| Table | Purpose |
|---|---|
| `license_keys` | License keys (SL-XXXXX format) — available → claimed → expired/revoked |
| `licenses` | Legacy license assignments |

### Reseller System
| Table | Purpose |
|---|---|
| `resellers` | Reseller accounts (company_name, referral_code, commission_rate, credit_balance, status) |
| `reseller_profiles` | Legacy extended reseller info (deprecated, use `resellers` instead) |
| `reseller_clients` | Legacy client tracking |
| `reseller_transactions` | Credit purchase history |
| `referrals` | Referral tracking |

### API Keys
| Table | Purpose |
|---|---|
| `api_keys` | Hashed API keys for reseller API access |
| `key_usage_logs` | API usage logging (endpoint, status, response time) |

### System
| Table | Purpose |
|---|---|
| `support_tickets` | User support requests |
| `site_settings` | Global platform configuration |

---

## User Roles

| Role | Portal Access | Capabilities |
|---|---|---|
| `user` | Dashboard | Upload files, view scans, claim license keys, manage profile |
| `reseller` | Reseller Portal | Generate license keys using credits, track key claims, API keys, buy credits |
| `admin` | Admin panel | Full system access, manage users/plans/resellers/keys/settings |

---

## Portal Details

### Landing Page (`scopelens-landing/`)
- **Port:** 3000
- **Pages:** `/` (home with dynamic pricing), standard marketing pages
- **API Routes:** None (reads plans from Supabase directly)
- Fetches plan data dynamically from `plans` table
- PKR currency localization (280:1 conversion)

### Dashboard (`scopelens-dashboard/`)
- **Port:** 3001
- **Pages:**
  - `/` — Dashboard home (scan stats, recent activity)
  - `/files` — File history with inline scan reports, PDF downloads
  - `/plans` — Plans & Usage (stats cards, license key claim, plan upgrade)
  - `/settings` — Profile, 2FA, report logo
  - `/auth/*`, `/login`, `/signup` — Authentication flows
  - `/checkout`, `/payment`, `/success` — Payment flows

- **API Routes:**
  - `POST /api/upload` — File upload (DOCX, TXT, max 20MB)
  - `GET/POST /api/scans` — Scan management
  - `GET /api/scans/[id]` — Individual scan details
  - `GET /api/scans/stats` — Scan statistics
  - `POST /api/claim-key` — Claim a license key (uses service_role for subscription writes)
  - `GET /api/plans` — List available plans
  - `GET/PUT /api/profile` — Profile management
  - `PUT /api/profile/logo` — Report logo upload
  - `GET /api/reports` — List reports
  - `GET /api/report` — Download report PDF
  - `GET /api/subscription` — Current subscription info
  - `GET /api/csrf` — CSRF token

### Reseller Portal (`scopelens-reseller/`)
- **Port:** 3003
- **Design:** Stitch design system — custom sidebar, Inter font, primary #1313ec, Material Symbols icons
- **Layout:** Custom ResellerSidebar component (not shadcn SidebarProvider), fixed sidebar + scrollable main
- **Auth:** Role-based — uses `profiles.role = 'reseller'` (same pattern as admin uses `'admin'`). Middleware enforces role isolation.
- **Login:** Checks `profiles.role === 'reseller'` — centered card, Scope Lens logo, gradient blue button, "Reseller Portal" badge
- **Signup:** Server-side `/api/signup` uses admin API to auto-confirm email, set `profiles.role = 'reseller'`, and create `resellers` table row
- **Pages:**
  - `/` — Reseller landing (become a reseller)
  - `/login` — Reseller authentication (checks profiles.role)
  - `/signup` — Create reseller account (company name, email, password — auto-confirmed)
  - `/dashboard` — Reseller overview (credit balance, key stats, recent keys)
  - `/keys` — Generate license keys (select plan, quantity, deduct credits)
  - `/keys/history` — View all keys with claim status & claimed-by email
  - `/billing` — Buy credits (credit packages with bonuses)
  - `/settings` — Reseller account info & referral code

- **API Routes:**
  - `POST /api/signup` — Server-side signup (admin API, auto-confirm, sets role + creates reseller row)
  - `GET /api/profile` — Reseller profile + key stats (uses `resellers` table)
  - `POST /api/keys/generate` — Generate SL-XXXXX license keys (deducts credits)
  - `GET /api/license-keys` — List all keys with plan info + claimed-by email
  - `GET/POST/DELETE /api/keys` — API key management (max 5 keys)
  - `GET /api/keys/usage` — API usage logs & stats
  - `GET /api/plans` — Plans with reseller pricing
  - `GET /api/transactions` — Transaction history

### Admin Panel (`scopelens-admin/`)
- **Port:** 3002
- **Pages:**
  - `/` — Admin dashboard (system overview)
  - `/users` — User management
  - `/plans` — Plan management
  - `/resellers` — Reseller management
  - `/licenses` — License management
  - `/ai-detection` — ZeroGPT account management & scan queue processing
  - `/analytics` — Platform analytics
  - `/settings` — System settings
  - `/support` — Support ticket management
  - `/system` — System health

- **API Routes:** (all under `/api/admin/`)
  - `GET/POST /api/admin/users` — User CRUD
  - `PUT /api/admin/users/[id]` — Update user
  - `GET/POST /api/admin/plans` — Plan management
  - `PUT /api/admin/plans/[id]` — Update plan
  - `GET/POST/DELETE /api/admin/license-keys` — License key generation & management
  - `GET/POST /api/admin/resellers` — Reseller management
  - `PUT /api/admin/resellers/[id]` — Update reseller
  - `GET/POST /api/admin/settings` — Site settings
  - `GET/PUT /api/admin/support` — Support tickets
  - `GET /api/admin/analytics` — Platform analytics
  - `GET/POST /api/admin/ai-detection/*` — ZeroGPT accounts, scan queue, processing

---

## RLS (Row Level Security)

All tables have RLS enabled. Key patterns:

- **Users** can only SELECT their own data (profiles, subscriptions, scans, reports)
- **Resellers** can manage their own clients, keys, and view their transactions
- **Admins** have ALL access on most tables via role check (`profiles.role = 'admin'`)
- **Service role** bypasses RLS (used for background processing, subscription writes)
- **Special:** `license_keys` has separate policies for:
  - Admin management (ALL)
  - User lookup of available keys (SELECT where status = 'available')
  - User claiming (UPDATE where status = 'available' → 'claimed')
  - User viewing claimed keys (SELECT where claimed_by = auth.uid())

---

## Key Design Patterns

### Cross-Portal Auth Handoff
Dashboard and Admin share Supabase Auth cookies. The `COOKIE_ENCRYPTION_KEY` enables secure session sharing between portals.

### License Key Flow
1. **Admin path:** Admin generates keys via `POST /api/admin/license-keys` (batches up to 100, format: `SL-XXXXX-XXXXX-XXXXX-XXXXX`)
2. **Reseller path:** Reseller generates keys via `POST /api/keys/generate` (uses credits at reseller discount price, sets `reseller_id`)
3. User enters key on Plans & Usage page (`/plans`)
4. `POST /api/claim-key` validates key → marks claimed → creates/updates subscription via service_role client
5. User's plan and scan limits update immediately
6. Reseller can track claim status via `/keys/history` (shows claimed-by email)

### File Scan Flow
1. User uploads DOCX/TXT via Upload Hub (max 20MB)
2. File stored in Supabase Storage, scan record created
3. File enters `scan_queue` for async processing
4. Admin triggers processing via AI Detection page (ZeroGPT API)
5. Results stored in `scans`, PDF report generated in `reports`

### Reseller API Key System
- Resellers can create up to 5 API keys (SHA-256 hashed storage)
- Raw key shown only once on creation
- Usage logged to `key_usage_logs` with rate limiting

---

## File Structure

```
ScopeLens/
├── scopelens-landing/          # Marketing site (port 3000)
│   └── src/
│       ├── app/                # Pages
│       ├── components/         # UI components
│       └── lib/                # Supabase client, utils
│
├── scopelens-dashboard/        # User dashboard (port 3001)
│   └── src/
│       ├── app/
│       │   ├── api/            # 11 API route groups
│       │   ├── files/          # File history page
│       │   ├── plans/          # Plans & Usage + license key claim
│       │   └── settings/       # User settings
│       ├── components/         # Shared UI components
│       └── lib/                # Supabase client, utils
│
├── scopelens-reseller/         # Reseller partner portal (port 3003)
│   └── src/
│       ├── app/
│       │   ├── api/            # 7 API route groups (profile, keys, keys/generate, license-keys, plans, transactions)
│       │   ├── dashboard/      # Reseller overview (credit balance, key stats)
│       │   ├── keys/           # Generate keys + key history
│       │   ├── billing/        # Buy credits
│       │   └── settings/       # Reseller account settings
│       ├── components/         # AppSidebar + UI components (matches dashboard)
│       ├── hooks/              # use-mobile hook
│       ├── contexts/           # CurrencyContext
│       └── lib/                # Supabase client, utils, cookie-crypto
│
├── scopelens-admin/            # Admin panel (port 3002)
│   └── src/
│       ├── app/
│       │   ├── api/admin/      # Admin API routes
│       │   ├── ai-detection/   # ZeroGPT management
│       │   ├── users/          # User management
│       │   ├── resellers/      # Reseller management
│       │   └── settings/       # System settings
│       ├── components/         # Admin UI components
│       └── lib/                # Supabase client, utils
│
├── stitch/                     # Design system assets
├── exmple_reports/             # Sample PDF reports
├── scripts/                    # Utility scripts
├── test_files/                 # Test documents
└── db.txt                      # Database connection reference
```

---

## Supabase Connection

- **Project:** `sonwwaslaqzbtmpxxrhr`
- **Region:** Supabase cloud
- **Direct DB:** `postgresql://postgres:***@db.sonwwaslaqzbtmpxxrhr.supabase.co:5432/postgres`
- **Storage Buckets:** `uploads` (user files), `reports` (PDF reports)
