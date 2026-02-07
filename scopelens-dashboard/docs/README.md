# ScopeLens Documentation

Welcome to the ScopeLens platform documentation. This guide covers all three portals and their features.

## Platform Overview

ScopeLens is a multi-portal SaaS platform for file scanning and document analysis:

| Portal | Port | Description |
|--------|------|-------------|
| **Landing** | 3000 | Public marketing website |
| **Dashboard** | 3001 | User & Reseller panel |
| **Admin** | 3002 | Administrative controls |

## Quick Start

```bash
# Start all portals
cd scopelens-landing && npm run dev &
cd scopelens-dashboard && npm run dev -- -p 3001 &
cd scopelens-admin && npm run dev -- -p 3002 &
```

## Documentation Index

### Core Features
- [Currency Support](./CURRENCY_SUPPORT.md) - PKR/USD multi-currency system
- [Authentication](./AUTHENTICATION.md) - Cross-portal auth with Supabase
- [File Upload](./FILE_UPLOAD.md) - Upload hub and file management

### User Dashboard
- [Dashboard Overview](./DASHBOARD.md) - Main user dashboard features
- [Plans & Checkout](./CHECKOUT.md) - Subscription checkout flow
- [Reports](./REPORTS.md) - Scan results and PDF reports

### Reseller Portal
- [Reseller System](./RESELLER.md) - Credit-based reseller features
- [Client Management](./RESELLER_CLIENTS.md) - Managing reseller clients

### Admin Panel
- [Admin Overview](./ADMIN.md) - Administrative dashboard
- [User Management](./ADMIN_USERS.md) - Managing platform users
- [Plan Management](./ADMIN_PLANS.md) - Subscription plan configuration

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with cross-portal handoff
- **UI Components**: shadcn/ui

## Project Structure

```
ScopeLens/
├── scopelens-landing/     # Marketing site (port 3000)
├── scopelens-dashboard/   # User & Reseller (port 3001)
│   ├── src/app/
│   │   ├── (routes)/      # User routes
│   │   ├── reseller/      # Reseller routes
│   │   └── api/           # API endpoints
│   └── src/contexts/      # React contexts
└── scopelens-admin/       # Admin panel (port 3002)
    └── src/app/
        ├── (routes)/      # Admin routes
        └── api/           # Admin API
```
