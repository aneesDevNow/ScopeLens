import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

// Use Node.js runtime (not Edge) because cookie-crypto uses Node.js crypto module
export const runtime = 'nodejs'

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next (all Next.js internals: static, image, webpack-hmr, etc.)
         * - favicon.ico (browser icon)
         * - public folder static assets (svg, png, jpg, etc.)
         */
        '/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}
