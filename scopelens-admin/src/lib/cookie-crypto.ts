import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getKey(): Buffer {
    const key = process.env.COOKIE_ENCRYPTION_KEY || "";
    // Derive a 32-byte key from the env variable using SHA-256
    return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt a cookie value using AES-256-CBC
 * Returns: iv:encrypted (hex encoded)
 */
export function encryptCookieValue(value: string): string {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
        let encrypted = cipher.update(value, "utf8", "hex");
        encrypted += cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
    } catch {
        // Fallback: return raw value if encryption fails
        return value;
    }
}

/**
 * Decrypt a cookie value encrypted with encryptCookieValue
 */
export function decryptCookieValue(encrypted: string): string {
    try {
        // If it doesn't look like our encrypted format, return as-is (migration support)
        if (!encrypted.includes(":") || encrypted.length < 34) {
            return encrypted;
        }
        const [ivHex, encHex] = encrypted.split(":");
        if (!ivHex || !encHex || ivHex.length !== 32) {
            return encrypted; // Not our format, return raw
        }
        const iv = Buffer.from(ivHex, "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
        let decrypted = decipher.update(encHex, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch {
        // If decryption fails, the cookie might be a legacy unencrypted value
        return encrypted;
    }
}

// Cookie name mapping: Supabase internal names → custom short names
// Supabase uses patterns like: sb-<project-ref>-auth-token, sb-<project-ref>-auth-token-code-verifier
const SUPABASE_PREFIX_REGEX = /^sb-[a-z0-9-]+-auth-token/;

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
    // Cloud Supabase: https://xxx.supabase.co
    const cloudMatch = url.match(/https?:\/\/([a-z0-9]+)\.supabase/);
    if (cloudMatch) return cloudMatch[1];
    // Self-hosted: use first subdomain as project ref (matches what Supabase uses internally)
    // e.g. https://scopelens-supabase.membercore.dev → scopelens-supabase
    const selfHostedMatch = url.match(/https?:\/\/([^./]+)/);
    return selfHostedMatch?.[1] || "";
}

// ── Cookie Chunking ──
// Browsers limit cookies to ~4096 bytes. AES encryption with hex encoding
// roughly doubles the value size, so we split large values into chunks.

const CHUNK_SIZE = 3500;

/**
 * Split a large cookie value into chunks (.0, .1, ...) if it exceeds CHUNK_SIZE.
 */
export function splitCookieValue(name: string, value: string): Array<{ name: string; value: string }> {
    if (value.length <= CHUNK_SIZE) {
        return [{ name, value }];
    }
    const chunks: Array<{ name: string; value: string }> = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push({
            name: `${name}.${chunks.length}`,
            value: value.substring(i, i + CHUNK_SIZE),
        });
    }
    return chunks;
}

/**
 * Reassemble chunked cookies (name.0, name.1, ...) back into single cookies.
 * Non-chunked cookies pass through unchanged.
 */
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
            if (!chunks.has(baseName)) {
                chunks.set(baseName, new Map());
            }
            chunks.get(baseName)!.set(index, cookie.value);
        } else {
            singles.push(cookie);
        }
    }

    const result = [...singles];
    for (const [baseName, indexMap] of chunks) {
        const indices = Array.from(indexMap.keys()).sort((a, b) => a - b);
        const combined = indices.map(i => indexMap.get(i)!).join('');
        result.push({ name: baseName, value: combined });
    }
    return result;
}
