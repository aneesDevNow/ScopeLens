# Authentication System

## Overview

ScopeLens uses Supabase Auth with a custom cross-portal authentication handoff system, allowing users to seamlessly navigate between the landing page, dashboard, and admin portal.

## Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Landing   │───►│  Dashboard  │───►│    Admin    │
│  Port 3000  │    │  Port 3001  │    │  Port 3002  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       └──────────────────┴──────────────────┘
                         │
                    Supabase Auth
```

## Login Methods

### Email/Password
Standard email and password authentication.

### Magic Link (OTP)
Passwordless login via email verification code.

## Cross-Portal Auth Handoff

Users authenticated on one portal can navigate to another without re-authenticating:

### How it works:

1. User logs in on Landing page
2. Portal generates a temporary handoff token
3. User is redirected to Dashboard with token in URL
4. Dashboard validates token and establishes session

### Implementation

```tsx
// Redirect to dashboard with auth handoff
const handoffUrl = `/auth/handoff?token=${handoffToken}&redirect=/dashboard`;
router.push(handoffUrl);
```

## User Roles

| Role | Portals Access | Description |
|------|----------------|-------------|
| `user` | Dashboard | Regular platform user |
| `reseller` | Dashboard (Reseller section) | Credit-based distributor |
| `admin` | Admin, Dashboard | Full administrative access |

## Protected Routes

### Middleware Protection

Routes are protected via Next.js middleware:

```tsx
// middleware.ts
export const config = {
  matcher: ['/dashboard/:path*', '/reseller/:path*', '/admin/:path*']
}
```

### Route-level Protection

```tsx
// In page component
const { user, loading } = useAuth();

if (loading) return <LoadingSpinner />;
if (!user) redirect('/login');
```

## Session Management

- **Session Duration**: 7 days (configurable)
- **Refresh**: Automatic token refresh
- **Storage**: Secure HTTP-only cookies

## API Authentication

All API routes verify authentication:

```tsx
// /api/example/route.ts
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Handle authenticated request
}
```

## Login Pages

| Portal | Login URL | Redirect After Login |
|--------|-----------|---------------------|
| Dashboard | `/auth/login` | `/` (Dashboard home) |
| Reseller | `/reseller/login` | `/reseller` |
| Admin | `/login` | `/` (Admin home) |

## Logout

```tsx
import { createClientClient } from '@/lib/supabase/client';

const logout = async () => {
  const supabase = createClientClient();
  await supabase.auth.signOut();
  router.push('/login');
};
```

## Security Features

- **CSRF Protection**: Token-based CSRF validation
- **Rate Limiting**: Login attempt throttling
- **Password Hashing**: Bcrypt via Supabase
- **Session Invalidation**: Server-side session control
