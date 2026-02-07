/**
 * Simple in-memory rate limiter for auth endpoints
 * In production, consider using Redis for distributed rate limiting
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitConfig {
    windowMs?: number;  // Time window in milliseconds
    maxRequests?: number;  // Max requests per window
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limiting configuration
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = {}
): RateLimitResult {
    const { windowMs = 15 * 60 * 1000, maxRequests = 5 } = config; // 15 min, 5 requests default
    const now = Date.now();

    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
        // Create new entry
        const newEntry: RateLimitEntry = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimitStore.set(identifier, newEntry);
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetTime: newEntry.resetTime,
        };
    }

    // Entry exists and is within window
    entry.count++;

    if (entry.count > maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
        };
    }

    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetTime: entry.resetTime,
    };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    // Fallback - in production, configure your proxy to set x-forwarded-for
    return "unknown";
}
