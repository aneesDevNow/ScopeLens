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
const SUPABASE_PREFIX_REGEX = /^sb-[a-z0-9]+-auth-token/;

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
 * https://xxx.supabase.co → xxx
 */
export function getProjectRef(): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const match = url.match(/https?:\/\/([a-z0-9]+)\.supabase/);
    return match?.[1] || "";
}
