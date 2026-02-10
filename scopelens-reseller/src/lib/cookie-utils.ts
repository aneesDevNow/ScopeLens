// Edge-safe encryption bypass (encryption temporarily disabled for Edge compatibility)
export function encryptCookieValue(value: string): string {
    return value;
}

export function decryptCookieValue(value: string): string {
    return value;
}

/**
 * Remap Supabase cookie name to a short custom name
 * sb-xxx-auth-token → sl_t
 * sb-xxx-auth-token-code-verifier → sl_v  
 * sb-xxx-auth-token.0, .1, etc → sl_t.0, sl_t.1
 */
export function toCustomCookieName(supabaseName: string): string {
    if (supabaseName.match(/^sb-[a-z0-9]+-auth-token-code-verifier$/)) {
        return "sl_v";
    }
    // Chunked tokens: sb-xxx-auth-token.0, .1, etc
    const chunkMatch = supabaseName.match(/^sb-[a-z0-9]+-auth-token\.(\d+)$/);
    if (chunkMatch) {
        return `sl_t.${chunkMatch[1]}`;
    }
    if (supabaseName.match(/^sb-[a-z0-9]+-auth-token$/)) {
        return "sl_t";
    }
    // Not a Supabase cookie, keep as-is
    return supabaseName;
}

/**
 * Remap custom cookie name back to Supabase internal name
 */
export function toSupabaseCookieName(customName: string, projectRef: string): string {
    if (customName === "sl_v") {
        return `sb-${projectRef}-auth-token-code-verifier`;
    }
    const chunkMatch = customName.match(/^sl_t\.(\d+)$/);
    if (chunkMatch) {
        return `sb-${projectRef}-auth-token.${chunkMatch[1]}`;
    }
    if (customName === "sl_t") {
        return `sb-${projectRef}-auth-token`;
    }
    return customName;
}

/**
 * Extract project ref from Supabase URL
 * Cloud:       https://xxx.supabase.co → xxx
 * Self-hosted: https://scopelens-supabase.membercore.dev → scopelens-supabase
 */
export function getProjectRef(): string {
    const url = process.env.SUPABASE_URL || "";
    // Cloud Supabase: https://xxx.supabase.co
    const cloudMatch = url.match(/https?:\/\/([a-z0-9]+)\.supabase/);
    if (cloudMatch) return cloudMatch[1];
    // Self-hosted: use full hostname as project ref
    const selfHostedMatch = url.match(/https?:\/\/([^/]+)/);
    return selfHostedMatch?.[1]?.replace(/[.:]/g, '_') || "";
}
