import { createBrowserClient } from '@supabase/ssr'

// Extract project ref from Supabase URL
function getProjectRef(): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const match = url.match(/https?:\/\/([a-z0-9]+)\.supabase/)
    return match?.[1] || ""
}

// Cookie name mapping (browser-safe, no encryption — encryption is handled server-side)
function toSupabaseCookieName(customName: string, projectRef: string): string {
    if (customName === "sl_v") return `sb-${projectRef}-auth-token-code-verifier`
    const chunkMatch = customName.match(/^sl_t\.(\d+)$/)
    if (chunkMatch) return `sb-${projectRef}-auth-token.${chunkMatch[1]}`
    if (customName === "sl_t") return `sb-${projectRef}-auth-token`
    return customName
}

function toCustomCookieName(supabaseName: string): string {
    if (supabaseName.match(/^sb-[a-z0-9]+-auth-token-code-verifier$/)) return "sl_v"
    const chunkMatch = supabaseName.match(/^sb-[a-z0-9]+-auth-token\.(\d+)$/)
    if (chunkMatch) return `sl_t.${chunkMatch[1]}`
    if (supabaseName.match(/^sb-[a-z0-9]+-auth-token$/)) return "sl_t"
    return supabaseName
}

export function createClient() {
    const projectRef = getProjectRef()

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    // Parse document.cookie and remap custom names back to Supabase format
                    const pairs = document.cookie.split(';').map(c => c.trim()).filter(Boolean)
                    return pairs.map(pair => {
                        const idx = pair.indexOf('=')
                        const name = idx > -1 ? pair.substring(0, idx) : pair
                        const value = idx > -1 ? decodeURIComponent(pair.substring(idx + 1)) : ''
                        return {
                            name: toSupabaseCookieName(name, projectRef),
                            value,
                        }
                    })
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        const customName = toCustomCookieName(name)
                        let cookieStr = `${customName}=${encodeURIComponent(value)}`
                        if (options?.path) cookieStr += `; path=${options.path}`
                        if (options?.maxAge) cookieStr += `; max-age=${options.maxAge}`
                        if (options?.domain) cookieStr += `; domain=${options.domain}`
                        if (options?.sameSite) cookieStr += `; samesite=${options.sameSite}`
                        if (options?.secure) cookieStr += `; secure`
                        document.cookie = cookieStr
                    })
                },
            },
        }
    )
}
