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
    if (supabaseName.match(/^sb-[a-z0-9-]+-auth-token-code-verifier$/)) {
        return "sl_v";
    }
    // Chunked tokens: sb-xxx-auth-token.0, .1, etc
    const chunkMatch = supabaseName.match(/^sb-[a-z0-9-]+-auth-token\.(\d+)$/);
    if (chunkMatch) {
        return `sl_t.${chunkMatch[1]}`;
    }
    if (supabaseName.match(/^sb-[a-z0-9-]+-auth-token$/)) {
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
    const cloudMatch = url.match(/https?:\/\/([a-z0-9]+)\.supabase/);
    if (cloudMatch) return cloudMatch[1];
    const selfHostedMatch = url.match(/https?:\/\/([^./]+)/);
    return selfHostedMatch?.[1] || "";
}

// ── Cookie Chunking ──
const CHUNK_SIZE = 3500;

export function splitCookieValue(name: string, value: string): Array<{ name: string; value: string }> {
    if (value.length <= CHUNK_SIZE) return [{ name, value }];
    const chunks: Array<{ name: string; value: string }> = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push({ name: `${name}.${chunks.length}`, value: value.substring(i, i + CHUNK_SIZE) });
    }
    return chunks;
}

export function reassembleChunkedCookies(
    cookies: Array<{ name: string; value: string }>
): Array<{ name: string; value: string }> {
    const chunks = new Map<string, Map<number, string>>();
    const singles: Array<{ name: string; value: string }> = [];
    for (const cookie of cookies) {
        const match = cookie.name.match(/^(.+)\.(\d+)$/);
        if (match) {
            const baseName = match[1];
            const index = parseInt(match[2]);
            if (!chunks.has(baseName)) chunks.set(baseName, new Map());
            chunks.get(baseName)!.set(index, cookie.value);
        } else {
            singles.push(cookie);
        }
    }
    const result = [...singles];
    for (const [baseName, indexMap] of chunks) {
        const indices = Array.from(indexMap.keys()).sort((a, b) => a - b);
        result.push({ name: baseName, value: indices.map(i => indexMap.get(i)!).join('') });
    }
    return result;
}

